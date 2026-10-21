-- ANTES DE COLAR (so leitura): esta consulta tem de voltar VAZIA. Se listar algo, ha video guardado no Supabase (o 019 so aceita video no Drive):
--   select a.id, a.nome, t.titulo as card, a.tamanho from public.arquivos a left join public.tarefas t on t.id = a.tarefa_id where a.tipo = 'video' and a.caminho is not null;
-- Se o 019 for colado assim mesmo, ele PARA no primeiro bloco com a lista dos cards e nao muda nada (a transacao desfaz tudo).
begin;
do $$
declare v_lista text; v_n int;
begin
  select count(*), string_agg(coalesce(t.titulo, 'sem card') || ' (' || a.nome || ')', '; ' order by t.titulo)
    into v_n, v_lista from public.arquivos a left join public.tarefas t on t.id = a.tarefa_id where a.tipo = 'video' and a.caminho is not null;
  if v_n > 0 then
    raise exception '019 NAO APLICADO: % video(s) guardado(s) no Supabase, e o 019 so aceita video no Drive. Cards: %. Baixe/anexe de novo cada video (ja com o Drive ligado) e apague o antigo, depois cole o 019 outra vez.', v_n, v_lista using errcode = 'P0001';
  end if;
end $$;
-- 019 v2 (item 229) · contrato do 196 (postagem IG/FB) + 203 (arquivo no Drive) + Concluir/lixeira/trava depois de Aprovado.
-- v2 = o 019 que a Lupa liberou + 3 mudanças do 229, todas marcadas com "229": (a) ocasioes ganha permanente/desligado_em e perde drive_pasta_id,
--   (b) arquivos aceita documento SOLTO de pasta (empresa/formato/tema, sem card), (c) funções definir_permanente e pode_mexer_pastas. O resto não mudou.
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

-- 2. Ocasião (na tela: TEMA) = agrupador dos conteúdos da empresa. 229: as pastas do Drive de um Tema são uma por Formato e moram em drive_pastas
--    (Tarefas · Conteúdos → Empresa → Formato → Tema → pasta do conteúdo), não aqui. Só a função drive escreve.
create table if not exists public.ocasioes (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas(id),
  nome text not null check (btrim(nome) <> ''),
  permanente boolean not null default false,  -- 229: tema permanente = a limpeza dos 7 dias não apaga nada dele (cadeado na tela)
  desligado_em timestamptz,                   -- 229: quando o Natham desligou o Permanente (a tela conta os 7 dias de novo a partir daqui)
  criado_por uuid references public.pessoas(id),
  created_at timestamptz not null default now()
);
alter table public.ocasioes add column if not exists permanente boolean not null default false;
alter table public.ocasioes add column if not exists desligado_em timestamptz;
alter table public.ocasioes drop column if exists drive_pasta_id;
create unique index if not exists ocasioes_nome_unico on public.ocasioes (empresa_id, lower(btrim(nome)));
alter table public.ocasioes enable row level security;
drop policy if exists ocasioes_le on public.ocasioes;
create policy ocasioes_le on public.ocasioes for select to authenticated using ((select private.minha_pessoa()) is not null);
alter table public.tarefas drop constraint if exists tarefas_ocasiao_fk;
alter table public.tarefas add constraint tarefas_ocasiao_fk foreign key (ocasiao_id) references public.ocasioes(id) on delete set null;

create table if not exists public.drive_pastas (chave text primary key, drive_id text not null);
alter table public.drive_pastas enable row level security;  -- sem política: só a chave de serviço
-- 229: chaves = empresa:<e> | formato:<e>:<formato|sem> | tema:<tema|sem>:<e>:<formato|sem> | card:<tarefa> (ver supabase/functions/_shared/pastas.ts)

-- 2b. 229 · Permanente: QUEM pode é do banco, não da tela. Natham e Matheus ligam; só o Natham desliga. Desligar anota a hora (recomeça os 7 dias).
create or replace function private.definir_permanente(p_ocasiao uuid, p_ligado boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_slug text; v_atual boolean;
begin
  select slug into v_slug from public.pessoas where id = (select private.minha_pessoa());
  if v_slug is null or v_slug not in ('natham', 'matheus') then raise exception 'sem permissao' using errcode = '42501'; end if;
  select permanente into v_atual from public.ocasioes where id = p_ocasiao for update;
  if not found then raise exception 'tema nao existe' using errcode = 'P0002'; end if;
  if v_atual and not p_ligado and v_slug <> 'natham' then raise exception 'so o Natham desliga o Permanente' using errcode = '42501'; end if;
  update public.ocasioes set permanente = p_ligado, desligado_em = case when p_ligado then null when v_atual then now() else desligado_em end where id = p_ocasiao;
end $$;
revoke all on function private.definir_permanente(uuid, boolean) from public, anon;
grant execute on function private.definir_permanente(uuid, boolean) to authenticated;
create or replace function public.definir_permanente(p_ocasiao uuid, p_ligado boolean) returns void
language sql security invoker set search_path = '' as $$ select private.definir_permanente(p_ocasiao, p_ligado) $$;
revoke all on function public.definir_permanente(uuid, boolean) from public, anon;
grant execute on function public.definir_permanente(uuid, boolean) to authenticated;

-- 229 · Quem pode pôr e tirar documento solto nas pastas da tela Pastas: qualquer pessoa com login (hoje Natham e Matheus).
create or replace function private.pode_mexer_pastas() returns boolean
language sql stable security definer set search_path = '' as $$ select (select private.minha_pessoa()) is not null $$;
revoke all on function private.pode_mexer_pastas() from public, anon;
grant execute on function private.pode_mexer_pastas() to authenticated;
create or replace function public.pode_mexer_pastas() returns boolean
language sql stable security invoker set search_path = '' as $$ select private.pode_mexer_pastas() $$;
revoke all on function public.pode_mexer_pastas() from public, anon;
grant execute on function public.pode_mexer_pastas() to authenticated;

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

-- 3b. 229 · Documento SOLTO de pasta: arquivo posto direto numa pasta de Tema pela tela Pastas (sem card). Mora no Drive, em Empresa → Formato → Tema.
--     Não vence em 7 dias (não há "Postado" que o arme); só sai quando alguém o apaga. Só a função drive grava (a política de inserir exige drive_id nulo).
alter table public.arquivos
  add column if not exists empresa_id text references public.empresas(id),
  add column if not exists formato text,
  add column if not exists ocasiao_id uuid references public.ocasioes(id) on delete restrict;
do $$ declare r record; begin  -- o check do 001 (exatamente um entre tarefa e peça) não vale mais para documento solto
  for r in select conname from pg_constraint where conrelid = 'public.arquivos'::regclass and contype = 'c' and conname <> 'arquivos_solto_ok'
      and pg_get_constraintdef(oid) like '%tarefa_id%' and pg_get_constraintdef(oid) like '%peca_id%' and pg_get_constraintdef(oid) not like '%caminho%' loop
    execute format('alter table public.arquivos drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.arquivos drop constraint if exists arquivos_solto_ok;
alter table public.arquivos add constraint arquivos_solto_ok check (
  (tarefa_id is not null or peca_id is not null or (empresa_id is not null and drive_id is not null))  -- solto precisa de empresa e vive no Drive
  and (empresa_id is null or (tarefa_id is null and peca_id is null))                                  -- solto não é de card nem de peça
  and (formato is null or formato in ('reels', 'post', 'carrossel', 'story'))
  and (ocasiao_id is null or empresa_id is not null)
);
drop policy if exists arquivos_le on public.arquivos;
create policy arquivos_le on public.arquivos for select to authenticated using (
  (tarefa_id is not null and exists (select 1 from public.tarefas t where t.id = tarefa_id))
  or (peca_id is not null and (select private.minha_pessoa()) is not null)
  or (empresa_id is not null and tarefa_id is null and peca_id is null and (select private.minha_pessoa()) is not null)
);
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
-- Quem aprova (223, igual ao 021): troca pela mão do Natham, do Matheus ou do aprovador atual.
create or replace function private.pode_trocar_aprovador(aprovador text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is null or exists (
    select 1 from public.pessoas p
    where p.user_id = (select auth.uid()) and (p.slug in ('natham', 'matheus') or lower(p.nome) = lower(btrim(aprovador)))
  )
$$;
revoke all on function private.pode_trocar_aprovador(text) from public, anon;
grant execute on function private.pode_trocar_aprovador(text) to authenticated;

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
    if new.aprovador is distinct from old.aprovador and not (select private.pode_trocar_aprovador(old.aprovador)) then
      raise exception 'so o Natham, o Matheus ou o aprovador do card troca quem aprova' using errcode = '42501';
    end if;
    -- Sair de Aprovado (para Postado a mão, Edição ou qualquer etapa) também é do Natham/aprovador: senão um editor "posta" no papel, ou volta o card para Edição
    -- e escapa da trava de legenda/redes/capa/anexos, e o alarme se cancela.
    if (new.conserto and not old.conserto) or v_entra_aprovado or v_entra_postado
       or (old.etapa = 'aprovado' and new.etapa is distinct from 'aprovado')
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
  rodadas int not null default 0,  -- vezes que a catraca entregou a linha na sequência atual (fila = 1, depois +1); o teto do sentinela lê aqui
  pego_em timestamptz, postado_em timestamptz,
  unique (tarefa_id, rede)
);
alter table public.postagens add column if not exists rodadas int not null default 0;
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

-- Só agenda (sem tocar). p_rodada = quantas vezes o sentinel já tocou nesta sequência (0 = alarme normal).
create or replace function private.cron_alarme(p_tipo text, p_tarefa uuid, p_quando timestamptz, p_rodada int) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_utc timestamp := p_quando at time zone 'UTC';
begin
  perform cron.schedule(private.alarme_nome(p_tipo, p_tarefa),
    format('%s %s %s %s *', extract(minute from v_utc)::int, extract(hour from v_utc)::int, extract(day from v_utc)::int, extract(month from v_utc)::int),
    format('select private.alarme_tocou(%L, %L::uuid, %s)', p_tipo, p_tarefa, p_rodada));
end $$;
revoke all on function private.cron_alarme(text, uuid, timestamptz, int) from public, anon, authenticated;

-- Quando o alarme toca: apaga a si mesmo, arma um SENTINELA (mesmo nome, +12 min, uso único) e só então chama a função.
-- Analogia: o despertador toca e já deixa outro de reserva; quem chegar ao fim do serviço (Postado) ou desistir (desarmar_alarme_servico) joga a reserva fora.
-- O sentinela não rearma se todas as linhas do card já terminaram (postado/erro)
-- ou, com a função fora do ar (ninguém pega, rodadas nunca sobe), depois de 5 toques seguidos (ou rodadas > 5, que a função já devia ter tratado): aí a postagem vai para erro (faixa vermelha).
create or replace function private.alarme_tocou(p_tipo text, p_tarefa uuid, p_rodada int) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_nome text := private.alarme_nome(p_tipo, p_tarefa); v_segredo text; v_rodadas int; v_aberto boolean; v_tem boolean;
  c_teto constant int := 5;  -- combinado com o Correio
begin
  -- Toque velho (sentinela que já estava rodando quando o card foi reprogramado, ou card que saiu de Aprovado): não mexe em nada, o gatilho cuida dos jobs.
  if p_tipo = 'postar' and not exists (select 1 from public.tarefas t where t.id = p_tarefa and t.etapa = 'aprovado' and t.postar_em is not null
       and t.postar_em <= to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI')) then return; end if;
  if p_tipo = 'limpar' and not exists (select 1 from public.tarefas t where t.id = p_tarefa and t.etapa = 'postado') then return; end if;
  if exists (select 1 from cron.job where jobname = v_nome) then perform cron.unschedule(v_nome); end if;
  -- Limpeza sem arquivo restante = serviço feito: o sentinela acaba aqui, sem depender de a função desarmar.
  if p_tipo = 'limpar' and not exists (select 1 from public.arquivos a where a.tarefa_id = p_tarefa) then return; end if;
  if p_tipo = 'postar' then
    select coalesce(max(p.rodadas) filter (where p.status not in ('postado', 'erro')), 0), coalesce(bool_or(p.status not in ('postado', 'erro')), false), count(*) > 0
      into v_rodadas, v_aberto, v_tem from public.postagens p join public.tarefas t on t.id = p.tarefa_id
      where p.tarefa_id = p_tarefa and p.rede = any (t.postar_redes);  -- rede fora do card não conta
    if v_tem and not v_aberto then
      -- Todas as redes do card postadas e o card ainda em Aprovado (a função não conseguiu movê-lo): o banco move (o gatilho arma a limpeza).
      if not exists (select 1 from public.tarefas t, unnest(t.postar_redes) r where t.id = p_tarefa
           and not exists (select 1 from public.postagens p where p.tarefa_id = t.id and p.rede = r and p.status = 'postado')) then
        update public.tarefas set etapa = 'postado' where id = p_tarefa and etapa = 'aprovado' and cardinality(postar_redes) > 0;
      end if;
      return;  -- senão: nada a fazer, as redes já terminaram (alguma em erro: a tela mostra a faixa)
    end if;
  else
    v_rodadas := 0;
  end if;
  if p_rodada >= c_teto or v_rodadas > c_teto then
    if p_tipo = 'limpar' then  -- função Drive fora do ar: tenta de novo daqui a 1 dia (1 alarme por card, sem relógio de minuto)
      perform private.cron_alarme('limpar', p_tarefa, now() + interval '1 day', 0);
    else
      insert into public.postagens (tarefa_id, rede, status, erro)
      select t.id, r, 'erro', 'a funcao de postagem nao respondeu depois de varias tentativas'
      from public.tarefas t, unnest(t.postar_redes) r where t.id = p_tarefa and t.etapa = 'aprovado'
      on conflict (tarefa_id, rede) do update set status = 'erro',
        erro = case when public.postagens.status = 'fila' then excluded.erro else 'estado incerto: confira a rede antes de tentar de novo' end
        where public.postagens.status in ('fila', 'enviando', 'processando');
    end if;
    return;
  end if;
  perform private.cron_alarme(p_tipo, p_tarefa, now() + interval '12 minutes', p_rodada + 1);
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'tarefas_funcoes_segredo';
  perform net.http_post(
    url := 'https://uruhjlurcxpjhhgvuzwt.supabase.co/functions/v1/' || case p_tipo when 'limpar' then 'drive' else 'postar-meta' end,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-tarefas-segredo', v_segredo),
    body := jsonb_build_object('acao', p_tipo, 'tarefa_id', p_tarefa),
    timeout_milliseconds := 55000);  -- pg_net padrão é 5 s (memória pgnet-timeout)
end $$;
revoke all on function private.alarme_tocou(text, uuid, int) from public, anon, authenticated;
-- Compatibilidade: job agendado com a assinatura de 2 argumentos (versão anterior deste arquivo) continua funcionando.
create or replace function private.alarme_tocou(p_tipo text, p_tarefa uuid) returns void
language sql security definer set search_path = '' as $$ select private.alarme_tocou(p_tipo, p_tarefa, 0) $$;
revoke all on function private.alarme_tocou(text, uuid) from public, anon, authenticated;

create or replace function private.armar_alarme(p_tipo text, p_tarefa uuid, p_quando timestamptz) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  -- a expressão do cron não tem ano: alarme a mais de ~1 ano tocaria cedo demais e se apagaria sem postar
  if p_quando > now() + interval '300 days' then raise exception 'alarme a mais de 300 dias nao e aceito' using errcode = '22023'; end if;
  if p_quando <= now() then perform private.alarme_tocou(p_tipo, p_tarefa, 0); return; end if;
  perform private.cron_alarme(p_tipo, p_tarefa, p_quando, 0);
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

-- Tirar uma rede do card apaga a linha dela que ainda não saiu (fila/erro): rede fora do card não segura o Postado nem o sentinela.
create or replace function private.tarefas_redes_limpa() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.postagens p where p.tarefa_id = new.id and p.status in ('fila', 'erro') and not p.rede = any (new.postar_redes);
  return new;
end $$;
drop trigger if exists tarefas_redes_limpa on public.tarefas;
create trigger tarefas_redes_limpa after update of postar_redes on public.tarefas
  for each row when (new.postar_redes is distinct from old.postar_redes) execute function private.tarefas_redes_limpa();

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
  if v_antes is not distinct from v_agora then perform private.alarme_tocou('postar', p_tarefa, 0); end if;
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
  -- rede tirada do card depois do erro: a linha é apagada (sem status novo); só as redes escolhidas voltam para a fila
  delete from public.postagens p using public.tarefas t where t.id = p_tarefa and p.tarefa_id = t.id and p.status in ('fila', 'erro') and not p.rede = any (t.postar_redes);
  update public.postagens p set status = 'fila', erro = null from public.tarefas t
    where p.tarefa_id = p_tarefa and t.id = p.tarefa_id and p.status = 'erro' and p.rede = any (t.postar_redes);
  perform private.alarme_tocou('postar', p_tarefa, 0);
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
  update public.postagens p set status = 'enviando', pego_em = now(), tentativas = p.tentativas + (p.status = 'fila')::int,
    rodadas = case when p.status = 'fila' then 1 else p.rodadas + 1 end
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

-- Fim do serviço (erro definitivo, ou limpeza feita): a função joga fora o sentinela.
create or replace function public.desarmar_alarme_servico(p_tipo text, p_tarefa uuid) returns void
language sql security definer set search_path = ''
as $$ select private.desarmar_alarme(p_tipo, p_tarefa) $$;
revoke all on function public.desarmar_alarme_servico(text, uuid) from public, anon, authenticated;
grant execute on function public.desarmar_alarme_servico(text, uuid) to service_role;

-- Cards que já estavam Aprovado (programados) ou Postado quando o 019 entra ganham o alarme (hora no passado fica de fora: a função ainda pode não estar no ar).
do $$ declare r record; begin
  for r in select id, postar_em, etapa from public.tarefas where etapa in ('aprovado', 'postado') loop
    if exists (select 1 from cron.job where jobname = private.alarme_nome(case r.etapa when 'postado' then 'limpar' else 'postar' end, r.id)) then continue; end if;
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
