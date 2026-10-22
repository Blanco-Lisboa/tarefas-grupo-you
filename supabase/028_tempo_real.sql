-- Item 274: tempo real. Esteira, Calendário, Mapa, Caderno, Pastas e Ideias passam a receber o aviso do banco quando alguém muda algo.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. NÃO aplicado: o Natham cola no SQL Editor.
-- Analogia: a publicação supabase_realtime é a lista de mesas com sino. O sino só toca para quem tem direito de ver a mesa (as travas RLS valem);
-- o app só usa o aviso para reler o dado, e a releitura passa pela trava. Caderno e agenda particulares não vazam.
-- Antes de colar, o app funciona igual (só não recebe os avisos). Tabela que ainda não existe (ex.: 019/024 não coladas) é pulada.
do $$
declare t text;
begin
  foreach t in array array[
    'tarefas', 'tarefa_tags', 'tags', 'empresas', 'fazendo_agora', 'arquivos', 'postagens',
    'agenda_eventos', 'agenda_acesso', 'agenda_saida_vinculo', 'agenda_feitos',
    'anotacoes_dia', 'nao_esquecer', 'ideias', 'ideias_categorias', 'ocasioes', 'pastas_livres'
  ] loop
    if to_regclass('public.' || t) is not null
       and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
