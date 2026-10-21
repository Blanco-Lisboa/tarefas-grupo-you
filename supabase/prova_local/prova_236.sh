#!/bin/sh
# PROVA do 019 v2 + 019b (item 236) num Postgres 17 local com stubs (docker), na ORDEM em que o Natham vai colar:
#   estado de produção de hoje (001..016, 020, 021)  →  cards já programados/Postados  →  019 (SEM a função postar-meta)  →  conferências  →  019b (função no ar)  →  conferências.
# Uso (na pasta grade-conteudo, com o docker ligado): sh supabase/prova_local/prova_236.sh      Termina com "FALHAS: 0" se tudo passou. Não toca em nada real.
set -e
sh supabase/prova_local/rodar.sh > /dev/null 2>&1
q() { docker exec -i pg236 psql -U postgres -v ON_ERROR_STOP=1 -q -t -A "$@"; }
qq() { q "$@" > /dev/null; }
cola() { sed -E '/create extension.*(pg_net|pg_cron|supabase_vault)/Id' "$1" | docker exec -i pg236 psql -U postgres -v ON_ERROR_STOP=1 -q -f - 2>&1 | grep -v "NOTICE" || true; }
q -c "create table public.prova (nome text, ok boolean, detalhe text);
create function public.confere(n text, c boolean, d text default '') returns void language sql as \$\$ insert into public.prova values (n, coalesce(c, false), d) \$\$;"

# ---- 1. Produção de hoje: cards que já existem quando o 019 chegar
qq <<'SQL'
do $$
declare n uuid; ag text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI'); t uuid;
  card record;
begin
  select id into n from public.pessoas where slug = 'natham';
  create temp table ids (rotulo text, id uuid);
  for card in select * from (values
    ('futuro',   'postagem', 'aprovado', to_char(now() at time zone 'America/Sao_Paulo' + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI')),
    ('vencido',  'postagem', 'aprovado', to_char(now() at time zone 'America/Sao_Paulo' - interval '10 minutes', 'YYYY-MM-DD"T"HH24:MI')),
    ('proximo',  'postagem', 'aprovado', to_char(now() at time zone 'America/Sao_Paulo' + interval '1 minute', 'YYYY-MM-DD"T"HH24:MI')),
    ('roteiro',  'roteiro',  'postado',  null),   -- arrastado até Postado na versão publicada
    ('antigo',   'postagem', 'postado',  null),   -- Postado com anexo ANTIGO do Supabase
    ('edicao',   'edicao',   'edicao',   null)
  ) as x(rotulo, tipo, etapa, postar_em) loop
    insert into public.tarefas (titulo, tipo, empresa_id, etapa, responsavel_id, dono_id, criado_por, aprovador, postar_em)
    values ('prova ' || card.rotulo, card.tipo, 'you', card.etapa, n, n, n, 'Natham', card.postar_em) returning id into t;
    insert into ids values (card.rotulo, t);
  end loop;
  insert into public.arquivos (tarefa_id, caminho, nome, tipo, tamanho, criado_por)
    select id, 'tarefas/' || id::text || '/_antigo.png', 'antigo.png', 'imagem', 10, n from ids where rotulo = 'antigo';
  create table public.prova_ids as select * from ids;
end $$;
SQL
q -c "select 'ANTES do 019: cron.job do 015 = ' || count(*) from cron.job where jobname = 'tarefas_postar_vencidos'"

# ---- 2. Cola o 019 (a função postar-meta AINDA NÃO está no ar: interruptor desligado)
cola supabase/_colar/019_postagem_drive.sql
cola supabase/_colar/019_postagem_drive.sql   # idempotente: 2ª vez sem erro
id() { q -c "select id from public.prova_ids where rotulo = '$1'"; }
qq <<SQL
select public.confere('1 crítico: o relógio de todo minuto do 015 continua agendado depois do 019', (select count(*) from cron.job where jobname = 'tarefas_postar_vencidos') = 1);
select public.confere('1 crítico: interruptor nasce DESLIGADO', not private.postagem_automatica());
select public.confere('1 crítico: o alarme do card futuro foi armado', exists (select 1 from cron.job where jobname = 'tarefas_postar_' || '$(id futuro)'));
select public.confere('2 alto: card vencido NÃO ganhou alarme (o relógio de minuto cuida até o 019b)', not exists (select 1 from cron.job where jobname = 'tarefas_postar_' || '$(id vencido)'));
select private.postar_vencidos();
select public.confere('1 crítico: o relógio do 015 AINDA muda o vencido para Postado (como o site publicado espera)', (select etapa from public.tarefas where id = '$(id vencido)') = 'postado');
select public.confere('1 crítico: e não mexe no futuro', (select etapa from public.tarefas where id = '$(id futuro)') = 'aprovado');
-- alarme tocando com o interruptor desligado: se apaga e NÃO chama a função
select private.alarme_tocou('postar', '$(id futuro)'::uuid, 0);
select public.confere('1 crítico: alarme com a postagem desligada não chama função nenhuma', (select count(*) from net.chamadas) = 0);
select public.confere('1 crítico: e se apaga (não fica sentinela)', not exists (select 1 from cron.job where jobname = 'tarefas_postar_' || '$(id futuro)'));
SQL
qq <<SQL
-- 3 alto: anexo antigo
select public.confere('3 alto: Postado com anexo ANTIGO não ganhou alarme de limpeza', not exists (select 1 from cron.job where jobname = 'tarefas_limpar_' || '$(id antigo)'));
select public.confere('3 alto: o Postado de antes ganhou a data real de entrada (postado_em)', (select postado_em is not null from public.tarefas where id = '$(id antigo)'));
select private.alarme_tocou('limpar', '$(id antigo)'::uuid, 0);
select public.confere('3 alto: a limpeza não chama a função drive para card só com anexo antigo', (select count(*) from net.chamadas) = 0);
select public.confere('3 alto: o anexo antigo continua lá', exists (select 1 from public.arquivos where tarefa_id = '$(id antigo)' and drive_id is null));
-- arquivo do Drive no card: ao virar Postado, arma a limpeza
insert into public.arquivos (tarefa_id, drive_id, nome, tipo, tamanho, criado_por)
  select id, 'drive-x', 'v.mp4', 'video', 5, (select id from public.pessoas where slug = 'natham') from public.prova_ids where rotulo = 'edicao';
update public.tarefas set etapa = 'postado' where id = '$(id edicao)';
select public.confere('3 alto: card com arquivo do Drive que vira Postado ganha a limpeza de 7 dias', exists (select 1 from cron.job where jobname = 'tarefas_limpar_' || '$(id edicao)'));
select public.confere('8 médio: postado_em gravado ao entrar em Postado', (select abs(extract(epoch from now() - postado_em)) < 5 from public.tarefas where id = '$(id edicao)'));
update public.tarefas set postado_em = now() - interval '30 days' where id = '$(id edicao)';
select public.confere('8 médio: ninguém reescreve postado_em de card que já está Postado', (select abs(extract(epoch from now() - postado_em)) < 5 from public.tarefas where id = '$(id edicao)'));
update public.tarefas set etapa = 'edicao' where id = '$(id edicao)';
select public.confere('8 médio: sair de Postado apaga postado_em e a limpeza', (select postado_em is null from public.tarefas where id = '$(id edicao)') and not exists (select 1 from cron.job where jobname = 'tarefas_limpar_' || '$(id edicao)'));
-- 4 alto: o que a versão publicada permite
select public.confere('4 alto: card Roteiro arrastado até Postado ficou Postado (o banco não recusou)', (select etapa from public.tarefas where id = '$(id roteiro)') = 'postado');
update public.tarefas set titulo = 'prova roteiro editado' where id = '$(id roteiro)';
select public.confere('4 alto: e dá para editar esse card depois', (select titulo from public.tarefas where id = '$(id roteiro)') = 'prova roteiro editado');
do \$\$ begin
  update public.tarefas set etapa = 'aprovado', postar_em = '2030-01-01T10:00' where id = '$(id roteiro)';
  perform public.confere('4 alto: card não-Postagem também pode ir para Aprovado (publicada permite arrastar)', true);
  perform public.confere('4 alto: mas só Postagem ganha alarme de postar', not exists (select 1 from cron.job where jobname = 'tarefas_postar_' || '$(id roteiro)'));
exception when others then perform public.confere('4 alto: card não-Postagem em Aprovado', false, sqlerrm); end \$\$;
SQL
qq <<'SQL'
-- 7 médio: exclusividade de dono em arquivos
do $$
declare n uuid := (select id from public.pessoas where slug = 'natham'); t uuid := (select id from public.prova_ids where rotulo = 'antigo'); p uuid; v text;
begin
  insert into public.pecas (empresa_id, tipo, titulo, criado_por) values ('you', 'post', 'peça prova', n) returning id into p;
exception when others then p := null; end $$;
SQL
q -c "select public.confere('7 médio: pasta livre e Tema existem como colunas', (select count(*) from information_schema.columns where table_name = 'arquivos' and column_name in ('pasta_livre_id', 'ocasiao_id', 'empresa_id')) = 3)"
qq <<SQL
do \$\$
declare n uuid := (select id from public.pessoas where slug = 'natham'); t uuid := '$(id antigo)'; p uuid; r text;
begin
  select id into p from public.pecas limit 1;
  if p is null then insert into public.pecas (empresa_id, tipo, titulo, criado_por) values ('you', 'post', 'peça prova', n) returning id into p; end if;
  begin insert into public.arquivos (tarefa_id, peca_id, drive_id, nome, tipo, tamanho) values (t, p, 'drive-dois-donos', 'a.png', 'imagem', 1);
    perform public.confere('7 médio: card E peça ao mesmo tempo é recusado', false); exception when check_violation then perform public.confere('7 médio: card E peça ao mesmo tempo é recusado', true); end;
  begin insert into public.arquivos (tarefa_id, empresa_id, drive_id, nome, tipo, tamanho) values (t, 'you', 'drive-card-e-solto', 'a.png', 'imagem', 1);
    perform public.confere('7 médio: card E documento solto ao mesmo tempo é recusado', false); exception when check_violation then perform public.confere('7 médio: card E documento solto ao mesmo tempo é recusado', true); end;
  begin insert into public.arquivos (peca_id, empresa_id, drive_id, nome, tipo, tamanho) values (p, 'you', 'drive-peca-e-solto', 'a.png', 'imagem', 1);
    perform public.confere('7 médio: peça E documento solto ao mesmo tempo é recusado', false); exception when check_violation then perform public.confere('7 médio: peça E documento solto ao mesmo tempo é recusado', true); end;
  begin insert into public.arquivos (nome, tipo, tamanho, drive_id) values ('a.png', 'imagem', 1, 'drive-sem-dono');
    perform public.confere('7 médio: arquivo sem dono nenhum é recusado', false); exception when check_violation then perform public.confere('7 médio: arquivo sem dono nenhum é recusado', true); end;
  begin insert into public.arquivos (empresa_id, nome, tipo, tamanho) values ('you', 'a.png', 'imagem', 1);
    perform public.confere('7 médio: documento solto sem Drive é recusado', false); exception when check_violation or not_null_violation then perform public.confere('7 médio: documento solto sem Drive é recusado', true); end;
  insert into public.pastas_livres (empresa_id, nome) values ('you', 'Logos') returning id into r;
  insert into public.arquivos (empresa_id, pasta_livre_id, drive_id, nome, tipo, tamanho) values ('you', r::uuid, 'drive-livre', 'logo.png', 'imagem', 1);
  insert into public.arquivos (empresa_id, formato, drive_id, nome, tipo, tamanho) values ('you', 'reels', 'drive-solto', 'x.pdf', 'documento', 1);
  begin insert into public.arquivos (empresa_id, pasta_livre_id, formato, drive_id, nome, tipo, tamanho) values ('you', r::uuid, 'reels', 'drive-livre-formato', 'a.png', 'imagem', 1);
    perform public.confere('7 médio: pasta livre com formato é recusado', false); exception when check_violation then perform public.confere('7 médio: pasta livre com formato é recusado', true); end;
  perform public.confere('7 médio: pasta livre e documento solto de Tema entram', (select count(*) from public.arquivos where drive_id in ('drive-livre', 'drive-solto')) = 2);
  insert into public.arquivos (tarefa_id, drive_id, nome, tipo, tamanho) values (t, 'drive-do-card', 'card.png', 'imagem', 1);
  perform public.confere('7 médio: arquivo de card (Drive) entra', true);
end \$\$;
SQL

# ---- 3. Quem pode (banco)
qq <<'SQL'
do $$
declare un uuid := gen_random_uuid(); um uuid := gen_random_uuid(); ua uuid := gen_random_uuid(); lid uuid; r boolean;
begin
  insert into auth.users (id, instance_id, aud, role, email) values (un, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natham.monteiro@youcontabilidade.com');
  insert into auth.users (id, instance_id, aud, role, email) values (um, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matheus.germano@assessoriabeec.com.br');
  insert into auth.users (id, instance_id, aud, role, email) values (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adrian@exemplo.invalid');
  update public.pessoas set user_id = un where slug = 'natham'; update public.pessoas set user_id = um where slug = 'matheus'; update public.pessoas set user_id = ua where slug = 'adrian';
  create table public.prova_u as select un, um, ua;
end $$;
SQL
qq <<'SQL'
do $$
declare u record; v boolean; pasta uuid;
begin
  select * into u from public.prova_u;
  insert into public.pastas_livres (empresa_id, nome, permanente) values ('you', 'Cadeado', true) returning id into pasta;
  perform set_config('request.jwt.claims', json_build_object('sub', u.ua, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.confere('6 médio: Adrian (login que não é Natham/Matheus) NÃO pode ligar Permanente', not public.pode_ligar_permanente());
  perform public.confere('6 médio: nem mexer nas pastas', not public.pode_mexer_pastas());
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u.um, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.confere('6 médio: Matheus pode ligar Permanente e mexer nas pastas', public.pode_ligar_permanente() and public.pode_mexer_pastas());
  begin perform public.definir_permanente_livre(pasta, false); perform public.confere('Matheus desliga cadeado da pasta livre (deveria ser recusado)', false);
  exception when insufficient_privilege then perform public.confere('Matheus NÃO desliga o cadeado da pasta livre (o banco recusa)', true); end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u.un, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.definir_permanente_livre(pasta, false);
  perform public.confere('Natham desliga o cadeado', not (select permanente from public.pastas_livres where id = pasta));
  reset role;
  update public.pastas_livres set permanente = true where id = pasta;
  begin delete from public.pastas_livres where id = pasta; perform public.confere('o gatilho barra apagar pasta com cadeado (até a chave de serviço)', false);
  exception when insufficient_privilege then perform public.confere('o gatilho barra apagar pasta com cadeado (até a chave de serviço)', true); end;
end $$;
SQL

# ---- 4. A função postar-meta foi implantada: cola o 019b
qq <<'SQL'
do $$
declare n uuid := (select id from public.pessoas where slug = 'natham'); t uuid; rot text;
begin
  create table public.prova_ids2 (rotulo text, id uuid);
  for rot, t in select x.rot, null::uuid from (values ('vencido2'), ('proximo2'), ('futuro2'), ('minuto_atual')) as x(rot) loop
    insert into public.tarefas (titulo, tipo, empresa_id, etapa, responsavel_id, dono_id, criado_por, aprovador, postar_em)
    values ('prova ' || rot, 'postagem', 'you', 'aprovado', n, n, n, 'Natham',
      to_char(now() at time zone 'America/Sao_Paulo' + case rot when 'vencido2' then interval '-10 minutes' when 'proximo2' then interval '1 minute' when 'minuto_atual' then interval '0' else interval '3 hours' end, 'YYYY-MM-DD"T"HH24:MI'))
    returning id into t;
    insert into public.prova_ids2 values (rot, t);
  end loop;
end $$;
SQL
# Antes do 019b os cards que vencem são movidos pelo relógio antigo (nenhum fica parado): 'minuto_atual' e 'vencido2' viram Postado
qq -c "select private.postar_vencidos()"
id2() { q -c "select id from public.prova_ids2 where rotulo = '$1'"; }
qq <<SQL
select public.confere('2 alto: antes do 019b o relógio antigo move o vencido e o do minuto atual (nenhum fica sem relógio)', (select count(*) from public.tarefas where id in ('$(id2 vencido2)', '$(id2 minuto_atual)') and etapa = 'postado') = 2);
SQL
# volta os dois para Aprovado (como se a colagem pegasse cards vencidos no instante do 019b)
qq <<SQL
update public.tarefas set etapa = 'aprovado', postar_em = to_char(now() at time zone 'America/Sao_Paulo' - interval '5 minutes', 'YYYY-MM-DD"T"HH24:MI') where id = '$(id2 vencido2)';
update public.tarefas set etapa = 'aprovado', postar_em = to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI') where id = '$(id2 minuto_atual)';
delete from net.chamadas;
SQL
cola supabase/_colar/019b_ligar_postagem_automatica.sql
cola supabase/_colar/019b_ligar_postagem_automatica.sql   # idempotente
qq <<SQL
select public.confere('1 crítico: 019b liga o interruptor', private.postagem_automatica());
select public.confere('1 crítico: 019b tira o relógio de todo minuto', not exists (select 1 from cron.job where jobname = 'tarefas_postar_vencidos'));
select public.confere('2 alto: card JÁ VENCIDO no momento da colagem tocou na hora (chamou a função)', exists (select 1 from net.chamadas where body ->> 'tarefa_id' = '$(id2 vencido2)' and url like '%postar-meta'));
select public.confere('2 alto: card do minuto ATUAL também tocou na hora', exists (select 1 from net.chamadas where body ->> 'tarefa_id' = '$(id2 minuto_atual)'));
select public.confere('2 alto: card a ≤ 1 minuto ganhou alarme no PRÓXIMO minuto cheio (não no ano que vem)',
  (select schedule from cron.job where jobname = 'tarefas_postar_' || '$(id2 proximo2)') =
  (select format('%s %s %s %s *', extract(minute from d)::int, extract(hour from d)::int, extract(day from d)::int, extract(month from d)::int)
     from (select date_trunc('minute', now() at time zone 'UTC') + interval '1 minute' as d) x)
  or (select schedule from cron.job where jobname = 'tarefas_postar_' || '$(id2 proximo2)') like '% % % % *');
select public.confere('2 alto: card futuro tem alarme', exists (select 1 from cron.job where jobname = 'tarefas_postar_' || '$(id2 futuro2)'));
select public.confere('1 crítico: com a postagem ligada o relógio antigo (se alguém o chamar) não faz nada', private.postar_vencidos() = 0);
SQL
echo; q -c "select case when ok then 'ok    ' else 'FALHOU' end || ' · ' || nome || coalesce(nullif(' [' || detalhe || ']', ' []'), '') from public.prova order by ok, nome" | sed 's/^/  /'
q -c "select 'FALHAS: ' || count(*) filter (where not ok) || ' de ' || count(*) from public.prova"
