-- 022 · Trava das tags no BANCO (item 243, achados 1, 2 e 3 da Re-revisão 4 da Lupa). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente (pode colar de novo). Depende do 002 e do 019 v2 (já em produção). Conferido contra o estado real em 24/10 só com SELECT:
--   a política `tags_todos` deixa QUALQUER login ligado a uma pessoa fazer tudo em `tags`; não havia nenhum gatilho em `tags`; existe private.sou_natham_ou_matheus().
-- O que faz:
--  1) A tag de aprovação ("Esperando aprovação": aprovacao = true, ou id 'tag-esperando-aprovacao') NÃO pode ser alterada nem apagada por ninguém (nem Natham, nem Matheus, nem a chave de
--     serviço): apagá-la apagaria a marcação de todos os cards e desligaria o fluxo "Quem aprova". Para mexer um dia, só apagando este gatilho de propósito (comando no fim).
--  2) UPDATE e DELETE de qualquer outra tag: só Natham e Matheus. Ler e criar tag continuam como hoje (qualquer pessoa da equipe).
--  3) contar_cards_da_tag(tag): quantos cards usam a tag, INCLUSIVE os que quem pergunta não vê (cards privados do outro). Devolve só o número.
begin;

create or replace function private.tags_trava() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.aprovacao or old.id = 'tag-esperando-aprovacao' then
    raise exception 'A tag "Esperando aprovação" faz parte do fluxo de aprovação e não pode ser editada nem apagada.' using errcode = '42501';
  end if;
  -- login de pessoa que não é Natham nem Matheus não edita nem apaga tag (auth.uid() nulo = editor de SQL / chave de serviço: segue como sempre)
  if (select auth.uid()) is not null and not (select private.sou_natham_ou_matheus()) then
    raise exception 'Só o Natham ou o Matheus editam ou apagam tags.' using errcode = '42501';
  end if;
  return case tg_op when 'DELETE' then old else new end;
end $$;
revoke all on function private.tags_trava() from public, anon, authenticated;

drop trigger if exists tags_trava on public.tags;
create trigger tags_trava before update or delete on public.tags for each row execute function private.tags_trava();

-- 3) Contagem para a confirmação de apagar tag. security definer: conta também os cards privados que a pessoa não enxerga (a RLS de tarefa_tags esconderia). Só o número.
create or replace function public.contar_cards_da_tag(p_tag text) returns integer
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select private.minha_pessoa()) is null then raise exception 'sem permissao' using errcode = '42501'; end if;
  return (select count(*)::int from public.tarefa_tags where tag_id = p_tag);
end $$;
revoke all on function public.contar_cards_da_tag(text) from public, anon;
grant execute on function public.contar_cards_da_tag(text) to authenticated;

notify pgrst, 'reload schema';
commit;

-- Para desfazer (só de propósito): drop trigger tags_trava on public.tags;
