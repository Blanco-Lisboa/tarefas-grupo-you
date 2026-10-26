# Brief — Chaveiro — item 315, ETAPA 1 BANCO (solo)

Projeto: `C:\Users\Natham Monteiro\Desktop\Sistemas-Grupo-You\grade-conteudo` (sistema Tarefas; Supabase `uruhjlurcxpjhhgvuzwt` — NUNCA o do CRM `xtclayekvviccrasxgos`).
Leia: item 315 (e sub-linhas) em `docs/levas/2026-10-18-grade-de-conteudo-beec.md`, o estudo `docs/levas/2026-10-26-315-ESTUDO.md` e o plano `docs/levas/2026-10-26-315-PLANO.md`.

Faça a **Etapa 1 — Terminal BANCO** do plano, exatamente no território descrito lá (SQL em `supabase/_colar/`, prova, `src/lib/dados/postagens-planejadas.ts` + teste + export no index). Não toque nos arquivos das etapas 2A/2B.

Regras:
- NÃO aplique nada na produção (nem apply_migration, nem execute_sql de escrita). Na produção, só SELECT de leitura (corpo de função com `pg_get_functiondef`, colunas, crons). O Natham cola o SQL depois.
- Prova sem dado falso na produção: transação com rollback numa cópia local ou `supabase/prova_local`, como o plano diz. Se não houver como provar algo, diga qual item ficou sem prova.
- Função que já existe e precisar mudar = partir do corpo de PRODUÇÃO.
- O app tem de funcionar antes e depois da colagem (`funcaoAusente`).
- Tarefas NÃO tem tema escuro e é só PC.
- Commits com prefixo "315-banco:". Atualize a sub-linha do 315 na leva com o que ficou pronto + sha + prova, e commite.
Resposta final (até 8 linhas): o que ficou pronto, o que a prova mostrou, nome do arquivo SQL para o Natham colar, e o que ficou sem prova.
- REGRA dele (26/10): nenhum arquivo, anexo ou imagem no Supabase/Storage; só linhas de texto. Vídeos e arquivos continuam no Drive.
