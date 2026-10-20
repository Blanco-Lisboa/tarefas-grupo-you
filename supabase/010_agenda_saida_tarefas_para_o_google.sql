-- Item 192: VOLTA da agenda. Tarefa COM DATA criada/alterada/apagada no Tarefas vira evento na agenda do Google do RESPONSÁVEL.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 001, 002, 003 e 008. NÃO aplicado: o Accept é do Natham.
--
-- Analogia: o gatilho é o funcionário do balcão que anota cada mudança numa FILA DE SAÍDA (agenda_saida). O n8n é o motoboy:
-- a cada 1-2 min pergunta "o que tem pra entregar?" (agenda_saida_pendentes), entrega no Google e avisa "entregue" (agenda_saida_confirmar).
-- Chave nenhuma está neste arquivo. Quem chama as duas funções é só a chave de serviço, guardada no cofre do n8n.
--
-- Três tabelas (ninguém logado lê nem escreve; só os gatilhos e as funções abaixo, que rodam com o poder do banco):
--   agenda_pessoa          pessoa -> calendarId da agenda dela no Google. Pessoa SEM linha aqui não manda nada para o Google (Adrian, por ora).
--   agenda_saida           a fila. Uma linha por "salvar" ou "apagar".
--   agenda_saida_vinculo   tarefa -> (agenda, id do evento no Google). Fica FORA da tabela tarefas de propósito: o app lê tarefas com select("*")
--                          e quem edita a própria tarefa poderia trocar o id e fazer o n8n apagar outro evento. Sobrevive à tarefa apagada.

-- 0) SÓ VAI PARA O GOOGLE a tarefa CRIADA PELO CALENDÁRIO (Natham, 21/10: "só se eu marcar no calendário! Tarefas simples, coisas pontuais,
--    eu marco no Caderno"). O Calendário marca `vai_pro_google` ao criar. Tarefa do Caderno, mesmo com data e hora, fica false e nunca vai.
--    Depois de criada o campo NÃO muda mais (o banco trava, como criado_por): editar em qualquer tela mantém a sincronização, e ninguém
--    liga ou desliga por engano. Vem false para o que já existe.
alter table public.tarefas add column if not exists vai_pro_google boolean not null default false;

-- tarefas_antes (002) + a trava nova: vai_pro_google é decidido na criação e não muda.
create or replace function private.tarefas_antes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.criado_por := old.criado_por;
    new.enviada_por := old.enviada_por;
    new.dono_id := old.dono_id;
    new.vai_pro_google := old.vai_pro_google;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- salvar_tarefa (007) + vai_pro_google na CRIAÇÃO (a edição não o toca). Resto igual ao 007.
create or replace function public.salvar_tarefa(p jsonb, p_tags text[] default '{}') returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  r public.tarefas;
  v_linhas int;
begin
  r := jsonb_populate_record(null::public.tarefas, p);
  if r.id is null then raise exception 'salvar_tarefa: falta o id'; end if;
  if exists (select 1 from public.tarefas where id = r.id) then
    update public.tarefas t set
      titulo = r.titulo, tipo = r.tipo, empresa_id = r.empresa_id, rede = r.rede, etapa = r.etapa,
      responsavel_id = r.responsavel_id, inicio = r.inicio, fim = r.fim, dia_inteiro = r.dia_inteiro, cor = r.cor,
      concluida = r.concluida, objetivo = r.objetivo, notas = r.notas, links = r.links, aprovador = r.aprovador
    where t.id = r.id;
    get diagnostics v_linhas = row_count;
    if v_linhas = 0 then raise exception 'sem permissao para alterar a tarefa'; end if;
    delete from public.tarefa_tags where tarefa_id = r.id;
  else
    insert into public.tarefas (id, titulo, tipo, empresa_id, rede, etapa, responsavel_id, inicio, fim, dia_inteiro, cor,
      concluida, objetivo, notas, links, aprovador, dono_id, criado_por, enviada_por, vai_pro_google)
    values (r.id, r.titulo, r.tipo, r.empresa_id, r.rede, r.etapa, r.responsavel_id, r.inicio, r.fim, r.dia_inteiro, r.cor,
      r.concluida, r.objetivo, r.notas, r.links, r.aprovador, r.dono_id, r.criado_por, r.enviada_por, coalesce(r.vai_pro_google, false));
  end if;
  insert into public.tarefa_tags (tarefa_id, tag_id) select r.id, unnest(p_tags);
end $$;
revoke all on function public.salvar_tarefa(jsonb, text[]) from public, anon;
grant execute on function public.salvar_tarefa(jsonb, text[]) to authenticated;
notify pgrst, 'reload schema';

-- 1) Mapeamento pessoa -> agenda do Google. Só o Natham é conhecido; Matheus e Adrian entram com uma linha (ver o brief do n8n).
create table if not exists public.agenda_pessoa (
  pessoa_id uuid primary key references public.pessoas (id) on delete cascade,
  calendar_id text not null check (btrim(calendar_id) <> '')
);
insert into public.agenda_pessoa (pessoa_id, calendar_id)
select p.id, 'nathamsud@gmail.com' from public.pessoas p where p.slug = 'natham'
on conflict do nothing;

-- 2) A fila de saída.
create table if not exists public.agenda_saida (
  id bigint generated always as identity primary key,
  tarefa_id uuid not null,            -- sem chave estrangeira: a linha "apagar" tem de sobreviver à tarefa
  acao text not null check (acao in ('salvar', 'apagar')),
  pessoa_id uuid not null references public.pessoas (id) on delete cascade, -- de quem é a agenda (o responsável na hora do gatilho)
  estado text not null default 'pendente' check (estado in ('pendente', 'feito', 'falhou')),
  pegou_em timestamptz,               -- quando o n8n pegou; se não confirmar em 5 min, outro pega (nada se perde)
  calendar_id text,                   -- preenchidos quando o n8n pega (apagar usa onde o evento ESTÁ, não o mapa de hoje)
  google_event_id text,
  tentativas int not null default 0,
  ultimo_erro text,
  criado_em timestamptz not null default now(),
  feito_em timestamptz
);
create index if not exists agenda_saida_pendente_idx on public.agenda_saida (id) where estado = 'pendente';
create index if not exists agenda_saida_tarefa_idx on public.agenda_saida (tarefa_id);

create table if not exists public.agenda_saida_vinculo (
  tarefa_id uuid primary key,
  pessoa_id uuid not null references public.pessoas (id) on delete cascade,
  calendar_id text not null,
  google_event_id text not null
);

-- fechadas: sem política e sem permissão para anon/logado. Só o dono do banco (gatilhos, funções SECURITY DEFINER) mexe.
alter table public.agenda_pessoa enable row level security;
alter table public.agenda_saida enable row level security;
alter table public.agenda_saida_vinculo enable row level security;
revoke all on public.agenda_pessoa, public.agenda_saida, public.agenda_saida_vinculo from public, anon, authenticated;

-- 3) O gatilho. Só tarefa COM DATA (inicio) E criada pelo Calendário (vai_pro_google) vai para o Google. Nunca derruba o salvar da tarefa: se algo falhar aqui, avisa e segue.
--    Não manda nada de tarefa que já existia: só o que for criado ou mudado depois do 010 (sem enxurrada de eventos antigos no Google).
create or replace function private.agenda_saida_tarefa() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v public.agenda_saida_vinculo; v_id uuid := coalesce(new.id, old.id); v_voando boolean;
begin
  begin
    select * into v from public.agenda_saida_vinculo where tarefa_id = v_id;
    -- tem um "salvar" já entregue ao n8n e ainda sem resposta? Então o evento pode já existir no Google sem vínculo.
    select exists (select 1 from public.agenda_saida where tarefa_id = v_id and acao = 'salvar' and estado = 'pendente' and pegou_em is not null) into v_voando;

    if tg_op = 'DELETE' or new.inicio is null then
      -- apagou a tarefa, ou tirou a data: some do Google; "salvar" que ninguém pegou ainda perde o sentido
      delete from public.agenda_saida where tarefa_id = v_id and acao = 'salvar' and estado = 'pendente' and pegou_em is null;
      if v.tarefa_id is not null or v_voando then
        insert into public.agenda_saida (tarefa_id, acao, pessoa_id)
        select v_id, 'apagar', coalesce(v.pessoa_id, s.pessoa_id)
        from (select pessoa_id from public.agenda_saida where tarefa_id = v_id order by id desc limit 1) s;
      end if;
    elsif tg_op = 'INSERT' or (old.titulo, old.inicio, old.fim, old.dia_inteiro, old.responsavel_id)
          is distinct from (new.titulo, new.inicio, new.fim, new.dia_inteiro, new.responsavel_id) then
      -- trocou de responsável: apaga na agenda antiga e cria na nova
      if tg_op = 'UPDATE' and old.responsavel_id <> new.responsavel_id then
        delete from public.agenda_saida where tarefa_id = v_id and acao = 'salvar' and estado = 'pendente' and pegou_em is null and pessoa_id <> new.responsavel_id;
        if v.tarefa_id is not null or v_voando then
          insert into public.agenda_saida (tarefa_id, acao, pessoa_id) values (v_id, 'apagar', coalesce(v.pessoa_id, old.responsavel_id));
        end if;
      end if;
      -- só quem tem agenda mapeada manda; e se já há um "salvar" esperando, ele lê a tarefa na hora de sair (basta um)
      if new.vai_pro_google and exists (select 1 from public.agenda_pessoa where pessoa_id = new.responsavel_id)
         and not exists (select 1 from public.agenda_saida where tarefa_id = v_id and acao = 'salvar' and estado = 'pendente' and pegou_em is null and pessoa_id = new.responsavel_id) then
        insert into public.agenda_saida (tarefa_id, acao, pessoa_id) values (v_id, 'salvar', new.responsavel_id);
      end if;
    end if;
  exception when others then
    raise warning 'agenda_saida_tarefa: % (tarefa %)', sqlerrm, v_id;  -- ponytail: avisa e deixa a tarefa salvar; a fila perde esse aviso
  end;
  return coalesce(new, old);
end $$;
revoke all on function private.agenda_saida_tarefa() from public, anon, authenticated;

drop trigger if exists agenda_saida_tarefa_ins on public.tarefas;
create trigger agenda_saida_tarefa_ins after insert on public.tarefas for each row execute function private.agenda_saida_tarefa();
drop trigger if exists agenda_saida_tarefa_upd on public.tarefas;
create trigger agenda_saida_tarefa_upd after update of titulo, inicio, fim, dia_inteiro, responsavel_id on public.tarefas for each row execute function private.agenda_saida_tarefa();
drop trigger if exists agenda_saida_tarefa_del on public.tarefas;
create trigger agenda_saida_tarefa_del after delete on public.tarefas for each row execute function private.agenda_saida_tarefa();

-- 4) O que sai para o n8n. Só a chave de serviço chama.
-- Devolve uma lista (JSON) de, no máximo, p_limite itens. Cada item:
--   id               da linha da fila (volta em agenda_saida_confirmar como p_id)
--   acao             "criar" | "editar" | "apagar"   (o banco decide: já existe evento no Google? então editar)
--   tarefa_id        vai para extendedProperties.private.tarefa_id do evento (e o agenda_receber ignora evento com isso)
--   calendar_id      a agenda onde agir
--   google_event_id  só em editar/apagar (o id do evento no Google); em criar vem null
--   titulo, inicio, fim, dia_inteiro, fuso   só em criar/editar, prontos para o Google:
--       com hora:   inicio/fim = "2026-10-22T14:00:00" (hora de Brasília, sem fuso na ponta; o fuso vai em `fuso`); sem fim = +1 hora
--       dia inteiro: inicio/fim = "2026-10-22" / "2026-10-23" (o fim já é o dia SEGUINTE, como o Google exige)
-- Uma tarefa por vez na rua: se a primeira linha de uma tarefa ainda não foi confirmada, as seguintes esperam.
create or replace function public.agenda_saida_pendentes(p_limite int default 20) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  r public.agenda_saida; t public.tarefas; v public.agenda_saida_vinculo;
  v_acao text; v_cal text; v_ev text; v_ini text; v_fim text; v_dia boolean;
  v_lista jsonb := '[]';
begin
  p_limite := least(greatest(coalesce(p_limite, 20), 1), 100);
  delete from public.agenda_saida where estado <> 'pendente' and coalesce(feito_em, criado_em) < now() - interval '14 days';

  for r in
    select s.* from public.agenda_saida s
    where s.estado = 'pendente' and (s.pegou_em is null or s.pegou_em < now() - interval '5 minutes')
      and s.id = (select min(x.id) from public.agenda_saida x where x.tarefa_id = s.tarefa_id and x.estado = 'pendente')
    order by s.id limit p_limite for update skip locked
  loop
    select * into v from public.agenda_saida_vinculo where tarefa_id = r.tarefa_id;
    v_cal := null; v_ev := null;

    if r.acao = 'apagar' then
      if v.tarefa_id is null then  -- nada no Google para apagar
        update public.agenda_saida set estado = 'feito', feito_em = now() where id = r.id; continue;
      end if;
      v_acao := 'apagar'; v_cal := v.calendar_id; v_ev := v.google_event_id;
    else
      select * into t from public.tarefas where id = r.tarefa_id;
      if t.id is null or t.inicio is null or t.responsavel_id <> r.pessoa_id then  -- ficou velho: tem outra linha atrás dele (ou nenhuma, de propósito)
        update public.agenda_saida set estado = 'feito', feito_em = now() where id = r.id; continue;
      end if;
      if v.tarefa_id is not null and v.pessoa_id = r.pessoa_id then
        v_acao := 'editar'; v_cal := v.calendar_id; v_ev := v.google_event_id;
      else
        select calendar_id into v_cal from public.agenda_pessoa where pessoa_id = r.pessoa_id;
        if v_cal is null then  -- a agenda dela saiu do mapa
          update public.agenda_saida set estado = 'feito', feito_em = now() where id = r.id; continue;
        end if;
        v_acao := 'criar';
      end if;
      v_dia := t.dia_inteiro or position('T' in t.inicio) = 0;
      if v_dia then
        v_ini := left(t.inicio, 10);
        v_fim := ((case when t.fim is not null and left(t.fim, 10) >= v_ini then left(t.fim, 10) else v_ini end)::date + 1)::text;
      else
        v_ini := t.inicio || ':00';
        v_fim := case when t.fim is not null and position('T' in t.fim) > 0 and t.fim > t.inicio then t.fim || ':00'
                      else to_char(t.inicio::timestamp + interval '1 hour', 'YYYY-MM-DD"T"HH24:MI:SS') end;
      end if;
    end if;

    update public.agenda_saida set pegou_em = now(), calendar_id = v_cal, google_event_id = v_ev where id = r.id;
    v_lista := v_lista || jsonb_build_array(
      jsonb_build_object('id', r.id, 'acao', v_acao, 'tarefa_id', r.tarefa_id, 'calendar_id', v_cal, 'google_event_id', v_ev)
      || case when v_acao = 'apagar' then '{}'::jsonb else jsonb_build_object('titulo', t.titulo, 'inicio', v_ini, 'fim', v_fim, 'dia_inteiro', v_dia, 'fuso', 'America/Sao_Paulo') end);
  end loop;
  return v_lista;
end $$;

-- 5) O n8n avisa o resultado de cada item.
--   p_id               o `id` do item
--   p_google_event_id  o `id` do evento que o Google devolveu (criar) ou usou (editar). Obrigatório em criar/editar com sucesso; ignorado em apagar.
--   p_erro             texto do erro se o Google recusou; nulo = deu certo. "Evento já não existe" (404/410) ao apagar conta como sucesso: mande p_erro nulo.
-- Erro: a mesma linha volta em 5 min; na 5ª falha vira "falhou" e a fila anda. Confirmar duas vezes o mesmo id é inofensivo.
create or replace function public.agenda_saida_confirmar(p_id bigint, p_google_event_id text default null, p_erro text default null) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare r public.agenda_saida;
begin
  select * into r from public.agenda_saida where id = p_id for update;
  if r.id is null then raise exception 'item % nao existe', p_id using errcode = '22023'; end if;
  if r.estado <> 'pendente' then return jsonb_build_object('estado', r.estado); end if;

  if nullif(btrim(p_erro), '') is not null then
    update public.agenda_saida set tentativas = tentativas + 1, ultimo_erro = left(p_erro, 500), pegou_em = now(),
      estado = case when tentativas + 1 >= 5 then 'falhou' else 'pendente' end where id = p_id returning estado into r.estado;
    return jsonb_build_object('estado', r.estado);
  end if;

  if r.acao = 'salvar' then
    if nullif(btrim(p_google_event_id), '') is null then raise exception 'salvar precisa de p_google_event_id' using errcode = '22023'; end if;
    insert into public.agenda_saida_vinculo (tarefa_id, pessoa_id, calendar_id, google_event_id)
    values (r.tarefa_id, r.pessoa_id, r.calendar_id, p_google_event_id)
    on conflict (tarefa_id) do update set pessoa_id = excluded.pessoa_id, calendar_id = excluded.calendar_id, google_event_id = excluded.google_event_id;
  else
    delete from public.agenda_saida_vinculo where tarefa_id = r.tarefa_id and google_event_id = r.google_event_id;
  end if;
  update public.agenda_saida set estado = 'feito', feito_em = now(), google_event_id = coalesce(p_google_event_id, google_event_id) where id = p_id;
  return jsonb_build_object('estado', 'feito');
end $$;

-- Só a chave de serviço (o Supabase dá execute a anon e logado em função nova: tirar de todos e devolver só ao service_role).
revoke all on function public.agenda_saida_pendentes(int) from public, anon, authenticated;
grant execute on function public.agenda_saida_pendentes(int) to service_role;
revoke all on function public.agenda_saida_confirmar(bigint, text, text) from public, anon, authenticated;
grant execute on function public.agenda_saida_confirmar(bigint, text, text) to service_role;
-- a porta de entrada (008) e as funções novas leem/escrevem tabelas fechadas: service_role precisa enxergar o esquema
grant usage on schema public to service_role;

-- 6) Sem loop e sem duplicata: o evento que o Tarefas criou volta a aparecer na leitura do n8n (a agenda é lida de volta). Ele leva
--    extendedProperties.private.tarefa_id; o n8n manda esse valor como `tarefa_id` e a porta de entrada IGNORA o evento
--    (senão a tarefa apareceria 2x no Calendário: como tarefa e como compromisso). Igual ao 008, mais o desvio `tarefa_id`.
create or replace function public.agenda_receber(
  p_fonte text, p_eventos jsonb, p_varredura_de timestamptz default null, p_varredura_ate timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  e jsonb; v_id text; v_uid text; v_chave text; v_dia boolean; v_part boolean; v_ini timestamptz; v_fim timestamptz; v_titulo text;
  v_alvo uuid[]; v_vistos text[] := '{}';
  gravados int := 0; removidos int := 0; varridos int := 0; ignorada boolean := false; ignorados int := 0;
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
    if nullif(btrim(e->>'tarefa_id'), '') is not null then ignorados := ignorados + 1; continue; end if;  -- veio do Tarefas: já é tarefa, não vira compromisso
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
  return jsonb_build_object('gravados', gravados, 'removidos', removidos, 'varridos', varridos, 'varredura_ignorada', ignorada, 'ignorados', ignorados);
end $$;
revoke all on function public.agenda_receber(text, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.agenda_receber(text, jsonb, timestamptz, timestamptz) to service_role;

-- 7) "Lucas não entra aqui" (Natham, 21/10): tira a agenda do Lucas de quem a via. Só essas linhas de agenda_acesso;
--    a pessoa Lucas, as tarefas e os eventos de ninguém são tocados. Voltar = inserir ('natham','lucas') e ('matheus','lucas').
delete from public.agenda_acesso where fonte = 'lucas';

-- QUEM VÊ O QUÊ depois do 010 (agenda_acesso): Natham: natham, matheus, adrian, contato. Matheus: matheus, adrian, contato (NUNCA natham).
-- Adrian não tem linha: não vê agenda nenhuma e ninguém compartilha nada com ele.
