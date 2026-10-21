# Alvenaria · item 229 · PLANO (sem código) — Drive e tela Pastas no formato do Natham

Use a skill /arquitetar (ritual de pré-implementação). Projeto `Desktop/Sistemas-Grupo-You/grade-conteudo`. Supabase do Tarefas = `uruhjlurcxpjhhgvuzwt` (NUNCA o do CRM). Não aplicar nada, não codar.
Leia o item 229 da leva (`docs/levas/2026-10-18-grade-de-conteudo-beec.md`) — decisão dele já registrada — e o 203 + RETOMADAs 23-24/10 + `supabase/_colar/019*`.

Decisão dele (resumo):
- Drive: Tarefas · Conteúdos → Empresa → Formato (Reels, Carrossel, Post, Stories...) → Tema (ou "Sem tema") → uma pasta por conteúdo ("<Formato> <tema> - <título>"), com os arquivos do card dentro.
- Tela Pastas mostra as MESMAS pastas, na mesma ordem (Empresa → Formato → Tema → conteúdos). Hoje ela é filtro no navegador (lib/dados/pastas.ts) — avaliar o que vira dado de banco e o que some (ex.: "Ideias de conteúdo", pastas avulsas tipo "Adrian - Aprovar").
- 7 dias depois de postado o conteúdo vai para a lixeira do Drive e some da tela Pastas (o card fica no Mapa como histórico).
- "Permanente" no Tema (padrão desligado; cadeado; liga/desliga no ⋮). Desligar = recomeça a contar 7 dias. Apagar card de propósito = arquivos vão junto mesmo em Tema permanente.

Entregue `docs/levas/2026-10-21-PLANO-229-drive-pastas.md`: o que muda em tela/banco/função drive/pg_cron/n8n; ordem de construção por território (quem faz o quê: Alvenaria base+banco, Vitral tela Pastas, Sextante ficha); SQL novo vai para UM arquivo em `supabase/_colar/` a ser colado pelo Natham, substituindo/ajustando o 019 (diga qual dos dois se cola); riscos (cards e pastas já existentes no Drive real, renomear título/formato/tema depois de criado = mover pasta?, formato trocado depois do upload); o que dá para provar no banco falso (3101); e no máximo 3 perguntas que só ele decide, descrevendo a TELA.
Commit `229-plano: ...`. Responda SÓ na mensagem final: caminho do plano + as perguntas.
