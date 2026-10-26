#!/bin/sh
# PROVA do 315 (calendário de postagens, Etapa 1 banco) num Postgres 17 local com stubs (docker). Não toca em nada real.
# Estado de produção de 26/10: rodar.sh (001..016, 020, 021) + os _colar já colados (019, 022, 024..029, 292..312), menos o gatilho do 029 que
# a produção ainda não tem (conferido por SELECT em 26/10: colunas, travas, gatilhos e corpos de função de tarefas iguais aos da produção).
# Depois cola o 315 DUAS vezes (idempotente) e roda supabase/prova_315_pauta.sql. Uso (na pasta grade-conteudo): sh supabase/prova_local/prova_315.sh
set -e
sh supabase/prova_local/rodar.sh > /dev/null 2>&1
psqlf() { sed -E '/create extension.*(pg_net|pg_cron|supabase_vault)/Id' "$1" | docker exec -i pg236 psql -U postgres -v ON_ERROR_STOP=1 -q -f - > /dev/null 2>&1 || { echo "ERRO ao colar $1"; exit 1; }; }
docker exec pg236 psql -U postgres -q -c "create publication supabase_realtime" > /dev/null 2>&1
for f in 019_postagem_drive 022-tags-trava 024-ideias-no-banco 025-ideias-varios-links 027-matheus-aprova-conserto-legendado 026-adrian-vira-usuario 028-tempo-real 029-card-so-pela-esteira \
  2026-10-22-292-linha-caderno 2026-10-22-296-cor-da-linha 2026-10-23-298-ordem-das-colunas 2026-10-23-300-prints-das-ideias 2026-10-26-312-tu-ecom; do psqlf "supabase/_colar/$f.sql"; done
docker exec pg236 psql -U postgres -q -c "drop trigger tarefas_so_esteira_apaga on public.tarefas"
psqlf supabase/_colar/2026-10-26-315-01-pauta.sql && echo "colagem 1 do 315: sem erro"
psqlf supabase/_colar/2026-10-26-315-01-pauta.sql && echo "colagem 2 do 315: sem erro (idempotente)"
docker exec -i pg236 psql -U postgres -v ON_ERROR_STOP=1 -q -P pager=off -f - < supabase/prova_315_pauta.sql 2>&1 | grep -v -e NOTICE -e WARNING
