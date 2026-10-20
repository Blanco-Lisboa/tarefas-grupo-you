-- Item 190: porta de entrada da agenda do Google. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente.
-- Depende do 001, 002 e 003. NÃO aplicado: o Accept é do Natham.
--
-- O n8n (conta contato@assessoriabeec.com.br) chama public.agenda_receber(...) com a chave de serviço, guardada no cofre do n8n.
-- Chave nenhuma está neste arquivo. Quem vê o quê: ver o fim do arquivo.
--
-- Um evento = UMA linha, mesmo aparecendo em 2 agendas (ex.: "Reunião - Caderno" na contato@ e na do Natham).
-- Chave de não-duplicar = iCalUID (+ início original, se for uma data de evento repetido). `fontes` lista as agendas onde ele aparece;
-- `ids` guarda o id do evento em cada agenda, porque evento apagado chega do Google só com o id (sem iCalUID).

-- 1) agenda_eventos: de "uma linha por (agenda, id)" para "uma linha por evento". A tabela está vazia (001, nada gravou nela).
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'agenda_eventos' and column_name = 'fonte') then
    if exists (select 1 from public.agenda_eventos) then
      raise exception 'agenda_eventos tem linhas: migrar à mão antes de trocar o formato';
    end if;
    drop policy if exists agenda_eventos_le on public.agenda_eventos;
    drop index if exists public.agenda_eventos_inicio_idx;
    alter table public.agenda_eventos drop column fonte, drop column google_id;
  end if;
end $$;

alter table public.agenda_eventos
  add column if not exists chave text,
  add column if not exists ical_uid text,
  add column if not exists fontes text[] not null default '{}',
  add column if not exists ids jsonb not null default '{}',
  add column if not exists particular boolean not null default false,
  add column if not exists atualizado_em timestamptz not null default now();
alter table public.agenda_eventos alter column chave set not null;

-- fontes novas: 'contato' = a agenda própria da contato@assessoriabeec.com.br
alter table public.agenda_eventos drop constraint if exists agenda_eventos_fontes_ok;
alter table public.agenda_eventos add constraint agenda_eventos_fontes_ok
  check (fontes <@ array['natham','matheus','adrian','lucas','contato']);
alter table public.agenda_acesso drop constraint if exists agenda_acesso_fonte_check;
alter table public.agenda_acesso add constraint agenda_acesso_fonte_check
  check (fonte in ('natham','matheus','adrian','lucas','contato'));

create unique index if not exists agenda_eventos_chave_idx on public.agenda_eventos (chave);
create index if not exists agenda_eventos_inicio_idx on public.agenda_eventos (inicio);
create index if not exists agenda_eventos_ids_idx on public.agenda_eventos using gin (ids jsonb_path_ops);

-- 2) Quem vê a contato@: Natham e Matheus (agenda de equipe da Beec, sem conteúdo pessoal do Natham).
insert into public.agenda_acesso (pessoa_id, fonte)
select p.id, 'contato' from public.pessoas p where p.slug in ('natham', 'matheus')
on conflict do nothing;

-- 3) Trava de leitura: vê o evento quem tem acesso a QUALQUER agenda onde ele está.
-- Não vaza nada: o evento já está na agenda que a pessoa enxerga. Evento só da agenda do Natham continua só do Natham.
drop policy if exists agenda_eventos_le on public.agenda_eventos;
create policy agenda_eventos_le on public.agenda_eventos for select to authenticated using (
  fontes && (select coalesce(array_agg(a.fonte), '{}') from public.agenda_acesso a where a.pessoa_id = (select private.minha_pessoa()))
);
-- o app só lê as colunas que precisa (sem chave, iCalUID nem ids do Google)
revoke select on public.agenda_eventos from authenticated;
grant select (id, fontes, titulo, particular, inicio, fim, dia_inteiro, local) on public.agenda_eventos to authenticated;

-- 4) Tira uma agenda de dentro de eventos; evento que fica sem nenhuma agenda é apagado.
create or replace function private.agenda_tirar_fonte(p_eventos uuid[], p_fonte text) returns int
language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  update public.agenda_eventos set fontes = array_remove(fontes, p_fonte), ids = ids - p_fonte, atualizado_em = now()
  where id = any (p_eventos);
  get diagnostics n = row_count;
  delete from public.agenda_eventos where id = any (p_eventos) and cardinality(fontes) = 0;
  return n;
end $$;
revoke all on function private.agenda_tirar_fonte(uuid[], text) from public, anon, authenticated;

-- 5) A PORTA DE ENTRADA. Só a chave de serviço chama (anon e logado: "permission denied").
--   p_fonte          agenda de onde vêm os eventos: natham | matheus | adrian | lucas | contato
--   p_eventos        lista (JSON) de eventos, um objeto por evento; campos abaixo
--   p_varredura_de/ate  (opcional) só na varredura diária: janela de datas que o n8n acabou de ler INTEIRA. Evento desta agenda dentro da
--                    janela que não veio na lista é tirado dela (rede de segurança contra aviso perdido). Lista vazia nunca apaga nada.
-- Campos de cada evento: id (obrigatório), status ("cancelled" = apagado), ical_uid, inicio_original (só evento repetido),
--   titulo, particular (true se visibility = private/confidential), inicio, fim, dia_inteiro, local.
--   inicio/fim com fuso ("2026-10-21T14:00:00-03:00"); dia inteiro: só a data ("2026-10-21"), fim = dia seguinte, como o Google manda.
create or replace function public.agenda_receber(
  p_fonte text, p_eventos jsonb, p_varredura_de timestamptz default null, p_varredura_ate timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  e jsonb; v_id text; v_uid text; v_chave text; v_dia boolean; v_part boolean; v_ini timestamptz; v_fim timestamptz; v_titulo text;
  v_alvo uuid[]; v_vistos text[] := '{}';
  gravados int := 0; removidos int := 0; varridos int := 0; ignorada boolean := false;
begin
  if p_fonte is null or p_fonte <> all (array['natham','matheus','adrian','lucas','contato']) then
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
    v_vistos := v_vistos || v_id;

    if e->>'status' = 'cancelled' then  -- apagado: tira só desta agenda; some de vez quando não sobra nenhuma
      select coalesce(array_agg(id), '{}') into v_alvo from public.agenda_eventos where ids @> jsonb_build_object(p_fonte, v_id);
      if cardinality(v_alvo) > 0 then removidos := removidos + private.agenda_tirar_fonte(v_alvo, p_fonte); end if;
      continue;
    end if;

    v_dia := coalesce((e->>'dia_inteiro')::boolean, false);
    v_part := coalesce((e->>'particular')::boolean, false);
    v_titulo := case when v_part then 'Ocupado' else coalesce(nullif(btrim(e->>'titulo'), ''), '(Sem título)') end;
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

    insert into public.agenda_eventos as a (chave, ical_uid, fontes, ids, titulo, particular, inicio, fim, dia_inteiro, local)
    values (v_chave, v_uid, array[p_fonte], jsonb_build_object(p_fonte, v_id), v_titulo, v_part, v_ini, v_fim, v_dia, nullif(btrim(e->>'local'), ''))
    on conflict (chave) do update set
      fontes = (select array_agg(distinct x order by x) from unnest(a.fontes || p_fonte) x),
      ids = a.ids || jsonb_build_object(p_fonte, v_id),
      -- a cópia particular (sem detalhes) nunca troca o título e o local de uma cópia que os tem
      titulo = case when excluded.particular and not a.particular then a.titulo else excluded.titulo end,
      local = case when excluded.particular and not a.particular then a.local else excluded.local end,
      particular = a.particular and excluded.particular,
      inicio = excluded.inicio, fim = excluded.fim, dia_inteiro = excluded.dia_inteiro, atualizado_em = now();
    gravados := gravados + 1;
  end loop;

  if p_varredura_de is not null then
    if jsonb_array_length(p_eventos) = 0 then
      ignorada := true;
    else
      select coalesce(array_agg(id), '{}') into v_alvo from public.agenda_eventos
      where ids ? p_fonte and inicio >= p_varredura_de and inicio < p_varredura_ate and (ids->>p_fonte) <> all (v_vistos);
      if cardinality(v_alvo) > 0 then varridos := private.agenda_tirar_fonte(v_alvo, p_fonte); end if;
    end if;
  end if;
  return jsonb_build_object('gravados', gravados, 'removidos', removidos, 'varridos', varridos, 'varredura_ignorada', ignorada);
end $$;

-- Só a chave de serviço. O Supabase dá execute a anon e authenticated sozinho em função nova: tirar de todos e devolver só ao service_role.
revoke all on function public.agenda_receber(text, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.agenda_receber(text, jsonb, timestamptz, timestamptz) to service_role;

-- QUEM VÊ O QUÊ (agenda_acesso, semente no 003 + contato acima):
--   Natham: natham, matheus, adrian, lucas, contato.   Matheus: matheus, adrian, lucas, contato (NUNCA natham).
-- Mudar é uma linha em agenda_acesso. Adrian entra depois: é só o n8n começar a mandar com p_fonte = 'adrian'.
