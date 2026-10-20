-- Item 191 (URGENTE, Natham testou em producao, 20/10): tarefa ENVIADA (enviada_por preenchido) e SO LEITURA para quem RECEBEU.
-- Quem recebeu nao altera, nao apaga, nao marca como feita, nao mexe em tags, anexos nem "fazendo agora".
-- Quem ENVIOU edita E apaga o que mandou. Tarefa nao enviada fica como no 006 (dono; conteudo com empresa os dois editam; so o dono apaga).
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 006 e do 007 (aplicar depois deles).

-- Uma regra so para ALTERAR. As politicas de tarefas (update), tarefa_tags, fazendo_agora e arquivos (007, tabela e storage)
-- ja chamam esta funcao pelo nome, entao trocar o corpo aqui vale para todas.
create or replace function private.pode_alterar(dono uuid, enviada uuid, etapa text, empresa text) returns boolean
language sql stable set search_path = ''
as $$
  select (select private.minha_pessoa()) is not null and case
    when enviada is not null then enviada = (select private.minha_pessoa())
    else dono = (select private.minha_pessoa()) or (etapa is not null and empresa is not null)
  end
$$;
revoke all on function private.pode_alterar(uuid, uuid, text, text) from public, anon;
grant execute on function private.pode_alterar(uuid, uuid, text, text) to authenticated;

-- Quem pode APAGAR: enviada = quem enviou; nao enviada = o dono.
create or replace function private.pode_apagar(dono uuid, enviada uuid) returns boolean
language sql stable set search_path = ''
as $$
  select (select private.minha_pessoa()) is not null
    and coalesce(enviada, dono) = (select private.minha_pessoa())
$$;
revoke all on function private.pode_apagar(uuid, uuid) from public, anon;
grant execute on function private.pode_apagar(uuid, uuid) to authenticated;

drop policy if exists tarefas_apaga on public.tarefas;
create policy tarefas_apaga on public.tarefas for delete to authenticated
  using ((select private.pode_apagar(dono_id, enviada_por)));
