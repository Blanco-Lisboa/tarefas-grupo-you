-- Travas (RLS). Nada para anon. A pessoa do login vem de private.minha_pessoa().
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.minha_pessoa() returns uuid
language sql stable security definer set search_path = ''
as $$ select id from public.pessoas where user_id = (select auth.uid()) $$;
revoke all on function private.minha_pessoa() from public, anon;
grant execute on function private.minha_pessoa() to authenticated;

-- Liga o login à pessoa pelo e-mail, no momento em que o usuário é criado (convite do painel).
create or replace function private.liga_pessoa() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.pessoas set user_id = new.id where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;
revoke all on function private.liga_pessoa() from public, anon, authenticated;
drop trigger if exists liga_pessoa on auth.users;
create trigger liga_pessoa after insert on auth.users for each row execute function private.liga_pessoa();

-- tarefas: criado_por, enviada_por e dono_id nunca mudam depois de criadas.
create or replace function private.tarefas_antes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.criado_por := old.criado_por;
    new.enviada_por := old.enviada_por;
    new.dono_id := old.dono_id;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists tarefas_antes on public.tarefas;
create trigger tarefas_antes before insert or update on public.tarefas for each row execute function private.tarefas_antes();

alter table public.pessoas enable row level security;
alter table public.empresas enable row level security;
alter table public.tags enable row level security;
alter table public.tarefas enable row level security;
alter table public.tarefa_tags enable row level security;
alter table public.anotacoes_dia enable row level security;
alter table public.nao_esquecer enable row level security;
alter table public.pastas enable row level security;
alter table public.pecas enable row level security;
alter table public.ideias enable row level security;
alter table public.arquivos enable row level security;
alter table public.agenda_eventos enable row level security;
alter table public.agenda_acesso enable row level security;

-- Privilégios: anon nada; logado só o que o app usa.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select (id, slug, nome, foto, user_id) on public.pessoas to authenticated;
grant select, insert, update, delete on public.empresas, public.tags, public.tarefas,
  public.pastas, public.pecas, public.ideias, public.anotacoes_dia, public.nao_esquecer to authenticated;
grant select, insert, delete on public.tarefa_tags to authenticated;
grant select, insert, delete on public.arquivos to authenticated;
grant select on public.agenda_eventos, public.agenda_acesso to authenticated;

-- pessoas: quem tem pessoa vê as 4 (nomes e fotos). Ninguém escreve pelo app.
drop policy if exists pessoas_le on public.pessoas;
create policy pessoas_le on public.pessoas for select to authenticated
  using ((select private.minha_pessoa()) is not null);

-- compartilhadas entre os dois: empresas, tags, pastas, pecas, ideias
drop policy if exists empresas_todos on public.empresas;
create policy empresas_todos on public.empresas for all to authenticated
  using ((select private.minha_pessoa()) is not null) with check ((select private.minha_pessoa()) is not null);
drop policy if exists tags_todos on public.tags;
create policy tags_todos on public.tags for all to authenticated
  using ((select private.minha_pessoa()) is not null) with check ((select private.minha_pessoa()) is not null);
drop policy if exists pastas_todos on public.pastas;
create policy pastas_todos on public.pastas for all to authenticated
  using ((select private.minha_pessoa()) is not null) with check ((select private.minha_pessoa()) is not null);
drop policy if exists pecas_todos on public.pecas;
create policy pecas_todos on public.pecas for all to authenticated
  using ((select private.minha_pessoa()) is not null) with check ((select private.minha_pessoa()) is not null);
drop policy if exists ideias_todos on public.ideias;
create policy ideias_todos on public.ideias for all to authenticated
  using ((select private.minha_pessoa()) is not null) with check ((select private.minha_pessoa()) is not null);

-- tarefas: lê o seu, o que mandou e o conteúdo com empresa
drop policy if exists tarefas_le on public.tarefas;
create policy tarefas_le on public.tarefas for select to authenticated using (
  dono_id = (select private.minha_pessoa())
  or enviada_por = (select private.minha_pessoa())
  or (etapa is not null and empresa_id is not null)
);
drop policy if exists tarefas_cria on public.tarefas;
create policy tarefas_cria on public.tarefas for insert to authenticated with check (
  criado_por = (select private.minha_pessoa())
  and (
    (dono_id = criado_por and enviada_por is null)
    or (dono_id <> criado_por and enviada_por = criado_por)
  )
);
-- altera/apaga o que lê, menos a tarefa que mandou para outro (quem mandou só lê)
drop policy if exists tarefas_altera on public.tarefas;
create policy tarefas_altera on public.tarefas for update to authenticated
  using (
    dono_id = (select private.minha_pessoa())
    or (etapa is not null and empresa_id is not null and enviada_por is distinct from (select private.minha_pessoa()))
  )
  with check (
    dono_id = (select private.minha_pessoa())
    or (etapa is not null and empresa_id is not null and enviada_por is distinct from (select private.minha_pessoa()))
  );
drop policy if exists tarefas_apaga on public.tarefas;
create policy tarefas_apaga on public.tarefas for delete to authenticated using (
  dono_id = (select private.minha_pessoa())
  or (etapa is not null and empresa_id is not null and enviada_por is distinct from (select private.minha_pessoa()))
);

-- tarefa_tags: lê o que a tarefa deixa ler; mexe só onde pode alterar a tarefa
drop policy if exists tarefa_tags_todos on public.tarefa_tags;
drop policy if exists tarefa_tags_le on public.tarefa_tags;
create policy tarefa_tags_le on public.tarefa_tags for select to authenticated
  using (exists (select 1 from public.tarefas t where t.id = tarefa_id));
drop policy if exists tarefa_tags_cria on public.tarefa_tags;
create policy tarefa_tags_cria on public.tarefa_tags for insert to authenticated
  with check (exists (
    select 1 from public.tarefas t where t.id = tarefa_id and (
      t.dono_id = (select private.minha_pessoa())
      or (t.etapa is not null and t.empresa_id is not null and t.enviada_por is distinct from (select private.minha_pessoa()))
    )
  ));
drop policy if exists tarefa_tags_apaga on public.tarefa_tags;
create policy tarefa_tags_apaga on public.tarefa_tags for delete to authenticated
  using (exists (
    select 1 from public.tarefas t where t.id = tarefa_id and (
      t.dono_id = (select private.minha_pessoa())
      or (t.etapa is not null and t.empresa_id is not null and t.enviada_por is distinct from (select private.minha_pessoa()))
    )
  ));

-- só o dono
drop policy if exists anotacoes_dono on public.anotacoes_dia;
create policy anotacoes_dono on public.anotacoes_dia for all to authenticated
  using (dono_id = (select private.minha_pessoa())) with check (dono_id = (select private.minha_pessoa()));
drop policy if exists nao_esquecer_dono on public.nao_esquecer;
create policy nao_esquecer_dono on public.nao_esquecer for all to authenticated
  using (dono_id = (select private.minha_pessoa())) with check (dono_id = (select private.minha_pessoa()));

-- arquivos: quem vê a tarefa vê o arquivo; peça é dos dois
drop policy if exists arquivos_le on public.arquivos;
create policy arquivos_le on public.arquivos for select to authenticated using (
  (tarefa_id is not null and exists (select 1 from public.tarefas t where t.id = tarefa_id))
  or (peca_id is not null and (select private.minha_pessoa()) is not null)
);
drop policy if exists arquivos_cria on public.arquivos;
create policy arquivos_cria on public.arquivos for insert to authenticated with check (
  criado_por = (select private.minha_pessoa())
  and (
    (tarefa_id is not null and exists (select 1 from public.tarefas t where t.id = tarefa_id))
    or peca_id is not null
  )
);
drop policy if exists arquivos_apaga on public.arquivos;
create policy arquivos_apaga on public.arquivos for delete to authenticated using (
  (tarefa_id is not null and exists (select 1 from public.tarefas t where t.id = tarefa_id))
  or (peca_id is not null and (select private.minha_pessoa()) is not null)
);

-- agenda: só as fontes liberadas em agenda_acesso; ninguém escreve pelo app (só o n8n, com chave de serviço)
drop policy if exists agenda_acesso_le on public.agenda_acesso;
create policy agenda_acesso_le on public.agenda_acesso for select to authenticated
  using (pessoa_id = (select private.minha_pessoa()));
drop policy if exists agenda_eventos_le on public.agenda_eventos;
create policy agenda_eventos_le on public.agenda_eventos for select to authenticated using (
  exists (select 1 from public.agenda_acesso a where a.pessoa_id = (select private.minha_pessoa()) and a.fonte = agenda_eventos.fonte)
);
