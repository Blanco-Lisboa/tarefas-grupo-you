-- 315 · Calendário de postagens, Etapa 1 (banco). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente (pode colar de novo). NÃO aplicado: o Natham cola no SQL Editor. Só linhas de TEXTO: nenhum arquivo, anexo ou imagem.
-- Antes de colar, o app funciona igual (o botão "Postagens" nem aparece: a função postagens_calendario não existe).
-- Analogia: é a "agenda de pauta" da redação. O Natham escreve na agenda o que cada empresa posta e quando; o banco copia cada linha para o
-- caderno de quem faz (padrão Matheus), confere sozinho quando o post sai (risca) e marca "faltou" quando o dia passa sem post.
-- Plano: docs/levas/2026-10-26-315-PLANO.md. Prova: supabase/prova_315_pauta.sql (+ .saida.txt), num Postgres local, nunca na produção.
-- Funções de produção que este arquivo REESCREVE: só private.tocar_sino (corpo de PRODUÇÃO puxado em 26/10 com pg_get_functiondef, + 'pauta').
-- salvar_tarefa e tarefas_antes NÃO mudam: a coluna nova (planejada_id) não passa por elas.
begin;

-- ===== quem monta a pauta: só o Natham (o Adrian NÃO herda) =====
create or replace function private.sou_natham() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.pessoas p where p.user_id = (select auth.uid()) and p.slug = 'natham') $$;
revoke all on function private.sou_natham() from public, anon;
grant execute on function private.sou_natham() to authenticated;

-- ===== 1. a pauta: uma linha = uma postagem planejada (numa data só, ou toda semana nos dias marcados) =====
create table if not exists public.postagens_planejadas (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas(id) on delete restrict,
  formato text not null check (formato in ('reels', 'post', 'carrossel', 'story')),
  redes text[] not null default '{instagram,facebook}' check (redes <@ array['instagram', 'facebook'] and cardinality(redes) >= 1),
  hora text not null check (hora ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  responsavel_id uuid not null references public.pessoas(id),
  titulo text check (char_length(titulo) <= 200),
  repete text not null check (repete in ('data', 'semana')),
  data date,
  dias_semana int[],  -- 0 = domingo ... 6 = sábado (igual ao getDay() do navegador)
  inicio date not null,
  fim date,
  criado_por uuid references public.pessoas(id),
  created_at timestamptz not null default now(),
  constraint postagens_planejadas_quando check (
    (repete = 'data' and data is not null and dias_semana is null)
    or (repete = 'semana' and data is null and dias_semana is not null and cardinality(dias_semana) >= 1 and dias_semana <@ array[0, 1, 2, 3, 4, 5, 6])),
  constraint postagens_planejadas_fim check (fim is null or fim >= inicio)
);

-- ===== 2. "só este dia": pula o dia, ou muda hora / responsável / título só nele =====
create table if not exists public.postagens_planejadas_excecoes (
  planejada_id uuid not null references public.postagens_planejadas(id) on delete cascade,
  dia date not null,
  tipo text not null check (tipo in ('pula', 'muda')),
  hora text check (hora ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  responsavel_id uuid references public.pessoas(id),
  titulo text check (char_length(titulo) <= 200),
  primary key (planejada_id, dia)
);

-- ===== 3. livro-razão: cada (postagem, dia) que já virou tarefa no Caderno. tarefa_id nulo = alguém apagou a tarefa: NÃO renasce =====
create table if not exists public.postagens_planejadas_geradas (
  planejada_id uuid not null references public.postagens_planejadas(id) on delete cascade,
  dia date not null,
  tarefa_id uuid references public.tarefas(id) on delete set null,
  primary key (planejada_id, dia)
);
create index if not exists postagens_planejadas_geradas_tarefa on public.postagens_planejadas_geradas (tarefa_id);

-- ===== 4. tarefa do Caderno que nasceu da pauta: o banco impede que ela vire card (nunca ganha etapa) =====
alter table public.tarefas add column if not exists planejada_id uuid references public.postagens_planejadas(id) on delete set null;
create index if not exists tarefas_planejada on public.tarefas (planejada_id) where planejada_id is not null;
alter table public.tarefas drop constraint if exists tarefas_pauta_sem_etapa;
alter table public.tarefas add constraint tarefas_pauta_sem_etapa check (planejada_id is null or etapa is null);

-- ===== 5. travas: quem tem login LÊ; só o Natham escreve; o livro-razão só as funções escrevem =====
alter table public.postagens_planejadas enable row level security;
alter table public.postagens_planejadas_excecoes enable row level security;
alter table public.postagens_planejadas_geradas enable row level security;
revoke all on public.postagens_planejadas, public.postagens_planejadas_excecoes, public.postagens_planejadas_geradas from anon;
revoke insert, update, delete, truncate on public.postagens_planejadas_geradas from authenticated;

drop policy if exists postagens_planejadas_le on public.postagens_planejadas;
create policy postagens_planejadas_le on public.postagens_planejadas for select to authenticated using ((select private.minha_pessoa()) is not null);
drop policy if exists postagens_planejadas_natham on public.postagens_planejadas;
create policy postagens_planejadas_natham on public.postagens_planejadas for all to authenticated
  using ((select private.sou_natham())) with check ((select private.sou_natham()));
drop policy if exists postagens_planejadas_excecoes_le on public.postagens_planejadas_excecoes;
create policy postagens_planejadas_excecoes_le on public.postagens_planejadas_excecoes for select to authenticated using ((select private.minha_pessoa()) is not null);
drop policy if exists postagens_planejadas_excecoes_natham on public.postagens_planejadas_excecoes;
create policy postagens_planejadas_excecoes_natham on public.postagens_planejadas_excecoes for all to authenticated
  using ((select private.sou_natham())) with check ((select private.sou_natham()));
drop policy if exists postagens_planejadas_geradas_le on public.postagens_planejadas_geradas;
create policy postagens_planejadas_geradas_le on public.postagens_planejadas_geradas for select to authenticated using ((select private.minha_pessoa()) is not null);

-- ===== 6. ocorrências: a pauta "aberta" em dias, já com as exceções (o que vale em cada dia) =====
create or replace function private.ocorrencias(p_de date, p_ate date)
returns table (planejada_id uuid, dia date, hora text, responsavel_id uuid, titulo text, empresa_id text, formato text, redes text[], repete text)
language sql stable set search_path = ''
as $$
  with dias as (
    select p.*, d::date as o_dia from public.postagens_planejadas p
    cross join lateral generate_series(greatest(p_de, p.inicio)::timestamp, least(p_ate, coalesce(p.fim, p_ate))::timestamp, interval '1 day') d  -- sem fuso: dia é dia
    where p.repete = 'semana' and extract(dow from d)::int = any (p.dias_semana)
    union all
    select p.*, p.data from public.postagens_planejadas p where p.repete = 'data' and p.data between p_de and p_ate
  )
  select d.id, d.o_dia, coalesce(e.hora, d.hora), coalesce(e.responsavel_id, d.responsavel_id), coalesce(e.titulo, d.titulo), d.empresa_id, d.formato, d.redes, d.repete
  from dias d left join public.postagens_planejadas_excecoes e on e.planejada_id = d.id and e.dia = d.o_dia
  where e.tipo is distinct from 'pula'
$$;
revoke all on function private.ocorrencias(date, date) from public, anon;
grant execute on function private.ocorrencias(date, date) to authenticated;  -- (a postagens_calendario roda com o login de quem pergunta)

-- ===== 7. o calendário: UMA conta só para planejada / feita / faltou / extra (a tela e o Caderno usam a mesma) =====
-- feita = card Postado da mesma empresa + formato + dia (dia = postado_em em São Paulo; sem ele, postar_em). Dois planejados iguais no mesmo dia
-- casam com até dois posts, pela ordem da hora. Redes não entram. faltou = dia anterior a hoje (São Paulo) sem par. extra = post sem planejada.
create or replace function public.postagens_calendario(p_de date, p_ate date)
returns table (planejada_id uuid, dia date, hora text, empresa_id text, formato text, redes text[], responsavel text, titulo text,
  repete text, estado text, card_id uuid, card_titulo text)
language sql stable security invoker set search_path = ''
as $$
  with plano as (
    select o.*, row_number() over (partition by o.empresa_id, o.formato, o.dia order by o.hora, o.planejada_id) n
    from private.ocorrencias(p_de, p_ate) o
  ),
  posts as (
    select x.*, x.quando::date as dia, row_number() over (partition by x.empresa_id, x.formato, x.quando::date order by x.quando, x.id) n
    from (select t.id, t.titulo, t.empresa_id, t.formato, t.responsavel_id,
            coalesce(t.postado_em at time zone 'America/Sao_Paulo', t.postar_em::timestamp) quando
          from public.tarefas t where t.etapa = 'postado' and t.empresa_id is not null) x
    where x.quando::date between p_de and p_ate
  )
  select p.planejada_id, p.dia, p.hora, p.empresa_id, p.formato, p.redes, (select s.slug from public.pessoas s where s.id = p.responsavel_id),
    p.titulo, p.repete,
    case when r.id is not null then 'feita' when p.dia < (now() at time zone 'America/Sao_Paulo')::date then 'faltou' else 'planejada' end,
    r.id, r.titulo
  from plano p left join posts r on r.empresa_id = p.empresa_id and r.formato = p.formato and r.dia = p.dia and r.n = p.n
  union all
  select null, r.dia, to_char(r.quando, 'HH24:MI'), r.empresa_id, r.formato, null, (select s.slug from public.pessoas s where s.id = r.responsavel_id),
    null, null, 'extra', r.id, r.titulo
  from posts r
  where r.formato is null or not exists (select 1 from plano p where p.empresa_id = r.empresa_id and p.formato = r.formato and p.dia = r.dia and p.n = r.n)
  order by 2, 3
$$;
revoke all on function public.postagens_calendario(date, date) from public, anon;
grant execute on function public.postagens_calendario(date, date) to authenticated;

-- ===== 8. a tarefa do Caderno: título e notas (um lugar só, a geração e a regeneração comparam pelos mesmos) =====
create or replace function private.titulo_da_pauta(p_empresa text, p_formato text, p_titulo text) returns text
language sql stable set search_path = ''
as $$
  select 'Postar ' || case p_formato when 'reels' then 'Reels' when 'post' then 'Post' when 'carrossel' then 'Carrossel' when 'story' then 'Story' else p_formato end
    || ' — ' || coalesce((select e.nome from public.empresas e where e.id = p_empresa), p_empresa)
    || coalesce(' · ' || nullif(btrim(p_titulo), ''), '')
$$;
create or replace function private.notas_da_pauta(p_redes text[]) returns text
language sql immutable set search_path = ''
as $$ select 'Redes: ' || array_to_string(array(select case r when 'instagram' then 'Instagram' when 'facebook' then 'Facebook' else r end from unnest(p_redes) r), ', ') $$;
revoke all on function private.titulo_da_pauta(text, text, text) from public, anon, authenticated;
revoke all on function private.notas_da_pauta(text[]) from public, anon, authenticated;

-- ===== 9. riscar: a tarefa da pauta fica feita quando o post sai (só de ida: card que volta de etapa NÃO desmarca) =====
create or replace function private.riscar_postagens(p_empresa text default null, p_de date default null, p_ate date default null) returns int
language plpgsql security definer set search_path = ''
as $$
declare v_hoje date := (now() at time zone 'America/Sao_Paulo')::date; v_n int;
begin
  update public.tarefas t set concluida = true
  from public.postagens_calendario(coalesce(p_de, v_hoje - 7), coalesce(p_ate, v_hoje)) c
  join public.postagens_planejadas_geradas g on g.planejada_id = c.planejada_id and g.dia = c.dia
  where c.estado = 'feita' and (p_empresa is null or c.empresa_id = p_empresa) and t.id = g.tarefa_id and not t.concluida;
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function private.riscar_postagens(text, date, date) from public, anon, authenticated;

-- ===== 10. gerar: cada dia da pauta de hoje até hoje+13 vira UMA tarefa no Caderno do responsável (o livro-razão impede a segunda) =====
create or replace function private.gerar_tarefas_postagens(p_janela int default 14, p_planejada uuid default null) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  o record; v_tarefa uuid; v_n int := 0;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_natham uuid := (select id from public.pessoas where slug = 'natham');
begin
  for o in select * from private.ocorrencias(v_hoje, v_hoje + p_janela - 1) x where p_planejada is null or x.planejada_id = p_planejada loop
    -- a linha do livro-razão entra ANTES (na mesma transação): quem chegar junto espera e desiste aqui, sem tarefa dobrada
    insert into public.postagens_planejadas_geradas (planejada_id, dia) values (o.planejada_id, o.dia) on conflict do nothing;
    continue when not found;
    insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por, inicio, dia_inteiro, notas, vai_pro_google, planejada_id)
    values (private.titulo_da_pauta(o.empresa_id, o.formato, o.titulo), 'outro', o.responsavel_id, o.responsavel_id, v_natham,
      to_char(o.dia, 'YYYY-MM-DD') || 'T' || o.hora, false, private.notas_da_pauta(o.redes), false, o.planejada_id)
    returning id into v_tarefa;
    update public.postagens_planejadas_geradas set tarefa_id = v_tarefa where planejada_id = o.planejada_id and dia = o.dia;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;
revoke all on function private.gerar_tarefas_postagens(int, uuid) from public, anon, authenticated;

-- ===== 11. o Natham mudou a pauta: refaz as tarefas FUTURAS que ainda estão vivas e não feitas (o que já foi riscado ou apagado fica como está) =====
create or replace function private.sincronizar_planejada(p_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare g record; v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  for g in
    select l.dia, l.tarefa_id, o.planejada_id is not null as vale,
      (t.dono_id, t.inicio, t.titulo, coalesce(t.notas, '')) is distinct from (o.responsavel_id, to_char(o.dia, 'YYYY-MM-DD') || 'T' || o.hora,
        private.titulo_da_pauta(o.empresa_id, o.formato, o.titulo), private.notas_da_pauta(o.redes)) as mudou
    from public.postagens_planejadas_geradas l
    join public.tarefas t on t.id = l.tarefa_id and not t.concluida
      and not exists (select 1 from public.arquivos a where a.tarefa_id = t.id)  -- com anexo: alguém mexeu, não apaga
    left join private.ocorrencias(v_hoje, (select max(x.dia) from public.postagens_planejadas_geradas x where x.planejada_id = p_id)) o
      on o.planejada_id = l.planejada_id and o.dia = l.dia
    where l.planejada_id = p_id and l.dia >= v_hoje
  loop
    if not g.vale then  -- o dia saiu da pauta (pulado, série cortada): a tarefa some e o livro-razão fica, para não renascer
      delete from public.tarefas where id = g.tarefa_id;
    elsif g.mudou then  -- o banco não troca o dono de uma tarefa (010): apaga e a geração abaixo cria de novo com os dados novos
      delete from public.tarefas where id = g.tarefa_id;
      delete from public.postagens_planejadas_geradas where planejada_id = p_id and dia = g.dia;
    end if;
  end loop;
  perform private.gerar_tarefas_postagens(14, p_id);
  perform private.riscar_postagens(null, v_hoje, v_hoje);  -- planejou hoje algo que já saiu: risca na hora
end $$;
revoke all on function private.sincronizar_planejada(uuid) from public, anon, authenticated;

-- ===== 12. salvar (criar ou mudar) e apagar: só o Natham. Escopo de quem se repete: 'dia' (só este dia), 'proximos' (este e os próximos), 'todos' =====
-- p: {id?, empresa_id, formato, redes[], hora 'HH:MM', responsavel (slug; vazio = matheus), titulo, repete 'data'|'semana', data, dias_semana[], inicio, fim}
create or replace function public.salvar_planejada(p jsonb, p_escopo text default 'todos', p_dia date default null) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := nullif(p->>'id', '')::uuid;
  v_antiga public.postagens_planejadas;
  v_repete text := coalesce(nullif(p->>'repete', ''), 'semana');
  v_data date := nullif(p->>'data', '')::date;
  v_dias int[] := case when jsonb_typeof(p->'dias_semana') = 'array'
    then (select array_agg(distinct x::int order by x::int) from jsonb_array_elements_text(p->'dias_semana') x) end;
  v_redes text[] := case when jsonb_typeof(p->'redes') = 'array' then array(select jsonb_array_elements_text(p->'redes')) else '{instagram,facebook}' end;
  v_resp uuid := (select id from public.pessoas where slug = coalesce(nullif(p->>'responsavel', ''), 'matheus'));
  v_inicio date;
  v_fim date := nullif(p->>'fim', '')::date;
  v_novo uuid;
begin
  if not (select private.sou_natham()) then
    raise exception 'Só o Natham monta o calendário de postagens' using errcode = '42501';
  end if;
  if p_escopo not in ('todos', 'dia', 'proximos') then raise exception 'escopo invalido: %', p_escopo using errcode = '22023'; end if;
  if v_resp is null then raise exception 'responsavel desconhecido: %', p->>'responsavel' using errcode = '22023'; end if;
  if v_repete = 'data' then v_inicio := v_data; v_dias := null; v_fim := null;
  else v_inicio := coalesce(nullif(p->>'inicio', '')::date, (now() at time zone 'America/Sao_Paulo')::date); v_data := null;
  end if;
  if v_id is not null then
    select * into v_antiga from public.postagens_planejadas where id = v_id for update;
    if not found then raise exception 'postagem planejada não existe (foi apagada?)' using errcode = 'P0002'; end if;
  end if;

  if v_id is not null and p_escopo in ('dia', 'proximos') and p_dia is null then
    raise exception 'falta o dia do escopo' using errcode = '22023';
  end if;

  if v_id is not null and p_escopo = 'dia' then  -- só este dia: hora, responsável e título valem só nele
    insert into public.postagens_planejadas_excecoes as e (planejada_id, dia, tipo, hora, responsavel_id, titulo)
    values (v_id, p_dia, 'muda', nullif(p->>'hora', ''), case when nullif(p->>'responsavel', '') is not null then v_resp end, nullif(btrim(p->>'titulo'), ''))
    on conflict (planejada_id, dia) do update set tipo = 'muda', hora = excluded.hora, responsavel_id = excluded.responsavel_id, titulo = excluded.titulo;
    perform private.sincronizar_planejada(v_id);
    return v_id;
  end if;

  if v_id is not null and p_escopo = 'proximos' and v_antiga.repete = 'semana' and p_dia > v_antiga.inicio then
    -- este e os próximos: a série antiga termina na véspera; uma nova começa no dia, já com a mudança
    update public.postagens_planejadas set fim = p_dia - 1 where id = v_id;
    delete from public.postagens_planejadas_excecoes where planejada_id = v_id and dia >= p_dia;
    insert into public.postagens_planejadas (empresa_id, formato, redes, hora, responsavel_id, titulo, repete, data, dias_semana, inicio, fim, criado_por)
    values (p->>'empresa_id', p->>'formato', v_redes, p->>'hora', v_resp, nullif(btrim(p->>'titulo'), ''), v_repete, v_data, v_dias,
      case when v_repete = 'data' then v_data else p_dia end, v_fim, (select private.minha_pessoa()))
    returning id into v_novo;
    -- as tarefas já geradas daqui em diante passam para a série nova (a sincronização refaz só as que mudaram)
    update public.postagens_planejadas_geradas set planejada_id = v_novo where planejada_id = v_id and dia >= p_dia;
    perform private.sincronizar_planejada(v_id);
    perform private.sincronizar_planejada(v_novo);
    return v_novo;
  end if;

  if v_id is null then
    insert into public.postagens_planejadas (empresa_id, formato, redes, hora, responsavel_id, titulo, repete, data, dias_semana, inicio, fim, criado_por)
    values (p->>'empresa_id', p->>'formato', v_redes, p->>'hora', v_resp, nullif(btrim(p->>'titulo'), ''), v_repete, v_data, v_dias, v_inicio, v_fim,
      (select private.minha_pessoa()))
    returning id into v_id;
  else  -- todos (ou "este e os próximos" no primeiro dia da série, que é o mesmo)
    update public.postagens_planejadas set empresa_id = p->>'empresa_id', formato = p->>'formato', redes = v_redes, hora = p->>'hora',
      responsavel_id = v_resp, titulo = nullif(btrim(p->>'titulo'), ''), repete = v_repete, data = v_data, dias_semana = v_dias,
      inicio = v_inicio, fim = v_fim
    where id = v_id;
  end if;
  perform private.sincronizar_planejada(v_id);
  return v_id;
end $$;
revoke all on function public.salvar_planejada(jsonb, text, date) from public, anon;
grant execute on function public.salvar_planejada(jsonb, text, date) to authenticated;

create or replace function public.apagar_planejada(p_id uuid, p_escopo text default 'todos', p_dia date default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_antiga public.postagens_planejadas; v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not (select private.sou_natham()) then
    raise exception 'Só o Natham monta o calendário de postagens' using errcode = '42501';
  end if;
  if p_escopo not in ('todos', 'dia', 'proximos') then raise exception 'escopo invalido: %', p_escopo using errcode = '22023'; end if;
  select * into v_antiga from public.postagens_planejadas where id = p_id for update;
  if not found then return; end if;  -- já apagada: nada a fazer
  if p_escopo in ('dia', 'proximos') and p_dia is null then raise exception 'falta o dia do escopo' using errcode = '22023'; end if;

  if p_escopo = 'dia' and v_antiga.repete = 'semana' then
    insert into public.postagens_planejadas_excecoes (planejada_id, dia, tipo) values (p_id, p_dia, 'pula')
    on conflict (planejada_id, dia) do update set tipo = 'pula', hora = null, responsavel_id = null, titulo = null;
    perform private.sincronizar_planejada(p_id);
  elsif p_escopo = 'proximos' and v_antiga.repete = 'semana' and p_dia > v_antiga.inicio then
    update public.postagens_planejadas set fim = p_dia - 1 where id = p_id;
    delete from public.postagens_planejadas_excecoes where planejada_id = p_id and dia >= p_dia;
    perform private.sincronizar_planejada(p_id);
  else  -- todos: a série some; das tarefas, saem só as de hoje em diante ainda não feitas (o passado do Caderno fica)
    delete from public.tarefas t using public.postagens_planejadas_geradas l
    where l.planejada_id = p_id and l.dia >= v_hoje and t.id = l.tarefa_id and not t.concluida
      and not exists (select 1 from public.arquivos a where a.tarefa_id = t.id);
    delete from public.postagens_planejadas where id = p_id;
  end if;
end $$;
revoke all on function public.apagar_planejada(uuid, text, date) from public, anon;
grant execute on function public.apagar_planejada(uuid, text, date) to authenticated;

-- ===== 13. o post saiu (card entrou em Postado): risca na hora. Falha aqui NUNCA impede o card de andar =====
create or replace function private.tarefas_risca_pauta() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_dia date;
begin
  begin
    v_dia := coalesce((new.postado_em at time zone 'America/Sao_Paulo')::date, left(new.postar_em, 10)::date);
    perform private.riscar_postagens(new.empresa_id, v_dia, v_dia);
  exception when others then
    raise warning 'tarefas_risca_pauta: % (tarefa %)', sqlerrm, new.id;  -- ponytail: avisa e segue; o relógio de 5 em 5 minutos risca depois
  end;
  return null;
end $$;
revoke all on function private.tarefas_risca_pauta() from public, anon, authenticated;
drop trigger if exists tarefas_risca_pauta on public.tarefas;
create trigger tarefas_risca_pauta after update of etapa on public.tarefas for each row
  when (new.etapa = 'postado' and old.etapa is distinct from 'postado' and new.empresa_id is not null)
  execute function private.tarefas_risca_pauta();

-- ===== 14. tempo real (028): a pauta toca o sino 'pauta' (sem ':' = todo logado ouve). Corpo de PRODUÇÃO de 26/10, só com 'pauta' a mais =====
create or replace function private.tocar_sino()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare modo text := tg_argv[0]; l jsonb; t jsonb; chaves text[] := '{}';
begin
  foreach l in array array[case when tg_op <> 'INSERT' then to_jsonb(old) end, case when tg_op <> 'DELETE' then to_jsonb(new) end] loop
    continue when l is null;
    if modo in ('esteira', 'ideias', 'pastas', 'pauta') then chaves := chaves || modo;
    elsif modo in ('caderno', 'feitos') then chaves := chaves || (modo || ':' || (l->>'dono_id'));
    elsif modo = 'acesso' then chaves := chaves || ('acesso:' || (l->>'pessoa_id'));
    elsif modo = 'vinculo' then -- confirmação da ida ao Google (010): avisa quem a função tarefas_no_google() deixa ver (dono, criador, responsável); a tabela segue fechada
      select to_jsonb(x) into t from public.tarefas x where x.id = (l->>'tarefa_id')::uuid;
      continue when t is null;
      chaves := chaves || ('acesso:' || (t->>'dono_id')) || ('acesso:' || (t->>'criado_por')) || ('acesso:' || (t->>'responsavel_id'));
    elsif modo = 'agenda' then chaves := chaves || ('agenda:' || (l->>'fonte'));
    else -- 'tarefa' (a própria) ou 'filha' (tarefa_tags, arquivos, postagens: olha a tarefa a que pertence)
      if modo = 'filha' then
        if l->>'tarefa_id' is null then chaves := chaves || 'pastas'::text; continue; end if; -- arquivo solto numa pasta
        select to_jsonb(x) into t from public.tarefas x where x.id = (l->>'tarefa_id')::uuid;
        continue when t is null; -- a tarefa já foi apagada: o gatilho dela avisou
      else t := l;
      end if;
      -- card de conteúdo com empresa é de todos; senão, só do dono e de quem enviou (e o Natham lendo o Matheus)
      if t->>'etapa' is not null and t->>'empresa_id' is not null then chaves := chaves || 'esteira'::text; end if;
      chaves := chaves || ('cartao:' || (t->>'dono_id'));
      if t->>'enviada_por' is not null then chaves := chaves || ('cartao:' || (t->>'enviada_por')); end if;
    end if;
  end loop;
  insert into public.aviso_mudanca (chave, em) select distinct c, now() from unnest(chaves) c
    on conflict (chave) do update set em = excluded.em;
  return null;
end $function$;
drop trigger if exists tocar_sino on public.postagens_planejadas;
create trigger tocar_sino after insert or delete or update on public.postagens_planejadas for each row execute function private.tocar_sino('pauta');
drop trigger if exists tocar_sino on public.postagens_planejadas_excecoes;
create trigger tocar_sino after insert or delete or update on public.postagens_planejadas_excecoes for each row execute function private.tocar_sino('pauta');

-- ===== 15. relógios (GMT; cron.schedule com o mesmo nome só atualiza): gerar às 03:00 de São Paulo; conferir/riscar de 5 em 5 minutos =====
select cron.schedule('postagens_gerar', '0 6 * * *', $cmd$select private.gerar_tarefas_postagens()$cmd$);
select cron.schedule('postagens_riscar', '*/5 * * * *', $cmd$select private.riscar_postagens()$cmd$);

notify pgrst, 'reload schema';
commit;

-- Conferência depois de colar (só leitura): as 3 tabelas, as 2 funções do app e os 2 relógios existem.
select (select count(*) from information_schema.tables where table_schema = 'public' and table_name like 'postagens_planejadas%') as tabelas,
  (select count(*) from pg_proc where proname in ('postagens_calendario', 'salvar_planejada', 'apagar_planejada')) as funcoes_do_app,
  (select count(*) from cron.job where jobname in ('postagens_gerar', 'postagens_riscar')) as relogios;
