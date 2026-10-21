-- Item 246 (2ª volta): apagar a pasta livre "Ideias de conteúdo" duplicada da Beec (criada em 21/10/2026 20:29 UTC).
-- Banco: Supabase do Tarefas (uruhjlurcxpjhhgvuzwt). Conferido antes: 1 linha, 0 arquivos, sem id de Drive na linha, com cadeado (permanente = true).
-- A 1ª colagem falhou (42501 "pasta com cadeado nao se apaga", gatilho private.pasta_livre_cadeado, que só olha old.permanente no DELETE).
-- Agora: tira o cadeado SÓ desta pasta e apaga, na mesma transação (se algo falhar, nada fica pela metade).
-- Item 254 NÃO entra aqui: as ideias da You moram no navegador (localStorage), a tabela public.ideias está vazia. Ver docs/levas.
begin;

update public.pastas_livres
set permanente = false
where id = '4402d8ca-470f-4cba-af86-c743fdd3903a'
  and empresa_id = 'beec'
  and nome = 'Ideias de conteúdo';

delete from public.pastas_livres
where id = '4402d8ca-470f-4cba-af86-c743fdd3903a'
  and empresa_id = 'beec'
  and nome = 'Ideias de conteúdo'
  and not exists (select 1 from public.arquivos where pasta_livre_id = '4402d8ca-470f-4cba-af86-c743fdd3903a')
returning id;

commit;

-- Conferência: deve voltar 0 linhas (a de ideias do sistema fica em public.pastas, slug 'ideias').
select id, nome from public.pastas_livres where empresa_id = 'beec';
