-- 287 · DEVOLVER os 6 cards da Esteira apagados em 22/10 (17:47 UTC = 14:47 de Brasília, e 15:30 UTC). NÃO APLICADO. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- SÓ USE se a restauração do backup (Dashboard > Database > Backups, ver docs/levas/2026-10-22-287-recuperacao.md) não for possível: o backup traz tudo de volta, com os anexos.
-- Este arquivo RECRIA os cards a partir do print da Esteira (docs/referencias/2026-10-22-281-canto-esteira.png: 10 conteúdos). Recria só o card: título, etapa, quem faz, aprovador e tag.
-- NÃO recria: os anexos (os arquivos estão na Lixeira do Google Drive; ver o doc), o texto das notas, o Objetivo e a data/hora exata de postar_em onde o print não mostra.
-- Idempotente: se já existe um card da You com o mesmo título, não cria outro. Roda no SQL Editor (sem login: os gatilhos de aprovação deixam passar).
begin;

do $$
declare
  m uuid := (select id from public.pessoas where slug = 'matheus');
  n uuid := (select id from public.pessoas where slug = 'natham');
  t uuid;
  c record;
begin
  for c in select * from (values
    -- titulo, tipo, etapa, quem (slug), formato, inicio, postar_em, aprovador, com tag "Esperando aprovação", conserto
    ('Roteiro de conteúdos',                                       'roteiro',  'roteiro',  'natham',  null,    '2026-10-22T14:30', null,               null,     false, false),
    ('Evento do tiktok - José Milton pergunta óbvia',              'edicao',   'edicao',   'matheus', null,    null,               null,               null,     false, false),
    ('Adrian Reels - Editar (conferir o resto do título)',         'postagem', 'edicao',   'matheus', 'reels', null,               null,               null,     false, true),
    ('Deodato reel 1 ao 5',                                        'postagem', 'analise',  'matheus', 'reels', null,               null,               'Natham', true,  false),
    ('visita a operação do junio - 1',                             'postagem', 'aprovado', 'matheus', 'reels', null,               null,               'Natham', true,  false),
    ('Teto do Mei - 140k',                                         'postagem', 'postado',  'matheus', 'reels', null,               '2026-10-21T16:30', null,     false, false)
  ) as v(titulo, tipo, etapa, quem, formato, inicio, postar_em, aprovador, com_tag, conserto)
  loop
    continue when exists (select 1 from public.tarefas x where x.empresa_id = 'you' and x.titulo = c.titulo);
    insert into public.tarefas (titulo, tipo, empresa_id, rede, etapa, responsavel_id, dono_id, criado_por, inicio, dia_inteiro, formato, postar_em, aprovador, conserto)
    select c.titulo, c.tipo, 'you', case when c.tipo = 'roteiro' then null else 'instagram' end, c.etapa,
           case c.quem when 'natham' then n else m end, case c.quem when 'natham' then n else m end, case c.quem when 'natham' then n else m end,
           c.inicio, false, c.formato, c.postar_em, c.aprovador, false
    returning id into t;
    if c.conserto then update public.tarefas set conserto = true where id = t; end if;  -- o gatilho do 015 só deixa ligar o Conserto numa atualização
    if c.com_tag then insert into public.tarefa_tags (tarefa_id, tag_id) values (t, 'tag-esperando-aprovacao'); end if;
  end loop;
end $$;

-- Conferência (deve listar os 6, mais os 4 que já existem):
select titulo, etapa, tipo, inicio, postar_em, aprovador from public.tarefas where empresa_id = 'you' and etapa is not null order by etapa, titulo;

commit;
