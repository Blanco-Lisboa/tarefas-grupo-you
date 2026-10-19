-- Bucket privado "arquivos" (200 MB, só imagem e vídeo). Caminho: tarefas/<id da tarefa>/<arquivo> ou pecas/<id da peça>/<arquivo>.
-- Quem vê o arquivo = quem vê a tarefa dona (a subconsulta passa pela trava de tarefas); peça é dos dois.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('arquivos', 'arquivos', false, 209715200, array['image/*', 'video/*'])
on conflict (id) do update set public = false, file_size_limit = 209715200, allowed_mime_types = array['image/*', 'video/*'];

create or replace function private.pode_ver_arquivo(caminho text) returns boolean
language sql stable set search_path = ''
as $$
  select case split_part(caminho, '/', 1)
    when 'tarefas' then exists (select 1 from public.tarefas t where t.id::text = split_part(caminho, '/', 2))
    when 'pecas' then (select private.minha_pessoa()) is not null
    else false
  end
$$;
revoke all on function private.pode_ver_arquivo(text) from public, anon;
grant execute on function private.pode_ver_arquivo(text) to authenticated;

drop policy if exists arquivos_storage_le on storage.objects;
create policy arquivos_storage_le on storage.objects for select to authenticated
  using (bucket_id = 'arquivos' and private.pode_ver_arquivo(name));
drop policy if exists arquivos_storage_cria on storage.objects;
create policy arquivos_storage_cria on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and private.pode_ver_arquivo(name));
drop policy if exists arquivos_storage_altera on storage.objects;
create policy arquivos_storage_altera on storage.objects for update to authenticated
  using (bucket_id = 'arquivos' and private.pode_ver_arquivo(name))
  with check (bucket_id = 'arquivos' and private.pode_ver_arquivo(name));
drop policy if exists arquivos_storage_apaga on storage.objects;
create policy arquivos_storage_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and private.pode_ver_arquivo(name));
