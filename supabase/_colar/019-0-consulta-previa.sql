-- 019-0 · CONSULTA PRÉVIA (só leitura: não muda nada). Rode ANTES de colar o 019. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- O que olhar no resultado:
--   1) Linhas "VIDEO NO SUPABASE": TEM DE SER ZERO. Se aparecer alguma, NÃO cole o 019 (o 019 só aceita vídeo no Drive); avise o terminal com o print.
--   2) Linhas "CARD APROVADO COM HORA": só anote quantos são e o tipo. Só os de tipo postagem com hora FUTURA ganham alarme no 019 (o recruta compara depois). Nada a fazer.
--   3) Linha "CARD POSTADO": só a quantidade.
select 'VIDEO NO SUPABASE (tem de ser zero)' as o_que, a.id::text as id, coalesce(t.titulo, 'sem card') as titulo, a.nome as detalhe
from public.arquivos a left join public.tarefas t on t.id = a.tarefa_id
where a.tipo = 'video' and a.caminho is not null
union all
select 'CARD APROVADO COM HORA (so anotar)', t.id::text, t.titulo, t.tipo || ' em ' || t.postar_em
from public.tarefas t where t.etapa = 'aprovado' and t.postar_em is not null
union all
select 'CARD POSTADO (so a quantidade)', count(*)::text, 'quantidade', ''
from public.tarefas t where t.etapa = 'postado'
order by 1, 3;
