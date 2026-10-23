-- 030 · Item 303: liga o login do Adrian ao perfil dele. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- APLICADO em 23/10 via MCP. Idempotente. So liga e-mail + user_id: NAO da permissao extra (o 026, que aprova e le o caderno do Matheus, segue NAO aplicado).
-- Causa: a conta nasceu (convite de 22/10) com a pessoa Adrian sem e-mail; o gatilho liga_pessoa so liga por e-mail igual, entao ficou solta.
update public.pessoas p set email = 'adrian@youcontabilidade.com', user_id = u.id
from auth.users u
where p.slug = 'adrian' and lower(u.email) = 'adrian@youcontabilidade.com' and p.user_id is null;
