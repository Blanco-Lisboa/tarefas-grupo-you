-- 026 · Item 266: o Adrian vira usuário. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- ORDEM DE COLAGEM FINAL: 027, depois 026, depois 028 (o 026 já traz o Matheus em pode_aprovar, então colar depois do 027 não tira nada dele).
-- Idempotente (pode colar de novo). Depende do 002, 006, 011, 015 e 021. NÃO aplicado: o Natham cola no SQL Editor
-- DEPOIS de criar a conta do Adrian no painel (docs/levas/2026-10-21-ADRIAN-PASSO-A-PASSO.md). Código funciona antes e depois da colagem.
--
-- O Adrian ganha, ao lado do Natham (slug fixo nas 3 funções, sem papel novo: é uma linha por função):
--  (a) aprovar, consertar, programar, "Postar agora", "Tentar de novo" e trocar "Quem aprova"  -> private.pode_aprovar, pode_trocar_aprovador
--  (b) LER o caderno do Matheus (tarefas, anotações do dia, "não esquecer")                     -> private.natham_le_matheus (o nome fica; as políticas já a usam)
-- Já valia sem mudar nada: editar/apagar a tarefa que ELE enviou (pode_alterar/pode_apagar olham quem enviou) e mandar tarefa ao Matheus (política tarefas_cria).
-- NÃO herda: caderno e agenda do Natham, Configurações/Drive do Natham, desligar Permanente, tags, pastas, apagar card de conteúdo, "vai pro Google" de tarefa enviada.
-- Analogia: o Adrian ganha uma cópia da chave de aprovar e da chave de LEITURA da gaveta do Matheus; a gaveta do Natham continua com uma chave só.
begin;

-- 1) A pessoa Adrian já existe (sem e-mail e sem login). Põe o e-mail; o gatilho liga_pessoa (002) liga o login quando a conta nascer depois,
--    e o update de baixo liga se a conta já existir (mesmo mecanismo do Matheus).
update public.pessoas set email = 'adrian@youcontabilidade.com' where slug = 'adrian' and email is distinct from 'adrian@youcontabilidade.com';
update public.pessoas p set user_id = u.id
from auth.users u
where p.slug = 'adrian' and lower(u.email) = 'adrian@youcontabilidade.com' and p.user_id is null;

-- 2) Aprovar: Natham, Adrian, Matheus (269: já vem aqui para o 026 colado DEPOIS do 027 não tirar a permissão dele), ou a pessoa cujo nome é o aprovador do card. Sem login (auth.uid nulo) = true: despertador e SQL Editor.
create or replace function private.pode_aprovar(aprovador text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is null or exists (
    select 1 from public.pessoas p
    where p.user_id = (select auth.uid()) and (p.slug in ('natham', 'adrian', 'matheus') or lower(p.nome) = lower(btrim(aprovador)))
  )
$$;

-- 3) Trocar "Quem aprova": Natham, Matheus, Adrian, ou o aprovador atual do card.
create or replace function private.pode_trocar_aprovador(aprovador text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is null or exists (
    select 1 from public.pessoas p
    where p.user_id = (select auth.uid()) and (p.slug in ('natham', 'matheus', 'adrian') or lower(p.nome) = lower(btrim(aprovador)))
  )
$$;

-- 4) Ler o caderno do Matheus: Natham ou Adrian logado + a pessoa dona do caderno é o Matheus. Ninguém mais.
create or replace function private.natham_le_matheus(dono uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.pessoas n, public.pessoas m
    where n.user_id = (select auth.uid()) and n.slug in ('natham', 'adrian') and m.slug = 'matheus' and m.id = dono
  )
$$;

-- 5) Agendas que o Adrian vê: a do Matheus e as duas dele. Nunca a do Natham. (A contato@ é da Beec: fica de fora até o Natham pedir.)
insert into public.agenda_acesso (pessoa_id, fonte)
select p.id, f.fonte from public.pessoas p
cross join (values ('matheus'), ('adrian'), ('adrian_pessoal')) as f (fonte)
where p.slug = 'adrian'
on conflict do nothing;

commit;
