-- PROVA do 315 (calendário de postagens, Etapa 1 banco) num Postgres 17 LOCAL com stubs (docker). NUNCA na produção: nenhum dado falso no Supabase real.
-- Montar: sh supabase/prova_local/prova_315.sh (sobe o banco no estado de produção de 26/10, cola o 315 DUAS vezes e roda este arquivo).
-- Tudo roda numa transação que termina em ROLLBACK: pode rodar de novo. Termina com "FALHAS: 0".
begin;
create table public.prova (ordem serial, nome text, ok boolean, detalhe text);
create function public.confere(n text, c boolean, d text default '') returns void language sql security definer as $$ insert into public.prova (nome, ok, detalhe) values (n, coalesce(c, false), d) $$;
create function public.login(s text) returns void language sql as $$
  select set_config('request.jwt.claims', coalesce(json_build_object('sub', (select user_id from public.pessoas where slug = s), 'role', 'authenticated')::text, '{}'), true) $$;
create table public.ids (nome text primary key, id uuid);
create function public.id(n text) returns uuid language sql as $$ select id from public.ids where nome = n $$;

-- logins de mentira para Natham, Matheus e Adrian
insert into auth.users (id, email) select gen_random_uuid(), slug || '@prova.invalid' from public.pessoas where slug in ('natham', 'matheus', 'adrian');
update public.pessoas p set user_id = u.id from auth.users u where u.email = p.slug || '@prova.invalid';

-- ===== A. série semanal, exceções e "este e os próximos" (datas de 2027: longe da janela de geração) =====
do $$
declare s1 uuid; s2 uuid; n int; t text;
begin
  perform public.login('natham'); set local role authenticated;
  s1 := public.salvar_planejada('{"empresa_id":"you","formato":"reels","hora":"17:00","repete":"semana","dias_semana":[1,3],"inicio":"2027-03-01","fim":"2027-03-14"}');
  insert into public.ids values ('s1', s1);
  select string_agg(dia || ' ' || hora, ', ' order by dia) into t from private.ocorrencias('2027-02-01', '2027-03-31');
  perform public.confere('A1 série seg+qua de 01/03 a 14/03/2027 = 4 dias certos', t = '2027-03-01 17:00, 2027-03-03 17:00, 2027-03-08 17:00, 2027-03-10 17:00', t);

  perform public.apagar_planejada(s1, 'dia', '2027-03-03');
  select string_agg(dia::text, ', ' order by dia) into t from private.ocorrencias('2027-02-01', '2027-03-31');
  perform public.confere('A2 exceção "pula" (só 03/03): o dia some, a série fica', t = '2027-03-01, 2027-03-08, 2027-03-10', t);

  perform public.salvar_planejada(jsonb_build_object('id', s1, 'hora', '18:30'), 'dia', '2027-03-08');
  select string_agg(dia || ' ' || hora, ', ' order by dia) into t from private.ocorrencias('2027-02-01', '2027-03-31');
  perform public.confere('A3 exceção "muda" (só 08/03 às 18:30): os outros dias seguem 17:00', t = '2027-03-01 17:00, 2027-03-08 18:30, 2027-03-10 17:00', t);

  s2 := public.salvar_planejada(jsonb_build_object('id', s1, 'empresa_id', 'you', 'formato', 'reels', 'hora', '19:00', 'repete', 'semana',
    'dias_semana', jsonb_build_array(1, 3), 'inicio', '2027-03-01', 'fim', '2027-03-14'), 'proximos', '2027-03-08');
  insert into public.ids values ('s1b', s2);
  select string_agg(dia || ' ' || hora || ' ' || case planejada_id when s1 then 'antiga' when s2 then 'nova' end, ', ' order by dia) into t from private.ocorrencias('2027-02-01', '2027-03-31');
  perform public.confere('A4 "este e os próximos" a partir de 08/03: a antiga para em 07/03 e uma nova começa em 08/03 às 19:00 (a exceção do 08/03 caiu)',
    s2 <> s1 and t = '2027-03-01 17:00 antiga, 2027-03-08 19:00 nova, 2027-03-10 19:00 nova', t);
  perform public.confere('A4 a antiga ficou com fim = 07/03', (select fim from public.postagens_planejadas where id = s1) = '2027-03-07');
  reset role;
end $$;

-- ===== B. Matheus e Adrian LEEM e NÃO escrevem (42501); quem não tem login nem lê =====
do $$
declare quem text; n int;
begin
  foreach quem in array array['matheus', 'adrian'] loop
    perform public.login(quem); set local role authenticated;
    perform public.confere('B ' || quem || ' lê a pauta', (select count(*) from public.postagens_planejadas) = 2);
    perform public.confere('B ' || quem || ' lê o calendário', (select count(*) from public.postagens_calendario('2027-03-01', '2027-03-31')) = 3);
    begin insert into public.postagens_planejadas (empresa_id, formato, hora, responsavel_id, repete, data, inicio)
            values ('you', 'post', '10:00', (select id from public.pessoas where slug = 'matheus'), 'data', '2027-05-01', '2027-05-01');
          perform public.confere('B ' || quem || ' NÃO cria direto na tabela', false);
    exception when insufficient_privilege then perform public.confere('B ' || quem || ' NÃO cria direto na tabela (42501)', true); end;
    update public.postagens_planejadas set hora = '06:00' where id = public.id('s1');
    get diagnostics n = row_count;
    perform public.confere('B ' || quem || ' NÃO muda direto na tabela (0 linhas)', n = 0);
    delete from public.postagens_planejadas_excecoes;
    get diagnostics n = row_count;
    perform public.confere('B ' || quem || ' NÃO apaga exceção direto (0 linhas)', n = 0);
    begin insert into public.postagens_planejadas_geradas (planejada_id, dia) values (public.id('s1'), '2027-04-01');
          perform public.confere('B ' || quem || ' NÃO escreve no livro-razão', false);
    exception when insufficient_privilege then perform public.confere('B ' || quem || ' NÃO escreve no livro-razão (42501)', true); end;
    begin perform public.salvar_planejada('{"empresa_id":"you","formato":"post","hora":"10:00","repete":"data","data":"2027-05-01"}');
          perform public.confere('B ' || quem || ' NÃO cria pela função', false);
    exception when insufficient_privilege then perform public.confere('B ' || quem || ' NÃO cria pela função (42501, "' || sqlerrm || '")', true); end;
    begin perform public.apagar_planejada(public.id('s1'));
          perform public.confere('B ' || quem || ' NÃO apaga pela função', false);
    exception when insufficient_privilege then perform public.confere('B ' || quem || ' NÃO apaga pela função (42501)', true); end;
    begin perform private.gerar_tarefas_postagens();
          perform public.confere('B ' || quem || ' NÃO chama a geração', false);
    exception when insufficient_privilege then perform public.confere('B ' || quem || ' NÃO chama a geração nem o riscar (42501)', true); end;
    reset role;
  end loop;
  perform public.confere('B nada mudou na pauta', (select count(*) from public.postagens_planejadas) = 2 and (select hora from public.postagens_planejadas where id = public.id('s1')) = '17:00');
  perform public.login(null); set local role anon;
  begin perform public.postagens_calendario('2027-03-01', '2027-03-31'); perform public.confere('B sem login NÃO lê o calendário', false);
  exception when insufficient_privilege then perform public.confere('B sem login NÃO lê o calendário (42501)', true); end;
  reset role;
end $$;

-- ===== C. geração no Caderno do Matheus: uma vez só, nunca card, nunca Google =====
do $$
declare s uuid; n int; hoje date := (now() at time zone 'America/Sao_Paulo')::date; mat uuid := (select id from public.pessoas where slug = 'matheus');
  nat uuid := (select id from public.pessoas where slug = 'natham'); t uuid; msg text;
begin
  perform public.login('natham'); set local role authenticated;
  s := public.salvar_planejada(jsonb_build_object('empresa_id', 'beec', 'formato', 'post', 'hora', '10:00', 'repete', 'semana',
    'dias_semana', jsonb_build_array(0, 1, 2, 3, 4, 5, 6), 'inicio', hoje, 'redes', jsonb_build_array('instagram')));
  reset role;
  insert into public.ids values ('s2', s);
  select count(*) into n from public.tarefas where planejada_id = s;
  perform public.confere('C1 salvar já gera hoje..hoje+13 = 14 tarefas', n = 14, n::text);
  perform public.confere('C1 todas no Caderno do Matheus (dono = responsável = Matheus), criadas pelo Natham, sem empresa e sem etapa',
    not exists (select 1 from public.tarefas where planejada_id = s and (dono_id <> mat or responsavel_id <> mat or criado_por <> nat or empresa_id is not null or etapa is not null or enviada_por is not null)));
  perform public.confere('C1 na linha do horário certo e com título/redes', exists (select 1 from public.tarefas where planejada_id = s
    and inicio = to_char(hoje + 3, 'YYYY-MM-DD') || 'T10:00' and titulo = 'Postar Post — Beec' and notas = 'Redes: Instagram' and tipo = 'outro' and not dia_inteiro));
  perform public.confere('C1 vai_pro_google sai FALSO e nada entra na fila do Google', not exists (select 1 from public.tarefas where planejada_id = s and vai_pro_google)
    and not exists (select 1 from public.agenda_saida a join public.tarefas x on x.id = a.tarefa_id where x.planejada_id = s));
  n := private.gerar_tarefas_postagens();
  perform public.confere('C2 gerar de novo não cria nada (0) e não duplica', n = 0 and (select count(*) from public.tarefas where planejada_id = s) = 14, n::text);
  perform public.confere('C2 livro-razão: 14 linhas, uma por dia', (select count(*) from public.postagens_planejadas_geradas where planejada_id = s) = 14);

  -- o Matheus apaga uma à mão (hoje+2): não renasce
  select id into t from public.tarefas where planejada_id = s and inicio like to_char(hoje + 2, 'YYYY-MM-DD') || '%';
  perform public.login('matheus'); set local role authenticated;
  perform public.confere('C3 o Matheus vê as 14 no Caderno dele', (select count(*) from public.tarefas where planejada_id = s) = 14);
  delete from public.tarefas where id = t;
  get diagnostics n = row_count;
  perform public.confere('C3 o Matheus apaga uma à mão', n = 1);
  reset role;
  n := private.gerar_tarefas_postagens();
  perform public.confere('C3 gerar de novo NÃO recria a apagada (0 novas, 13 tarefas, livro-razão com tarefa nula)', n = 0
    and (select count(*) from public.tarefas where planejada_id = s) = 13
    and (select tarefa_id from public.postagens_planejadas_geradas where planejada_id = s and dia = hoje + 2) is null, n::text);

  perform public.login('natham'); set local role authenticated;
  perform public.confere('C4 o Natham lê o Caderno do Matheus como antes (13)', (select count(*) from public.tarefas where planejada_id = s) = 13);
  reset role;

  -- a tarefa da pauta não vira card: nem pelo Matheus, nem pelo salvar_tarefa, nem pelo editor de SQL
  select id into t from public.tarefas where planejada_id = s order by inicio limit 1;
  perform public.login('matheus'); set local role authenticated;
  begin update public.tarefas set etapa = 'roteiro', empresa_id = 'beec' where id = t; perform public.confere('C5 tarefa da pauta NÃO ganha etapa (Matheus)', false);
  exception when check_violation then get stacked diagnostics msg = constraint_name; perform public.confere('C5 tarefa da pauta NÃO ganha etapa (Matheus: CHECK ' || msg || ')', true); end;
  begin perform public.salvar_tarefa((select to_jsonb(x) || '{"etapa":"roteiro","empresa_id":"beec"}' from public.tarefas x where x.id = t));
        perform public.confere('C5 nem pelo salvar_tarefa (o caminho do app)', false);
  exception when check_violation then perform public.confere('C5 nem pelo salvar_tarefa (o caminho do app)', true); end;
  -- mas o Matheus mexe nela como em qualquer tarefa do Caderno (arrastar de horário, editar)
  update public.tarefas set inicio = to_char(hoje, 'YYYY-MM-DD') || 'T14:00' where id = t;
  get diagnostics n = row_count;
  perform public.confere('C5 o Matheus continua podendo arrastar o horário', n = 1);
  reset role;
  begin update public.tarefas set etapa = 'roteiro' where id = t; perform public.confere('C5 nem o editor de SQL', false);
  exception when check_violation then perform public.confere('C5 nem o editor de SQL dá etapa a ela', true); end;
end $$;

-- ===== D. o Natham muda a série ("todos"): refaz só as futuras vivas e não feitas =====
do $$
declare s uuid := public.id('s2'); hoje date := (now() at time zone 'America/Sao_Paulo')::date; n int; mat uuid := (select id from public.pessoas where slug = 'matheus');
  nat uuid := (select id from public.pessoas where slug = 'natham');
begin
  update public.tarefas set concluida = true where planejada_id = s and inicio like to_char(hoje + 1, 'YYYY-MM-DD') || '%';  -- o Matheus riscou a de amanhã
  perform public.login('natham'); set local role authenticated;
  perform public.salvar_planejada(jsonb_build_object('id', s, 'empresa_id', 'beec', 'formato', 'post', 'hora', '11:00', 'repete', 'semana',
    'dias_semana', jsonb_build_array(0, 1, 2, 3, 4, 5, 6), 'inicio', hoje, 'responsavel', 'natham', 'redes', jsonb_build_array('instagram')));
  reset role;
  perform public.confere('D1 a feita (amanhã) ficou como estava: 10:00, Matheus, riscada', exists (select 1 from public.tarefas where planejada_id = s and concluida
    and inicio = to_char(hoje + 1, 'YYYY-MM-DD') || 'T10:00' and dono_id = mat));
  perform public.confere('D1 a apagada à mão (hoje+2) continua apagada', (select tarefa_id from public.postagens_planejadas_geradas where planejada_id = s and dia = hoje + 2) is null);
  select count(*) into n from public.tarefas where planejada_id = s and not concluida and inicio like '%T11:00' and dono_id = nat and responsavel_id = nat;
  perform public.confere('D1 as outras 12 foram refeitas às 11:00 no Caderno do novo responsável (Natham)', n = 12, n::text);
  perform public.confere('D1 e nada duplicou (13 tarefas, 14 linhas no livro-razão)', (select count(*) from public.tarefas where planejada_id = s) = 13
    and (select count(*) from public.postagens_planejadas_geradas where planejada_id = s) = 14);

  perform public.login('natham'); set local role authenticated;
  perform public.apagar_planejada(s, 'dia', hoje + 4);
  perform public.confere('D2 "só este dia" (pula hoje+4) tira a tarefa daquele dia e ela não volta', not exists (select 1 from public.tarefas where planejada_id = s and inicio like to_char(hoje + 4, 'YYYY-MM-DD') || '%'));
  perform public.apagar_planejada(s, 'proximos', hoje + 10);
  perform public.confere('D3 "este e os próximos" (de hoje+10): as tarefas de hoje+10 em diante somem; antes ficam', (select count(*) from public.tarefas where planejada_id = s and inicio >= to_char(hoje + 10, 'YYYY-MM-DD')) = 0
    and (select count(*) from public.tarefas where planejada_id = s) = 8);
  reset role;
  perform public.confere('D3 gerar de novo não traz de volta nada', private.gerar_tarefas_postagens() = 0);
end $$;

-- ===== E. o post sai: casa e risca (gatilho na hora), dois iguais no mesmo dia casam com dois posts, riscar é só de ida =====
do $$
declare hoje date := (now() at time zone 'America/Sao_Paulo')::date; s3 uuid; s4 uuid; s5 uuid; c1 uuid; c2 uuid; c3 uuid; e text; tr uuid;
  nat uuid := (select id from public.pessoas where slug = 'natham');
begin
  perform public.login('natham'); set local role authenticated;
  s3 := public.salvar_planejada(jsonb_build_object('empresa_id', 'you', 'formato', 'reels', 'hora', '09:00', 'repete', 'data', 'data', hoje));
  s4 := public.salvar_planejada(jsonb_build_object('empresa_id', 'you', 'formato', 'carrossel', 'hora', '15:00', 'repete', 'data', 'data', hoje));
  s5 := public.salvar_planejada(jsonb_build_object('empresa_id', 'you', 'formato', 'carrossel', 'hora', '10:00', 'repete', 'data', 'data', hoje));
  reset role;
  insert into public.tarefas (titulo, tipo, empresa_id, etapa, formato, responsavel_id, dono_id, criado_por) values
    ('reels real', 'postagem', 'you', 'edicao', 'reels', nat, nat, nat), ('carrossel real 1', 'postagem', 'you', 'edicao', 'carrossel', nat, nat, nat),
    ('carrossel real 2', 'postagem', 'you', 'edicao', 'carrossel', nat, nat, nat);
  select id into c1 from public.tarefas where titulo = 'reels real'; select id into c2 from public.tarefas where titulo = 'carrossel real 1'; select id into c3 from public.tarefas where titulo = 'carrossel real 2';
  select estado into e from public.postagens_calendario(hoje, hoje) where planejada_id = s3;
  perform public.confere('E0 antes do post: planejada', e = 'planejada', e);

  perform public.login('natham'); set local role authenticated;
  update public.tarefas set etapa = 'postado' where id = c1;  -- o Natham arrasta o card até Postado
  reset role;
  perform public.confere('E1 o post saiu: a planejada fica FEITA com o card certo', exists (select 1 from public.postagens_calendario(hoje, hoje) where planejada_id = s3 and estado = 'feita' and card_id = c1));
  select tarefa_id into tr from public.postagens_planejadas_geradas where planejada_id = s3;
  perform public.confere('E1 e a tarefa do Caderno do Matheus foi riscada NA HORA (gatilho)', (select concluida from public.tarefas where id = tr));

  perform public.login('natham'); set local role authenticated;
  update public.tarefas set etapa = 'postado' where id = c2;
  reset role;
  select string_agg(hora || ' ' || estado, ', ' order by hora) into e from public.postagens_calendario(hoje, hoje) where planejada_id in (s4, s5);
  perform public.confere('E2 dois carrosséis no dia e UM post: casa o primeiro pela hora (10:00 feita, 15:00 planejada)', e = '10:00 feita, 15:00 planejada', e);
  perform public.login('natham'); set local role authenticated;
  update public.tarefas set etapa = 'postado' where id = c3;
  reset role;
  select string_agg(hora || ' ' || estado, ', ' order by hora) into e from public.postagens_calendario(hoje, hoje) where planejada_id in (s4, s5);
  perform public.confere('E2 com o SEGUNDO post os dois ficam feitos (10:00 e 15:00)', e = '10:00 feita, 15:00 feita', e);
  perform public.confere('E2 as duas tarefas do Caderno riscadas', (select bool_and(t.concluida) from public.postagens_planejadas_geradas g join public.tarefas t on t.id = g.tarefa_id where g.planejada_id in (s4, s5)));
  perform public.confere('E2 nenhum post virou "extra"', not exists (select 1 from public.postagens_calendario(hoje, hoje) where estado = 'extra' and card_id in (c1, c2, c3)));

  perform public.login('natham'); set local role authenticated;
  update public.tarefas set etapa = 'edicao' where id = c1;  -- o card volta
  reset role;
  perform public.confere('E3 riscar é só de ida: o card voltou e a tarefa continua riscada', (select concluida from public.tarefas where id = tr));
  perform public.confere('E3 (o calendário volta a mostrar "planejada" para aquele reels)', (select estado from public.postagens_calendario(hoje, hoje) where planejada_id = s3) = 'planejada');

  -- o relógio de 5 em 5 minutos: post que saiu sem passar pelo gatilho (ex.: card criado já Postado) é riscado na conferência
  perform public.login('natham'); set local role authenticated;
  s3 := public.salvar_planejada(jsonb_build_object('empresa_id', 'tu-ecom', 'formato', 'story', 'hora', '20:00', 'repete', 'data', 'data', hoje));
  reset role;
  set local session_replication_role = replica;  -- (só na prova: grava o card Postado sem os gatilhos)
  insert into public.tarefas (titulo, tipo, empresa_id, etapa, formato, responsavel_id, dono_id, criado_por, postado_em) values ('story real', 'postagem', 'tu-ecom', 'postado', 'story', nat, nat, nat, now());
  set local session_replication_role = origin;
  select tarefa_id into tr from public.postagens_planejadas_geradas where planejada_id = s3;
  perform public.confere('E4 antes do relógio: ainda não riscada', not (select concluida from public.tarefas where id = tr));
  perform private.riscar_postagens();
  perform public.confere('E4 o relógio (riscar_postagens) risca', (select concluida from public.tarefas where id = tr));
end $$;

-- ===== F. dia passado: faltou; post sem pauta: extra; dia do post em horário de São Paulo =====
do $$
declare hoje date := (now() at time zone 'America/Sao_Paulo')::date; s6 uuid; s7 uuid; e text; c4 uuid; c5 uuid; c6 uuid; nat uuid := (select id from public.pessoas where slug = 'natham');
begin
  perform public.login('natham'); set local role authenticated;
  s6 := public.salvar_planejada(jsonb_build_object('empresa_id', 'tu-ecom', 'formato', 'story', 'hora', '12:00', 'repete', 'data', 'data', hoje - 1));
  s7 := public.salvar_planejada(jsonb_build_object('empresa_id', 'you', 'formato', 'post', 'hora', '08:00', 'repete', 'data', 'data', hoje - 2));
  reset role;
  perform public.confere('F0 pauta no passado não gera tarefa no Caderno', not exists (select 1 from public.tarefas where planejada_id in (s6, s7)));
  set local session_replication_role = replica;
  insert into public.tarefas (titulo, tipo, empresa_id, etapa, formato, responsavel_id, dono_id, criado_por, postado_em) values
    ('post de anteontem 23:30', 'postagem', 'you', 'postado', 'post', nat, nat, nat, ((hoje - 2) + time '23:30') at time zone 'America/Sao_Paulo'),
    ('reels solto de ontem', 'postagem', 'beec', 'postado', 'reels', nat, nat, nat, ((hoje - 1) + time '16:00') at time zone 'America/Sao_Paulo'),
    ('postado sem formato', 'outro', 'beec', 'postado', null, nat, nat, nat, ((hoje - 1) + time '18:00') at time zone 'America/Sao_Paulo');
  set local session_replication_role = origin;
  select id into c4 from public.tarefas where titulo = 'post de anteontem 23:30'; select id into c5 from public.tarefas where titulo = 'reels solto de ontem'; select id into c6 from public.tarefas where titulo = 'postado sem formato';
  select estado into e from public.postagens_calendario(hoje - 1, hoje - 1) where planejada_id = s6;
  perform public.confere('F1 dia passado sem post = FALTOU', e = 'faltou', e);
  perform public.confere('F2 post às 23:30 de São Paulo (já é o dia seguinte em GMT) casa com a pauta do dia certo', exists (select 1 from public.postagens_calendario(hoje - 2, hoje - 2) where planejada_id = s7 and estado = 'feita' and card_id = c4));
  perform public.login('matheus'); set local role authenticated;
  perform public.confere('F3 post sem pauta aparece como EXTRA (com hora e card), e o Matheus vê', exists (select 1 from public.postagens_calendario(hoje - 1, hoje - 1) where estado = 'extra' and card_id = c5 and hora = '16:00' and empresa_id = 'beec' and formato = 'reels'));
  perform public.confere('F3 postado sem formato também é extra (não some)', exists (select 1 from public.postagens_calendario(hoje - 1, hoje - 1) where estado = 'extra' and card_id = c6));
  reset role;
end $$;

-- ===== G. tempo real, relógios e apagar a série inteira =====
do $$
declare hoje date := (now() at time zone 'America/Sao_Paulo')::date; s uuid; tr uuid;
begin
  delete from public.aviso_mudanca where chave = 'pauta';
  perform public.login('natham'); set local role authenticated;
  s := public.salvar_planejada(jsonb_build_object('empresa_id', 'beec', 'formato', 'reels', 'hora', '13:00', 'repete', 'data', 'data', hoje + 1));
  reset role;
  perform public.login('adrian'); set local role authenticated;
  perform public.confere('G1 mudar a pauta toca o sino "pauta", e qualquer logado (Adrian) ouve', exists (select 1 from public.aviso_mudanca where chave = 'pauta'));
  reset role;
  perform public.confere('G2 relógios: postagens_gerar 0 6 * * * e postagens_riscar */5', (select string_agg(jobname || ' ' || schedule, ', ' order by jobname) from cron.job where jobname like 'postagens_%') = 'postagens_gerar 0 6 * * *, postagens_riscar */5 * * * *');
  select tarefa_id into tr from public.postagens_planejadas_geradas where planejada_id = s;
  perform public.login('natham'); set local role authenticated;
  perform public.apagar_planejada(s);
  reset role;
  perform public.confere('G3 apagar "todos": a série e a tarefa futura não feita somem', not exists (select 1 from public.postagens_planejadas where id = s) and not exists (select 1 from public.tarefas where id = tr));
end $$;

\echo '== RESULTADO'
select ordem, case when ok then 'ok   ' else 'FALHA' end as r, nome, detalhe from public.prova order by ordem;
select 'FALHAS: ' || count(*) filter (where not ok) || ' de ' || count(*) as total from public.prova;
rollback;
