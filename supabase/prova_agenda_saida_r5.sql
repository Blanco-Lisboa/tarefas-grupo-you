-- PROVA dos achados R5-1, R5-2, R5-3 e R5-5 da Lupa (volta da agenda, 010). Vale com 001 a 010 aplicados.
-- Não grava nada: termina com erro de propósito e o banco desfaz tudo. O resultado vem na mensagem "RESULTADO: {...}".
-- Chaves terminadas em _esperado_X trazem o valor certo no nome.
do $$
declare
  n uuid; m uuid; pn uuid; pm uuid; r jsonb := '{}'; v int; x jsonb; id1 text; t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid; t6 uuid; fila bigint;
begin
  select id into n from auth.users where email = 'natham.monteiro@youcontabilidade.com';
  if n is null then insert into auth.users (id, instance_id, aud, role, email) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natham.monteiro@youcontabilidade.com') returning id into n; end if;
  select id into m from auth.users where email = 'matheus.germano@assessoriabeec.com.br';
  if m is null then insert into auth.users (id, instance_id, aud, role, email) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matheus.germano@assessoriabeec.com.br') returning id into m; end if;
  select id into pn from public.pessoas where slug = 'natham';
  select id into pm from public.pessoas where slug = 'matheus';
  insert into public.agenda_pessoa (pessoa_id, calendar_id) values (pm, 'matheus@example.com') on conflict (pessoa_id) do update set calendar_id = excluded.calendar_id;

  -- ===== R5-2: criar é idempotente (id fixo por tarefa; confirmação perdida não duplica) =====
  insert into public.tarefas (vai_pro_google, titulo, tipo, responsavel_id, inicio, fim, dono_id, criado_por)
    values (true, 'Gravar reels', 'gravacao', pn, '2026-10-22T14:00', '2026-10-22T15:00', pn, pn) returning id into t1;
  set local role service_role;
  x := public.agenda_saida_pendentes();
  id1 := x->0->>'google_event_id';
  r := r || jsonb_build_object('criar_traz_id_fixo', jsonb_build_object('acao', x->0->>'acao', 'id', id1,
         'igual_ao_tarefa_id_sem_tracos', id1 = replace(t1::text, '-', ''), 'valido_base32hex_5_a_1024_tem_32', id1 ~ '^[0-9a-v]{5,255}$'));
  -- o n8n criou no Google mas a confirmação se perdeu: passam-se 6 minutos e o banco devolve o MESMO pedido, com o MESMO id
  reset role;
  update public.agenda_saida set pegou_em = now() - interval '6 minutes' where tarefa_id = t1;
  set local role service_role;
  x := public.agenda_saida_pendentes();
  r := r || jsonb_build_object('repeticao_devolve_criar_com_o_mesmo_id_esperado_true', (x->0->>'acao') = 'criar' and (x->0->>'google_event_id') = id1);
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint);  -- sem p_google_event_id: o banco usa o id que guardou
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint);  -- confirmar de novo é inofensivo
  reset role;
  select count(*) into v from public.agenda_saida_vinculo where tarefa_id = t1 and google_event_id = id1;
  r := r || jsonb_build_object('vinculo_com_o_id_fixo_esperado_1', v);
  update public.tarefas set titulo = 'Gravar reels v2' where id = t1;
  set local role service_role;
  x := public.agenda_saida_pendentes();
  r := r || jsonb_build_object('depois_da_confirmacao_vira_editar_com_o_mesmo_id', jsonb_build_object('acao', x->0->>'acao', 'mesmo_id', (x->0->>'google_event_id') = id1));
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint);
  reset role;

  -- ===== R5-5: o app enxerga "já confirmada" =====
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  select count(*) into v from public.tarefas_no_google() i where i = t1; r := r || jsonb_build_object('natham_ve_confirmada_esperado_1', v);
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  select count(*) into v from public.tarefas_no_google(); r := r || jsonb_build_object('matheus_nao_ve_a_do_natham_esperado_0', v);
  begin perform * from public.agenda_saida_vinculo; r := r || jsonb_build_object('logado_le_o_vinculo', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('logado_le_o_vinculo', 'barrado: ' || sqlerrm); end;
  reset role;

  -- ===== R5-1: apagar depois que a limpeza de 14 dias levou TODO o histórico da fila =====
  delete from public.agenda_saida;  -- é o que a limpeza faz com linha concluída antiga
  delete from public.tarefas where id = t1;
  select count(*) into v from public.agenda_saida where tarefa_id = t1 and acao = 'apagar' and estado = 'pendente'; r := r || jsonb_build_object('apagar_na_fila_apos_limpeza_esperado_1', v);
  set local role service_role;
  x := public.agenda_saida_pendentes();
  r := r || jsonb_build_object('apagar_sai_com_o_evento_certo', jsonb_build_object('acao', x->0->>'acao', 'ev_igual', (x->0->>'google_event_id') = id1, 'cal', x->0->>'calendar_id'));
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint);
  reset role;
  select count(*) into v from public.agenda_saida_vinculo where tarefa_id = t1; r := r || jsonb_build_object('vinculo_some_esperado_0', v);
  -- mesma coisa tirando a data (em vez de apagar)
  insert into public.tarefas (vai_pro_google, titulo, tipo, responsavel_id, inicio, dono_id, criado_por) values (true, 'Prazo', 'outro', pn, '2026-10-30T10:00', pn, pn) returning id into t2;
  set local role service_role; x := public.agenda_saida_pendentes(); perform public.agenda_saida_confirmar((x->0->>'id')::bigint, 'evp'); reset role;
  delete from public.agenda_saida;
  update public.tarefas set inicio = null where id = t2;
  select count(*) into v from public.agenda_saida where tarefa_id = t2 and acao = 'apagar' and estado = 'pendente'; r := r || jsonb_build_object('tirar_data_apos_limpeza_gera_apagar_esperado_1', v);

  -- ===== R5-3: "só eu escrevo" =====
  delete from public.agenda_saida;
  set local role authenticated;
  -- Matheus cria com o Natham como responsável (mandando vai_pro_google direto, como a API permitiria)
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  insert into public.tarefas (vai_pro_google, titulo, tipo, responsavel_id, inicio, dono_id, criado_por, enviada_por)
    values (true, 'Matheus para Natham', 'outro', pn, '2026-11-02T10:00', pn, pm, pm) returning id into t3;
  -- e o mesmo pelo salvar_tarefa (o caminho do app)
  perform public.salvar_tarefa(jsonb_build_object('id', gen_random_uuid(), 'titulo', 'Matheus para Natham (RPC)', 'tipo', 'outro', 'responsavel_id', pn,
    'inicio', '2026-11-03T10:00', 'dia_inteiro', false, 'cor', 'etiqueta-5', 'concluida', false, 'links', '[]'::jsonb, 'dono_id', pn, 'criado_por', pm, 'enviada_por', pm, 'vai_pro_google', true));
  -- Matheus cria para si mesmo
  insert into public.tarefas (vai_pro_google, titulo, tipo, responsavel_id, inicio, dono_id, criado_por)
    values (true, 'Matheus para Matheus', 'outro', pm, '2026-11-04T10:00', pm, pm) returning id into t5;
  -- Natham cria para o Matheus
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  insert into public.tarefas (vai_pro_google, titulo, tipo, responsavel_id, inicio, dono_id, criado_por, enviada_por)
    values (true, 'Natham para Matheus', 'outro', pm, '2026-11-05T10:00', pm, pn, pn) returning id into t4;
  reset role;
  select count(*) into v from public.agenda_saida where acao = 'salvar' and tarefa_id = t3; r := r || jsonb_build_object('matheus_para_natham_na_fila_esperado_0', v);
  select count(*) into v from public.tarefas where titulo like 'Matheus para Natham%' and vai_pro_google; r := r || jsonb_build_object('matheus_para_natham_campo_ligado_esperado_0', v);
  select count(*) into v from public.agenda_saida where acao = 'salvar' and tarefa_id = t4; r := r || jsonb_build_object('natham_para_matheus_na_fila_esperado_1', v);
  select count(*) into v from public.agenda_saida where acao = 'salvar' and tarefa_id = t5; r := r || jsonb_build_object('matheus_para_matheus_na_fila_esperado_1', v);
  -- Matheus cria para si e depois passa a tarefa ao Natham: nada vai para a agenda do Natham
  delete from public.agenda_saida;
  insert into public.tarefas (vai_pro_google, titulo, tipo, responsavel_id, inicio, dono_id, criado_por) values (true, 'Troca de responsavel', 'outro', pm, '2026-11-06T10:00', pm, pm) returning id into t6;
  set local role service_role; x := public.agenda_saida_pendentes(); perform public.agenda_saida_confirmar((x->0->>'id')::bigint); reset role;
  update public.tarefas set responsavel_id = pn where id = t6;
  select count(*) into v from public.agenda_saida where tarefa_id = t6 and acao = 'salvar' and estado = 'pendente'; r := r || jsonb_build_object('passar_ao_natham_nao_manda_salvar_esperado_0', v);
  select count(*) into v from public.agenda_saida where tarefa_id = t6 and acao = 'apagar' and pessoa_id = pm; r := r || jsonb_build_object('passar_ao_natham_apaga_da_agenda_do_matheus_esperado_1', v);

  raise exception 'RESULTADO: %', jsonb_pretty(r);
end $$;
