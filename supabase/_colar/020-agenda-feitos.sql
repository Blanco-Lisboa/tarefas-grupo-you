-- Item 221: "feito" dos compromissos do Google no Caderno do Natham. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente. Depende do 002 (private.minha_pessoa). NÃO aplicado: o Natham cola no SQL Editor.
-- Analogia: o Google é um quadro de avisos que só se lê; aqui fica o caderninho de quem já riscou cada aviso.
-- Uma linha = esta pessoa marcou este compromisso como feito. Sem chave estrangeira: o compromisso pode ser regravado pelo n8n.
begin;
create table if not exists public.agenda_feitos (
  dono_id uuid not null default private.minha_pessoa() references public.pessoas (id) on delete cascade,
  evento_id uuid not null,
  feito_em timestamptz not null default now(),
  primary key (dono_id, evento_id)
);
alter table public.agenda_feitos enable row level security;
revoke all on public.agenda_feitos from public, anon;
grant select, insert, delete on public.agenda_feitos to authenticated;
-- cada um lê, marca e desmarca só os seus
drop policy if exists agenda_feitos_dono on public.agenda_feitos;
create policy agenda_feitos_dono on public.agenda_feitos for all to authenticated
  using (dono_id = (select private.minha_pessoa())) with check (dono_id = (select private.minha_pessoa()));
commit;
