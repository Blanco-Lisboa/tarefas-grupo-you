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
  with check (bucket_id = 'arquivos' and (select private.pode_alterar_arquivo(name)));
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
