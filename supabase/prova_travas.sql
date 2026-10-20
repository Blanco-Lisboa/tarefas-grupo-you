-- PROVA das travas (troca de papel, como o bloco 242 do CRM). Não grava nada: termina com erro de propósito e o banco desfaz tudo.
-- (Teste de apagar não está aqui: o MCP pede confirmação humana para DELETE. A trava de apagar é igual à de alterar.)
-- Rodar no projeto Tarefas (uruhjlurcxpjhhgvuzwt). O resultado vem na mensagem "RESULTADO: {...}".
do $$
declare
  n uuid; m uuid; pn uuid; pm uuid;
  r jsonb := '{}'; v int; t uuid;
begin
  -- usuários de teste com os e-mails reais: o gatilho liga cada um à sua pessoa (prova a ligação por e-mail)
  insert into auth.users (id, instance_id, aud, role, email) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natham.monteiro@youcontabilidade.com') returning id into n;
  insert into auth.users (id, instance_id, aud, role, email) values
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matheus.germano@assessoriabeec.com.br') returning id into m;
  select id into pn from public.pessoas where slug = 'natham';
  select id into pm from public.pessoas where slug = 'matheus';
  r := r || jsonb_build_object('ligacao_por_email', (select user_id = n from public.pessoas where slug = 'natham') and (select user_id = m from public.pessoas where slug = 'matheus'));

  -- eventos de agenda das 4 fontes (como dono do banco; o app não escreve nelas)
  insert into public.agenda_eventos (chave, fontes, titulo, inicio) values
    ('g1', '{natham}', 'Evento do Natham', now()), ('g2', '{matheus}', 'Evento do Matheus', now()),
    ('g3', '{adrian}', 'Evento do Adrian', now()), ('g4', '{lucas}', 'Evento do Lucas', now());

  -- NATHAM cria
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated')::text, true);
  insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por) values ('P1 caderno sem empresa', 'outro', pn, pn, pn);
  insert into public.tarefas (titulo, tipo, empresa_id, responsavel_id, dono_id, criado_por) values ('P2 caderno com empresa', 'reuniao', 'you', pn, pn, pn);
  insert into public.tarefas (titulo, tipo, etapa, empresa_id, responsavel_id, dono_id, criado_por) values ('C1 conteudo COM empresa', 'roteiro', 'roteiro', 'you', pn, pn, pn);
  insert into public.tarefas (titulo, tipo, etapa, responsavel_id, dono_id, criado_por) values ('C2 conteudo SEM empresa', 'roteiro', 'roteiro', pn, pn, pn);
  insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por, enviada_por) values ('E1 enviada ao Matheus', 'outro', pm, pm, pn, pn) returning id into t;
  insert into public.anotacoes_dia (dono_id, dia, texto) values (pn, current_date, 'nota privada do Natham');
  select count(*) into v from public.tarefas; r := r || jsonb_build_object('natham_ve_tarefas', v);
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('natham_ve_eventos', v);
  select count(*) into v from public.tarefas where id = t; r := r || jsonb_build_object('natham_le_a_que_enviou', v);
  update public.tarefas set concluida = true where id = t; get diagnostics v = row_count;
  r := r || jsonb_build_object('natham_altera_a_que_enviou_linhas', v);
  begin
    insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por) values ('F1 forjada: dono Matheus sem enviar', 'outro', pm, pm, pn);
    r := r || jsonb_build_object('natham_forja_dono', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('natham_forja_dono', 'barrado: ' || sqlerrm); end;

  -- MATHEUS
  perform set_config('request.jwt.claims', json_build_object('sub', m, 'role', 'authenticated')::text, true);
  select count(*) into v from public.tarefas; r := r || jsonb_build_object('matheus_ve_tarefas_total', v);
  select count(*) into v from public.tarefas where titulo like 'P%'; r := r || jsonb_build_object('matheus_ve_privadas_do_natham', v);
  select count(*) into v from public.tarefas where titulo like 'C1%'; r := r || jsonb_build_object('matheus_ve_conteudo_COM_empresa', v);
  select count(*) into v from public.tarefas where titulo like 'C2%'; r := r || jsonb_build_object('matheus_ve_conteudo_SEM_empresa_do_natham', v);
  select count(*) into v from public.tarefas where titulo like 'E1%'; r := r || jsonb_build_object('matheus_ve_a_enviada_a_ele', v);
  select count(*) into v from public.anotacoes_dia; r := r || jsonb_build_object('matheus_ve_notas_do_natham', v);
  select count(*) into v from public.agenda_eventos where fontes = '{natham}'; r := r || jsonb_build_object('matheus_ve_eventos_fonte_natham', v);
  select count(*) into v from public.agenda_eventos; r := r || jsonb_build_object('matheus_ve_eventos_total', v);
  update public.tarefas set titulo = 'hackeado' where titulo like 'P%'; get diagnostics v = row_count;
  r := r || jsonb_build_object('matheus_altera_privada_do_natham_linhas', v);
  update public.tarefas set concluida = true where id = t; get diagnostics v = row_count;
  r := r || jsonb_build_object('matheus_conclui_a_enviada_a_ele_linhas', v);
  update public.tarefas set concluida = true where titulo like 'C1%'; get diagnostics v = row_count;
  r := r || jsonb_build_object('matheus_edita_conteudo_COM_empresa_linhas', v);
  begin
    insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por) values ('F2 forjada no caderno do Natham', 'outro', pn, pn, pn);
    r := r || jsonb_build_object('matheus_cria_no_caderno_do_natham', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_cria_no_caderno_do_natham', 'barrado: ' || sqlerrm); end;
  begin
    insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por) values ('F3 criada como se fosse o Natham', 'outro', pn, pm, pn);
    r := r || jsonb_build_object('matheus_se_passa_por_natham', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_se_passa_por_natham', 'barrado: ' || sqlerrm); end;
  begin
    insert into public.agenda_eventos (chave, fontes, titulo, inicio) values ('x', '{natham}', 'forjado', now());
    r := r || jsonb_build_object('matheus_escreve_agenda', 'PASSOU (ERRO)');
  exception when others then r := r || jsonb_build_object('matheus_escreve_agenda', 'barrado: ' || sqlerrm); end;

  -- ANON (sem login)
  reset role; set local role anon;
  begin
    select count(*) into v from public.tarefas; r := r || jsonb_build_object('anon_ve_tarefas', v);
  exception when others then r := r || jsonb_build_object('anon_ve_tarefas', 'barrado: ' || sqlerrm); end;

  reset role;
  raise exception 'RESULTADO: %', jsonb_pretty(r);
end $$;
