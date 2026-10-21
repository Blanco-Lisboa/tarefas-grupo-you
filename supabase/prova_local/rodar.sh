#!/bin/sh
# Sobe um Postgres 17 local (docker) e aplica stubs + 001..016 + 020 + 021: o estado de PRODUÇÃO de hoje (sem o 019). As provas (prova_236.sh) colam o 019 e o 019b por cima.
# Uso (na pasta grade-conteudo): sh supabase/prova_local/rodar.sh   ·   Para apagar: docker rm -f pg236
set -e
docker rm -f pg236 >/dev/null 2>&1 || true
docker run -d --name pg236 -e POSTGRES_PASSWORD=x -p 54329:5432 postgres:17 >/dev/null
until docker exec pg236 pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done; sleep 2
# as linhas "create extension pg_net/pg_cron/vault" saem: os stubs já fazem o papel delas
psqlf() { sed -E '/create extension.*(pg_net|pg_cron|supabase_vault)/Id' "$1" | docker exec -i pg236 psql -U postgres -v ON_ERROR_STOP=1 -q -f -; }
psqlf supabase/prova_local/stubs.sql
for f in supabase/001_*.sql supabase/002_*.sql supabase/003_*.sql supabase/004_*.sql supabase/005_*.sql supabase/006_*.sql supabase/007_*.sql supabase/008_*.sql supabase/009_*.sql supabase/010_*.sql supabase/011_*.sql supabase/012_*.sql supabase/013_*.sql supabase/014_*.sql supabase/015_*.sql supabase/016_*.sql supabase/_colar/020-*.sql supabase/_colar/021-*.sql; do
  echo "== $f"; psqlf "$f"
done
