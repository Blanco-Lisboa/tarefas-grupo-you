-- Item 300: prints (imagens coladas) nas folhas do mural de Ideias, guardados no Storage e compartilhados Natham/Matheus.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. NÃO aplicado: o Natham cola no SQL Editor.
-- Analogia: o balde "arquivos" já é o armário dos anexos. Aqui abrimos uma gaveta nova ("ideias/") para os prints e a folha ganha uma lista com o endereço de cada um.
-- Sem este SQL a tela não quebra: o print só avisa que falta colar.
begin;

alter table public.ideias add column if not exists prints text[] not null default '{}';

-- Quem pode ver/mexer em ideias/<empresa>/<arquivo>: qualquer pessoa cadastrada (as ideias são dos dois, como a tabela ideias).
create or replace function private.pode_ver_arquivo(caminho text) returns boolean
language sql stable set search_path = ''
as $$
  select case split_part(caminho, '/', 1)
    when 'tarefas' then exists (select 1 from public.tarefas t where t.id::text = split_part(caminho, '/', 2))
    when 'pecas' then (select private.minha_pessoa()) is not null
    when 'ideias' then (select private.minha_pessoa()) is not null
    else false
  end
$$;

create or replace function private.pode_alterar_arquivo(caminho text) returns boolean
language sql stable set search_path = ''
as $$
  select case split_part(caminho, '/', 1)
    when 'tarefas' then exists (
      select 1 from public.tarefas t where t.id::text = split_part(caminho, '/', 2)
        and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id)))
    when 'pecas' then (select private.minha_pessoa()) is not null
    when 'ideias' then (select private.minha_pessoa()) is not null
    else false
  end
$$;

commit;

-- Conferência: tem que listar a coluna "prints".
select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = 'ideias' and column_name = 'prints';
