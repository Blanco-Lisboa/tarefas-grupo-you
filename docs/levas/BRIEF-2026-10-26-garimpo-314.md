# BRIEF — Garimpo · item 314 BUG (Tarefas, 26/10/2026) — URGENTE, o Matheus está usando agora

Projeto: `Desktop/Sistemas-Grupo-You/grade-conteudo`. Leia o `CLAUDE.md` dele antes de tudo. Supabase do Tarefas = `uruhjlurcxpjhhgvuzwt` (NUNCA o do CRM).
Relato e print: `docs/levas/2026-10-18-grade-de-conteudo-beec.md`, item 314; `docs/referencias/2026-10-26-314-card-some-em-analise.png`.

## Sintoma
Matheus clica no + da coluna "Em análise", preenche o card, sobe o vídeo. O painel de envio mostra "Reunião com Junio — Enviado" e "Reunião junio - 1 — 100%", mas o card NÃO aparece na Esteira (some).

## O que fazer (diagnóstico antes de consertar — causa raiz, não sintoma)
1. Produção, SÓ LEITURA: ache as linhas desses cards (`tarefas` criadas hoje pelo Matheus, títulos "Reunião com Junio" / "Reunião junio - 1", e os `arquivos` ligados). Eles existem? Com que etapa, empresa, dono, deleted/arquivado? Estão aparecendo em outro lugar (Caderno "Sem data", Mapa)?
2. Reproduza o caminho real na 3101 (`npm run exemplo`): + em "Em análise" → preencher → anexar vídeo → salvar. Compare com o + de outras colunas. Suspeitas a confirmar ou descartar: card criado sem empresa vira tarefa de Caderno (regra "conteúdo = etapa E empresa"); a ficha nova manda etapa errada / o gatilho de etapa reescreve; o envio do vídeo cria/salva o card por outro caminho que perde a etapa; o Duplicar (310/313, publicado hoje) mexeu na criação.
3. Conserte a causa no código. Se precisar de SQL, arquivo em `supabase/_colar/`, app funcionando antes e depois.
4. Os cards do Matheus que sumiram: NÃO altere nem apague dado de produção. Diga onde estão e qual UPDATE os traria de volta — o Maestro pede ok ao Natham.

## Regras
- Não publique. Commit local pelo index, na branch atual. Outras pessoas podem estar no repo: não desfaça nada de ninguém.
- Prova: `npm run check` verde + foto na 3101 do card criado em "Em análise" com vídeo, aparecendo na coluna depois de salvar e depois de recarregar. Nada de mexer no mouse; Chrome de teste fora da tela. Ao terminar, desligue a 3101/3201.
- Atualize o item 314 na leva (causa, sha, prova) e commite a leva.
- Ao terminar: `maestri ask "Claude Code" "<causa raiz, sha, onde estão os cards do Matheus e o UPDATE proposto, caminho da foto>"`.
