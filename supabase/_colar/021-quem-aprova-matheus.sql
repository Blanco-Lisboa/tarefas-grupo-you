-- Item 223: o Matheus escolhe "Quem aprova" em qualquer card. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente. Depende do 015. NÃO aplicado: o Natham cola no SQL Editor.
--
-- Antes (015): depois de criado o card, só o Natham ou o aprovador atual trocava o aprovador; card sem aprovador, só o Natham.
--   O Matheus não conseguia escolher ninguém em card do Natham ou sem aprovador (a tela travava o campo e o banco recusava).
-- Agora: o Natham, o Matheus ou o aprovador atual troca o aprovador. Aprovar, programar e consertar NÃO mudam:
--   continuam só com o Natham ou o aprovador de antes da gravação (private.pode_aprovar, sem mudança).
-- Com ou sem o 019: o 019 já traz esta mesma regra no gatilho dele. Se o 019 já foi colado (coluna legenda existe), este arquivo
--   só cria a função e não mexe no gatilho; se não, troca o gatilho do 015 por ele mesmo com a regra nova.
begin;

-- Natham, Matheus, ou a pessoa cujo nome é o aprovador atual do card. Sem login (auth.uid nulo) = true: despertador e SQL Editor.
create or replace function private.pode_trocar_aprovador(aprovador text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is null or exists (
    select 1 from public.pessoas p
    where p.user_id = (select auth.uid()) and (p.slug in ('natham', 'matheus') or lower(p.nome) = lower(btrim(aprovador)))
  )
$$;
revoke all on function private.pode_trocar_aprovador(text) from public, anon;
grant execute on function private.pode_trocar_aprovador(text) to authenticated;

do $do$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tarefas' and column_name = 'legenda') then
    raise notice '019 ja colado: o gatilho dele ja usa private.pode_trocar_aprovador; gatilho mantido';
    return;
  end if;
  -- Gatilho do 015, igual, com a troca do aprovador saindo da regra de quem aprova para a regra nova.
  execute $f$
create or replace function private.tarefas_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
declare v_entra_aprovado boolean; v_entra_postado boolean;
begin
  if new.postar_em is not null then
    begin perform new.postar_em::timestamp;  -- recusa data impossível (31/02, 99:99) que o formato do CHECK deixaria passar
    exception when others then raise exception 'postar_em invalido: %', new.postar_em using errcode = '22007'; end;
  end if;
  v_entra_aprovado := new.etapa = 'aprovado' and (tg_op = 'INSERT' or old.etapa is distinct from 'aprovado');
  v_entra_postado := new.etapa = 'postado' and (tg_op = 'INSERT' or coalesce(old.etapa, '') not in ('aprovado', 'postado'));
  if tg_op = 'UPDATE' then
    -- Quem aprova: muda pela mão do Natham, do Matheus ou de quem aprova hoje (223), em qualquer etapa.
    if new.aprovador is distinct from old.aprovador and not (select private.pode_trocar_aprovador(old.aprovador)) then
      raise exception 'so o Natham, o Matheus ou o aprovador do card troca quem aprova' using errcode = '42501';
    end if;
    -- Aprovar, postar sem passar por Aprovado, consertar e mudar postar_em depois de Aprovado: o aprovador de ANTES desta gravação
    -- (quem se nomeia aprovador não se aprova na mesma gravação).
    if (new.conserto and not old.conserto) or v_entra_aprovado or v_entra_postado
       or (old.etapa in ('aprovado', 'postado') and new.etapa in ('aprovado', 'postado') and new.postar_em is distinct from old.postar_em) then
      if not (select private.pode_aprovar(old.aprovador)) then
        raise exception 'so o Natham ou o aprovador do card aprova, programa a postagem ou manda consertar' using errcode = '42501';
      end if;
    end if;
  else
    if new.conserto then raise exception 'conserto so nasce de "Consertar" em um card existente' using errcode = '42501'; end if;
    if (v_entra_aprovado or v_entra_postado) and not (select private.pode_aprovar(new.aprovador)) then
      raise exception 'so o Natham ou o aprovador do card cria um card ja aprovado' using errcode = '42501';
    end if;
  end if;
  if new.etapa is distinct from 'edicao' then new.conserto := false; end if;
  if new.etapa is null or new.etapa not in ('aprovado', 'postado') then new.postar_em := null; end if;
  return new;
end $$;
$f$;
end $do$;

notify pgrst, 'reload schema';
commit;
