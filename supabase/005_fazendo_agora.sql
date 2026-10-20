-- Selo "fazendo agora" (item 170): cada pessoa marca UMA tarefa em que está agora. Todos veem de todos.
create table if not exists public.fazendo_agora (
  pessoa_id uuid primary key references public.pessoas (id),
  tarefa_id uuid not null references public.tarefas (id) on delete cascade,
  desde timestamptz not null default now()
);
alter table public.fazendo_agora enable row level security;

revoke all on public.fazendo_agora from anon, authenticated;
grant select, insert, update, delete on public.fazendo_agora to authenticated;

-- lê: todo logado com pessoa (vê quem está fazendo o quê)
drop policy if exists fazendo_agora_le on public.fazendo_agora;
create policy fazendo_agora_le on public.fazendo_agora for select to authenticated
  using ((select private.minha_pessoa()) is not null);

-- escreve: só a própria linha, e só em tarefa que a pessoa consegue LER (a trava de tarefas vale dentro do exists)
drop policy if exists fazendo_agora_cria on public.fazendo_agora;
create policy fazendo_agora_cria on public.fazendo_agora for insert to authenticated
  with check (pessoa_id = (select private.minha_pessoa()) and exists (select 1 from public.tarefas t where t.id = tarefa_id));
drop policy if exists fazendo_agora_altera on public.fazendo_agora;
create policy fazendo_agora_altera on public.fazendo_agora for update to authenticated
  using (pessoa_id = (select private.minha_pessoa()))
  with check (pessoa_id = (select private.minha_pessoa()) and exists (select 1 from public.tarefas t where t.id = tarefa_id));
drop policy if exists fazendo_agora_apaga on public.fazendo_agora;
create policy fazendo_agora_apaga on public.fazendo_agora for delete to authenticated
  using (pessoa_id = (select private.minha_pessoa()));
