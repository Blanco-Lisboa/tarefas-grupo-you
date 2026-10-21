#!/bin/sh
# PROVA do 022 (trava das tags + contagem, item 243) num Postgres 17 local com stubs (docker), no estado de produção de hoje: 001..016, 020, 021, 019 v2, e então o 022.
# Uso (na pasta grade-conteudo, docker ligado): sh supabase/prova_local/prova_243.sh      Sai com ERRO (código 1) se qualquer conferência falhar. Não toca em nada real.
set -e
sh supabase/prova_local/rodar.sh > /dev/null 2>&1
q() { docker exec -i pg236 psql -U postgres -v ON_ERROR_STOP=1 -q -t -A "$@"; }
qq() { q "$@" > /dev/null; }
# cola um arquivo SQL e FALHA o script se o banco devolver ERROR
cola() {
  saida=$(sed -E '/create extension.*(pg_net|pg_cron|supabase_vault)/Id' "$1" | docker exec -i pg236 psql -U postgres -v ON_ERROR_STOP=1 -q -f - 2>&1 | grep -v NOTICE || true)
  case "$saida" in *ERROR*) echo "ERRO ao colar $1: $saida"; exit 1;; esac
}
q -c "create table public.prova (nome text, ok boolean, detalhe text);
create function public.confere(n text, c boolean, d text default '') returns void language sql as \$\$ insert into public.prova values (n, coalesce(c, false), d) \$\$;"
cola supabase/_colar/019_postagem_drive.sql

# usuários de mentira: Natham, Matheus e Adrian (login que NÃO é Natham nem Matheus) + um login sem pessoa
qq <<'SQL'
do $$
declare un uuid := gen_random_uuid(); um uuid := gen_random_uuid(); ua uuid := gen_random_uuid(); ux uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (un, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natham.monteiro@youcontabilidade.com'),
    (um, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matheus.germano@assessoriabeec.com.br'),
    (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adrian@exemplo.invalid'),
    (ux, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ninguem@exemplo.invalid');
  update public.pessoas set user_id = un where slug = 'natham';
  update public.pessoas set user_id = um where slug = 'matheus';
  update public.pessoas set user_id = ua where slug = 'adrian';
  create table public.prova_u as select un, um, ua, ux;
end $$;
SQL
# estado de hoje ANTES do 022: qualquer login mexe em qualquer tag (é o furo que o 022 fecha)
qq <<'SQL'
do $$
declare u record;
begin
  select * into u from public.prova_u;
  perform set_config('request.jwt.claims', json_build_object('sub', u.ua, 'role', 'authenticated')::text, true); set local role authenticated;
  insert into public.tags (id, nome, cor, aprovacao) values ('tag-teste-adrian', 'do Adrian', 'etiqueta-3', false);
  update public.tags set nome = 'Adrian mexeu' where id = 'tag-teste-adrian';
  perform public.confere('ANTES do 022: Adrian edita tag (o furo existe, por isso o 022)', (select nome from public.tags where id = 'tag-teste-adrian') = 'Adrian mexeu');
  delete from public.tags where id = 'tag-teste-adrian';
  reset role;
end $$;
SQL

cola supabase/_colar/022-tags-trava.sql
cola supabase/_colar/022-tags-trava.sql   # idempotente: 2ª vez sem erro

qq <<'SQL'
do $$
declare u record; v text; n int; t_priv uuid; t_nat uuid; t_pub uuid; adr uuid := (select id from public.pessoas where slug = 'adrian'); nat uuid := (select id from public.pessoas where slug = 'natham');
begin
  select * into u from public.prova_u;
  perform set_config('request.jwt.claims', '{}', true);  -- editor de SQL (sem login)
  insert into public.tags (id, nome, cor, aprovacao) values ('tag-comum', 'comum', 'etiqueta-3', false), ('tag-comum2', 'comum 2', 'etiqueta-4', false), ('tag-aprov-outra', 'outra de aprovação', 'etiqueta-5', true), ('tag-comum3', 'comum 3', 'etiqueta-6', false);

  -- ===== 2: Natham e Matheus editam e apagam tag comum
  perform set_config('request.jwt.claims', json_build_object('sub', u.un, 'role', 'authenticated')::text, true); set local role authenticated;
  update public.tags set nome = 'comum (Natham)' where id = 'tag-comum';
  perform public.confere('243-2: Natham edita tag comum', (select nome from public.tags where id = 'tag-comum') = 'comum (Natham)');
  delete from public.tags where id = 'tag-comum';
  perform public.confere('243-2: Natham apaga tag comum', not exists (select 1 from public.tags where id = 'tag-comum'));
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u.um, 'role', 'authenticated')::text, true); set local role authenticated;
  update public.tags set nome = 'comum 2 (Matheus)' where id = 'tag-comum2';
  perform public.confere('243-2: Matheus edita tag comum', (select nome from public.tags where id = 'tag-comum2') = 'comum 2 (Matheus)');
  delete from public.tags where id = 'tag-comum2';
  perform public.confere('243-2: Matheus apaga tag comum', not exists (select 1 from public.tags where id = 'tag-comum2'));
  reset role;

  -- ===== 2: Adrian (login que não é Natham/Matheus): lê e cria como hoje, NÃO edita nem apaga
  perform set_config('request.jwt.claims', json_build_object('sub', u.ua, 'role', 'authenticated')::text, true); set local role authenticated;
  perform public.confere('243-2: Adrian continua LENDO as tags', (select count(*) from public.tags) >= 2);
  insert into public.tags (id, nome, cor, aprovacao) values ('tag-do-adrian', 'criada pelo Adrian', 'etiqueta-7', false);
  perform public.confere('243-2: Adrian continua CRIANDO tag', exists (select 1 from public.tags where id = 'tag-do-adrian'));
  begin update public.tags set nome = 'x' where id = 'tag-comum3'; perform public.confere('243-2: Adrian NÃO edita tag', false);
  exception when insufficient_privilege then perform public.confere('243-2: Adrian NÃO edita tag (mensagem em português)', sqlerrm like 'Só o Natham ou o Matheus%'); end;
  begin delete from public.tags where id = 'tag-comum3'; perform public.confere('243-2: Adrian NÃO apaga tag', false);
  exception when insufficient_privilege then perform public.confere('243-2: Adrian NÃO apaga tag', true); end;
  begin update public.tags set nome = 'x' where id = 'tag-do-adrian'; perform public.confere('243-2: nem a tag que ele mesmo criou', false);
  exception when insufficient_privilege then perform public.confere('243-2: nem a tag que ele mesmo criou (só Natham e Matheus mexem)', true); end;
  reset role;
  perform public.confere('243-2: a tag de Adrian não mudou', (select nome from public.tags where id = 'tag-comum3') = 'comum 3');

  -- ===== 1: a tag de aprovação ninguém altera nem apaga (Natham, Matheus e o editor de SQL)
  perform set_config('request.jwt.claims', json_build_object('sub', u.un, 'role', 'authenticated')::text, true); set local role authenticated;
  begin update public.tags set nome = 'renomeada' where id = 'tag-esperando-aprovacao'; perform public.confere('243-1: Natham NÃO edita a tag de aprovação', false);
  exception when insufficient_privilege then perform public.confere('243-1: Natham NÃO edita a tag de aprovação (mensagem em português)', sqlerrm like '%Esperando aprovação%não pode ser editada nem apagada%'); end;
  begin delete from public.tags where id = 'tag-esperando-aprovacao'; perform public.confere('243-1: Natham NÃO apaga a tag de aprovação', false);
  exception when insufficient_privilege then perform public.confere('243-1: Natham NÃO apaga a tag de aprovação', true); end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u.um, 'role', 'authenticated')::text, true); set local role authenticated;
  begin delete from public.tags where id = 'tag-esperando-aprovacao'; perform public.confere('243-1: Matheus NÃO apaga a tag de aprovação', false);
  exception when insufficient_privilege then perform public.confere('243-1: Matheus NÃO apaga a tag de aprovação', true); end;
  begin update public.tags set aprovacao = false where id = 'tag-esperando-aprovacao'; perform public.confere('243-1: Matheus NÃO desliga o aprovacao da tag', false);
  exception when insufficient_privilege then perform public.confere('243-1: Matheus NÃO desliga o "aprovacao" da tag', true); end;
  reset role;
  perform set_config('request.jwt.claims', '{}', true);
  begin delete from public.tags where id = 'tag-esperando-aprovacao'; perform public.confere('243-1: nem o editor de SQL apaga a tag de aprovação', false);
  exception when insufficient_privilege then perform public.confere('243-1: nem o editor de SQL / chave de serviço apaga a tag de aprovação', true); end;
  begin delete from public.tags where id = 'tag-aprov-outra'; perform public.confere('243-1: outra tag com aprovacao=true também é protegida', false);
  exception when insufficient_privilege then perform public.confere('243-1: outra tag com aprovacao=true também é protegida', true); end;
  perform public.confere('243-1: a tag de aprovação continua lá, intacta', (select nome from public.tags where id = 'tag-esperando-aprovacao') = 'Esperando aprovação');
  -- a marcação nos cards NÃO some (a exclusão que a apagaria em cascata foi barrada)
  insert into public.tarefas (titulo, tipo, empresa_id, etapa, responsavel_id, dono_id, criado_por, aprovador) values ('card com a tag de aprovação', 'postagem', 'you', 'analise', nat, nat, nat, 'Natham') returning id into t_pub;
  insert into public.tarefa_tags (tarefa_id, tag_id) values (t_pub, 'tag-esperando-aprovacao');
  begin delete from public.tags where id = 'tag-esperando-aprovacao'; exception when insufficient_privilege then null; end;
  perform public.confere('243-1: e a marcação dos cards continua (nada apagado em cascata)', exists (select 1 from public.tarefa_tags where tag_id = 'tag-esperando-aprovacao'));

  -- ===== 3: contagem inclui os cards que quem pergunta NÃO vê
  insert into public.tarefas (titulo, tipo, responsavel_id, dono_id, criado_por) values ('privado do Adrian', 'outro', adr, adr, adr) returning id into t_priv;  -- caderno do Adrian: o Natham não lê
  insert into public.tags (id, nome, cor, aprovacao) values ('tag-contada', 'contada', 'etiqueta-8', false);
  insert into public.tarefa_tags (tarefa_id, tag_id) values (t_priv, 'tag-contada'), (t_pub, 'tag-contada');
  perform set_config('request.jwt.claims', json_build_object('sub', u.un, 'role', 'authenticated')::text, true); set local role authenticated;
  select count(*) into n from public.tarefa_tags where tag_id = 'tag-contada';
  perform public.confere('243-3: sem a função, o Natham só enxerga ' || n || ' dos 2 cards (por isso a função)', n = 1);
  perform public.confere('243-3: contar_cards_da_tag conta os 2 (inclui o card privado do Adrian)', public.contar_cards_da_tag('tag-contada') = 2);
  perform public.confere('243-3: tag que ninguém usa = 0', public.contar_cards_da_tag('tag-do-adrian') = 0);
  perform public.confere('243-3: tag que não existe = 0 (não dá erro)', public.contar_cards_da_tag('nao-existe') = 0);
  perform public.confere('243-3: devolve só um número (inteiro)', pg_typeof(public.contar_cards_da_tag('tag-contada'))::text = 'integer');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u.ux, 'role', 'authenticated')::text, true); set local role authenticated;
  begin perform public.contar_cards_da_tag('tag-contada'); perform public.confere('243-3: login sem pessoa NÃO conta', false);
  exception when insufficient_privilege then perform public.confere('243-3: login sem pessoa NÃO conta', true); end;
  reset role;
  perform set_config('request.jwt.claims', '{}', true); set local role anon;
  begin perform public.contar_cards_da_tag('tag-contada'); perform public.confere('243-3: anônimo NÃO conta', false);
  exception when insufficient_privilege then perform public.confere('243-3: anônimo NÃO conta', true); end;
  reset role;
  -- cascata normal de tag comum apagada por Natham continua funcionando (tira só as marcações dela)
  perform set_config('request.jwt.claims', json_build_object('sub', u.un, 'role', 'authenticated')::text, true); set local role authenticated;
  delete from public.tags where id = 'tag-contada';
  reset role;
  perform public.confere('243: apagar tag comum (Natham) tira só as marcações dela', not exists (select 1 from public.tarefa_tags where tag_id = 'tag-contada') and exists (select 1 from public.tarefa_tags where tag_id = 'tag-esperando-aprovacao'));
end $$;
SQL

echo; q -c "select case when ok then 'ok    ' else 'FALHOU' end || ' · ' || nome || coalesce(nullif(' [' || detalhe || ']', ' []'), '') from public.prova order by ok, nome" | sed 's/^/  /'
# PROVA_FORCAR_FALHA=1 insere uma conferência que falha de propósito (prova que o script sai com erro).
[ -n "$PROVA_FORCAR_FALHA" ] && qq -c "select public.confere('FALHA FORCADA (teste do próprio script)', false)"
total=$(q -c "select count(*) from public.prova")
falhas=$(q -c "select count(*) filter (where not ok) from public.prova")
echo "FALHAS: $falhas de $total"
[ "$falhas" = "0" ] || { echo "PROVA FALHOU: $falhas conferência(s)."; exit 1; }
