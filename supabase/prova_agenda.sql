-- PROVA da porta de entrada da agenda (008). Vale só com 001 a 008 (formato antigo, uma linha mesclada). Depois do 010 use prova_agenda_privacidade.sql. Não grava nada: termina com erro de propósito e o banco desfaz tudo.
-- Rodar no projeto Tarefas (uruhjlurcxpjhhgvuzwt) DEPOIS de aplicar o 008. O resultado vem na mensagem "RESULTADO: {...}".
-- Esperado: ver supabase/prova_agenda.esperado.txt
do $$
declare
  n uuid; m uuid; r jsonb := '{}'; v int; x jsonb; f text[]; b boolean; t text;
  lote_contato jsonb := '[
    {"id":"c1","ical_uid":"U1","titulo":"Reunião - Caderno","inicio":"2026-10-22T14:00:00-03:00","fim":"2026-10-22T15:00:00-03:00"},
    {"id":"c3","ical_uid":"U3","titulo":"Gravação Beec","inicio":"2026-10-23T10:00:00-03:00","fim":"2026-10-23T11:00:00-03:00","local":"Estúdio"},
    {"id":"c4","ical_uid":"U4","titulo":"Alinhamento","inicio":"2026-10-24T10:00:00-03:00","fim":"2026-10-24T11:00:00-03:00"}]';
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natham.monteiro@youcontabilidade.com') returning id into n;
  insert into auth.users (id, instance_id, aud, role, email) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matheus.germano@assessoriabeec.com.br') returning id into m;

  -- quem chama: anon e logado são barrados; a chave de serviço entra
  set local role anon;
  begin perform public.agenda_receber('contato', '[]'); r := r || jsonb_build_object('anon_chama', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('anon_chama', 'barrado: ' || sqlerrm); end;
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  begin perform public.agenda_receber('contato', '[]'); r := r || jsonb_build_object('logado_chama', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('logado_chama', 'barrado: ' || sqlerrm); end;
  reset role;

  set local role service_role;
  -- contato manda 3 eventos; natham manda o MESMO U1 (outro id, como acontece em convite) + um só dele (U2) + um repetido (2 datas) + dia inteiro
  x := public.agenda_receber('contato', lote_contato);
  r := r || jsonb_build_object('contato_primeira_carga', x);
  x := public.agenda_receber('natham', '[
    {"id":"n1","ical_uid":"U1","titulo":"Reunião - Caderno","inicio":"2026-10-22T14:00:00-03:00","fim":"2026-10-22T15:00:00-03:00"},
    {"id":"n2","ical_uid":"U2","titulo":"Dentista","inicio":"2026-10-22T09:00:00-03:00","fim":"2026-10-22T10:00:00-03:00"},
    {"id":"n3_20261026","ical_uid":"U5","inicio_original":"2026-10-26T08:00:00-03:00","titulo":"Treino","inicio":"2026-10-26T08:00:00-03:00"},
    {"id":"n3_20261027","ical_uid":"U5","inicio_original":"2026-10-27T08:00:00-03:00","titulo":"Treino","inicio":"2026-10-27T08:00:00-03:00"},
    {"id":"n6","ical_uid":"U6","titulo":"Feriado","inicio":"2026-11-02","fim":"2026-11-03","dia_inteiro":true}]');
  r := r || jsonb_build_object('natham_primeira_carga', x);
  reset role;
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('total_eventos_esperado_7', v);
  select fontes into f from public.agenda_eventos where ical_uid = 'U1'; r := r || jsonb_build_object('U1_fontes', f);
  select count(*) into v from public.agenda_eventos where ical_uid = 'U1'; r := r || jsonb_build_object('U1_linhas', v);
  select (inicio = '2026-11-02 03:00:00+00' and fim = '2026-11-03 03:00:00+00') into b from public.agenda_eventos where ical_uid = 'U6';
  r := r || jsonb_build_object('dia_inteiro_meia_noite_de_brasilia', b);

  -- mandar tudo de novo não duplica
  set local role service_role;
  perform public.agenda_receber('contato', lote_contato);
  reset role;
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('total_apos_reenvio_esperado_7', v);

  -- cópia particular (sem título) não apaga o título de quem tem
  set local role service_role;
  perform public.agenda_receber('natham', '[{"id":"n1","ical_uid":"U1","particular":true,"inicio":"2026-10-22T14:30:00-03:00","fim":"2026-10-22T15:30:00-03:00"}]');
  reset role;
  select titulo || ' / ' || (inicio at time zone 'America/Sao_Paulo')::time::text into t from public.agenda_eventos where ical_uid = 'U1'; r := r || jsonb_build_object('U1_titulo_e_hora_nova', t);
  set local role service_role;
  perform public.agenda_receber('adrian', '[{"id":"a1","ical_uid":"U7","particular":true,"inicio":"2026-10-25T10:00:00-03:00"}]');
  reset role;
  select titulo || ' / particular=' || particular into t from public.agenda_eventos where ical_uid = 'U7'; r := r || jsonb_build_object('particular_sozinho', t);

  -- quem vê: Natham 8 (todos); Matheus: tudo menos U2, U5 (x2) e U6 (só do Natham) = 4
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('natham_ve_esperado_8', v);
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('matheus_ve_esperado_4', v);
  select count(*) into v from public.agenda_eventos where titulo in ('Dentista', 'Treino', 'Feriado'); r := r || jsonb_build_object('matheus_ve_so_do_natham_esperado_0', v);
  select count(*) into v from public.agenda_eventos where titulo = 'Reunião - Caderno'; r := r || jsonb_build_object('matheus_ve_a_reuniao_da_contato_esperado_1', v);
  begin perform ids from public.agenda_eventos limit 1; r := r || jsonb_build_object('matheus_le_ids_do_google', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_le_ids_do_google', 'barrado: ' || sqlerrm); end;
  begin insert into public.agenda_eventos (chave, titulo, inicio, fontes) values ('x', 'forjado', now(), '{matheus}');
    r := r || jsonb_build_object('matheus_escreve', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_escreve', 'barrado: ' || sqlerrm); end;
  reset role;

  -- apagado: some da agenda que mandou o aviso; some de vez quando não sobra nenhuma
  set local role service_role;
  x := public.agenda_receber('contato', '[{"id":"c1","status":"cancelled"}]');
  r := r || jsonb_build_object('cancela_na_contato', x);
  reset role;
  select fontes into f from public.agenda_eventos where ical_uid = 'U1'; r := r || jsonb_build_object('U1_fontes_apos_cancelar_contato', f);
  set local role service_role;
  perform public.agenda_receber('natham', '[{"id":"n1","status":"cancelled"},{"id":"nao-existe","status":"cancelled"}]');
  reset role;
  select count(*) into v from public.agenda_eventos where ical_uid = 'U1'; r := r || jsonb_build_object('U1_linhas_apos_cancelar_os_dois_esperado_0', v);

  -- varredura: c4 sumiu da lista da contato dentro da janela -> sai; lista vazia nunca apaga
  set local role service_role;
  x := public.agenda_receber('contato', '[{"id":"c3","ical_uid":"U3","titulo":"Gravação Beec","inicio":"2026-10-23T10:00:00-03:00"}]', '2026-10-20T00:00:00-03:00', '2026-11-30T00:00:00-03:00');
  r := r || jsonb_build_object('varredura', x);
  x := public.agenda_receber('contato', '[]', '2026-10-20T00:00:00-03:00', '2026-11-30T00:00:00-03:00');
  r := r || jsonb_build_object('varredura_lista_vazia', x);
  begin perform public.agenda_receber('banana', '[]'); r := r || jsonb_build_object('fonte_invalida', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('fonte_invalida', 'barrado: ' || sqlerrm); end;
  reset role;
  select count(*) into v from public.agenda_eventos where ical_uid = 'U4'; r := r || jsonb_build_object('U4_apos_varredura_esperado_0', v);
  select count(*) into v from public.agenda_eventos where ical_uid = 'U3'; r := r || jsonb_build_object('U3_continua_esperado_1', v);

  raise exception 'RESULTADO: %', jsonb_pretty(r);
end $$;
