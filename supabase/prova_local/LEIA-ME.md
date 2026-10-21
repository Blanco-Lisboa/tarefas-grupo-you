# Prova do SQL num Postgres local

Peças de mentira (`stubs.sql`: auth, vault, pg_cron, pg_net, storage, papéis) + as migrações 001 a 016, 020 e 021 = o estado de produção de hoje, num Postgres 17 em docker.

- `sh supabase/prova_local/rodar.sh`: sobe o banco local (porta 54329, contêiner `pg236`) no estado de produção, sem o 019.
- `sh supabase/prova_local/prova_236.sh`: refaz tudo na ORDEM do Natham (cards já programados e Postados, 019 sem a função postar-meta, conferências, 019b, conferências). Termina com `FALHAS: 0`.
- Apagar: `docker rm -f pg236`. Nada disso toca no Supabase real.
