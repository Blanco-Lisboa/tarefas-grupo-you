-- PROVA da privacidade da agenda (Lupa R4-1) e do selo "fazendo agora" de tarefa recebida (R4-4). Vale com 001 a 010 aplicados.
-- Não grava nada: termina com erro de propósito e o banco desfaz tudo. O resultado vem na mensagem "RESULTADO: {...}".
-- Chaves terminadas em _esperado_X trazem o valor certo no nome; as que dizem "barrado" têm de começar com "barrado".
-- Rodada contra o 008 (antes do 010) vários casos de vazamento FALHAM: é o que a Lupa apontou. Com o 010 todos batem.
do $$
declare
  n uuid; m uuid; pn uuid; pm uuid; r jsonb := '{}'; v int; t text; ta uuid; tm uuid; l text; f text[];
begin
  select id into n from auth.users where email = 'natham.monteiro@youcontabilidade.com';
  if n is null then
    insert into auth.users (id, instance_id, aud, role, email) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natham.monteiro@youcontabilidade.com') returning id into n;
  end if;
  select id into m from auth.users where email = 'matheus.germano@assessoriabeec.com.br';
  if m is null then
    insert into auth.users (id, instance_id, aud, role, email) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matheus.germano@assessoriabeec.com.br') returning id into m;
  end if;
  select id into pn from public.pessoas where slug = 'natham';
  select id into pm from public.pessoas where slug = 'matheus';

  -- ===== R4-1: a mesma reunião (mesmo iCalUID) em duas agendas com permissões diferentes: contato (Natham e Matheus) e natham (só Natham) =====
  set local role service_role;
  -- ordem 1: natham (com detalhes) chega primeiro, contato (particular) depois
  perform public.agenda_receber('natham', '[{"id":"n1","ical_uid":"A","titulo":"Consulta medica","local":"Clinica X","inicio":"2026-10-22T09:00:00-03:00","fim":"2026-10-22T10:00:00-03:00"}]');
  perform public.agenda_receber('contato', '[{"id":"c1","ical_uid":"A","particular":true,"local":"Clinica X","inicio":"2026-10-22T09:00:00-03:00","fim":"2026-10-22T10:00:00-03:00"}]');
  -- ordem 2: contato (particular) chega primeiro, natham (com detalhes) depois
  perform public.agenda_receber('contato', '[{"id":"c2","ical_uid":"B","particular":true,"inicio":"2026-10-23T09:00:00-03:00","fim":"2026-10-23T10:00:00-03:00"}]');
  perform public.agenda_receber('natham', '[{"id":"n2","ical_uid":"B","titulo":"Terapia","local":"Consultorio Y","inicio":"2026-10-23T09:00:00-03:00","fim":"2026-10-23T10:00:00-03:00"}]');
  -- comum -> particular na MESMA agenda (contato): título e local antigos não podem ficar
  perform public.agenda_receber('contato', '[{"id":"c3","ical_uid":"C","titulo":"Reuniao comercial","local":"Sala 1","inicio":"2026-10-24T09:00:00-03:00","fim":"2026-10-24T10:00:00-03:00"}]');
  perform public.agenda_receber('contato', '[{"id":"c3","ical_uid":"C","particular":true,"inicio":"2026-10-24T09:00:00-03:00","fim":"2026-10-24T10:00:00-03:00"}]');
  -- primeira carga já particular, com local no JSON
  perform public.agenda_receber('contato', '[{"id":"c4","ical_uid":"D","particular":true,"titulo":"Segredo","local":"Local secreto","inicio":"2026-10-25T09:00:00-03:00"}]');
  -- evento só da agenda do Natham
  perform public.agenda_receber('natham', '[{"id":"n5","ical_uid":"E","titulo":"Dentista","inicio":"2026-10-26T09:00:00-03:00"}]');
  -- e o mesmo evento comum nas duas agendas (deve juntar em 1, com 2 fontes, para o Natham)
  perform public.agenda_receber('natham', '[{"id":"n6","ical_uid":"F","titulo":"Reuniao - Caderno","inicio":"2026-10-27T14:00:00-03:00","fim":"2026-10-27T15:00:00-03:00"}]');
  perform public.agenda_receber('contato', '[{"id":"c6","ical_uid":"F","titulo":"Reuniao - Caderno","inicio":"2026-10-27T14:00:00-03:00","fim":"2026-10-27T15:00:00-03:00"}]');
  reset role;

  select count(*) into v from public.agenda_copias where particular and (titulo <> 'Ocupado' or local is not null);
  r := r || jsonb_build_object('particular_com_detalhe_guardado_esperado_0', v);
  begin
    insert into public.agenda_copias (fonte, google_id, chave, titulo, particular, inicio, local) values ('contato', 'x', 'x', 'Segredo', true, now(), null);
    r := r || jsonb_build_object('banco_aceita_particular_com_titulo', 'PASSOU (ERRO)');
  exception when check_violation then r := r || jsonb_build_object('banco_aceita_particular_com_titulo', 'barrado: check'); end;

  -- Matheus
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  select titulo || ' / local=' || coalesce(local, 'nulo') || ' / fontes=' || fontes::text || ' / particular=' || particular into t from public.agenda_eventos where titulo in ('Ocupado', 'Consulta medica') and inicio = '2026-10-22T09:00:00-03:00';
  r := r || jsonb_build_object('matheus_ordem1_esperado_Ocupado_nulo_contato', t);
  select titulo || ' / local=' || coalesce(local, 'nulo') || ' / fontes=' || fontes::text into t from public.agenda_eventos where inicio = '2026-10-23T09:00:00-03:00';
  r := r || jsonb_build_object('matheus_ordem2_esperado_Ocupado_nulo_contato', t);
  select titulo || ' / local=' || coalesce(local, 'nulo') into t from public.agenda_eventos where inicio = '2026-10-24T09:00:00-03:00';
  r := r || jsonb_build_object('matheus_comum_virou_particular_esperado_Ocupado_nulo', t);
  select titulo || ' / local=' || coalesce(local, 'nulo') into t from public.agenda_eventos where inicio = '2026-10-25T09:00:00-03:00';
  r := r || jsonb_build_object('matheus_primeira_carga_particular_esperado_Ocupado_nulo', t);
  select count(*) into v from public.agenda_eventos where titulo in ('Consulta medica', 'Terapia', 'Reuniao comercial', 'Segredo', 'Dentista') or local is not null;
  r := r || jsonb_build_object('matheus_ve_algum_detalhe_proibido_esperado_0', v);
  select fontes::text into t from public.agenda_eventos where titulo = 'Reuniao - Caderno';
  r := r || jsonb_build_object('matheus_fontes_da_reuniao_comum_esperado_contato', t);
  select count(*) into v from public.agenda_eventos where 'natham' = any (fontes);
  r := r || jsonb_build_object('matheus_ve_fonte_natham_em_alguma_linha_esperado_0', v);
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('matheus_total_esperado_5', v);  -- A, B, C, D, F (E é só do Natham)
  select count(*) into v from public.agenda_copias where fonte = 'natham'; r := r || jsonb_build_object('matheus_le_copias_natham_esperado_0', v);
  begin perform chave from public.agenda_copias limit 1; r := r || jsonb_build_object('matheus_le_chave', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_le_chave', 'barrado: ' || sqlerrm); end;
  begin insert into public.agenda_copias (fonte, google_id, chave, titulo, inicio) values ('contato', 'z', 'z', 'forjado', now());
    r := r || jsonb_build_object('matheus_escreve', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_escreve', 'barrado: ' || sqlerrm); end;

  -- Natham: vê o detalhe de quem tem; junta as fontes dele
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  select titulo || ' / ' || local || ' / ' || fontes::text into t from public.agenda_eventos where inicio = '2026-10-22T09:00:00-03:00';
  r := r || jsonb_build_object('natham_ordem1_esperado_Consulta_Clinica_contato_natham', t);
  select titulo || ' / ' || local || ' / ' || fontes::text into t from public.agenda_eventos where inicio = '2026-10-23T09:00:00-03:00';
  r := r || jsonb_build_object('natham_ordem2_esperado_Terapia_Consultorio_contato_natham', t);
  select count(*) into v from public.agenda_eventos where titulo = 'Reuniao - Caderno'; r := r || jsonb_build_object('natham_reuniao_comum_em_1_linha_esperado_1', v);
  select fontes::text into t from public.agenda_eventos where titulo = 'Reuniao - Caderno'; r := r || jsonb_build_object('natham_reuniao_fontes_esperado_contato_natham', t);
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('natham_total_esperado_6', v);  -- A, B, C, D, E, F
  reset role;

  -- retirar a fonte natham (Natham apaga a consulta): ninguém recalcula nada, a ficha da contato continua particular
  set local role service_role;
  perform public.agenda_receber('natham', '[{"id":"n1","status":"cancelled"},{"id":"n2","status":"cancelled"}]');
  reset role;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  select count(*) into v from public.agenda_eventos where titulo = 'Ocupado' and local is null and fontes = '{contato}'; r := r || jsonb_build_object('matheus_apos_tirar_natham_Ocupados_esperado_4', v);  -- A, B, C, D
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  select count(*) into v from public.agenda_eventos where titulo in ('Consulta medica', 'Terapia'); r := r || jsonb_build_object('natham_apos_tirar_natham_detalhes_esperado_0', v);
  select titulo || ' / ' || coalesce(local, 'nulo') into t from public.agenda_eventos where inicio = '2026-10-22T09:00:00-03:00'; r := r || jsonb_build_object('natham_apos_tirar_natham_A_esperado_Ocupado_nulo', t);
  reset role;

  -- varredura e cancelamento não mexem em ficha de outra agenda
  set local role service_role;
  perform public.agenda_receber('contato', '[{"id":"c6","status":"cancelled"}]');
  reset role;
  select count(*) into v from public.agenda_copias where google_id = 'n6'; r := r || jsonb_build_object('cancelar_na_contato_ficha_da_natham_fica_esperado_1', v);

  -- ===== R4-4: selo "fazendo agora" de tarefa RECEBIDA =====
  insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por, enviada_por) values ('Recebida pelo Matheus', 'outro', pm, pm, pn, pn) returning id into tm;
  insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por) values ('Do Matheus', 'outro', pm, pm, pm) returning id into ta;
  insert into public.fazendo_agora (pessoa_id, tarefa_id) values (pm, tm);  -- selo antigo, anterior à regra (como dono do banco)
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  delete from public.fazendo_agora where pessoa_id = pm and tarefa_id = tm; get diagnostics v = row_count;
  r := r || jsonb_build_object('destinatario_apaga_selo_da_recebida_linhas_esperado_0', v);
  reset role;
  select count(*) into v from public.fazendo_agora where pessoa_id = pm and tarefa_id = tm; r := r || jsonb_build_object('selo_antigo_continua_esperado_1', v);
  delete from public.fazendo_agora where pessoa_id = pm;
  -- o próprio Matheus continua marcando e parando em tarefa DELE; Natham (remetente) marca e para na que mandou
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  insert into public.fazendo_agora (pessoa_id, tarefa_id) values (pm, ta);
  delete from public.fazendo_agora where pessoa_id = pm; get diagnostics v = row_count;
  r := r || jsonb_build_object('dono_para_o_proprio_selo_linhas_esperado_1', v);
  begin insert into public.fazendo_agora (pessoa_id, tarefa_id) values (pm, tm); r := r || jsonb_build_object('destinatario_marca_recebida', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('destinatario_marca_recebida', 'barrado: ' || sqlerrm); end;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  insert into public.fazendo_agora (pessoa_id, tarefa_id) values (pn, tm);
  delete from public.fazendo_agora where pessoa_id = pn; get diagnostics v = row_count;
  r := r || jsonb_build_object('remetente_marca_e_para_na_que_mandou_linhas_esperado_1', v);
  reset role;

  raise exception 'RESULTADO: %', jsonb_pretty(r);
end $$;
