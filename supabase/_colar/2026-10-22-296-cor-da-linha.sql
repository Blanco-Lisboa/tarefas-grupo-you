-- 296 · Caderno: cor da linha da tarefa (Azul, Roxo, Dourado, Vermelho, Verde, Rosa; vazio = sem cor). NÃO APLICADO.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente: pode colar duas vezes. Coluna nova e vazia: nenhuma tarefa muda de aparência até alguém escolher uma cor.
-- Como no 292: sem mexer em salvar_tarefa nem em política de acesso; a tela grava com um update comum, já limitado pelas travas existentes.
-- O app funciona ANTES e DEPOIS de colar: antes, a cor vale só até recarregar a página.
alter table public.tarefas add column if not exists cor_linha text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tarefas_cor_linha_check') then
    alter table public.tarefas add constraint tarefas_cor_linha_check check (cor_linha is null or cor_linha in ('azul', 'roxo', 'dourado', 'vermelho', 'verde', 'rosa'));
  end if;
end $$;
