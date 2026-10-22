-- 292 · Caderno "Sem data": a tarefa fica em QUALQUER linha da folha. Guarda o número da linha (0 = primeira). NÃO APLICADO.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente: pode colar duas vezes. Coluna nova e vazia: tarefa sem número continua empilhada nas primeiras linhas, como hoje.
-- Sem mexer em salvar_tarefa nem em política de acesso: a tela grava o número com um update comum, que já é limitado pelas travas que existem
-- (só quem pode alterar a tarefa consegue). Analogia: um número de página escrito a lápis no canto de cada tarefa.
-- O app funciona ANTES e DEPOIS de colar: antes, a posição vale só até recarregar a página.
alter table public.tarefas add column if not exists linha_caderno integer check (linha_caderno is null or linha_caderno >= 0);
