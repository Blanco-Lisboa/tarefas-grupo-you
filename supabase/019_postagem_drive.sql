begin;
-- 019 · contrato do 196 (postagem IG/FB) + 203 (arquivo no Drive) + Concluir/lixeira/trava depois de Aprovado.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 002, 006, 009, 015, 016.

-- 1. Card: legenda, redes e ocasião
alter table public.tarefas
  add column if not exists legenda text,
  add column if not exists postar_redes text[] not null default '{instagram,facebook}',
  add column if not exists ocasiao_id uuid,
  add column if not exists capa_quadro_ms int;  -- quadro da capa do Reels no Instagram (thumb_offset); nulo = primeiro quadro
alter table public.tarefas drop constraint if exists tarefas_capa_quadro_ok;
alter table public.tarefas add constraint tarefas_capa_quadro_ok check (capa_quadro_ms >= 0);
alter table public.tarefas drop constraint if exists tarefas_legenda_ok;
alter table public.tarefas add constraint tarefas_legenda_ok check (char_length(legenda) <= 2200);
alter table public.tarefas drop constraint if exists tarefas_postar_redes_ok;
alter table public.tarefas add constraint tarefas_postar_redes_ok check (postar_redes <@ array['instagram', 'facebook'] and cardinality(postar_redes) >= 1);

-- 2. Ocasião = pasta do Drive dentro da empresa (Tarefas · Conteúdos → Empresa → Ocasião). Só a função drive escreve.
create table if not exists public.ocasioes (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas(id),
  nome text not null check (btrim(nome) <> ''),
  drive_pasta_id text unique,
  criado_por uuid references public.pessoas(id),
  created_at timestamptz not null default now()
);
create unique index if not exists ocasioes_nome_unico on public.ocasioes (empresa_id, lower(btrim(nome)));
alter table public.ocasioes enable row level security;
drop policy if exists ocasioes_le on public.ocasioes;
create policy ocasioes_le on public.ocasioes for select to authenticated using ((select private.minha_pessoa()) is not null);
alter table public.tarefas drop constraint if exists tarefas_ocasiao_fk;
alter table public.tarefas add constraint tarefas_ocasiao_fk foreign key (ocasiao_id) references public.ocasioes(id) on delete set null;

create table if not exists public.drive_pastas (chave text primary key, drive_id text not null);
alter table public.drive_pastas enable row level security;  -- sem política: só a chave de serviço

-- 3. Arquivos: Drive, ordem do carrossel e capa
alter table public.arquivos
  add column if not exists drive_id text unique,
  add column if not exists ordem int not null default 0,
  add column if not exists papel text not null default 'anexo';
alter table public.arquivos alter column caminho drop not null;
alter table public.arquivos drop constraint if exists arquivos_um_lugar;
alter table public.arquivos add constraint arquivos_um_lugar check ((caminho is null) <> (drive_id is null));
alter table public.arquivos drop constraint if exists arquivos_video_no_drive;
alter table public.arquivos add constraint arquivos_video_no_drive check (tipo <> 'video' or drive_id is not null);
alter table public.arquivos drop constraint if exists arquivos_papel_ok;
alter table public.arquivos add constraint arquivos_papel_ok check (papel in ('anexo', 'capa') and (papel <> 'capa' or tipo = 'imagem'));
create unique index if not exists arquivos_uma_capa on public.arquivos (tarefa_id) where papel = 'capa';
update storage.buckets set allowed_mime_types = array_remove(allowed_mime_types, 'video/*') where id = 'arquivos';

-- 4. Quem mexe em anexo: quem pode alterar o card E, depois de Aprovado, só o Natham ou o aprovador (decisão de 23/10).
create or replace function private.pode_mexer_anexos(p_tarefa uuid) returns boolean
language sql stable set search_path = ''
as $$
  select exists (select 1 from public.tarefas t where t.id = p_tarefa
    and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
    and (t.etapa is null or t.etapa not in ('aprovado', 'postado') or (select private.pode_aprovar(t.aprovador))))
$$;
revoke all on function private.pode_mexer_anexos(uuid) from public, anon;
grant execute on function private.pode_mexer_anexos(uuid) to authenticated;
create or replace function public.pode_mexer_anexos(p_tarefa uuid) returns boolean
language sql stable security invoker set search_path = '' as $$ select private.pode_mexer_anexos(p_tarefa) $$;
revoke all on function public.pode_mexer_anexos(uuid) from public, anon;
grant execute on function public.pode_mexer_anexos(uuid) to authenticated;

create or replace function private.pode_alterar_arquivo(caminho text) returns boolean
language sql stable set search_path = ''
as $$
  select case split_part(caminho, '/', 1)
    when 'tarefas' then exists (select 1 from public.tarefas t where t.id::text = split_part(caminho, '/', 2)
      and (select private.pode_mexer_anexos(t.id)))
    when 'pecas' then (select private.minha_pessoa()) is not null
    else false
  end
$$;

-- Linha com drive_id só nasce e só sai pela função drive (senão alguém apontaria para outro arquivo do Drive e a limpeza o apagaria).
drop policy if exists arquivos_cria on public.arquivos;
create policy arquivos_cria on public.arquivos for insert to authenticated with check (
  criado_por = (select private.minha_pessoa()) and drive_id is null
  and ((tarefa_id is not null and (select private.pode_mexer_anexos(tarefa_id)))
       or (peca_id is not null and (select private.minha_pessoa()) is not null))
);
drop policy if exists arquivos_apaga on public.arquivos;
create policy arquivos_apaga on public.arquivos for delete to authenticated using (
  drive_id is null
  and ((tarefa_id is not null and (select private.pode_mexer_anexos(tarefa_id)))
       or (peca_id is not null and (select private.minha_pessoa()) is not null))
);

-- 5. Lixeira: além do dono, o Natham e o Matheus apagam card de conteúdo (decisão de 23/10).
create or replace function private.sou_natham_ou_matheus() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.pessoas p where p.user_id = (select auth.uid()) and p.slug in ('natham', 'matheus')) $$;
revoke all on function private.sou_natham_ou_matheus() from public, anon;
grant execute on function private.sou_natham_ou_matheus() to authenticated;
drop policy if exists tarefas_apaga on public.tarefas;
create policy tarefas_apaga on public.tarefas for delete to authenticated using (
  (select private.pode_apagar(dono_id, enviada_por))
  or (etapa is not null and empresa_id is not null and (select private.sou_natham_ou_matheus()))
);
create or replace function public.pode_apagar_tarefa(p_tarefa uuid) returns boolean
language sql stable security invoker set search_path = ''
as $$
  select exists (select 1 from public.tarefas t where t.id = p_tarefa and (
    (select private.pode_apagar(t.dono_id, t.enviada_por))
    or (t.etapa is not null and t.empresa_id is not null and (select private.sou_natham_ou_matheus()))))
$$;
revoke all on function public.pode_apagar_tarefa(uuid) from public, anon;
grant execute on function public.pode_apagar_tarefa(uuid) to authenticated;
-- Card com anexo (Drive ou Supabase) só se apaga pela função drive (ela tira os arquivos antes; nada fica órfão).
create or replace function private.tarefas_apagar_com_drive() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and exists (select 1 from public.arquivos a where a.tarefa_id = old.id) then
    raise exception 'card com anexo se apaga pela lixeira ou pelo Concluir (a funcao drive tira os arquivos antes)' using errcode = '42501';
  end if;
  return old;
end $$;
drop trigger if exists tarefas_apagar_com_drive on public.tarefas;
create trigger tarefas_apagar_com_drive before delete on public.tarefas for each row execute function private.tarefas_apagar_com_drive();

-- 6. Gatilho de aprovação (015) + Aprovado/Postado só para Tipo Postagem + trava de legenda, formato e redes depois de Aprovado.
create or replace function private.tarefas_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
declare v_entra_aprovado boolean; v_entra_postado boolean;
begin
  if new.postar_em is not null then
    begin perform new.postar_em::timestamp;
    exception when others then raise exception 'postar_em invalido: %', new.postar_em using errcode = '22007'; end;
  end if;
  if new.etapa in ('aprovado', 'postado') and new.tipo is distinct from 'postagem' then
    raise exception 'so card do tipo Postagem vai para Aprovado ou Postado; os outros terminam em Concluir' using errcode = '23514';
  end if;
  v_entra_aprovado := new.etapa = 'aprovado' and (tg_op = 'INSERT' or old.etapa is distinct from 'aprovado');
  v_entra_postado := new.etapa = 'postado' and (tg_op = 'INSERT' or coalesce(old.etapa, '') not in ('aprovado', 'postado'));
  if tg_op = 'UPDATE' then
    -- Aprovado -> Postado a mão (sem a função ter postado) também é do Natham/aprovador: senão um editor "posta" no papel e o arquivo some em 7 dias.
    if (new.conserto and not old.conserto) or v_entra_aprovado or v_entra_postado
       or (old.etapa = 'aprovado' and new.etapa = 'postado')
       or new.aprovador is distinct from old.aprovador
       or (old.etapa in ('aprovado', 'postado') and new.etapa in ('aprovado', 'postado') and (
            new.postar_em is distinct from old.postar_em or new.legenda is distinct from old.legenda
            or new.formato is distinct from old.formato or new.postar_redes is distinct from old.postar_redes
            or new.capa_quadro_ms is distinct from old.capa_quadro_ms)) then
      if not (select private.pode_aprovar(old.aprovador)) then
        raise exception 'so o Natham ou o aprovador do card aprova, programa, muda o que vai para a rede ou manda consertar' using errcode = '42501';
      end if;
    end if;
  else
    if new.conserto then raise exception 'conserto so nasce de "Consertar" em um card existente' using errcode = '42501'; end if;
    if (v_entra_aprovado or v_entra_postado) and not (select private.pode_aprovar(new.aprovador)) then
      raise exception 'so o Natham ou o aprovador do card cria um card ja aprovado' using errcode = '42501';
    end if;
  end if;
  if new.etapa is distinct from 'edicao' then new.conserto := false; end if;
  if new.etapa is null or new.etapa not in ('aprovado', 'postado') then new.postar_em := null; end if;
  return new;
end $$;

-- 7. salvar_tarefa (015) + legenda, postar_redes, ocasiao_id, capa_quadro_ms. Chave ausente no JSON = mantém o valor atual.
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
      concluida = r.concluida, objetivo = r.objetivo, notas = r.notas, links = r.links, aprovador = r.aprovador,
      postar_em = case when p ? 'postar_em' then r.postar_em else t.postar_em end,
      formato = case when p ? 'formato' then r.formato else t.formato end,
      conserto = case when p ? 'conserto' then coalesce(r.conserto, false) else t.conserto end,
      legenda = case when p ? 'legenda' then r.legenda else t.legenda end,
      postar_redes = case when p ? 'postar_redes' then coalesce(r.postar_redes, '{instagram,facebook}') else t.postar_redes end,
      ocasiao_id = case when p ? 'ocasiao_id' then r.ocasiao_id else t.ocasiao_id end,
      capa_quadro_ms = case when p ? 'capa_quadro_ms' then r.capa_quadro_ms else t.capa_quadro_ms end
    where t.id = r.id;
    get diagnostics v_linhas = row_count;
    if v_linhas = 0 then raise exception 'sem permissao para alterar a tarefa'; end if;
    delete from public.tarefa_tags where tarefa_id = r.id;
  else
    insert into public.tarefas (id, titulo, tipo, empresa_id, rede, etapa, responsavel_id, inicio, fim, dia_inteiro, cor,
      concluida, objetivo, notas, links, aprovador, dono_id, criado_por, enviada_por, vai_pro_google, postar_em, formato,
      legenda, postar_redes, ocasiao_id, capa_quadro_ms)
    values (r.id, r.titulo, r.tipo, r.empresa_id, r.rede, r.etapa, r.responsavel_id, r.inicio, r.fim, r.dia_inteiro, r.cor,
      r.concluida, r.objetivo, r.notas, r.links, r.aprovador, r.dono_id, r.criado_por, r.enviada_por, coalesce(r.vai_pro_google, false),
      r.postar_em, r.formato, r.legenda, coalesce(r.postar_redes, '{instagram,facebook}'), r.ocasiao_id, r.capa_quadro_ms);
  end if;
  insert into public.tarefa_tags (tarefa_id, tag_id) select r.id, unnest(p_tags);
end $$;
revoke all on function public.salvar_tarefa(jsonb, text[]) from public, anon;
grant execute on function public.salvar_tarefa(jsonb, text[]) to authenticated;

-- 8. Registro da postagem (uma linha por card e por rede: o unique impede post duplicado na mesma rede)
create table if not exists public.postagens (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  rede text not null check (rede in ('instagram', 'facebook')),
  status text not null default 'fila' check (status in ('fila', 'enviando', 'processando', 'postado', 'erro')),
  conteiner_id text, post_id text, link text, erro text,
  tentativas int not null default 0,
  pego_em timestamptz, postado_em timestamptz,
  unique (tarefa_id, rede)
);
alter table public.postagens enable row level security;
drop policy if exists postagens_le on public.postagens;
create policy postagens_le on public.postagens for select to authenticated
  using (exists (select 1 from public.tarefas t where t.id = tarefa_id));  -- a trava de leitura de tarefas decide

-- 9. Segredos (Vault). O da campainha é sorteado aqui; ninguém precisa vê-lo.
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'tarefas_funcoes_segredo') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'tarefas_funcoes_segredo');
  end if;
  if not exists (select 1 from vault.secrets where name = 'tarefas_aviso_segredo') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'tarefas_aviso_segredo');
  end if;
end $$;
create or replace function public.ler_segredo_servico(p_nome text) returns text
language sql stable security definer set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_nome
    and p_nome in ('tarefas_funcoes_segredo', 'google_drive_refresh_token', 'tarefas_aviso_url', 'tarefas_aviso_segredo')
$$;
revoke all on function public.ler_segredo_servico(text) from public, anon, authenticated;
grant execute on function public.ler_segredo_servico(text) to service_role;
create or replace function public.guardar_google_token(p text) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'google_drive_refresh_token';
  if v_id is null then perform vault.create_secret(p, 'google_drive_refresh_token'); else perform vault.update_secret(v_id, p); end if;
end $$;
revoke all on function public.guardar_google_token(text) from public, anon, authenticated;
grant execute on function public.guardar_google_token(text) to service_role;

-- 10. Alarmes de uso único (pg_cron em GMT). Analogia: um despertador por card, que toca uma vez e se joga fora.
create or replace function private.alarme_nome(p_tipo text, p_tarefa uuid) returns text
language sql immutable set search_path = '' as $$ select 'tarefas_' || p_tipo || '_' || p_tarefa::text $$;

create or replace function private.alarme_tocou(p_tipo text, p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_nome text := private.alarme_nome(p_tipo, p_tarefa); v_segredo text;
begin
  if exists (select 1 from cron.job where jobname = v_nome) then perform cron.unschedule(v_nome); end if;
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'tarefas_funcoes_segredo';
  perform net.http_post(
    url := 'https://uruhjlurcxpjhhgvuzwt.supabase.co/functions/v1/' || case p_tipo when 'limpar' then 'drive' else 'postar-meta' end,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-tarefas-segredo', v_segredo),
    body := jsonb_build_object('acao', p_tipo, 'tarefa_id', p_tarefa),
    timeout_milliseconds := 55000);  -- pg_net padrão é 5 s (memória pgnet-timeout)
end $$;
revoke all on function private.alarme_tocou(text, uuid) from public, anon, authenticated;

create or replace function private.armar_alarme(p_tipo text, p_tarefa uuid, p_quando timestamptz) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_utc timestamp := p_quando at time zone 'UTC';
begin
  -- a expressão do cron não tem ano: alarme a mais de ~1 ano tocaria cedo demais e se apagaria sem postar
  if p_quando > now() + interval '300 days' then raise exception 'alarme a mais de 300 dias nao e aceito' using errcode = '22023'; end if;
  if p_quando <= now() + interval '1 minute' then perform private.alarme_tocou(p_tipo, p_tarefa); return; end if;
  perform cron.schedule(private.alarme_nome(p_tipo, p_tarefa),
    format('%s %s %s %s *', extract(minute from v_utc)::int, extract(hour from v_utc)::int, extract(day from v_utc)::int, extract(month from v_utc)::int),
    format('select private.alarme_tocou(%L, %L::uuid)', p_tipo, p_tarefa));
end $$;
revoke all on function private.armar_alarme(text, uuid, timestamptz) from public, anon, authenticated;

create or replace function private.desarmar_alarme(p_tipo text, p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from cron.job where jobname = private.alarme_nome(p_tipo, p_tarefa)) then
    perform cron.unschedule(private.alarme_nome(p_tipo, p_tarefa));
  end if;
end $$;
revoke all on function private.desarmar_alarme(text, uuid) from public, anon, authenticated;

create or replace function private.tarefas_alarmes() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.desarmar_alarme('postar', old.id);
    perform private.desarmar_alarme('limpar', old.id);
    return old;
  end if;
  if new.etapa = 'aprovado' and new.postar_em is not null then
    if tg_op = 'INSERT' or old.etapa is distinct from 'aprovado' or old.postar_em is distinct from new.postar_em then
      perform private.armar_alarme('postar', new.id, new.postar_em::timestamp at time zone 'America/Sao_Paulo');
    end if;
  else
    perform private.desarmar_alarme('postar', new.id);
  end if;
  if new.etapa = 'postado' and (tg_op = 'INSERT' or old.etapa is distinct from 'postado') then
    perform private.armar_alarme('limpar', new.id, now() + interval '7 days');
  elsif new.etapa is distinct from 'postado' then
    perform private.desarmar_alarme('limpar', new.id);
  end if;
  return new;
end $$;
drop trigger if exists tarefas_alarmes on public.tarefas;
create trigger tarefas_alarmes after insert or update of etapa, postar_em or delete on public.tarefas
  for each row execute function private.tarefas_alarmes();

-- O relógio de todo minuto (015) sai: o Natham não quer execução à toa (23/10).
do $$ begin
  if exists (select 1 from cron.job where jobname = 'tarefas_postar_vencidos') then perform cron.unschedule('tarefas_postar_vencidos'); end if;
end $$;
drop function if exists private.postar_vencidos();

-- 11. RPCs da tela
create or replace function public.postar_agora(p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_antes text; v_agora text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI');
begin
  select postar_em into v_antes from public.tarefas t
  where t.id = p_tarefa and t.etapa = 'aprovado' and t.tipo = 'postagem' and (select private.pode_aprovar(t.aprovador));
  if not found then raise exception 'so o Natham ou o aprovador posta agora, e so card de Postagem em Aprovado' using errcode = '42501'; end if;
  update public.tarefas set postar_em = v_agora where id = p_tarefa;  -- o gatilho de alarmes dispara se a hora mudou
  if v_antes is not distinct from v_agora then perform private.alarme_tocou('postar', p_tarefa); end if;
end $$;
revoke all on function public.postar_agora(uuid) from public, anon;
grant execute on function public.postar_agora(uuid) to authenticated;

create or replace function public.tentar_de_novo(p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.tarefas t where t.id = p_tarefa and t.etapa = 'aprovado' and (select private.pode_aprovar(t.aprovador))) then
    raise exception 'so o Natham ou o aprovador tenta de novo' using errcode = '42501';
  end if;
  update public.postagens set status = 'fila', erro = null where tarefa_id = p_tarefa and status = 'erro';
  perform private.alarme_tocou('postar', p_tarefa);
end $$;
revoke all on function public.tentar_de_novo(uuid) from public, anon;
grant execute on function public.tentar_de_novo(uuid) to authenticated;

-- 12. RPCs das funções (só chave de serviço)
-- A catraca: cria as linhas das redes escolhidas e passa para 'enviando' só o que ninguém pegou.
-- 'enviando' parado há mais de 10 min = a função caiu no meio; volta a ser pego, e a função confere na Meta antes de publicar de novo.
create or replace function public.pegar_postagens(p_tarefa uuid) returns setof public.postagens
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.postagens (tarefa_id, rede)
  select t.id, r from public.tarefas t, unnest(t.postar_redes) r
  where t.id = p_tarefa and t.etapa = 'aprovado' and t.tipo = 'postagem' and t.empresa_id = 'you' and t.postar_em is not null
    and t.postar_em <= to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI')
  on conflict (tarefa_id, rede) do nothing;
  return query
  -- tentativas conta só envio novo (fila); voltar de 'processando' para conferir o vídeo não gasta tentativa
  update public.postagens p set status = 'enviando', pego_em = now(), tentativas = p.tentativas + (p.status = 'fila')::int
  from public.tarefas t
  where p.tarefa_id = p_tarefa and t.id = p.tarefa_id and t.etapa = 'aprovado' and t.tipo = 'postagem' and t.empresa_id = 'you'
    and t.postar_em is not null and t.postar_em <= to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI')
    and p.rede = any (t.postar_redes)  -- rede tirada do card depois de um erro não volta; pedido velho antes da nova hora não pega nada
    and (p.status in ('fila', 'processando') or (p.status = 'enviando' and p.pego_em < now() - interval '10 minutes'))
  returning p.*;
end $$;
revoke all on function public.pegar_postagens(uuid) from public, anon, authenticated;
grant execute on function public.pegar_postagens(uuid) to service_role;

create or replace function public.armar_alarme_servico(p_tipo text, p_tarefa uuid, p_minutos int) returns void
language sql security definer set search_path = ''
as $$ select private.armar_alarme(p_tipo, p_tarefa, now() + make_interval(mins => p_minutos)) $$;
revoke all on function public.armar_alarme_servico(text, uuid, int) from public, anon, authenticated;
grant execute on function public.armar_alarme_servico(text, uuid, int) to service_role;

-- Cards que já estavam Aprovado (programados) ou Postado quando o 019 entra ganham o alarme (hora no passado fica de fora: a função ainda pode não estar no ar).
do $$ declare r record; begin
  for r in select id, postar_em, etapa from public.tarefas where etapa in ('aprovado', 'postado') loop
    if r.etapa = 'aprovado' and r.postar_em is not null and (r.postar_em::timestamp at time zone 'America/Sao_Paulo') > now() + interval '1 minute' then
      perform private.armar_alarme('postar', r.id, r.postar_em::timestamp at time zone 'America/Sao_Paulo');
    elsif r.etapa = 'postado' then
      perform private.armar_alarme('limpar', r.id, now() + interval '7 days');
    end if;
  end loop;
end $$;

-- Privilégios explícitos (não depender do padrão do projeto): a tela só lê; escrever é da função com a chave de serviço.
revoke all on public.ocasioes, public.postagens, public.drive_pastas from anon, authenticated;
grant select on public.ocasioes, public.postagens to authenticated;
grant all on public.ocasioes, public.postagens, public.drive_pastas to service_role;

-- 13. Balde temporário da foto/capa para a Meta baixar (minutos; a função apaga depois). Vídeo nunca entra aqui.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('postagens', 'postagens', false, 52428800, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

notify pgrst, 'reload schema';
commit;
