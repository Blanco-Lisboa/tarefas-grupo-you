-- Item 177 (decisão do Natham, 21/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente.
--  (b) o Natham LÊ tudo do caderno do Matheus (só leitura);
--  (c) o Matheus continua vendo só as dele + as enviadas a ele (nada muda para ele);
--  (e) quem ENVIOU a tarefa pode EDITAR o que mandou (antes só lia).
--  (f) APAGAR é só do dono, sem exceção (nem conteúdo com empresa; Lupa A3).
--  (g) login sem pessoa vinculada não lê nem altera nada, nem conteúdo com empresa (Lupa A4).
--  (h) marcar "fazendo agora" exige poder ALTERAR a tarefa, não só ler (Lupa D1).
-- Depende de 001 e 002. Aplicar ANTES do 007.

-- Natham logado + a pessoa dona do caderno é o Matheus. Ninguém mais ganha leitura extra.
create or replace function private.natham_le_matheus(dono uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.pessoas n, public.pessoas m
    where n.user_id = (select auth.uid()) and n.slug = 'natham' and m.slug = 'matheus' and m.id = dono
  )
$$;
revoke all on function private.natham_le_matheus(uuid) from public, anon;
grant execute on function private.natham_le_matheus(uuid) to authenticated;

-- Quem pode ALTERAR uma tarefa: o dono, quem a enviou, ou qualquer PESSOA se for conteúdo com empresa.
-- Sem pessoa vinculada ao login = nunca. Uma só regra, usada nas travas de tarefas, tags, arquivos (007).
create or replace function private.pode_alterar(dono uuid, enviada uuid, etapa text, empresa text) returns boolean
language sql stable set search_path = ''
as $$
  select (select private.minha_pessoa()) is not null and (
    dono = (select private.minha_pessoa())
    or enviada = (select private.minha_pessoa())
    or (etapa is not null and empresa is not null)
  )
$$;
revoke all on function private.pode_alterar(uuid, uuid, text, text) from public, anon;
grant execute on function private.pode_alterar(uuid, uuid, text, text) to authenticated;

drop policy if exists tarefas_le on public.tarefas;
create policy tarefas_le on public.tarefas for select to authenticated using (
  dono_id = (select private.minha_pessoa())
  or enviada_por = (select private.minha_pessoa())
  or ((select private.minha_pessoa()) is not null and etapa is not null and empresa_id is not null)
  or (select private.natham_le_matheus(dono_id))
);

-- Apagar: só o dono. Quem enviou edita mas não apaga; conteúdo com empresa de outro dono também não.
drop policy if exists tarefas_apaga on public.tarefas;
create policy tarefas_apaga on public.tarefas for delete to authenticated
  using (dono_id = (select private.minha_pessoa()));

drop policy if exists tarefas_altera on public.tarefas;
create policy tarefas_altera on public.tarefas for update to authenticated
  using ((select private.pode_alterar(dono_id, enviada_por, etapa, empresa_id)))
  with check ((select private.pode_alterar(dono_id, enviada_por, etapa, empresa_id)));

-- tags da tarefa: mexe quem pode alterar a tarefa (inclui quem enviou)
drop policy if exists tarefa_tags_cria on public.tarefa_tags;
create policy tarefa_tags_cria on public.tarefa_tags for insert to authenticated
  with check (exists (
    select 1 from public.tarefas t where t.id = tarefa_id
      and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
  ));
drop policy if exists tarefa_tags_apaga on public.tarefa_tags;
create policy tarefa_tags_apaga on public.tarefa_tags for delete to authenticated
  using (exists (
    select 1 from public.tarefas t where t.id = tarefa_id
      and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
  ));

-- Selo "fazendo agora" (005, Lupa D1): marcar exige poder ALTERAR a tarefa, não só ler. Natham lê a privada do Matheus, mas não marca.
-- Depende de private.pode_alterar acima. Só inserir/alterar mudam; ler e apagar a própria linha continuam como no 005.
drop policy if exists fazendo_agora_cria on public.fazendo_agora;
create policy fazendo_agora_cria on public.fazendo_agora for insert to authenticated
  with check (pessoa_id = (select private.minha_pessoa()) and exists (
    select 1 from public.tarefas t where t.id = tarefa_id
      and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
  ));
drop policy if exists fazendo_agora_altera on public.fazendo_agora;
create policy fazendo_agora_altera on public.fazendo_agora for update to authenticated
  using (pessoa_id = (select private.minha_pessoa()))
  with check (pessoa_id = (select private.minha_pessoa()) and exists (
    select 1 from public.tarefas t where t.id = tarefa_id
      and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
  ));
