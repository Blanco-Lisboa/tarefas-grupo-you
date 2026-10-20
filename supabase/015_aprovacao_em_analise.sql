begin;
-- Item 195-banco (rodada 193-198, 22/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 002 e do 006.
--
-- Colunas novas em tarefas:
--   postar_em  text  "AAAA-MM-DDTHH:mm" na hora de Brasília, sem fuso (mesmo jeito de inicio/fim). Data e hora do post, escolhida em "Aprovar".
--   conserto   bool  etiqueta vermelha "Conserto": o aprovador mandou voltar para Edição.
-- O que o banco garante sozinho (gatilho private.tarefas_aprovacao):
--   * Só o Natham ou o aprovador do card (tarefas.aprovador, comparado com o nome da pessoa) põe um card em "Aprovado" (de onde vier, ou
--     criado já assim), leva a "Postado" sem passar por Aprovado, liga o "Conserto", troca o aprovador depois de "Em análise" ou muda
--     postar_em depois de Aprovado. Aprovado -> Postado a mão é de qualquer editor. Sem login (despertador, SQL Editor; o app sempre tem login e anon não escreve) não trava.
--   * postar_em com data impossível (31/02, 99:99) é recusado.
--   * Voltou para "Em análise" ou saiu de "Edição": o "Conserto" apaga. Saiu de "Aprovado/Postado": o postar_em apaga.
-- Postar sozinho: um despertador (pg_cron) roda a CADA MINUTO e passa para "Postado" todo card "Aprovado" cujo postar_em já passou.
--   Por que no banco: roda com o navegador fechado. Analogia: um despertador na parede, não um recado que depende de alguém abrir a loja.
--   A hora é comparada em Brasília; texto no mesmo formato compara certo em ordem alfabética.
--   Atraso máximo ~1 min. Card "Aprovado" sem postar_em NÃO posta sozinho (fica até alguém arrastar).
-- Para o 196 (postagem automática IG/FB): é só ler tarefas com etapa = 'postado' e postar_em preenchido; nada muda aqui.

alter table public.tarefas
  add column if not exists postar_em text,
  add column if not exists conserto boolean not null default false;
alter table public.tarefas drop constraint if exists tarefas_postar_em_ok;
alter table public.tarefas add constraint tarefas_postar_em_ok check (postar_em ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$');

-- Natham, ou a pessoa cujo nome é o aprovador do card. Sem login (auth.uid nulo) = true: despertador e SQL Editor.
create or replace function private.pode_aprovar(aprovador text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is null or exists (
    select 1 from public.pessoas p
    where p.user_id = (select auth.uid()) and (p.slug = 'natham' or lower(p.nome) = lower(btrim(aprovador)))
  )
$$;
revoke all on function private.pode_aprovar(text) from public, anon;
grant execute on function private.pode_aprovar(text) to authenticated;

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
  -- Postado só nasce de Aprovado (a mão ou o despertador); vindo de qualquer outra etapa, ou criado já Postado, é como aprovar.
  v_entra_postado := new.etapa = 'postado' and (tg_op = 'INSERT' or old.etapa not in ('aprovado', 'postado'));
  if tg_op = 'UPDATE' then
    if (new.conserto and not old.conserto) or v_entra_aprovado or v_entra_postado
       -- depois de entrar em análise, quem aprova e quando posta só mudam pela mão de quem aprova
       or (old.etapa in ('analise', 'aprovado', 'postado') and new.aprovador is distinct from old.aprovador)
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
drop trigger if exists tarefas_aprovacao on public.tarefas;
create trigger tarefas_aprovacao before insert or update on public.tarefas for each row execute function private.tarefas_aprovacao();

create or replace function private.postar_vencidos() returns integer
language plpgsql security definer set search_path = ''
as $$
declare n integer;
begin
  update public.tarefas set etapa = 'postado'
  where etapa = 'aprovado' and postar_em is not null
    and postar_em <= to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI');
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function private.postar_vencidos() from public, anon, authenticated;

-- salvar_tarefa (010) + postar_em e conserto. Se a chave não vem no JSON (app antigo), o valor atual fica; assim nenhuma tela esquece o selo.
-- Aprovar = salvar etapa 'aprovado' + postar_em; Consertar = etapa 'edicao' + conserto true. A trava de quem pode está no gatilho acima.
create or replace function public.salvar_tarefa(p jsonb, p_tags text[] default '{}') returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  r public.tarefas;
  v_linhas int;
begin
  r := jsonb_populate_record(null::public.tarefas, p);
  if r.id is null then raise exception 'salvar_tarefa: falta o id'; end if;
  if exists (select 1 from public.tarefas where id = r.id) then
    update public.tarefas t set
      titulo = r.titulo, tipo = r.tipo, empresa_id = r.empresa_id, rede = r.rede, etapa = r.etapa,
      responsavel_id = r.responsavel_id, inicio = r.inicio, fim = r.fim, dia_inteiro = r.dia_inteiro, cor = r.cor,
      concluida = r.concluida, objetivo = r.objetivo, notas = r.notas, links = r.links, aprovador = r.aprovador,
      postar_em = case when p ? 'postar_em' then r.postar_em else t.postar_em end,
      conserto = case when p ? 'conserto' then coalesce(r.conserto, false) else t.conserto end
    where t.id = r.id;
    get diagnostics v_linhas = row_count;
    if v_linhas = 0 then raise exception 'sem permissao para alterar a tarefa'; end if;
    delete from public.tarefa_tags where tarefa_id = r.id;
  else
    insert into public.tarefas (id, titulo, tipo, empresa_id, rede, etapa, responsavel_id, inicio, fim, dia_inteiro, cor,
      concluida, objetivo, notas, links, aprovador, dono_id, criado_por, enviada_por, vai_pro_google, postar_em)
    values (r.id, r.titulo, r.tipo, r.empresa_id, r.rede, r.etapa, r.responsavel_id, r.inicio, r.fim, r.dia_inteiro, r.cor,
      r.concluida, r.objetivo, r.notas, r.links, r.aprovador, r.dono_id, r.criado_por, r.enviada_por, coalesce(r.vai_pro_google, false), r.postar_em);
  end if;
  insert into public.tarefa_tags (tarefa_id, tag_id) select r.id, unnest(p_tags);
end $$;
revoke all on function public.salvar_tarefa(jsonb, text[]) from public, anon;
grant execute on function public.salvar_tarefa(jsonb, text[]) to authenticated;

-- cron.schedule com o mesmo nome apenas atualiza o job (idempotente).
select cron.schedule('tarefas_postar_vencidos', '* * * * *', $cmd$select private.postar_vencidos()$cmd$);

notify pgrst, 'reload schema';
commit;
