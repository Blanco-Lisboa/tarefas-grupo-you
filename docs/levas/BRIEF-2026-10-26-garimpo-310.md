# BRIEF — Garimpo · item 310 (Tarefas, 26/10/2026)

Projeto: `Desktop/Sistemas-Grupo-You/grade-conteudo`. Leia o `CLAUDE.md` dele antes de tudo.
Pedido literal: `docs/levas/2026-10-18-grade-de-conteudo-beec.md`, item 310.

## 310 · Duplicar card na Esteira
O Natham grava vídeos em sequência ("Reunião X - Video 1", "Reunião X - Video 2"). Quer DUPLICAR um card para ganhar velocidade.
- Onde: opção "Duplicar" no card da Esteira (onde já ficam as ações do card — menu ⋮ ou ficha; escolha o lugar que já existe e é mais natural, e diga qual).
- Título da cópia: `<título> - Cópia N`. N = próximo número livre: duplicou "Reunião X" → "Reunião X - Cópia 1"; duplicou de novo → "Reunião X - Cópia 2". Duplicar uma cópia ("Reunião X - Cópia 1") também conta a partir da base "Reunião X" (vira "Cópia 3", não "Cópia 1 - Cópia 1").
- Copia: empresa, formato/tipo, rede social, responsável, tema, descrição/roteiro, tags, cor — os dados "de planejamento".
- NÃO copia: anexos/vídeos/arquivos, pasta do Drive, aprovações, agendamento/postagem (postar_em, postado_em, ids da Meta), histórico. Cada vídeo da sequência tem o seu.
- Coluna: a cópia entra na MESMA coluna do original; se o original estiver em Aprovado ou Postado, a cópia entra na primeira coluna (Roteiro) — default do Maestro, registre na leva.
- Respeite as regras de banco que já existem (RLS, gatilhos de etapa, `pode_*`). Se precisar de SQL, arquivo em `supabase/_colar/` e o app tem que funcionar ANTES e DEPOIS do Natham colar.

## Regras
- Não publique (sem push, sem deploy). Commit local na branch atual (não troque de branch).
- Prova: `npm run check` verde + foto (cópia de exemplo 3101 via `npm run exemplo`, ou 3100) mostrando o card original e as cópias "- Cópia 1" e "- Cópia 2" na coluna. Nada de mexer no mouse; Chrome de teste fora da tela.
- Atualize o estado do item 310 na leva (FEITO + sha + prova curta) e commite a leva.
- Ao terminar: `maestri ask "Claude Code" "<resultado curto: sha, onde ficou o botão, o que copia, caminho da foto, pendências>"`.
