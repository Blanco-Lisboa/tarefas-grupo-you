# RETOMADA · Tarefas · rodada do Caderno, 22/10 noite (itens 291–297)

## Estado
- **291–297 NO AR** (último deploy `dpl_33puzsKE…`, READY). Executor de tudo: Pena. Maestro só registrou/conferiu foto.
  - 291: hora no meio da faixa e centralizada entre a borda da folha e a linha azul (coluna 54px).
  - 292/293/294: Sem data = tarefa em qualquer linha, nas duas páginas, soltar em cima troca; folha idêntica à do Dia (sem horas). Coluna `tarefas.linha_caderno` (SQL 292 COLADO).
  - 295: "volta para a esquerda ao recarregar" = SQL 292 ainda não colado. Resolvido ao colar.
  - 296: menu ⋮ → "Cor da linha" (azul, roxo, dourado, vermelho, verde, rosa, sem cor) com o efeito da reunião. Coluna `tarefas.cor_linha` (SQL 296 COLADO). cd1bc8a: aviso quando a gravação não acha a linha; "coluna ausente" expira em 1 min.
  - 297: brilho de todas as linhas no mesmo compasso (03caf00).
- Nada pendente desta rodada.

## Abertos que vêm de antes (não mexidos hoje)
- 286 (notas do Matheus: modo escuro, marcar feito na agenda) — perguntado, sem resposta. Não existe tema escuro no Tarefas (Pena conferiu).
- 026 (conta do Adrian) e 029 (trava: card de conteúdo só se apaga pela Esteira) NÃO colados.
- Spend cap do Supabase = decisão dele (item 289).

## Lições
- "Some ao recarregar" depois de um item com SQL novo = quase sempre SQL não colado. Mandar a Pena conferir a coluna (só leitura) ANTES de mexer em código; depois de colar, o Natham precisa recarregar a aba.
- `scripts/publicar.sh`: o `rm` final da cópia `.publicar-auto` dá "Device or resource busy" e o comando sai com "failed", mas o deploy fica READY. Limpar à mão (`rm -rf ../.publicar-auto && git worktree prune`). Conserto do script = pendente (proposto).
- Mensagem para recruta Claude OCUPADO: `maestri ask X --raw "<texto>"` + `--raw "\r"` entra na fila dele ("queued") e ele lê ao terminar — funcionou.
