-- Item 257: cada ideia do mural pode ter VÁRIOS links de referência (todas as colunas, todas as empresas).
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. NÃO aplicado: o Natham cola no SQL Editor.
-- Analogia: o card tinha um bolso para 1 papelzinho (link); agora tem uma pilha de papelzinhos (links). O papelzinho de hoje vira o 1º da pilha; nenhum se perde.
-- A coluna antiga "link" continua existindo (sempre igual ao 1º da lista). O mural funciona antes e depois desta colagem.
begin;

alter table public.ideias add column if not exists links text[] not null default '{}';

-- o link de hoje vira o primeiro da lista (só onde a lista ainda está vazia)
update public.ideias set links = array[link] where link is not null and link <> '' and cardinality(links) = 0;

commit;

-- Conferência: total de ideias, quantas têm link antigo e quantas já têm lista; "sem_lista" tem que dar 0.
select count(*) as ideias, count(*) filter (where link is not null and link <> '') as com_link_antigo,
       count(*) filter (where cardinality(links) > 0) as com_lista,
       count(*) filter (where link is not null and link <> '' and cardinality(links) = 0) as sem_lista
from public.ideias;
