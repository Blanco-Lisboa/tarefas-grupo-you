-- Item 298: a ordem das colunas do mural de Ideias passa a ficar guardada no banco (vale para Natham e Matheus).
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. NÃO aplicado: o Natham cola no SQL Editor.
-- Analogia: as colunas eram numeradas pela ordem em que foram criadas (seq, que não muda). Agora cada coluna ganha uma "etiqueta de posição" (ordem) que dá para trocar.
-- Renomear e apagar coluna já funcionam sem este SQL; só a ordem nova depende dele (sem ele, a ordem vale até recarregar a página).
begin;

alter table public.ideias_categorias add column if not exists ordem integer;

-- colunas que já existem: posição 1, 2, 3... na ordem de hoje, por empresa (só onde ainda não tem posição)
update public.ideias_categorias c set ordem = x.n
from (select id, row_number() over (partition by empresa_id order by seq) as n from public.ideias_categorias) x
where c.id = x.id and c.ordem is null;

commit;

-- Conferência: "sem_ordem" tem que dar 0.
select count(*) as colunas, count(*) filter (where ordem is null) as sem_ordem from public.ideias_categorias;
