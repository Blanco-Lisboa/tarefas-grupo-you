begin;
-- Itens 201 e 202-banco (rodada 193-198, acréscimo 22/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente.
-- Depende do 015 (etapa 'postado', postar_em) e do 016 (anexos). Segredos no Vault (NÃO neste arquivo): n8n_drive_url, n8n_drive_secret.
-- Brief do n8n: docs/levas/2026-10-22-N8N-DRIVE-BRIEF.md.
--
-- FLUXO. Analogia: o armário (Storage) é pequeno e caro; o arquivo morto (Drive) é grande. Quando o conteúdo é postado, o banco põe os
-- anexos numa FILA; o n8n (o motoboy) leva cada um ao Drive e devolve o RECIBO (id e link). Só com o recibo na mão, 3 dias depois do
-- "Postado", o n8n tira o arquivo do armário. Sem recibo, ninguém apaga nada: a linha ganha um AVISO.
--   1) card vai para 'postado'  -> tarefas.postado_em = agora; cada anexo do card (que ainda não foi) entra na fila (arquivos.drive_estado='pendente')
--      e o banco toca a campainha do n8n (pg_net). Anexo posto num card JÁ postado entra na fila na hora.
--   2) n8n: drive_fila() devolve os anexos a enviar -> envia -> drive_confirmar(id, file_id, link, pasta) (ou com erro).
--      Erro: volta para a fila em ~5 min; na 5ª falha vira 'falhou' (e fica o aviso). Reserva de quem pegou: 30 min (vídeo de 500 MB demora). Reenfileirar à mão: ver o fim do arquivo.
--   3) n8n, 1x por dia: drive_limpar_pendentes() devolve os anexos com recibo e postado há 3 dias+ -> o n8n apaga o arquivo do Storage
--      -> drive_limpeza_confirmar(id) grava removido_em. A linha continua, com o drive_link no lugar do arquivo.
--      (Apagar de dentro do banco NÃO serve: apagar a linha de storage.objects deixa o arquivo físico para trás. Só a API do Storage apaga de verdade.)
--   4) Um despertador de hora em hora marca arquivos.aviso para o que passou de 3 dias do Postado sem recibo (e limpa o aviso quando o recibo chega).

alter table public.tarefas add column if not exists postado_em timestamptz;
alter table public.arquivos
  add column if not exists drive_estado text check (drive_estado in ('pendente', 'feito', 'falhou')),
  add column if not exists drive_na_fila_em timestamptz,
  add column if not exists drive_pegou_em timestamptz,
  add column if not exists drive_tentativas int not null default 0,
  add column if not exists drive_erro text,
  add column if not exists drive_file_id text,
  add column if not exists drive_link text,
  add column if not exists drive_pasta text,   -- "Postagens / Empresa / Reels", só para a pessoa ler
  add column if not exists drive_em timestamptz,
  add column if not exists removido_em timestamptz, -- quando o arquivo saiu do Storage (a linha fica, com o drive_link)
  add column if not exists aviso text,
  add column if not exists limpeza_autorizada_em timestamptz, -- o banco deu o ok para apagar do Storage (sem prazo: a confirmação pode atrasar)
  add column if not exists limpeza_tentou_em timestamptz;     -- última vez que entrou numa lista de limpeza (falha repetida vai para o fim da fila)
-- feito = tem recibo (id e link) ; removido do Storage = só se feito
alter table public.arquivos drop constraint if exists arquivos_drive_recibo_ok;
alter table public.arquivos add constraint arquivos_drive_recibo_ok check (
  (drive_estado is distinct from 'feito' or (nullif(btrim(drive_file_id), '') is not null and nullif(btrim(drive_link), '') is not null))
  and (removido_em is null or drive_estado = 'feito')
);
create index if not exists arquivos_drive_fila_idx on public.arquivos (drive_na_fila_em) where drive_estado = 'pendente';

-- A pessoa logada NUNCA escreve as colunas do Drive (senão um recibo falso liberaria a limpeza). Só tarefa/peça, caminho, nome, tipo e tamanho.
revoke insert on public.arquivos from authenticated;
grant insert (id, tarefa_id, peca_id, caminho, nome, tipo, tamanho, criado_por) on public.arquivos to authenticated;

-- ---------- 1) postado_em e a fila ----------
create or replace function private.tarefas_postado_antes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.etapa = 'postado' then
    if tg_op = 'INSERT' or old.etapa is distinct from 'postado' then new.postado_em := now();
    else new.postado_em := coalesce(old.postado_em, new.postado_em, now()); end if;  -- a pessoa não muda a data: vale a do banco (só preenche card antigo sem data)
  else
    new.postado_em := null;  -- saiu de Postado (voltou atrás): a contagem dos 3 dias zera
  end if;
  return new;
end $$;
drop trigger if exists tarefas_postado_antes on public.tarefas;
create trigger tarefas_postado_antes before insert or update on public.tarefas for each row execute function private.tarefas_postado_antes();
-- Cards que JÁ estão em Postado quando este arquivo entra: ganham postado_em (a última alteração, melhor palpite) e os anexos vão para a fila.
update public.tarefas set postado_em = updated_at where etapa = 'postado' and postado_em is null;
update public.arquivos a set drive_estado = 'pendente', drive_na_fila_em = now()
  from public.tarefas t where t.id = a.tarefa_id and t.etapa = 'postado' and a.drive_estado is null;

-- Toca a campainha do n8n (mesmo molde do 012). Sem segredo no Vault: só um WARNING; a fila espera o despertador.
create or replace function private.drive_avisar_n8n(p_so_se_travado boolean default false) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_url text; v_segredo text;
begin
  if p_so_se_travado and not exists (
    select 1 from public.arquivos
    where drive_estado = 'pendente'
      and ((drive_pegou_em is null and drive_na_fila_em < now() - interval '2 minutes') or (drive_pegou_em < now() - interval '30 minutes'))
  ) then return; end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'n8n_drive_url';
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'n8n_drive_secret';
  if coalesce(v_url, '') = '' or coalesce(v_segredo, '') = '' then
    raise warning 'drive_avisar_n8n: segredo n8n_drive_url ou n8n_drive_secret não existe no Vault';
    return;
  end if;
  perform net.http_post(url := v_url, headers := jsonb_build_object('Content-Type', 'application/json', 'x-crm-secret', v_segredo),
                        body := '{}'::jsonb, timeout_milliseconds := 55000);
end $$;
revoke all on function private.drive_avisar_n8n(boolean) from public, anon, authenticated;

-- Card chegou em Postado: os anexos que ainda não tinham estado entram na fila. Security definer: a pessoa logada não tem permissão de alterar arquivos.
create or replace function private.tarefas_postado_depois() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.arquivos set drive_estado = 'pendente', drive_na_fila_em = now() where tarefa_id = new.id and drive_estado is null;
  if found then
    begin perform private.drive_avisar_n8n(false);
    exception when others then raise warning 'tarefas_postado_depois: aviso ao n8n falhou: %', sqlerrm; end;
  end if;
  return null;
end $$;
revoke all on function private.tarefas_postado_depois() from public, anon, authenticated;
drop trigger if exists tarefas_postado_depois on public.tarefas;
create trigger tarefas_postado_depois after insert or update of etapa on public.tarefas
  for each row when (new.etapa = 'postado') execute function private.tarefas_postado_depois();

-- Card saiu de Postado (voltou atrás): o que ainda não tinha recibo sai da fila (nada de copiar o que não está mais postado). Recibo 'feito' fica.
create or replace function private.tarefas_saiu_de_postado() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.arquivos set drive_estado = null, drive_na_fila_em = null, drive_pegou_em = null, drive_tentativas = 0, drive_erro = null, aviso = null
  where tarefa_id = new.id and drive_estado in ('pendente', 'falhou');
  return null;
end $$;
revoke all on function private.tarefas_saiu_de_postado() from public, anon, authenticated;
drop trigger if exists tarefas_saiu_de_postado on public.tarefas;
create trigger tarefas_saiu_de_postado after update of etapa on public.tarefas
  for each row when (old.etapa = 'postado' and new.etapa is distinct from 'postado') execute function private.tarefas_saiu_de_postado();

-- Anexo novo em card que já está Postado entra direto na fila (o aviso vem pelo despertador, no máximo 5 min).
create or replace function private.arquivos_antes() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.tarefa_id is not null and exists (select 1 from public.tarefas t where t.id = new.tarefa_id and t.etapa = 'postado') then
    new.drive_estado := 'pendente'; new.drive_na_fila_em := now();
  end if;
  return new;
end $$;
revoke all on function private.arquivos_antes() from public, anon, authenticated;
drop trigger if exists arquivos_antes on public.arquivos;
create trigger arquivos_antes before insert on public.arquivos for each row execute function private.arquivos_antes();

-- ---------- 2) o que o n8n chama (só chave de serviço) ----------
-- drive_fila: anexos a enviar. Cada item:
--   id, caminho (no balde "arquivos"), nome (original), tipo, tamanho,
--   pasta: ["Postagens", <empresa>, <formato>]   (o n8n acha ou cria cada nível; a conta é a da contato@)
--   nome_no_drive: "2026-10-22 Titulo do card.mp4" (data do post + título; com mais de um anexo no card: "... (2).jpg")
-- Formato: vem do campo tarefas.formato (reels, post, carrossel, story; 015). Sem formato = pasta 'Sem formato'.
create or replace function public.drive_fila(p_limite int default 10) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare r record; v_lista jsonb := '[]'; v_formato text; v_data text; v_base text; v_ext text; v_n int; v_total int;
begin
  p_limite := least(greatest(coalesce(p_limite, 10), 1), 50);
  for r in
    select a.id, a.caminho, a.nome, a.tipo, a.tamanho, a.tarefa_id, t.titulo, t.postar_em, t.postado_em, t.formato, e.nome as empresa
    from public.arquivos a
    join public.tarefas t on t.id = a.tarefa_id
    left join public.empresas e on e.id = t.empresa_id
    where a.drive_estado = 'pendente' and a.removido_em is null and (a.drive_pegou_em is null or a.drive_pegou_em < now() - interval '30 minutes')
    order by a.drive_na_fila_em, a.id limit p_limite for update of a skip locked
  loop
    v_formato := case r.formato when 'reels' then 'Reels' when 'post' then 'Post' when 'carrossel' then 'Carrossel' when 'story' then 'Story' else 'Sem formato' end;
    v_data := coalesce(left(r.postar_em, 10), to_char(r.postado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'));
    v_base := left(btrim(regexp_replace(coalesce(nullif(btrim(r.titulo), ''), 'Sem titulo'), '[\\/:*?"<>|\r\n]+', ' ', 'g')), 120);
    v_ext := coalesce(substring(r.nome from '\.[A-Za-z0-9]{1,8}$'), '');
    select count(*), count(*) filter (where (x.created_at, x.id) <= (select y.created_at, y.id from public.arquivos y where y.id = r.id))
      into v_total, v_n from public.arquivos x where x.tarefa_id = r.tarefa_id;
    update public.arquivos set drive_pegou_em = now() where id = r.id;
    v_lista := v_lista || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'caminho', r.caminho, 'nome', r.nome, 'tipo', r.tipo, 'tamanho', r.tamanho,
      'pasta', jsonb_build_array('Postagens', left(btrim(regexp_replace(coalesce(r.empresa, 'Sem empresa'), '[\\/:*?"<>|\r\n]+', ' ', 'g')), 80), v_formato),
      'nome_no_drive', v_data || ' ' || v_base || case when v_total > 1 then ' (' || v_n || ')' else '' end || v_ext));
  end loop;
  return v_lista;
end $$;

-- drive_confirmar: recibo (ou erro) de um anexo. Sucesso exige p_file_id, p_link e p_tamanho IGUAL ao tamanho do anexo (o n8n lê o `size`
-- do arquivo que acabou de criar no Drive). O arquivo do Drive é do anexo pelo id dele (ver brief), nunca por nome e tamanho.
-- Erro: volta para a fila em ~5 min; na 5ª falha vira 'falhou'. p_definitivo = true (ex.: arquivo grande demais para o n8n) vira 'falhou' já.
-- Confirmar duas vezes é inofensivo.
-- reaplicar o arquivo não deixa a versão antiga (5 parâmetros, sem conferir tamanho) viva ao lado da nova
drop function if exists public.drive_confirmar(uuid, text, text, text, text);
create or replace function public.drive_confirmar(p_id uuid, p_file_id text default null, p_link text default null, p_pasta text default null,
  p_erro text default null, p_tamanho bigint default null, p_definitivo boolean default false) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare r public.arquivos; v_falha boolean;
begin
  select * into r from public.arquivos where id = p_id for update;
  if r.id is null then raise exception 'anexo % nao existe', p_id using errcode = '22023'; end if;
  if r.drive_estado is distinct from 'pendente' then return jsonb_build_object('estado', r.drive_estado); end if;
  if nullif(btrim(p_erro), '') is not null then
    v_falha := coalesce(p_definitivo, false) or r.drive_tentativas + 1 >= 5;
    update public.arquivos set drive_tentativas = drive_tentativas + 1, drive_erro = left(p_erro, 500),
      drive_pegou_em = now() - interval '25 minutes',  -- a reserva é de 30 min; depois de um erro, outra tentativa em ~5 min
      drive_estado = case when v_falha then 'falhou' else 'pendente' end,
      aviso = case when v_falha then 'A copia no Drive falhou; o arquivo continua guardado aqui' else aviso end
    where id = p_id returning drive_estado into r.drive_estado;
    return jsonb_build_object('estado', r.drive_estado);
  end if;
  if nullif(btrim(p_file_id), '') is null or nullif(btrim(p_link), '') is null then
    raise exception 'sucesso precisa de p_file_id e p_link' using errcode = '22023';
  end if;
  if p_tamanho is distinct from r.tamanho then
    raise exception 'tamanho da copia (%) diferente do anexo (%): nao e a copia deste arquivo', p_tamanho, r.tamanho using errcode = '22023';
  end if;
  update public.arquivos set drive_estado = 'feito', drive_file_id = btrim(p_file_id), drive_link = btrim(p_link), drive_pasta = left(p_pasta, 300),
    drive_em = now(), drive_erro = null, aviso = null where id = p_id;
  return jsonb_build_object('estado', 'feito');
end $$;

-- drive_limpar_pendentes: com recibo e Postado há 3 dias ou mais, ainda no Storage. O n8n apaga o arquivo pela API do Storage
-- (404 = já não existe = sucesso) e chama drive_limpeza_confirmar.
create or replace function public.drive_limpar_pendentes(p_limite int default 50) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v jsonb;
begin
  -- Cada anexo entregue é CARIMBADO (limpeza_tentou_em) e só volta a ser listado depois de 6 horas: o laço do n8n termina ao receber [] e uma
  -- exclusão que falha sempre não ocupa os primeiros lugares. Ordem: os nunca tentados primeiro, depois os tentados há mais tempo.
  with pegos as (
    select a.id, a.caminho from public.arquivos a join public.tarefas t on t.id = a.tarefa_id
    where a.removido_em is null and a.drive_estado = 'feito' and nullif(btrim(a.drive_link), '') is not null
      and t.etapa = 'postado' and t.postado_em <= now() - interval '3 days'
      and (a.limpeza_tentou_em is null or a.limpeza_tentou_em < now() - interval '6 hours')
    order by a.limpeza_tentou_em nulls first, a.id
    limit least(greatest(coalesce(p_limite, 50), 1), 200)
    for update of a skip locked
  ), marcados as (
    update public.arquivos a set limpeza_tentou_em = now() from pegos p where a.id = p.id returning p.id, p.caminho
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'caminho', caminho) order by id), '[]'::jsonb) into v from marcados;
  return v;
end $$;

-- Os 3 dias valem em TRÊS momentos: ao montar a lista, ao autorizar (logo antes de apagar) e ao confirmar. O card pode voltar atrás no meio do caminho.
create or replace function private.anexo_limpavel(p_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.arquivos a join public.tarefas t on t.id = a.tarefa_id
    where a.id = p_id and a.removido_em is null and a.drive_estado = 'feito' and nullif(btrim(a.drive_link), '') is not null
      and t.etapa = 'postado' and t.postado_em <= now() - interval '3 days')
$$;
revoke all on function private.anexo_limpavel(uuid) from public, anon, authenticated;

-- drive_limpeza_autorizar: o n8n chama IMEDIATAMENTE antes de apagar cada arquivo. false = não apague (o card mudou). true = o banco ANOTA a
-- autorização (limpeza_autorizada_em). Analogia: o "pode retirar" fica carimbado na ficha, não só na conversa.
create or replace function public.drive_limpeza_autorizar(p_id uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.anexo_limpavel(p_id) then return false; end if;
  update public.arquivos set limpeza_autorizada_em = now() where id = p_id;
  return true;
end $$;

-- drive_limpeza_confirmar: registra o que de fato aconteceu e é repetível. Sempre exige o recibo do Drive. Aceita se
--   (a) a remoção JÁ está registrada (repetir devolve sucesso, sem mudar nada);
--   (b) o anexo foi AUTORIZADO antes, não importa há quanto tempo nem onde está o card agora (o arquivo foi apagado de verdade: a cópia está no Drive
--       e o card abre o drive_link); ou (c) está limpável agora.
-- Sem nada disso recusa. Registrar removido_em não apaga nada: se a autorização for velha e o arquivo ainda existir, só sobra um arquivo esquecido no Storage.
create or replace function public.drive_limpeza_confirmar(p_id uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  if exists (select 1 from public.arquivos where id = p_id and removido_em is not null) then
    return jsonb_build_object('removido', true, 'ja_registrado', true);
  end if;
  update public.arquivos a set removido_em = now(), aviso = null
  where a.id = p_id and a.drive_estado = 'feito' and nullif(btrim(a.drive_link), '') is not null
    and (a.limpeza_autorizada_em is not null or private.anexo_limpavel(a.id));
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'anexo % sem recibo do Drive ou sem autorizacao de limpeza: nao pode ser dado como removido', p_id using errcode = '22023';
  end if;
  return jsonb_build_object('removido', true);
end $$;

revoke all on function public.drive_fila(int), public.drive_confirmar(uuid, text, text, text, text, bigint, boolean),
  public.drive_limpar_pendentes(int), public.drive_limpeza_autorizar(uuid), public.drive_limpeza_confirmar(uuid) from public, anon, authenticated;
grant execute on function public.drive_fila(int), public.drive_confirmar(uuid, text, text, text, text, bigint, boolean),
  public.drive_limpar_pendentes(int), public.drive_limpeza_autorizar(uuid), public.drive_limpeza_confirmar(uuid) to service_role;
grant usage on schema public to service_role;

-- ---------- 3) despertadores ----------
-- Aviso na linha: passou de 3 dias do Postado e ainda sem recibo. Nada é apagado.
create or replace function private.drive_marcar_avisos() returns void
language sql security definer set search_path = ''
as $$
  update public.arquivos a set aviso = 'Sem copia no Drive: o arquivo nao sera apagado do Storage'
  from public.tarefas t
  where t.id = a.tarefa_id and t.etapa = 'postado' and t.postado_em <= now() - interval '3 days'
    and a.removido_em is null and a.drive_estado is distinct from 'feito' and a.aviso is null
$$;
revoke all on function private.drive_marcar_avisos() from public, anon, authenticated;
select cron.schedule('drive_avisos', '7 * * * *', $cmd$select private.drive_marcar_avisos()$cmd$);
-- Fila esquecida (erro, aviso perdido): a cada 5 min, só toca se tiver anexo parado.
select cron.schedule('drive_despertador', '*/5 * * * *', $cmd$select private.drive_avisar_n8n(true)$cmd$);

notify pgrst, 'reload schema';

-- REENFILEIRAR um anexo que falhou (SQL Editor): update public.arquivos set drive_estado = 'pendente', drive_tentativas = 0, drive_erro = null,
--   drive_pegou_em = null, drive_na_fila_em = now(), aviso = null where id = '<id>';
-- LIMITE: anexo de card que foi apagado some junto com a linha (cascata) e o arquivo físico fica órfão no Storage; limpar órfão = tarefa futura.
commit;
