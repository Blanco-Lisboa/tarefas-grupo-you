# Brief do Sextante (20/10) · item 159

Projeto: `Desktop/Sistemas-Grupo-You/grade-conteudo`. Leia `AGENTS.md` e `docs/design.md`. Item 159 na leva `docs/levas/2026-10-18-grade-de-conteudo-beec.md` (palavras do Natham lá).
Commit pelo índice, sem trocar de branch, sem publicar, sem push. Atualize o estado do 159 na leva ao terminar.

## O pedido

Na ficha da tarefa (`src/components/ficha/Ficha.tsx`, bloco "Quando", perto da linha 191), tirar o campo **Termina**. Fica só **Começa** (data + hora), em toda ficha (Calendário, Caderno, Conteúdos, Mapa: é a mesma ficha).

## Cuidados (decida e registre na leva)

- Tarefa antiga que já tem fim: não apague o fim calado. Se a pessoa muda o Começa, o fim anda junto mantendo a duração (senão o fim fica antes do começo). Tarefa nova: sem fim.
- Confira onde o `fim` é usado (calendário, caderno `grade.ts`/`moverPara`, Mapa) e que tarefa sem fim continua aparecendo certo em cada um (ex.: bloco de 30 min no calendário). Não mude essas telas se já funcionam; só confirme.
- Com o Termina fora, o rótulo pode virar só "Começa" ou "Data e hora": mantenha "Começa" (é a palavra que o Natham usou).
- Depois da linha da data, a ficha não pode ficar com buraco: confira o encaixe ao lado de "Responsável" (item 154 mudou essa linha em `ficha.css`).

## Prova

Tela logada sem login de verdade: siga a seção "Como fotografar tela logada" de `docs/levas/BRIEF-2026-10-20-alvenaria-157-158.md` (banco de mentira em `provas/r7-caderno-cartao/banco-falso.mjs`, app em 3199; o 3100 é do Natham, não mexa). Fotos da ficha aberta (nova e de uma tarefa existente) em 1903x900, 1440x760 e 390 com innerWidth na imagem, em `provas/r9-so-comeca/`. Prove também que mudar o Começa de uma tarefa com fim leva o fim junto (leia o que seria salvo). `npm run lint`, `npm run typecheck`, `npm test` e, no fim, `npm run build` normal (sem as variáveis falsas). Pare o 3199 e o 3299 no fim.

## Resposta final

Até 4 linhas: o que fez, como ficou a tarefa antiga com fim, sha, pendências. Não use `maestri ask` para reportar.
