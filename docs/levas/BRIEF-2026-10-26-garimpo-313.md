# BRIEF — Garimpo · item 313 (Tarefas, 26/10/2026)

Projeto: `Desktop/Sistemas-Grupo-You/grade-conteudo`. Leia o `CLAUDE.md` dele antes de tudo.
Pedido literal: `docs/levas/2026-10-18-grade-de-conteudo-beec.md`, item 313. Contexto: você fez o 310 (botão Duplicar no pé da ficha, commit 4869ba9).

## 313 · Duplicar pede confirmação
- Clicar em Duplicar abre uma confirmação ("Duplicar este card?" + título que a cópia vai ganhar, ex.: "Reunião X - Cópia 2"), com Duplicar e Cancelar.
- Use o MESMO componente/padrão de confirmação que o sistema já tem (lixeira do card, confirmar Postado). Não invente estilo novo.
- Só cria a cópia ao confirmar. Cancelar/Esc fecha sem fazer nada.

## Regras
- Não publique. Commit local na branch atual, pelo index.
- Prova: `npm run check` verde + foto da confirmação aberta (3101 de exemplo). Nada de mexer no mouse; Chrome de teste fora da tela.
- Atualize o item 313 na leva (FEITO + sha + prova) e commite a leva.
- Ao terminar: `maestri ask "Claude Code" "<sha, componente reaproveitado, caminho da foto>"`.
