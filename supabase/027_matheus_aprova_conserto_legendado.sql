-- 027 · Rodada 268-277, itens 269, 270, 271, 272, 273 (Alvenaria, 22/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente (pode colar de novo). Depende do 002, 006, 015 e 019. ORDEM: 026 e depois 027 (o 026 também já traz o Matheus em pode_aprovar,
-- então qualquer ordem mantém Natham + Adrian + Matheus; o 027 sozinho também os mantém). NÃO aplicado: o Natham cola no SQL Editor.
-- O código funciona ANTES e DEPOIS da colagem (antes: o Matheus ainda não aprova no banco e o campo Conserto nem aparece).
--
--  269  O Matheus aprova, programa e posta (aprovação presencial): entra ao lado do Natham e do Adrian em private.pode_aprovar.
--       Isso vale para tudo que a função guarda: mover para Aprovado, Consertar, programar, "Postar agora", "Tentar de novo",
--       e mexer nos anexos de card Aprovado/Postado (private.pode_mexer_anexos usa a mesma função; é isso que libera o 270 para ele).
--  270  Vídeo legendado: quando sobe um vídeo NOVO num card Aprovado, o vídeo que já estava como anexo vira papel 'original'
--       (sem legenda, guardado no Drive, fora do post). A postar-meta só lê papel 'anexo', então o post sai com o novo.
--       Analogia: o vídeo velho vai para a gaveta de baixo; o da frente é o que sai pelo correio.
--  271  Coluna tarefas.conserto_texto (texto do campo "Conserto" da ficha). Só quem aprova muda; some ao aprovar.
--  273  (nada no banco: a causa era a tela, que travava a área de anexos para quem não aprova.)
--  272  (nada no banco: a tag sai pelo salvar da tela. O gatilho das tags, 022, continua barrando editar/apagar a tag em si.)
begin;

-- 1) Aprovar: Natham, Adrian, Matheus, ou a pessoa cujo nome é o aprovador do card. Sem login (auth.uid nulo) = true: despertador e SQL Editor.
create or replace function private.pode_aprovar(aprovador text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is null or exists (
    select 1 from public.pessoas p
    where p.user_id = (select auth.uid()) and (p.slug in ('natham', 'adrian', 'matheus') or lower(p.nome) = lower(btrim(aprovador)))
  )
$$;
revoke all on function private.pode_aprovar(text) from public, anon;
grant execute on function private.pode_aprovar(text) to authenticated;

-- 2) Coluna do campo "Conserto".
alter table public.tarefas add column if not exists conserto_texto text;

-- 3) Papel 'original' (vídeo sem legenda guardado) em arquivos.
alter table public.arquivos drop constraint if exists arquivos_papel_ok;
alter table public.arquivos add constraint arquivos_papel_ok check (
  papel in ('anexo', 'capa', 'original') and (papel <> 'capa' or tipo = 'imagem') and (papel <> 'original' or tipo = 'video')
);

create or replace function private.arquivos_video_novo() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.tarefa_id is not null and new.tipo = 'video' and new.papel = 'anexo'
     and exists (select 1 from public.tarefas t where t.id = new.tarefa_id and t.etapa = 'aprovado') then
    update public.arquivos set papel = 'original' where tarefa_id = new.tarefa_id and tipo = 'video' and papel = 'anexo' and id <> new.id;
  end if;
  return null;
end $$;
revoke all on function private.arquivos_video_novo() from public, anon, authenticated;
drop trigger if exists arquivos_video_novo on public.arquivos;
create trigger arquivos_video_novo after insert on public.arquivos for each row execute function private.arquivos_video_novo();

-- 4) Gatilho de aprovação (019) + pedido de conserto: só quem aprova escreve; aprovado ou postado limpa.
create or replace function private.tarefas_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
declare v_entra_aprovado boolean; v_entra_postado boolean;
begin
  if new.postar_em is not null then
    begin perform new.postar_em::timestamp;
    exception when others then raise exception 'postar_em invalido: %', new.postar_em using errcode = '22007'; end;
  end if;
  -- 236: a versão publicada (c5bb34b) deixa arrastar QUALQUER card até Postado; o banco não recusa mais isso. (Só Postagem programa e posta nas redes: ver os alarmes e pegar_postagens.)
  v_entra_aprovado := new.etapa = 'aprovado' and (tg_op = 'INSERT' or old.etapa is distinct from 'aprovado');
  v_entra_postado := new.etapa = 'postado' and (tg_op = 'INSERT' or coalesce(old.etapa, '') not in ('aprovado', 'postado'));
  if tg_op = 'UPDATE' then
    if new.aprovador is distinct from old.aprovador and not (select private.pode_trocar_aprovador(old.aprovador)) then
      raise exception 'so o Natham, o Matheus ou o aprovador do card troca quem aprova' using errcode = '42501';
    end if;
    -- Sair de Aprovado (para Postado a mão, Edição ou qualquer etapa) também é do Natham/aprovador: senão um editor "posta" no papel, ou volta o card para Edição
    -- e escapa da trava de legenda/redes/capa/anexos, e o alarme se cancela.
    if (new.conserto and not old.conserto) or v_entra_aprovado or v_entra_postado
       or (old.etapa = 'aprovado' and new.etapa is distinct from 'aprovado')
       or new.conserto_texto is distinct from old.conserto_texto  -- 271: só quem aprova escreve o pedido de conserto
       or (old.etapa in ('aprovado', 'postado') and new.etapa in ('aprovado', 'postado') and (
            new.postar_em is distinct from old.postar_em or new.legenda is distinct from old.legenda
            or new.formato is distinct from old.formato or new.postar_redes is distinct from old.postar_redes
            or new.capa_quadro_ms is distinct from old.capa_quadro_ms)) then
      if not (select private.pode_aprovar(old.aprovador)) then
        raise exception 'so o Natham ou o aprovador do card aprova, programa, muda o que vai para a rede ou manda consertar' using errcode = '42501';
      end if;
    end if;
  else
    if new.conserto then raise exception 'conserto so nasce de "Consertar" em um card existente' using errcode = '42501'; end if;
    if (v_entra_aprovado or v_entra_postado) and not (select private.pode_aprovar(new.aprovador)) then
      raise exception 'so o Natham ou o aprovador do card cria um card ja aprovado' using errcode = '42501';
    end if;
  end if;
  if new.etapa is distinct from 'edicao' then new.conserto := false; end if;
  if tg_op = 'INSERT' or new.etapa in ('aprovado', 'postado') then new.conserto_texto := null; end if;  -- 271: aprovado = o pedido de conserto fecha
  if new.etapa is null or new.etapa not in ('aprovado', 'postado') then new.postar_em := null; end if;
  -- 236: a data real de entrada em Postado (a tela conta os 7 dias dela). Só o gatilho escreve: quem já estava Postado mantém a data.
  if new.etapa = 'postado' and (tg_op = 'INSERT' or old.etapa is distinct from 'postado') then new.postado_em := now();
  elsif new.etapa = 'postado' and tg_op = 'UPDATE' then new.postado_em := coalesce(old.postado_em, new.postado_em);  -- (card antigo sem data: a colagem do 019 grava uma)
  else new.postado_em := null; end if;
  return new;
end $$;

-- 5) salvar_tarefa (019) + conserto_texto. Chave ausente no JSON = mantém o valor atual; texto vazio vira nulo.
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
      formato = case when p ? 'formato' then r.formato else t.formato end,
      conserto = case when p ? 'conserto' then coalesce(r.conserto, false) else t.conserto end,
      legenda = case when p ? 'legenda' then r.legenda else t.legenda end,
      postar_redes = case when p ? 'postar_redes' then coalesce(r.postar_redes, '{instagram,facebook}') else t.postar_redes end,
      ocasiao_id = case when p ? 'ocasiao_id' then r.ocasiao_id else t.ocasiao_id end,
      capa_quadro_ms = case when p ? 'capa_quadro_ms' then r.capa_quadro_ms else t.capa_quadro_ms end,
      conserto_texto = case when p ? 'conserto_texto' then nullif(btrim(r.conserto_texto), '') else t.conserto_texto end
    where t.id = r.id;
    get diagnostics v_linhas = row_count;
    if v_linhas = 0 then raise exception 'sem permissao para alterar a tarefa'; end if;
    delete from public.tarefa_tags where tarefa_id = r.id;
  else
    insert into public.tarefas (id, titulo, tipo, empresa_id, rede, etapa, responsavel_id, inicio, fim, dia_inteiro, cor,
      concluida, objetivo, notas, links, aprovador, dono_id, criado_por, enviada_por, vai_pro_google, postar_em, formato,
      legenda, postar_redes, ocasiao_id, capa_quadro_ms)
    values (r.id, r.titulo, r.tipo, r.empresa_id, r.rede, r.etapa, r.responsavel_id, r.inicio, r.fim, r.dia_inteiro, r.cor,
      r.concluida, r.objetivo, r.notas, r.links, r.aprovador, r.dono_id, r.criado_por, r.enviada_por, coalesce(r.vai_pro_google, false),
      r.postar_em, r.formato, r.legenda, coalesce(r.postar_redes, '{instagram,facebook}'), r.ocasiao_id, r.capa_quadro_ms);
  end if;
  insert into public.tarefa_tags (tarefa_id, tag_id) select r.id, unnest(p_tags);
end $$;
revoke all on function public.salvar_tarefa(jsonb, text[]) from public, anon;
grant execute on function public.salvar_tarefa(jsonb, text[]) to authenticated;

-- 6) Lupa #2, achado 3: postar_agora e tentar_de_novo rodam com privilégio do dono da função; agora também exigem que QUEM CHAMA possa alterar o card
--    (private.pode_alterar com o login de quem chamou), antes de qualquer escrita. Sem login (despertador, SQL Editor) segue livre.
--    Antes só valia pode_aprovar, que com o Matheus virou "true" para qualquer card, até card privado de outra pessoa cujo id ele conhecesse.
create or replace function public.postar_agora(p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_antes text; v_agora text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI');
begin
  select postar_em into v_antes from public.tarefas t
  where t.id = p_tarefa and t.etapa = 'aprovado' and t.tipo = 'postagem' and (select private.pode_aprovar(t.aprovador))
    and ((select auth.uid()) is null or (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id)));
  if not found then raise exception 'so o Natham ou o aprovador posta agora, e so card de Postagem em Aprovado' using errcode = '42501'; end if;
  update public.tarefas set postar_em = v_agora where id = p_tarefa;
  if v_antes is not distinct from v_agora then perform private.alarme_tocou('postar', p_tarefa, 0); end if;
end $$;
revoke all on function public.postar_agora(uuid) from public, anon;
grant execute on function public.postar_agora(uuid) to authenticated;

create or replace function public.tentar_de_novo(p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.tarefas t where t.id = p_tarefa and t.etapa = 'aprovado' and (select private.pode_aprovar(t.aprovador))
      and ((select auth.uid()) is null or (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id)))) then
    raise exception 'so o Natham ou o aprovador tenta de novo' using errcode = '42501';
  end if;
  delete from public.postagens p using public.tarefas t where t.id = p_tarefa and p.tarefa_id = t.id and p.status in ('fila', 'erro') and not p.rede = any (t.postar_redes);
  update public.postagens p set status = 'fila', erro = null from public.tarefas t
    where p.tarefa_id = p_tarefa and t.id = p.tarefa_id and p.status = 'erro' and p.rede = any (t.postar_redes);
  perform private.alarme_tocou('postar', p_tarefa, 0);
end $$;
revoke all on function public.tentar_de_novo(uuid) from public, anon;
grant execute on function public.tentar_de_novo(uuid) to authenticated;

-- 7) Item 272, limpeza única: cards que já estavam em Aprovado ou Postado antes do conserto ainda levavam a tag "Esperando aprovação".
--    Tira SÓ as tags de aprovação (tags.aprovacao) desses cards; as outras ficam. Mexe só na ligação tarefa_tags: a tag em si
--    (e o cadeado do 022, que barra editar/apagar a linha em public.tags) não é tocada. Conferido em produção em 22/10 só com SELECT: 4 cards (3 Aprovado, 1 Postado).
--    Idempotente: na segunda colagem não sobra nada para tirar. O "Quem aprova" do card (tarefas.aprovador) fica como está.
delete from public.tarefa_tags tt
using public.tags g, public.tarefas t
where tt.tag_id = g.id and g.aprovacao and t.id = tt.tarefa_id and t.etapa in ('aprovado', 'postado');

notify pgrst, 'reload schema';
commit;
