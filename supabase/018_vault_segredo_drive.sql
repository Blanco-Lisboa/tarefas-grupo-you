-- Item 202: cria no Vault o segredo da campainha do Drive. Projeto Tarefas (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Depende do 017.
-- Idempotente: se o nome já existe, não cria outro. O segredo é sorteado DENTRO do banco; nenhum valor fica neste arquivo.
-- A URL do webhook (n8n_drive_url) NÃO é criada aqui: ela só existe quando o agente do n8n criar o fluxo. Enquanto não existir, o banco só registra
-- um WARNING e a fila espera (nada quebra). Depois, o Natham roda no SQL Editor, com a URL de produção do nó Webhook:
--   select vault.create_secret('<URL de produção do webhook>', 'n8n_drive_url', 'URL do webhook do Drive (n8n)');
-- O segredo precisa ser copiado para a credencial Header Auth (cabeçalho x-crm-secret) do webhook do n8n: Natham lê o valor no painel do
-- Supabase (Project Settings > Vault > n8n_drive_secret) e cola na credencial do n8n. Ninguém precisa ver o valor em arquivo ou conversa.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'n8n_drive_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'n8n_drive_secret',
      'segredo do webhook do Drive (x-crm-secret)');
  end if;
end $$;
