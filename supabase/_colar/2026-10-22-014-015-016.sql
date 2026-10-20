-- ARQUIVO ÚNICO PARA COLAR no SQL Editor (projeto Tarefas - Grupo You, uruhjlurcxpjhhgvuzwt, NUNCA o do CRM). 22/10/2026.
-- Contém, nesta ordem, os arquivos 014, 015 e 016 sem alteração. O 017 e o 018 NÃO entram (vão junto do fluxo do n8n).

-- ===================== 014_caderno_natham_le_matheus.sql =====================
begin;
-- Item 193-banco (rodada 193-198, 22/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 002 e do 006.
--
-- As anotações da página da direita do caderno ("Anotações do dia" e "Não esquecer") já têm tabela desde o 001:
--   anotacoes_dia (dono_id, dia, texto)  = "Anotações do dia"  (campo 'notas' da tela)
--   nao_esquecer  (dono_id, dia, texto)  = "Não esquecer"      (campo 'lembrar' da tela)
-- chave primária (dono_id, dia): um texto por pessoa por dia, então a tela grava com upsert onConflict 'dono_id,dia'.
-- Em produção as duas estão vazias (conferido 22/10): nada a migrar no banco; o que está no navegador sobe pela tela.
--
-- Hoje a trava deixa SÓ o dono ler e escrever. Aqui entra uma regra a mais, só de LEITURA:
-- o Natham lê as do Matheus (mesma função private.natham_le_matheus do 006). Analogia: o Natham ganha a chave de LEITURA da
-- gaveta do Matheus; a gaveta do Natham continua com uma chave só. Matheus nunca lê as do Natham; ninguém escreve no caderno do outro.
-- As duas políticas se somam (ou é o dono, ou é o Natham lendo o Matheus).
drop policy if exists anotacoes_natham_le_matheus on public.anotacoes_dia;
create policy anotacoes_natham_le_matheus on public.anotacoes_dia for select to authenticated
  using ((select private.natham_le_matheus(dono_id)));
drop policy if exists nao_esquecer_natham_le_matheus on public.nao_esquecer;
create policy nao_esquecer_natham_le_matheus on public.nao_esquecer for select to authenticated
  using ((select private.natham_le_matheus(dono_id)));

-- Agenda do Matheus que "não aparece" para o Natham: NÃO é trava. agenda_acesso já dá natham -> matheus e a leitura
-- (agenda_copias_le) está certa. Em produção agenda_copias tem matheus = 1 evento, natham = 106, contato = 4 (22/10):
-- o n8n quase não trouxe a agenda do Matheus. Conferir o fluxo dessa fonte no n8n (fonte 'matheus').
commit;

-- ===================== 015_aprovacao_em_analise.sql =====================
begin;
-- Item 195-banco (rodada 193-198, 22/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 002 e do 006.
--
-- Colunas novas em tarefas:
--   postar_em  text  "AAAA-MM-DDTHH:mm" na hora de Brasília, sem fuso (mesmo jeito de inicio/fim). Data e hora do post, escolhida em "Aprovar".
--   formato    text  'reels' | 'post' | 'carrossel' | 'story' (nulo = sem formato). O banco NÃO exige formato junto de postar_em: a tela exige.
--   conserto   bool  etiqueta vermelha "Conserto": o aprovador mandou voltar para Edição.
-- O que o banco garante sozinho (gatilho private.tarefas_aprovacao):
--   * Só o Natham ou o aprovador do card (tarefas.aprovador, comparado com o nome da pessoa) põe um card em "Aprovado" (de onde vier, ou
--     criado já assim), leva a "Postado" sem passar por Aprovado, liga o "Conserto", troca o aprovador depois de criado o card (em qualquer etapa) ou muda
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
  add column if not exists conserto boolean not null default false,
  add column if not exists formato text;  -- formato do post, escolhido na tela; o n8n usa ESTE campo para a pasta do Drive (017). Nulo = sem formato.
alter table public.tarefas drop constraint if exists tarefas_formato_ok;
alter table public.tarefas add constraint tarefas_formato_ok check (formato in ('reels', 'post', 'carrossel', 'story'));
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
  v_entra_postado := new.etapa = 'postado' and (tg_op = 'INSERT' or coalesce(old.etapa, '') not in ('aprovado', 'postado'));
  if tg_op = 'UPDATE' then
    if (new.conserto and not old.conserto) or v_entra_aprovado or v_entra_postado
       -- depois de criado o card, quem aprova só muda pela mão de quem aprova hoje (em QUALQUER etapa: senão o editor se nomeia
       -- aprovador enquanto o card está em Edição e se aprova depois). Card sem aprovador: só o Natham define. Quando posta, idem.
       or new.aprovador is distinct from old.aprovador
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
      formato = case when p ? 'formato' then r.formato else t.formato end,
      conserto = case when p ? 'conserto' then coalesce(r.conserto, false) else t.conserto end
    where t.id = r.id;
    get diagnostics v_linhas = row_count;
    if v_linhas = 0 then raise exception 'sem permissao para alterar a tarefa'; end if;
    delete from public.tarefa_tags where tarefa_id = r.id;
  else
    insert into public.tarefas (id, titulo, tipo, empresa_id, rede, etapa, responsavel_id, inicio, fim, dia_inteiro, cor,
      concluida, objetivo, notas, links, aprovador, dono_id, criado_por, enviada_por, vai_pro_google, postar_em, formato)
    values (r.id, r.titulo, r.tipo, r.empresa_id, r.rede, r.etapa, r.responsavel_id, r.inicio, r.fim, r.dia_inteiro, r.cor,
      r.concluida, r.objetivo, r.notas, r.links, r.aprovador, r.dono_id, r.criado_por, r.enviada_por, coalesce(r.vai_pro_google, false), r.postar_em, r.formato);
  end if;
  insert into public.tarefa_tags (tarefa_id, tag_id) select r.id, unnest(p_tags);
end $$;
revoke all on function public.salvar_tarefa(jsonb, text[]) from public, anon;
grant execute on function public.salvar_tarefa(jsonb, text[]) to authenticated;

-- cron.schedule com o mesmo nome apenas atualiza o job (idempotente).
select cron.schedule('tarefas_postar_vencidos', '* * * * *', $cmd$select private.postar_vencidos()$cmd$);

notify pgrst, 'reload schema';
commit;

-- ===================== 016_anexos_storage.sql =====================
begin;
-- Item 199-banco (rodada 193-198, acréscimo 22/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente.
-- Depende do 004 (balde e funções), 006 (private.pode_alterar).
--
-- O QUE JÁ EXISTIA (004 + tabela arquivos do 001, vazios em produção, conferido 22/10): balde PRIVADO "arquivos", tabela public.arquivos
-- (uma linha por anexo: tarefa_id, caminho, nome, tipo, tamanho), caminho tarefas/<id da tarefa>/<arquivo>. O que faltava era a TELA gravar
-- (199-tela, Vitral). Aqui o banco só fecha três buracos:
--   1) documento: o balde só aceitava imagem e vídeo, e arquivos.tipo só 'imagem'/'video'. Entra 'documento' (PDF, Word, Excel, PowerPoint, texto, CSV).
--   2) tamanho: o balde estava em 200 MB. Sobe para 500 MB (vídeo de Reels grande). O TETO REAL é o menor entre este e o limite GLOBAL do
--      projeto (Dashboard > Storage > Settings > "Upload file size limit"); o plano Pro permite até 500 GB, mas o padrão é 50 MB e NÃO dá para
--      ler nem mudar por SQL: o Natham precisa conferir/subir lá para 500 MB. Sem isso, vídeo acima de 50 MB falha mesmo com este SQL.
--   3) quem MEXE: antes, quem só LÊ o card (ex.: Natham olhando a tarefa particular do Matheus) podia anexar e apagar arquivo dele.
--      Ler continua como era (quem vê o card vê o arquivo). Anexar e apagar passam a exigir poder ALTERAR o card (mesma regra de tags/fazendo_agora).
--      Analogia: ver a pasta é para quem tem a chave de leitura; colocar ou tirar papel é para quem tem a chave de escrita.

update storage.buckets set
  file_size_limit = 524288000,
  allowed_mime_types = array[
    'image/*', 'video/*', 'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
where id = 'arquivos';

alter table public.arquivos drop constraint if exists arquivos_tipo_check;
alter table public.arquivos add constraint arquivos_tipo_check check (tipo in ('imagem', 'video', 'documento'));

-- Pode alterar o dono do arquivo? tarefas/<id>/...: pela tarefa (private.pode_alterar); pecas/<id>/...: qualquer pessoa, como já era.
-- Roda com os direitos de quem chama: a subconsulta passa pela trava de leitura de tarefas, então tarefa invisível = false.
create or replace function private.pode_alterar_arquivo(caminho text) returns boolean
language sql stable set search_path = ''
as $$
  select case split_part(caminho, '/', 1)
    when 'tarefas' then exists (
      select 1 from public.tarefas t where t.id::text = split_part(caminho, '/', 2)
        and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id)))
    when 'pecas' then (select private.minha_pessoa()) is not null
    else false
  end
$$;
revoke all on function private.pode_alterar_arquivo(text) from public, anon;
grant execute on function private.pode_alterar_arquivo(text) to authenticated;

drop policy if exists arquivos_storage_cria on storage.objects;
create policy arquivos_storage_cria on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and (select private.pode_alterar_arquivo(name))
    -- caminho já registrado numa linha de anexo não se reutiliza (apagar o objeto e subir outro no mesmo endereço deixaria o recibo do Drive velho).
    -- O envio vem ANTES do registro da linha, então o primeiro envio passa; reenviar o mesmo caminho só depois de apagar a linha também.
    and not exists (select 1 from public.arquivos a where a.caminho = name));
-- Sem política de UPDATE no Storage: ninguém SUBSTITUI um arquivo que já está lá (o upload com upsert também precisa dela). Para trocar, anexa-se
-- um novo (caminho novo) e apaga-se o velho. Assim o recibo do Drive (017) vale para aquele arquivo exato e nunca fica velho. Só a chave de serviço mexe.
drop policy if exists arquivos_storage_altera on storage.objects;
drop policy if exists arquivos_storage_apaga on storage.objects;
create policy arquivos_storage_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and (select private.pode_alterar_arquivo(name)));

-- O caminho da linha tem de pertencer ao dono declarado (a fila do Drive e a limpeza confiam nele com a chave de serviço) e não pode subir de pasta.
alter table public.arquivos drop constraint if exists arquivos_caminho_ok;
alter table public.arquivos add constraint arquivos_caminho_ok check (
  caminho !~ '(^|/)\.\.(/|$)'
  and (tarefa_id is null or caminho like 'tarefas/' || tarefa_id::text || '/_%')
  and (peca_id is null or caminho like 'pecas/' || peca_id::text || '/_%')
);

-- A linha da tabela segue o mesmo caminho do arquivo: só cria/apaga quem pode alterar o card (ou a peça). Ler fica como no 002.
drop policy if exists arquivos_cria on public.arquivos;
create policy arquivos_cria on public.arquivos for insert to authenticated with check (
  criado_por = (select private.minha_pessoa())
  and (
    (tarefa_id is not null and exists (select 1 from public.tarefas t where t.id = tarefa_id
       and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))))
    or (peca_id is not null and (select private.minha_pessoa()) is not null)
  )
);
drop policy if exists arquivos_apaga on public.arquivos;
create policy arquivos_apaga on public.arquivos for delete to authenticated using (
  (tarefa_id is not null and exists (select 1 from public.tarefas t where t.id = tarefa_id
     and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))))
  or (peca_id is not null and (select private.minha_pessoa()) is not null)
);

-- COMO A TELA ENVIA (para a Vitral): arquivo até ~6 MB: sb.storage.from('arquivos').upload('tarefas/<tarefa_id>/<uuid>-<nome>', file).
-- Acima disso, envio em partes (TUS, resumível): endpoint https://uruhjlurcxpjhhgvuzwt.storage.supabase.co/storage/v1/upload/resumable,
-- bucketName 'arquivos', objectName igual ao caminho, chunk de 6 MB. Depois do envio, insert em public.arquivos (caminho, nome, tipo, tamanho, criado_por, tarefa_id).
-- Ver o arquivo: createSignedUrl(caminho, 3600) (balde privado, nunca URL pública). Se o card já foi sincronizado com o Drive e a limpeza (017)
-- tirou o arquivo do balde, arquivos.removido_em vem preenchido e arquivos.drive_link tem o endereço.
commit;
