-- Achados da Lupa 4, 5 e 11 (docs/levas/2026-10-20-PENTE-FINO/lupa-achados.md). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente.
-- Depende do 006 (usa private.pode_alterar). Aplicar o 006 primeiro.

-- ACHADO 11: ninguém apaga empresa pela API (o "Tirar empresa" saiu do produto; apagar levaria pastas, peças e ideias por cascata).
-- O app só lê, cria e altera empresa (salvarEmpresa usa upsert).
revoke delete on public.empresas from authenticated;
drop policy if exists empresas_todos on public.empresas;
drop policy if exists empresas_le on public.empresas;
create policy empresas_le on public.empresas for select to authenticated
  using ((select private.minha_pessoa()) is not null);
drop policy if exists empresas_cria on public.empresas;
create policy empresas_cria on public.empresas for insert to authenticated
  with check ((select private.minha_pessoa()) is not null);
drop policy if exists empresas_altera on public.empresas;
create policy empresas_altera on public.empresas for update to authenticated
  using ((select private.minha_pessoa()) is not null) with check ((select private.minha_pessoa()) is not null);

-- ACHADO 5: anexo de tarefa só mexe quem pode ALTERAR a tarefa (antes bastava poder LER; quem só lê conseguia subir e apagar arquivo).
-- Peça continua dos dois. Ler continua igual (quem vê a tarefa vê o arquivo).
create or replace function private.pode_alterar_arquivo(caminho text) returns boolean
language sql stable set search_path = ''
as $$
  select case split_part(caminho, '/', 1)
    when 'tarefas' then exists (
      select 1 from public.tarefas t
      where t.id::text = split_part(caminho, '/', 2)
        and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
    )
    when 'pecas' then (select private.minha_pessoa()) is not null
    else false
  end
$$;
revoke all on function private.pode_alterar_arquivo(text) from public, anon;
grant execute on function private.pode_alterar_arquivo(text) to authenticated;

drop policy if exists arquivos_storage_cria on storage.objects;
create policy arquivos_storage_cria on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and private.pode_alterar_arquivo(name));
drop policy if exists arquivos_storage_altera on storage.objects;
create policy arquivos_storage_altera on storage.objects for update to authenticated
  using (bucket_id = 'arquivos' and private.pode_alterar_arquivo(name))
  with check (bucket_id = 'arquivos' and private.pode_alterar_arquivo(name));
drop policy if exists arquivos_storage_apaga on storage.objects;
create policy arquivos_storage_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and private.pode_alterar_arquivo(name));

drop policy if exists arquivos_cria on public.arquivos;
create policy arquivos_cria on public.arquivos for insert to authenticated with check (
  criado_por = (select private.minha_pessoa())
  and (
    (tarefa_id is not null and exists (
      select 1 from public.tarefas t where t.id = tarefa_id
        and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
    ))
    or (peca_id is not null and (select private.minha_pessoa()) is not null)
  )
);
drop policy if exists arquivos_apaga on public.arquivos;
create policy arquivos_apaga on public.arquivos for delete to authenticated using (
  (tarefa_id is not null and exists (
    select 1 from public.tarefas t where t.id = tarefa_id
      and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
  ))
  or (peca_id is not null and (select private.minha_pessoa()) is not null)
);

-- ACHADO 4: salvar a tarefa e as tags numa só operação do banco (tudo grava ou nada grava).
-- Roda com a trava de quem chamou (security invoker): as mesmas regras de tarefas e tarefa_tags valem aqui dentro.
-- p = a tarefa em json com as colunas do banco (id, titulo, tipo, ..., dono_id, criado_por, enviada_por);
-- na edição o banco ignora dono_id/criado_por/enviada_por (gatilho tarefas_antes).
-- O app AINDA NÃO chama esta função: o repositório troca para ela só depois de aplicada (ver item 177 da leva).
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
      concluida = r.concluida, objetivo = r.objetivo, notas = r.notas, links = r.links, aprovador = r.aprovador
    where t.id = r.id;
    get diagnostics v_linhas = row_count;
    if v_linhas = 0 then raise exception 'sem permissao para alterar a tarefa'; end if;
    delete from public.tarefa_tags where tarefa_id = r.id;
  else
    insert into public.tarefas (id, titulo, tipo, empresa_id, rede, etapa, responsavel_id, inicio, fim, dia_inteiro, cor,
      concluida, objetivo, notas, links, aprovador, dono_id, criado_por, enviada_por)
    values (r.id, r.titulo, r.tipo, r.empresa_id, r.rede, r.etapa, r.responsavel_id, r.inicio, r.fim, r.dia_inteiro, r.cor,
      r.concluida, r.objetivo, r.notas, r.links, r.aprovador, r.dono_id, r.criado_por, r.enviada_por);
  end if;
  insert into public.tarefa_tags (tarefa_id, tag_id) select r.id, unnest(p_tags);
end $$;
revoke all on function public.salvar_tarefa(jsonb, text[]) from public, anon;
grant execute on function public.salvar_tarefa(jsonb, text[]) to authenticated;

-- Faz a API enxergar a função nova sem esperar (o app chama public.salvar_tarefa e, se ela não existir, cai no caminho antigo).
notify pgrst, 'reload schema';
