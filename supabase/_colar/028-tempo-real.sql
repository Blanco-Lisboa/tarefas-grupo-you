-- Item 274: tempo real. Esteira, Calendário, Caderno, Pastas e Ideias recebem um aviso quando alguém muda algo.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. NÃO aplicado: o Natham cola no SQL Editor.
-- Analogia: em vez de pôr o caderno e a agenda de cada pessoa na lista de avisos (o Realtime não confere a trava nas EXCLUSÕES e vazaria
-- "fulano apagou algo"), existe uma tabelinha-sino, public.aviso_mudanca: uma linha por assunto, só com a chave e a hora. Gatilhos tocam o sino.
-- Linha de assunto privado só é visível (trava RLS, valendo também no Realtime) para quem já pode ver aquele assunto. Nunca se apaga linha: sem evento DELETE.
-- Antes de colar, o app funciona igual (só não recebe os avisos). Tabela que ainda não existe (019/024 não coladas) é pulada.
begin;

-- Se uma versão anterior deste arquivo foi colada, tira as tabelas de verdade da publicação (vazavam exclusões).
do $$
declare t text;
begin
  foreach t in array array['tarefas','tarefa_tags','tags','empresas','fazendo_agora','arquivos','postagens','agenda_eventos','agenda_copias','agenda_acesso',
                           'agenda_saida_vinculo','agenda_feitos','anotacoes_dia','nao_esquecer','ideias','ideias_categorias','ocasioes','pastas_livres'] loop
    if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end $$;

create table if not exists public.aviso_mudanca (chave text primary key, em timestamptz not null default now());
alter table public.aviso_mudanca enable row level security;
revoke all on public.aviso_mudanca from public, anon, authenticated;
grant select on public.aviso_mudanca to authenticated;

-- (agenda_eventos é uma view desde o 010: o gatilho vai em agenda_copias, a tabela de verdade.)
-- Chaves: sem ":" = assunto de todos (esteira, ideias, pastas). Com ":" = <tipo>:<id>.
--   cartao:<pessoa> e caderno:<pessoa> = quem vê é a pessoa e o Natham lendo o Matheus (mesma regra do caderno e dos cards pessoais)
--   agenda:<fonte> = quem tem acesso àquela agenda; acesso:<pessoa> e feitos:<pessoa> = só a própria pessoa.
drop policy if exists aviso_mudanca_le on public.aviso_mudanca;
create policy aviso_mudanca_le on public.aviso_mudanca for select to authenticated using (
  chave !~ ':'
  or (split_part(chave, ':', 1) in ('acesso', 'feitos') and split_part(chave, ':', 2)::uuid = (select private.minha_pessoa()))
  or (split_part(chave, ':', 1) in ('cartao', 'caderno')
      and (split_part(chave, ':', 2)::uuid = (select private.minha_pessoa()) or (select private.natham_le_matheus(split_part(chave, ':', 2)::uuid))))
  or (split_part(chave, ':', 1) = 'agenda'
      and split_part(chave, ':', 2) in (select a.fonte from public.agenda_acesso a where a.pessoa_id = (select private.minha_pessoa())))
);

-- O gatilho: cada tabela diz, pelo argumento, qual chave tocar.
create or replace function private.tocar_sino() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare modo text := tg_argv[0]; l jsonb; t jsonb; chaves text[] := '{}';
begin
  foreach l in array array[case when tg_op <> 'INSERT' then to_jsonb(old) end, case when tg_op <> 'DELETE' then to_jsonb(new) end] loop
    continue when l is null;
    if modo in ('esteira', 'ideias', 'pastas') then chaves := chaves || modo;
    elsif modo in ('caderno', 'feitos') then chaves := chaves || (modo || ':' || (l->>'dono_id'));
    elsif modo = 'acesso' then chaves := chaves || ('acesso:' || (l->>'pessoa_id'));
    elsif modo = 'agenda' then chaves := chaves || ('agenda:' || (l->>'fonte'));
    else -- 'tarefa' (a própria) ou 'filha' (tarefa_tags, arquivos, postagens: olha a tarefa a que pertence)
      if modo = 'filha' then
        if l->>'tarefa_id' is null then chaves := chaves || 'pastas'; continue; end if; -- arquivo solto numa pasta
        select to_jsonb(x) into t from public.tarefas x where x.id = (l->>'tarefa_id')::uuid;
        continue when t is null; -- a tarefa já foi apagada: o gatilho dela avisou
      else t := l;
      end if;
      -- card de conteúdo com empresa é de todos; senão, só do dono e de quem enviou (e o Natham lendo o Matheus)
      if t->>'etapa' is not null and t->>'empresa_id' is not null then chaves := chaves || 'esteira'; end if;
      chaves := chaves || ('cartao:' || (t->>'dono_id'));
      if t->>'enviada_por' is not null then chaves := chaves || ('cartao:' || (t->>'enviada_por')); end if;
    end if;
  end loop;
  insert into public.aviso_mudanca (chave, em) select distinct c, now() from unnest(chaves) c
    on conflict (chave) do update set em = excluded.em;
  return null;
end $$;
revoke all on function private.tocar_sino() from public, anon, authenticated;

do $$
declare x record;
begin
  for x in select * from (values
    ('tarefas', 'tarefa'), ('tarefa_tags', 'filha'), ('arquivos', 'filha'), ('postagens', 'filha'),
    ('tags', 'esteira'), ('empresas', 'esteira'), ('fazendo_agora', 'esteira'),
    ('ideias', 'ideias'), ('ideias_categorias', 'ideias'), ('ocasioes', 'pastas'), ('pastas_livres', 'pastas'),
    ('agenda_copias', 'agenda'), ('agenda_acesso', 'acesso'), ('agenda_feitos', 'feitos'),
    ('anotacoes_dia', 'caderno'), ('nao_esquecer', 'caderno')
  ) as v(tabela, modo) loop
    if to_regclass('public.' || x.tabela) is not null then
      execute format('drop trigger if exists tocar_sino on public.%I', x.tabela);
      execute format('create trigger tocar_sino after insert or update or delete on public.%I for each row execute function private.tocar_sino(%L)', x.tabela, x.modo);
    end if;
  end loop;
end $$;

-- Só a tabelinha-sino entra na publicação.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'aviso_mudanca') then
    alter publication supabase_realtime add table public.aviso_mudanca;
  end if;
end $$;

commit;
