-- Item 192b: cria no Vault os 2 segredos da volta da agenda. Projeto Tarefas (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente: se o nome já existe, não cria outro. O segredo é sorteado DENTRO do banco; nenhum valor fica neste arquivo.
-- A URL do webhook não é segredo. O segredo precisa ser copiado para a credencial Header Auth (x-crm-secret) do n8n.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'n8n_tarefas_volta_url') then
    perform vault.create_secret(
      'https://youcont.app.n8n.cloud/webhook/tarefas-agenda-volta-p4w8zn',
      'n8n_tarefas_volta_url',
      'URL do webhook da volta da agenda (n8n)');
  end if;
  if not exists (select 1 from vault.secrets where name = 'n8n_tarefas_volta_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'n8n_tarefas_volta_secret',
      'segredo do webhook da volta (x-crm-secret)');
  end if;
end $$;
