-- 029 · Item 287 (parte C). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente (pode colar de novo). Depende do 019 (pode_apagar_tarefa, tarefas_apagar_com_drive). NÃO aplicado: o Natham cola no SQL Editor.
-- ORDEM: depois do 027, 026 e 028 (não depende deles; só vem por último para a lista ficar simples).
-- O código funciona ANTES e DEPOIS da colagem: antes, apagar card continua como sempre; depois, o app usa a função apagar_card.
--
-- O problema (22/10): cards de conteúdo (com empresa e etapa) apareciam na aba "Sem data" do Caderno, e o Matheus os apagou como se fossem notas.
-- A tela do Caderno e a da Esteira chamam o mesmo "apagar". Desenho mais simples: o BANCO só deixa apagar card de conteúdo por UMA porta, a função
-- public.apagar_card (a que a Esteira usa: Concluir e lixeira da ficha). Qualquer outro DELETE direto na tabela tarefas, para card de conteúdo, é recusado.
-- Tarefa comum do Caderno (sem empresa ou sem etapa) apaga como sempre. Quem pode apagar continua o mesmo (pode_apagar_tarefa, 019): só muda a porta.
-- Passam também: a função drive (card com arquivos: ela tira os arquivos e depois apaga; vem do servidor, sem navegador) e quem não tem login (SQL Editor, despertador).
-- Analogia: o armário dos cards ganha uma porta só, com o crachá certo; o armário das notas continua aberto.
begin;

create or replace function public.apagar_card(p_tarefa uuid) returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if not (select public.pode_apagar_tarefa(p_tarefa)) then raise exception 'sem permissao para apagar este card' using errcode = '42501'; end if;
  perform set_config('grade.apaga_card', 'sim', true);  -- vale só nesta transação
  delete from public.tarefas where id = p_tarefa;
  if not found then raise exception 'card nao encontrado' using errcode = 'P0002'; end if;
end $$;
revoke all on function public.apagar_card(uuid) from public, anon;
grant execute on function public.apagar_card(uuid) to authenticated;

create or replace function private.tarefas_so_esteira_apaga() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.etapa is not null and old.empresa_id is not null            -- card de conteúdo
     and (select auth.uid()) is not null                             -- (sem login: SQL Editor e despertador passam)
     and coalesce(current_setting('grade.apaga_card', true), '') <> 'sim'   -- (a porta certa: apagar_card)
     and coalesce(current_setting('request.headers', true)::json ->> 'user-agent', '') not like 'Deno/%'  -- (a função drive, que roda no servidor)
  then
    raise exception 'card de conteudo so se apaga pela Esteira (Concluir ou a lixeira da ficha)' using errcode = '42501';
  end if;
  return old;
end $$;
drop trigger if exists tarefas_so_esteira_apaga on public.tarefas;
create trigger tarefas_so_esteira_apaga before delete on public.tarefas for each row execute function private.tarefas_so_esteira_apaga();

notify pgrst, 'reload schema';
commit;
