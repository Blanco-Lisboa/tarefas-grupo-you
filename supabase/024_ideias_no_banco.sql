-- Item 256: ideias de conteúdo passam do navegador para o banco, compartilhadas (Natham e Matheus veem as mesmas, por empresa).
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 002 (private.minha_pessoa). NÃO aplicado: o Natham cola no SQL Editor.
-- Analogia: a tabela public.ideias já era o mural; faltava uma numeração para manter a ordem dos cards e um caderninho de colunas (categorias), para coluna vazia não sumir.
begin;

-- ordem dos cards (a tabela está vazia; quem criou antes aparece antes)
alter table public.ideias add column if not exists seq bigint generated always as identity;
create index if not exists ideias_empresa_seq_idx on public.ideias (empresa_id, seq);

-- colunas do mural (inclusive as vazias), na ordem em que foram criadas
create table if not exists public.ideias_categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas (id) on delete cascade,
  nome text not null,
  seq bigint generated always as identity,
  unique (empresa_id, nome)
);
alter table public.ideias_categorias enable row level security;
revoke all on public.ideias_categorias from public, anon;
grant select, insert, update, delete on public.ideias_categorias to authenticated;
-- mesma regra das ideias e das pastas: qualquer pessoa logada do sistema lê e escreve
drop policy if exists ideias_categorias_todos on public.ideias_categorias;
create policy ideias_categorias_todos on public.ideias_categorias for all to authenticated
  using ((select private.minha_pessoa()) is not null) with check ((select private.minha_pessoa()) is not null);

commit;

-- Conferência: 0 ideias, 0 categorias e as duas travas ligadas (rowsecurity = true).
select (select count(*) from public.ideias) as ideias, (select count(*) from public.ideias_categorias) as categorias,
       (select relrowsecurity from pg_class where oid = 'public.ideias_categorias'::regclass) as trava_categorias;
