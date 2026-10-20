-- PROVA da volta da agenda (010). Não grava nada: termina com erro de propósito e o banco desfaz tudo.
-- Rodar no projeto Tarefas DEPOIS de aplicar o 010 (e o 008). O resultado vem na mensagem "RESULTADO: {...}".
-- Esperado: ver supabase/prova_agenda_saida.saida.txt (chaves terminadas em _esperado_X trazem o valor certo no nome)
do $$
declare
  n uuid; m uuid; pn uuid; pm uuid; pa uuid; t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid;
  r jsonb := '{}'; x jsonb; v int; s text;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natham.monteiro@youcontabilidade.com') returning id into n;
  insert into auth.users (id, instance_id, aud, role, email) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matheus.germano@assessoriabeec.com.br') returning id into m;
  select id into pn from public.pessoas where slug = 'natham';
  select id into pm from public.pessoas where slug = 'matheus';
  select id into pa from public.pessoas where slug = 'adrian';
  insert into public.agenda_pessoa (pessoa_id, calendar_id) values (pm, 'matheus@cal.test') on conflict do nothing; -- Adrian fica SEM agenda de propósito
  select calendar_id into s from public.agenda_pessoa where pessoa_id = pn; r := r || jsonb_build_object('mapa_natham', s);

  -- 1) criar tarefa como o Natham (logado de verdade): com data entra na fila; sem data e de quem não tem agenda, não
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  insert into public.tarefas (titulo, tipo, responsavel_id, inicio, fim, dia_inteiro, dono_id, criado_por)
    values ('Gravar reels', 'gravacao', pn, '2026-10-22T14:00', '2026-10-22T15:30', false, pn, pn) returning id into t1;
  insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por) values ('Sem data', 'outro', pn, pn, pn);
  insert into public.tarefas (titulo, tipo, responsavel_id, inicio, dono_id, criado_por) values ('Do Adrian', 'outro', pa, '2026-10-23T09:00', pn, pn);
  begin perform 1 from public.agenda_saida; r := r || jsonb_build_object('logado_le_a_fila', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('logado_le_a_fila', 'barrado: ' || sqlerrm); end;
  begin perform public.agenda_saida_pendentes(); r := r || jsonb_build_object('logado_chama_pendentes', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('logado_chama_pendentes', 'barrado: ' || sqlerrm); end;
  begin perform public.agenda_saida_confirmar(1, 'x'); r := r || jsonb_build_object('logado_chama_confirmar', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('logado_chama_confirmar', 'barrado: ' || sqlerrm); end;
  reset role;
  set local role anon;
  begin perform public.agenda_saida_pendentes(); r := r || jsonb_build_object('anon_chama_pendentes', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('anon_chama_pendentes', 'barrado: ' || sqlerrm); end;
  reset role;
  select count(*) into v from public.agenda_saida; r := r || jsonb_build_object('fila_esperado_1', v);

  -- 2) o n8n pega: um item "criar", com a hora pronta para o Google; pegar de novo logo em seguida não devolve nada
  set local role service_role;
  x := public.agenda_saida_pendentes();
  r := r || jsonb_build_object('pega_1', x, 'pega_de_novo_esperado_lista_vazia', public.agenda_saida_pendentes());
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint, 'ev-1');
  r := r || jsonb_build_object('confirma_de_novo_inofensivo', public.agenda_saida_confirmar((x->0->>'id')::bigint, 'ev-1'));
  reset role;
  select google_event_id || ' @ ' || calendar_id into s from public.agenda_saida_vinculo where tarefa_id = t1; r := r || jsonb_build_object('vinculo', s);

  -- 3) editar: duas mudanças antes de o n8n pegar = uma linha só; o evento já existe, então vira "editar"; mudar a cor ou marcar feita não gera nada
  update public.tarefas set titulo = 'Gravar reels v2' where id = t1;
  update public.tarefas set fim = '2026-10-22T16:00' where id = t1;
  update public.tarefas set concluida = true, cor = 'etiqueta-3' where id = t1;
  select count(*) into v from public.agenda_saida where estado = 'pendente'; r := r || jsonb_build_object('duas_edicoes_uma_linha_esperado_1', v);
  set local role service_role;
  x := public.agenda_saida_pendentes(); r := r || jsonb_build_object('pega_editar', x);
  reset role;
  -- em voo: o Natham muda de novo ANTES de o n8n confirmar; a nova linha espera a primeira
  update public.tarefas set inicio = '2026-10-22T15:00', fim = '2026-10-22T16:30' where id = t1;
  set local role service_role;
  r := r || jsonb_build_object('em_voo_nada_novo_esperado_lista_vazia', public.agenda_saida_pendentes());
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint, 'ev-1');
  x := public.agenda_saida_pendentes(); r := r || jsonb_build_object('depois_da_confirmacao_sai_a_proxima', x);
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint, 'ev-1');
  reset role;

  -- 4) trocar de responsável: apaga na agenda do Natham, cria na do Matheus (nesta ordem, uma de cada vez)
  update public.tarefas set responsavel_id = pm where id = t1;
  set local role service_role;
  x := public.agenda_saida_pendentes(); r := r || jsonb_build_object('troca_primeiro_apaga', x);
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint);
  x := public.agenda_saida_pendentes(); r := r || jsonb_build_object('troca_depois_cria_na_do_matheus', x);
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint, 'ev-1b');
  reset role;
  select google_event_id || ' @ ' || calendar_id into s from public.agenda_saida_vinculo where tarefa_id = t1; r := r || jsonb_build_object('vinculo_apos_troca', s);

  -- 5) trocar para quem NÃO tem agenda (Adrian): só apaga; nada novo é criado
  update public.tarefas set responsavel_id = pa where id = t1;
  set local role service_role;
  x := public.agenda_saida_pendentes(); r := r || jsonb_build_object('para_o_adrian_so_apaga', x);
  perform public.agenda_saida_confirmar((x->0->>'id')::bigint);
  r := r || jsonb_build_object('para_o_adrian_nada_mais_esperado_lista_vazia', public.agenda_saida_pendentes());
  reset role;
  select count(*) into v from public.agenda_saida_vinculo where tarefa_id = t1; r := r || jsonb_build_object('vinculo_do_adrian_esperado_0', v);

  -- 6) formatos para o Google: dia inteiro (fim = dia seguinte), dia inteiro sem fim, hora sem fim (+1h, virando o dia)
  insert into public.tarefas (titulo, tipo, responsavel_id, inicio, fim, dia_inteiro, dono_id, criado_por)
    values ('Feriado', 'outro', pn, '2026-11-02', '2026-11-03', true, pn, pn) returning id into t2;
  insert into public.tarefas (titulo, tipo, responsavel_id, inicio, dia_inteiro, dono_id, criado_por)
    values ('Prazo', 'outro', pn, '2026-11-09', true, pn, pn);
  insert into public.tarefas (titulo, tipo, responsavel_id, inicio, dono_id, criado_por)
    values ('Tarde', 'outro', pn, '2026-10-22T23:30', pn, pn);
  set local role service_role;
  x := public.agenda_saida_pendentes();
  r := r || jsonb_build_object('formatos', (select jsonb_agg(jsonb_build_object('t', i->>'titulo', 'ini', i->>'inicio', 'fim', i->>'fim', 'dia', i->'dia_inteiro', 'fuso', i->>'fuso') order by i->>'titulo') from jsonb_array_elements(x) i));
  for v in 0 .. jsonb_array_length(x) - 1 loop perform public.agenda_saida_confirmar((x->v->>'id')::bigint, 'ev-f' || v); end loop;
  reset role;

  -- 7) apagar a tarefa, ou tirar a data: some do Google. Criou e apagou antes de o n8n pegar: nada vai (nem apagar)
  delete from public.tarefas where id = t2;
  update public.tarefas set inicio = null, fim = null where titulo = 'Prazo';
  insert into public.tarefas (titulo, tipo, responsavel_id, inicio, dono_id, criado_por) values ('Efemera', 'outro', pn, '2026-12-01T10:00', pn, pn) returning id into t3;
  delete from public.tarefas where id = t3;
  set local role service_role;
  x := public.agenda_saida_pendentes(); r := r || jsonb_build_object('apagados', (select jsonb_agg(jsonb_build_object('acao', i->>'acao', 'ev', i->>'google_event_id', 'cal', i->>'calendar_id')) from jsonb_array_elements(x) i));
  for v in 0 .. jsonb_array_length(x) - 1 loop perform public.agenda_saida_confirmar((x->v->>'id')::bigint); end loop;
  reset role;
  select count(*) into v from public.agenda_saida where tarefa_id = t3; r := r || jsonb_build_object('efemera_na_fila_esperado_0', v);
  select count(*) into v from public.agenda_saida_vinculo; r := r || jsonb_build_object('vinculos_que_sobram_esperado_1_a_Tarde', v);

  -- 8) erro do Google: tentativa conta, a linha volta; na 5ª falha vira "falhou" e a tarefa não trava a fila
  insert into public.tarefas (titulo, tipo, responsavel_id, inicio, dono_id, criado_por) values ('Teimosa', 'outro', pn, '2026-12-05T10:00', pn, pn) returning id into t4;
  for v in 1 .. 5 loop
    update public.agenda_saida set pegou_em = now() - interval '6 minutes' where tarefa_id = t4 and estado = 'pendente';
    set local role service_role;
    x := public.agenda_saida_pendentes();
    perform public.agenda_saida_confirmar((x->0->>'id')::bigint, null, 'Google disse 500');
    reset role;
  end loop;
  select estado || ' / ' || tentativas || ' / ' || ultimo_erro into s from public.agenda_saida where tarefa_id = t4; r := r || jsonb_build_object('apos_5_erros', s);
  update public.tarefas set titulo = 'Teimosa v2' where id = t4;
  set local role service_role;
  x := public.agenda_saida_pendentes(); r := r || jsonb_build_object('depois_do_falhou_a_tarefa_ainda_anda', x->0->>'acao');
  begin perform public.agenda_saida_confirmar((x->0->>'id')::bigint); r := r || jsonb_build_object('salvar_sem_id_do_google', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('salvar_sem_id_do_google', 'barrado: ' || sqlerrm); end;
  reset role;

  -- 9) um defeito na fila nunca impede o Natham de salvar a tarefa
  alter table public.agenda_saida rename to agenda_saida_quebrada;
  insert into public.tarefas (titulo, tipo, responsavel_id, inicio, dono_id, criado_por) values ('Salva mesmo assim', 'outro', pn, '2026-12-06T10:00', pn, pn) returning id into t5;
  alter table public.agenda_saida_quebrada rename to agenda_saida;
  select count(*) into v from public.tarefas where id = t5; r := r || jsonb_build_object('tarefa_salvou_com_fila_quebrada_esperado_1', v);

  -- 10) a porta de entrada ignora o evento que veio do Tarefas e continua gravando o resto
  set local role service_role;
  x := public.agenda_receber('natham', '[
    {"id":"g1","ical_uid":"U1","titulo":"Gravar reels v2","inicio":"2026-10-22T14:00:00-03:00","tarefa_id":"11111111-1111-1111-1111-111111111111"},
    {"id":"g2","ical_uid":"U2","titulo":"Dentista","inicio":"2026-10-22T09:00:00-03:00"}]');
  r := r || jsonb_build_object('receber_ignora_o_do_tarefas', x);
  reset role;
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('eventos_no_banco_esperado_1', v);

  -- 11) Lucas fora das agendas; o resto de quem vê o quê não mudou
  select count(*) into v from public.agenda_acesso where fonte = 'lucas'; r := r || jsonb_build_object('acesso_lucas_esperado_0', v);
  select string_agg(p.slug || ':' || a.fonte, ', ' order by p.slug, a.fonte) into s from public.agenda_acesso a join public.pessoas p on p.id = a.pessoa_id; r := r || jsonb_build_object('quem_ve_o_que', s);
  select count(*) into v from public.pessoas where slug = 'lucas'; r := r || jsonb_build_object('pessoa_lucas_continua_esperado_1', v);

  raise exception 'RESULTADO: %', jsonb_pretty(r);
end $$;
