-- PROVA do 019 (postagem IG/FB + Drive + alarmes + trava + lixeira). So roda DEPOIS do 019 aplicado, com OK do Natham.
-- Nao grava nada: termina com erro de proposito ("RESULTADO: {...}") e o banco desfaz tudo (alarmes de teste e chamadas incluidos).
-- Rodar no projeto Tarefas (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Nao le nenhum segredo do Vault.
do $$
declare
  n uuid; m uuid; pn uuid; pm uuid; r jsonb := '{}'; v int; t uuid; t2 uuid; t3 uuid;
  quando timestamp; esperado text; tem text;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natham.monteiro@youcontabilidade.com') returning id into n;
  insert into auth.users (id, instance_id, aud, role, email) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matheus.germano@assessoriabeec.com.br') returning id into m;
  select id into pn from public.pessoas where slug = 'natham';
  select id into pm from public.pessoas where slug = 'matheus';

  -- NATHAM cria um card Postagem da You ja Aprovado, programado para daqui a 5 min (hora de Brasilia)
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  set local role authenticated;
  t := gen_random_uuid();
  quando := now() at time zone 'America/Sao_Paulo' + interval '5 minutes';
  perform public.salvar_tarefa(jsonb_build_object('id', t, 'titulo', 'PROVA postagem', 'tipo', 'postagem', 'empresa_id', 'you', 'etapa', 'aprovado',
    'dono_id', pn, 'criado_por', pn, 'responsavel_id', pn, 'dia_inteiro', false, 'cor', 'etiqueta-5', 'links', '[]'::jsonb, 'concluida', false, 'formato', 'post', 'legenda', 'legenda aprovada',
    'postar_em', to_char(quando, 'YYYY-MM-DD"T"HH24:MI')));
  reset role;
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('alarme_armado_1_esperado', v);
  select count(*) into v from cron.job where jobname = 'tarefas_postar_vencidos'; r := r || jsonb_build_object('relogio_de_todo_minuto_0_esperado', v);
  -- hora do alarme em GMT = hora de Brasilia + 3 (Brasil sem horario de verao)
  esperado := format('%s %s %s %s *', extract(minute from quando)::int, extract(hour from quando + interval '3 hours')::int,
    extract(day from quando + interval '3 hours')::int, extract(month from quando + interval '3 hours')::int);
  select schedule into tem from cron.job where jobname = 'tarefas_postar_' || t;
  r := r || jsonb_build_object('alarme_na_hora_certa_GMT_true_esperado', tem = esperado);

  -- MATHEUS (nao e aprovador): nao muda legenda nem anexo de card Aprovado; nao posta agora; nao tenta de novo
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update public.tarefas set legenda = 'texto que o Natham nao viu' where id = t; get diagnostics v = row_count;
    r := r || jsonb_build_object('matheus_muda_legenda_de_aprovado', 'PASSOU (ERRO) linhas=' || v);
  exception when others then r := r || jsonb_build_object('matheus_muda_legenda_de_aprovado', 'barrado: ' || sqlerrm); end;
  begin update public.tarefas set capa_quadro_ms = 1000 where id = t;
    r := r || jsonb_build_object('matheus_muda_quadro_da_capa_de_aprovado', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_muda_quadro_da_capa_de_aprovado', 'barrado: ' || sqlerrm); end;
  r := r || jsonb_build_object('matheus_pode_mexer_anexos_de_aprovado_false_esperado', public.pode_mexer_anexos(t));
  begin perform public.postar_agora(t); r := r || jsonb_build_object('matheus_postar_agora', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_postar_agora', 'barrado: ' || sqlerrm); end;
  begin perform public.tentar_de_novo(t); r := r || jsonb_build_object('matheus_tentar_de_novo', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_tentar_de_novo', 'barrado: ' || sqlerrm); end;
  begin perform public.ler_segredo_servico('tarefas_funcoes_segredo'); r := r || jsonb_build_object('matheus_le_segredo', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_le_segredo', 'barrado: ' || sqlerrm); end;
  begin perform * from public.pegar_postagens(t); r := r || jsonb_build_object('matheus_usa_catraca', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_usa_catraca', 'barrado: ' || sqlerrm); end;
  reset role;

  -- Card de Edicao (nao aprovado): Matheus mexe em anexo e apaga o card do Natham (lixeira, decisao de 23/10)
  t3 := gen_random_uuid();
  insert into public.tarefas (id, titulo, tipo, empresa_id, etapa, dono_id, criado_por, responsavel_id)
    values (t3, 'PROVA lixeira', 'postagem', 'you', 'edicao', pn, pn, pn);
  set local role authenticated;
  r := r || jsonb_build_object('matheus_pode_mexer_anexos_de_edicao_true_esperado', public.pode_mexer_anexos(t3));
  r := r || jsonb_build_object('matheus_pode_apagar_card_de_conteudo_true_esperado', public.pode_apagar_tarefa(t3));
  delete from public.tarefas where id = t3; get diagnostics v = row_count;
  r := r || jsonb_build_object('matheus_apaga_card_de_conteudo_linhas_1_esperado', v);
  reset role;

  -- Tipo diferente de Postagem nao vai para Aprovado (23514)
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.tarefas (titulo, tipo, empresa_id, etapa, dono_id, criado_por, responsavel_id) values ('PROVA gravacao', 'gravacao', 'you', 'aprovado', pn, pn, pn);
    r := r || jsonb_build_object('gravacao_em_aprovado', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('gravacao_em_aprovado', sqlstate || ' ' || sqlerrm); end;
  reset role;

  -- Regras de arquivo (como dono do banco, que e o que a funcao drive faz com a chave de servico)
  insert into public.arquivos (tarefa_id, caminho, nome, tipo, tamanho, criado_por) values (t, 'tarefas/' || t || '/a.png', 'a.png', 'imagem', 10, pn);
  begin insert into public.arquivos (tarefa_id, nome, tipo, tamanho) values (t, 'v.mp4', 'video', 10);
    r := r || jsonb_build_object('arquivo_sem_lugar', 'PASSOU (ERRO)');
  exception when check_violation then r := r || jsonb_build_object('arquivo_sem_lugar', 'barrado (23514)'); end;
  begin insert into public.arquivos (tarefa_id, caminho, drive_id, nome, tipo, tamanho) values (t, 'tarefas/' || t || '/b.png', 'D1', 'b.png', 'imagem', 10);
    r := r || jsonb_build_object('arquivo_em_dois_lugares', 'PASSOU (ERRO)');
  exception when check_violation then r := r || jsonb_build_object('arquivo_em_dois_lugares', 'barrado (23514)'); end;
  begin insert into public.arquivos (tarefa_id, caminho, nome, tipo, tamanho) values (t, 'tarefas/' || t || '/v.mp4', 'v.mp4', 'video', 10);
    r := r || jsonb_build_object('video_no_supabase', 'PASSOU (ERRO)');
  exception when check_violation then r := r || jsonb_build_object('video_no_supabase', 'barrado (23514)'); end;
  insert into public.arquivos (tarefa_id, drive_id, nome, tipo, tamanho, papel) values (t, 'DRIVE-VIDEO', 'v.mp4', 'video', 10, 'anexo');
  insert into public.arquivos (tarefa_id, drive_id, nome, tipo, tamanho, papel) values (t, 'DRIVE-CAPA-1', 'c1.jpg', 'imagem', 10, 'capa');
  begin insert into public.arquivos (tarefa_id, drive_id, nome, tipo, tamanho, papel) values (t, 'DRIVE-CAPA-2', 'c2.jpg', 'imagem', 10, 'capa');
    r := r || jsonb_build_object('duas_capas', 'PASSOU (ERRO)');
  exception when unique_violation then r := r || jsonb_build_object('duas_capas', 'barrado (23505)'); end;
  begin insert into public.arquivos (tarefa_id, drive_id, nome, tipo, tamanho, papel) values (t, 'DRIVE-CAPA-V', 'c.mp4', 'video', 10, 'capa');
    r := r || jsonb_build_object('capa_em_video', 'PASSOU (ERRO)');
  exception when check_violation then r := r || jsonb_build_object('capa_em_video', 'barrado (23514)'); end;

  -- Usuario comum nao cria linha com drive_id (so a funcao drive) e nao apaga card que tem arquivo no Drive
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin insert into public.arquivos (tarefa_id, drive_id, nome, tipo, tamanho, criado_por) values (t, 'ALHEIO', 'x.png', 'imagem', 10, pn);
    r := r || jsonb_build_object('usuario_cria_linha_com_drive_id', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('usuario_cria_linha_com_drive_id', 'barrado: ' || sqlerrm); end;
  begin delete from public.tarefas where id = t;
    r := r || jsonb_build_object('usuario_apaga_card_com_drive', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('usuario_apaga_card_com_drive', 'barrado: ' || sqlerrm); end;
  reset role;

  -- Catraca (service_role): 1a chamada pega as 2 redes, 2a nao pega nada (ninguem posta em dobro)
  update public.tarefas set postar_em = to_char(now() at time zone 'America/Sao_Paulo' - interval '1 minute', 'YYYY-MM-DD"T"HH24:MI') where id = t;
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t;
  r := r || jsonb_build_object('hora_no_passado_toca_na_hora_e_deixa_so_o_sentinela_1_esperado', v);
  set local role service_role;
  select count(*) into v from public.pegar_postagens(t); r := r || jsonb_build_object('catraca_1a_chamada_2_esperado', v);
  select count(*) into v from public.pegar_postagens(t); r := r || jsonb_build_object('catraca_2a_chamada_0_esperado', v);
  reset role;
  select count(*) into v from public.postagens where tarefa_id = t and status = 'enviando' and tentativas = 1; r := r || jsonb_build_object('linhas_enviando_2_esperado', v);
  -- erro numa rede + Natham manda tentar de novo: so a rede com erro volta
  update public.postagens set status = 'erro', erro = 'x' where tarefa_id = t and rede = 'facebook';
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.tentar_de_novo(t);
  reset role;
  select count(*) into v from public.postagens where tarefa_id = t and rede = 'facebook' and status = 'fila' and erro is null; r := r || jsonb_build_object('tentar_de_novo_volta_so_a_rede_com_erro_1_esperado', v);
  select count(*) into v from public.postagens where tarefa_id = t and rede = 'instagram' and status = 'enviando'; r := r || jsonb_build_object('instagram_intocado_1_esperado', v);

  -- Sentinela (+12 min, mesmo nome, 1o toque = rodada 1), rodadas, teto e fim do servico
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t and command like '%, 1)'; r := r || jsonb_build_object('sentinela_rodada_1_esperado', v);
  select count(*) into v from public.postagens where tarefa_id = t and rodadas = 1; r := r || jsonb_build_object('rodadas_1_na_1a_pegada_2_esperado', v);
  update public.postagens set rodadas = 5 where tarefa_id = t;
  perform private.alarme_tocou('postar', t, 0);
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('linha_com_5_rodadas_ainda_tem_sentinela_1_esperado', v);
  update public.postagens set rodadas = 1, status = 'fila' where tarefa_id = t;
  perform private.alarme_tocou('postar', t, 5);
  select count(*) into v from public.postagens where tarefa_id = t and status = 'erro' and erro like 'a funcao de postagem nao respondeu%'; r := r || jsonb_build_object('funcao_fora_do_ar_5_toques_vira_erro_2_esperado', v);
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('depois_do_teto_sem_alarme_0_esperado', v);
  perform private.alarme_tocou('postar', t, 0);
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('todas_as_redes_terminadas_nao_rearma_0_esperado', v);
  set local role service_role;
  perform public.armar_alarme_servico('postar', t, 30);
  reset role;
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('armar_alarme_servico_1_esperado', v);
  set local role service_role;
  perform public.desarmar_alarme_servico('postar', t);
  reset role;
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('desarmar_alarme_servico_0_esperado', v);
  set local role authenticated;
  begin perform public.desarmar_alarme_servico('postar', t); r := r || jsonb_build_object('usuario_desarma_alarme', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('usuario_desarma_alarme', 'barrado: ' || sqlerrm); end;
  reset role;

  -- Achados da Lupa: editor nao "posta" no papel; rede tirada do card nao volta pela retomada; alarme a mais de 300 dias e recusado
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update public.tarefas set etapa = 'postado' where id = t;
    r := r || jsonb_build_object('matheus_aprovado_para_postado_a_mao', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_aprovado_para_postado_a_mao', 'barrado: ' || sqlerrm); end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  update public.tarefas set postar_redes = '{instagram}' where id = t;
  update public.postagens set status = 'fila' where tarefa_id = t and rede = 'facebook';
  set local role service_role;
  select count(*) into v from public.pegar_postagens(t) where rede = 'facebook'; r := r || jsonb_build_object('rede_tirada_do_card_nao_volta_0_esperado', v);
  reset role;
  update public.tarefas set postar_redes = '{instagram,facebook}' where id = t;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  begin update public.tarefas set postar_em = to_char(now() at time zone 'America/Sao_Paulo' + interval '400 days', 'YYYY-MM-DD"T"HH24:MI') where id = t;
    r := r || jsonb_build_object('alarme_a_400_dias', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('alarme_a_400_dias', sqlstate || ' ' || sqlerrm); end;

  -- Reprogramar, tirar de Aprovado, ir para Postado e apagar: os alarmes acompanham
  update public.tarefas set postar_em = to_char(now() at time zone 'America/Sao_Paulo' + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI') where id = t;
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('reprogramar_mantem_1_alarme', v);
  select schedule into tem from cron.job where jobname = 'tarefas_postar_' || t;
  perform private.alarme_tocou('postar', t, 1);  -- toque velho (card reprogramado para o futuro): nao mexe no alarme novo
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t and schedule = tem; r := r || jsonb_build_object('toque_velho_nao_apaga_alarme_novo_1_esperado', v);
  set local role authenticated;
  update public.tarefas set etapa = 'edicao' where id = t; get diagnostics v = row_count; r := r || jsonb_build_object('natham_volta_para_edicao_linhas_1_esperado', v);
  reset role;
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('alarme_some_ao_sair_de_aprovado_0_esperado', v);
  update public.tarefas set etapa = 'aprovado', postar_em = to_char(now() at time zone 'America/Sao_Paulo' + interval '3 hours', 'YYYY-MM-DD"T"HH24:MI') where id = t;
  update public.tarefas set etapa = 'postado' where id = t;
  select count(*) into v from cron.job where jobname = 'tarefas_postar_' || t; r := r || jsonb_build_object('postar_some_ao_ir_para_postado_0_esperado', v);
  select count(*) into v from cron.job where jobname = 'tarefas_limpar_' || t; r := r || jsonb_build_object('limpeza_de_7_dias_armada_1_esperado', v);
  t2 := t;
  delete from public.arquivos where tarefa_id = t;
  perform private.alarme_tocou('limpar', t, 0);
  select count(*) into v from cron.job where jobname = 'tarefas_limpar_' || t; r := r || jsonb_build_object('limpeza_sem_arquivo_para_de_tocar_0_esperado', v);
  delete from public.tarefas where id = t;
  select count(*) into v from cron.job where jobname like 'tarefas_%_' || t2::text; r := r || jsonb_build_object('apagar_card_leva_os_alarmes_0_esperado', v);

  raise exception 'RESULTADO: %', jsonb_pretty(r);
end $$;
