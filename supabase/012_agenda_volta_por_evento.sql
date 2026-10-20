begin;
-- Item 192b: a VOLTA da agenda passa a ser por EVENTO (pedido do N8NPro, 20/10/2026, decisão do Natham).
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 010. Não mexe em nada do 010/011.
--
-- Analogia: antes o motoboy (n8n) ia ao balcão a cada 2 min perguntar "tem entrega?". Agora o balcão TOCA A CAMPAINHA
-- (pg_net chama o webhook do n8n) só quando entra pedido novo na fila (agenda_saida). Um despertador (pg_cron) confere de
-- 5 em 5 min se ficou algum pedido esquecido e, só nesse caso, toca a campainha de novo. Sem pedido parado = silêncio = zero execução.
--
-- SEGREDOS: nada fica neste arquivo. Dois itens no Supabase Vault (nomes exatos):
--   n8n_tarefas_volta_url     -> a URL do webhook da volta (Production URL do nó Webhook no n8n)
--   n8n_tarefas_volta_secret  -> a senha; MESMO valor da credencial Header Auth do n8n (cabeçalho x-crm-secret)
-- Sem um dos dois, o aviso simplesmente não sai (só registra um WARNING) e a tarefa salva normalmente.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Toca a campainha. p_so_se_travado = true (despertador): só toca se existir item parado, com a regra do pedido.
create or replace function private.agenda_saida_avisar_n8n(p_so_se_travado boolean default false) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_url text;
  v_segredo text;
begin
  if p_so_se_travado and not exists (
    select 1 from public.agenda_saida
    where estado = 'pendente'
      and ((pegou_em is null and criado_em < now() - interval '2 minutes')
        or (pegou_em < now() - interval '5 minutes'))
  ) then
    return;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'n8n_tarefas_volta_url';
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'n8n_tarefas_volta_secret';
  if coalesce(v_url, '') = '' or coalesce(v_segredo, '') = '' then
    raise warning 'agenda_saida_avisar_n8n: segredo n8n_tarefas_volta_url ou n8n_tarefas_volta_secret não existe no Vault';
    return;
  end if;

  -- net.http_post só enfileira o pedido (assíncrono): não espera o n8n responder.
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-crm-secret', v_segredo),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
end $$;
revoke all on function private.agenda_saida_avisar_n8n(boolean) from public, anon, authenticated;

-- Gatilho: nunca pode quebrar o salvar da tarefa. Qualquer erro vira só um WARNING no log.
create or replace function private.agenda_saida_campainha() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.agenda_saida_avisar_n8n(false);
  return null;
exception when others then
  raise warning 'agenda_saida_campainha: aviso ao n8n falhou: %', sqlerrm;
  return null;
end $$;
revoke all on function private.agenda_saida_campainha() from public, anon, authenticated;

-- Statement-level: uma tarefa que gera várias linhas = 1 aviso, não N.
drop trigger if exists agenda_saida_campainha on public.agenda_saida;
create trigger agenda_saida_campainha after insert on public.agenda_saida
  for each statement execute function private.agenda_saida_campainha();

-- Despertador: a cada 5 min, só toca se houver item parado (cobre erro do Google, confirmação perdida, aviso que falhou).
-- cron.schedule com o mesmo nome apenas atualiza o job (idempotente).
select cron.schedule(
  'agenda_saida_despertador',
  '*/5 * * * *',
  $cmd$select private.agenda_saida_avisar_n8n(true)$cmd$
);

commit;
