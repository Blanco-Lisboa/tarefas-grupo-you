begin;
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 010 (aplicado pelo Natham em 21/10).
-- Natham, 21/10: o Matheus compartilhou com a contato@ a agenda matheus.germano@assessoriabeec.com.br; o Adrian compartilhou DUAS,
-- adrian@blcontabil.com.br (profissional) e blanco.adrian@gmail.com (pessoal). "Deixa a profissional pra receber."
--
-- 1) Para ONDE vai a tarefa de cada pessoa (agenda_pessoa). Só a agenda profissional do Adrian recebe tarefa.
insert into public.agenda_pessoa (pessoa_id, calendar_id)
select p.id, v.calendar_id
from public.pessoas p
join (values ('matheus', 'matheus.germano@assessoriabeec.com.br'), ('adrian', 'adrian@blcontabil.com.br')) as v (slug, calendar_id) on v.slug = p.slug
on conflict (pessoa_id) do update set calendar_id = excluded.calendar_id;

-- 2) De ONDE se lê: o Adrian tem 2 agendas, então viram DUAS fontes: 'adrian' (profissional) e 'adrian_pessoal' (pessoal).
--    Analogia: duas gavetas com a etiqueta "Adrian". Cada gaveta guarda a sua ficha (a chave de não-duplicar é fonte + id do Google);
--    se a mesma reunião estiver nas duas gavetas, a lista de leitura (view agenda_eventos) junta as fichas pelo iCalUID e mostra UM evento só.
--    Por que duas e não uma: uma fonte só misturaria os ids das duas agendas (o mesmo evento convidado teria ids diferentes em cada uma, e a
--    varredura de uma agenda apagaria as fichas da outra).
alter table public.agenda_copias drop constraint if exists agenda_copias_fonte_ok;
alter table public.agenda_copias add constraint agenda_copias_fonte_ok check (fonte in ('natham','matheus','adrian','adrian_pessoal','lucas','contato'));
alter table public.agenda_acesso drop constraint if exists agenda_acesso_fonte_check;
alter table public.agenda_acesso add constraint agenda_acesso_fonte_check check (fonte in ('natham','matheus','adrian','adrian_pessoal','lucas','contato'));

-- 3) Mesmas regras de quem vê, para as duas agendas do Adrian: Natham e Matheus veem; o Adrian não vê nenhuma agenda.
insert into public.agenda_acesso (pessoa_id, fonte)
select p.id, 'adrian_pessoal' from public.pessoas p where p.slug in ('natham', 'matheus')
on conflict do nothing;

-- 4) A porta de entrada (010) com a fonte nova. Só muda a lista de fontes aceitas; o resto é idêntico ao 010.
create or replace function public.agenda_receber(
  p_fonte text, p_eventos jsonb, p_varredura_de timestamptz default null, p_varredura_ate timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  e jsonb; v_id text; v_uid text; v_chave text; v_dia boolean; v_part boolean; v_ini timestamptz; v_fim timestamptz;
  v_vistos text[] := '{}'; n int;
  gravados int := 0; removidos int := 0; varridos int := 0; ignorada boolean := false; ignorados int := 0;
begin
  if p_fonte is null or p_fonte <> all (array['natham','matheus','adrian','adrian_pessoal','lucas','contato']) then
    raise exception 'fonte invalida: %', p_fonte using errcode = '22023';
  end if;
  if jsonb_typeof(p_eventos) is distinct from 'array' then
    raise exception 'p_eventos precisa ser uma lista' using errcode = '22023';
  end if;
  if (p_varredura_de is null) <> (p_varredura_ate is null) then
    raise exception 'varredura precisa de p_varredura_de e p_varredura_ate juntos' using errcode = '22023';
  end if;

  for e in select * from jsonb_array_elements(p_eventos) loop
    v_id := nullif(btrim(e->>'id'), '');
    if v_id is null then raise exception 'evento sem id: %', e using errcode = '22023'; end if;
    if nullif(btrim(e->>'tarefa_id'), '') is not null then ignorados := ignorados + 1; continue; end if;  -- veio do Tarefas: já é tarefa, não vira compromisso
    v_vistos := v_vistos || v_id;

    if e->>'status' = 'cancelled' then  -- apagado: some a ficha desta agenda (as das outras agendas não mudam)
      delete from public.agenda_copias where fonte = p_fonte and google_id = v_id;
      get diagnostics n = row_count;
      removidos := removidos + n;
      continue;
    end if;

    v_dia := coalesce((e->>'dia_inteiro')::boolean, false);
    v_part := coalesce((e->>'particular')::boolean, false);
    if v_dia then  -- dia inteiro = meia-noite de Brasília (o fim já vem exclusivo, como no Google)
      v_ini := ((e->>'inicio')::date)::timestamp at time zone 'America/Sao_Paulo';
      v_fim := ((coalesce(e->>'fim', e->>'inicio'))::date)::timestamp at time zone 'America/Sao_Paulo';
    else
      v_ini := (e->>'inicio')::timestamptz;
      v_fim := (e->>'fim')::timestamptz;
    end if;
    if v_ini is null then raise exception 'evento % sem inicio', v_id using errcode = '22023'; end if;
    v_uid := nullif(btrim(e->>'ical_uid'), '');
    v_chave := case when v_uid is null then 'id:' || v_id else v_uid || '#' || coalesce(nullif(btrim(e->>'inicio_original'), ''), '') end;

    -- a ficha é desta agenda: reescreve tudo. Particular: título "Ocupado" e SEM local, qualquer que seja o que veio (nunca guarda detalhe em claro).
    insert into public.agenda_copias (fonte, google_id, chave, ical_uid, titulo, particular, inicio, fim, dia_inteiro, local)
    values (p_fonte, v_id, v_chave, v_uid,
            case when v_part then 'Ocupado' else coalesce(nullif(btrim(e->>'titulo'), ''), '(Sem título)') end,
            v_part, v_ini, v_fim, v_dia,
            case when v_part then null else nullif(btrim(e->>'local'), '') end)
    on conflict (fonte, google_id) do update set
      chave = excluded.chave, ical_uid = excluded.ical_uid, titulo = excluded.titulo, particular = excluded.particular,
      inicio = excluded.inicio, fim = excluded.fim, dia_inteiro = excluded.dia_inteiro, local = excluded.local, atualizado_em = now();
    gravados := gravados + 1;
  end loop;

  if p_varredura_de is not null then
    if jsonb_array_length(p_eventos) = 0 then
      ignorada := true;
    else
      delete from public.agenda_copias
      where fonte = p_fonte and inicio >= p_varredura_de and inicio < p_varredura_ate and google_id <> all (v_vistos);
      get diagnostics varridos = row_count;
    end if;
  end if;
  return jsonb_build_object('gravados', gravados, 'removidos', removidos, 'varridos', varridos, 'varredura_ignorada', ignorada, 'ignorados', ignorados);
end $$;
revoke all on function public.agenda_receber(text, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.agenda_receber(text, jsonb, timestamptz, timestamptz) to service_role;
notify pgrst, 'reload schema';

-- QUEM VÊ O QUÊ depois do 011: Natham: natham, matheus, adrian, adrian_pessoal, contato. Matheus: matheus, adrian, adrian_pessoal, contato (NUNCA natham).
-- Adrian não tem linha: não vê agenda nenhuma.
commit;
