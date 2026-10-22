-- 027 · Rodada 268-277, itens 269, 270, 271, 272, 273 (Alvenaria, 22/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente (pode colar de novo). Depende do 002, 006, 015 e 019. ORDEM DE COLAGEM FINAL: 027, depois 026, depois 028.
-- (027 primeiro: ele junta a permissão do Matheus e a trava de postar_agora/tentar_de_novo numa só transação, sem janela de acesso indevido.
-- O 026 depois mantém Natham + Adrian + Matheus em pode_aprovar; o 028 por último, depois das tabelas que os gatilhos dele observam.) NÃO aplicado: o Natham cola no SQL Editor.
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
    update public.tarefas set video_pendente_desde = null where id = new.tarefa_id and video_pendente_desde is not null;  -- achado 5: o legendado chegou, a marca sai (coluna criada no passo 8)
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
  if new.etapa is distinct from 'aprovado' then new.video_pendente_desde := null; end if;  -- achado 5: saiu de Aprovado, a pendência do vídeo novo acaba
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
  if (select public.video_pendente(p_tarefa)) then raise exception 'o video novo ainda nao chegou: espere, suba de novo ou use Postar com o video atual' using errcode = '55000'; end if;
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
  if (select public.video_pendente(p_tarefa)) then raise exception 'o video novo ainda nao chegou: espere, suba de novo ou use Postar com o video atual' using errcode = '55000'; end if;
  delete from public.postagens p using public.tarefas t where t.id = p_tarefa and p.tarefa_id = t.id and p.status in ('fila', 'erro') and not p.rede = any (t.postar_redes);
  update public.postagens p set status = 'fila', erro = null from public.tarefas t
    where p.tarefa_id = p_tarefa and t.id = p.tarefa_id and p.status = 'erro' and p.rede = any (t.postar_redes);
  perform private.alarme_tocou('postar', p_tarefa, 0);
end $$;
revoke all on function public.tentar_de_novo(uuid) from public, anon;
grant execute on function public.tentar_de_novo(uuid) to authenticated;

-- 8) Lupa re-revisão 1 e 2, achado 5: marca NO BANCO de "vídeo novo pendente". A tela confirma a marca com o banco ANTES de o envio de um vídeo começar num card Aprovado.
--    Ela só sai quando o vídeo novo chega (gatilho do passo 3), ou quando alguém clica "Postar com o vídeo atual" (liberar_video_pendente), ou se o card sai de Aprovado.
--    Falha do envio NÃO libera, e fechar a aba no meio também não: prefere-se bloquear a postar o vídeo sem legenda. Sem prazo de validade (a saída é explícita).
--    Com a marca: "Postar agora" e "Tentar de novo" recusam (abaixo), o alarme da hora marcada espera (alarme_tocou, abaixo) e a ficha e o card avisam "Vídeo novo não subiu".
--    Vale para QUALQUER aba ou pessoa, porque mora no card. Analogia: um aviso "tinta fresca" na porta do correio, que só sai quando a tinta seca ou o dono tira de propósito.
alter table public.tarefas add column if not exists video_pendente_desde timestamptz;

create or replace function public.marcar_video_pendente(p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not (select private.pode_mexer_anexos(p_tarefa)) then raise exception 'sem permissao para mexer nos anexos deste card' using errcode = '42501'; end if;
  update public.tarefas set video_pendente_desde = coalesce(video_pendente_desde, now()) where id = p_tarefa and etapa = 'aprovado';
end $$;
revoke all on function public.marcar_video_pendente(uuid) from public, anon;
grant execute on function public.marcar_video_pendente(uuid) to authenticated;

-- "Postar com o vídeo atual": quem aprova desiste do vídeo novo e libera a postagem; se a hora já passou, o alarme é acordado na hora.
create or replace function public.liberar_video_pendente(p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.tarefas t where t.id = p_tarefa and (select private.pode_aprovar(t.aprovador))
      and ((select auth.uid()) is null or (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id)))) then
    raise exception 'so o Natham ou o aprovador libera a postagem com o video atual' using errcode = '42501';
  end if;
  update public.tarefas set video_pendente_desde = null where id = p_tarefa and video_pendente_desde is not null;
  if exists (select 1 from public.tarefas t where t.id = p_tarefa and t.etapa = 'aprovado' and t.postar_em is not null
      and t.postar_em <= to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI')) then
    perform private.alarme_tocou('postar', p_tarefa, 0);
  end if;
end $$;
revoke all on function public.liberar_video_pendente(uuid) from public, anon;
grant execute on function public.liberar_video_pendente(uuid) to authenticated;

create or replace function public.video_pendente(p_tarefa uuid) returns boolean
language sql stable security invoker set search_path = ''
as $$ select coalesce((select video_pendente_desde is not null from public.tarefas where id = p_tarefa), false) $$;
revoke all on function public.video_pendente(uuid) from public, anon;
grant execute on function public.video_pendente(uuid) to authenticated;

create or replace function private.alarme_tocou(p_tipo text, p_tarefa uuid, p_rodada int) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_nome text := private.alarme_nome(p_tipo, p_tarefa); v_segredo text; v_rodadas int; v_aberto boolean; v_tem boolean;
  c_teto constant int := 5;  -- combinado com o Correio
begin
  -- 236: postagem automática DESLIGADA (função postar-meta ainda não está no ar): o alarme se apaga e não chama nada; o relógio de todo minuto do 015 cuida.
  if p_tipo = 'postar' and not private.postagem_automatica() then
    if exists (select 1 from cron.job where jobname = v_nome) then perform cron.unschedule(v_nome); end if;
    return;
  end if;
  -- Toque velho (sentinela que já estava rodando quando o card foi reprogramado, ou card que saiu de Aprovado): não mexe em nada, o gatilho cuida dos jobs.
  if p_tipo = 'postar' and not exists (select 1 from public.tarefas t where t.id = p_tarefa and t.etapa = 'aprovado' and t.postar_em is not null
       and t.postar_em <= to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI')) then return; end if;
  if p_tipo = 'limpar' and not exists (select 1 from public.tarefas t where t.id = p_tarefa and t.etapa = 'postado') then return; end if;
  -- 270 (Lupa re-revisão 1 e 2, achado 5): o vídeo legendado está subindo ou não subiu. Não posta o antigo: o alarme se rearma para daqui a 1 minuto, sem gastar rodada.
  -- A marca só sai com o vídeo novo ou com "Postar com o vídeo atual" (liberar_video_pendente).
  if p_tipo = 'postar' and exists (select 1 from public.tarefas t where t.id = p_tarefa and t.video_pendente_desde is not null) then
    if exists (select 1 from cron.job where jobname = v_nome) then perform cron.unschedule(v_nome); end if;
    perform private.cron_alarme('postar', p_tarefa, now() + interval '1 minute', p_rodada);
    return;
  end if;
  if exists (select 1 from cron.job where jobname = v_nome) then perform cron.unschedule(v_nome); end if;
  -- Limpeza sem arquivo restante = serviço feito: o sentinela acaba aqui, sem depender de a função desarmar.
  -- 236: só conta arquivo do DRIVE; anexo antigo do Supabase (sem drive_id) nunca é limpo, fica só na ficha.
  if p_tipo = 'limpar' and not exists (select 1 from public.arquivos a where a.tarefa_id = p_tarefa and a.drive_id is not null) then return; end if;
  if p_tipo = 'postar' then
    select coalesce(max(p.rodadas) filter (where p.status not in ('postado', 'erro')), 0), coalesce(bool_or(p.status not in ('postado', 'erro')), false), count(*) > 0
      into v_rodadas, v_aberto, v_tem from public.postagens p join public.tarefas t on t.id = p.tarefa_id
      where p.tarefa_id = p_tarefa and p.rede = any (t.postar_redes);  -- rede fora do card não conta
    if v_tem and not v_aberto then
      -- Todas as redes do card postadas e o card ainda em Aprovado (a função não conseguiu movê-lo): o banco move (o gatilho arma a limpeza).
      if not exists (select 1 from public.tarefas t, unnest(t.postar_redes) r where t.id = p_tarefa
           and not exists (select 1 from public.postagens p where p.tarefa_id = t.id and p.rede = r and p.status = 'postado')) then
        update public.tarefas set etapa = 'postado' where id = p_tarefa and etapa = 'aprovado' and cardinality(postar_redes) > 0;
      end if;
      return;  -- senão: nada a fazer, as redes já terminaram (alguma em erro: a tela mostra a faixa)
    end if;
  else
    v_rodadas := 0;
  end if;
  if p_rodada >= c_teto or v_rodadas > c_teto then
    if p_tipo = 'limpar' then  -- função Drive fora do ar: tenta de novo daqui a 1 dia (1 alarme por card, sem relógio de minuto)
      perform private.cron_alarme('limpar', p_tarefa, now() + interval '1 day', 0);
    else
      insert into public.postagens (tarefa_id, rede, status, erro)
      select t.id, r, 'erro', 'a funcao de postagem nao respondeu depois de varias tentativas'
      from public.tarefas t, unnest(t.postar_redes) r where t.id = p_tarefa and t.etapa = 'aprovado'
      on conflict (tarefa_id, rede) do update set status = 'erro',
        erro = case when public.postagens.status = 'fila' then excluded.erro else 'estado incerto: confira a rede antes de tentar de novo' end
        where public.postagens.status in ('fila', 'enviando', 'processando');
    end if;
    return;
  end if;
  perform private.cron_alarme(p_tipo, p_tarefa, now() + interval '12 minutes', p_rodada + 1);
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'tarefas_funcoes_segredo';
  perform net.http_post(
    url := 'https://uruhjlurcxpjhhgvuzwt.supabase.co/functions/v1/' || case p_tipo when 'limpar' then 'drive' else 'postar-meta' end,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-tarefas-segredo', v_segredo),
    body := jsonb_build_object('acao', p_tipo, 'tarefa_id', p_tarefa),
    timeout_milliseconds := 55000);  -- pg_net padrão é 5 s (memória pgnet-timeout)
end $$;
revoke all on function private.alarme_tocou(text, uuid, int) from public, anon, authenticated;

-- 7) Item 272, limpeza única: cards que já estavam em Aprovado ou Postado antes do conserto ainda levavam a tag "Esperando aprovação".
--    Tira SÓ as tags de aprovação (tags.aprovacao) desses cards; as outras ficam. Mexe só na ligação tarefa_tags: a tag em si
--    (e o cadeado do 022, que barra editar/apagar a linha em public.tags) não é tocada. Conferido em produção em 22/10 só com SELECT: 4 cards (3 Aprovado, 1 Postado).
--    Idempotente: na segunda colagem não sobra nada para tirar. O "Quem aprova" do card (tarefas.aprovador) fica como está.
delete from public.tarefa_tags tt
using public.tags g, public.tarefas t
where tt.tag_id = g.id and g.aprovacao and t.id = tt.tarefa_id and t.etapa in ('aprovado', 'postado');

notify pgrst, 'reload schema';
commit;
