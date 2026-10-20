# Brief da Alvenaria (20/10) · item 168

Projeto `Desktop/Sistemas-Grupo-You/grade-conteudo`. Leia `AGENTS.md`, `docs/design.md` (identidade Névoa) e o item 168 na leva `docs/levas/2026-10-18-grade-de-conteudo-beec.md`. Commit pelo índice (só seus arquivos), sem publicar. A Régua mexe em `src/components/conteudos/` e o Vitral faz uma página em `src/app/modelos/fazendo-agora`: não toque lá.

## O pedido
As cores das 6 etapas (`--etapa-roteiro` ... `--etapa-postado` em `src/styles/etiquetas.css`; pintam o cabeçalho das colunas de Conteúdos, a trilha e o vidro do card, e também o Calendário: `calendario.css` `.etapa-*`) estão "femininas demais" (pastel). Ele quer **cores fortes, com presença: verde escuro, azul escuro etc., que façam sentido com a ID** (Névoa: azul `#0064CC`, texto `#1D1D1F`, cinzas frios).

Faça **3 paletas** para ele escolher, SEM trocar as cores de verdade ainda:
- Página `src/app/modelos/cores-etapas/page.tsx` (padrão da comparação da contorno: `git show ae144f2`) mostrando, para cada paleta, as 6 colunas como no quadro (cabeçalho com número, nome, contador e +, e um card de exemplo dentro, com a trilha das etapas), mais a paleta "Hoje" para comparar. Faça as cores pela variável `--etapa` em volta (ex.: `.paleta-a { --etapa-roteiro: … }`) para o resto do visual reagir igual.
- Com cor escura no cabeçalho, o texto do cabeçalho vira branco: contraste AA no mínimo (confira e escreva a razão de cada cor). A trilha e o vidro do card também usam a cor: veja se ficam bons ou se precisam de um tom mais claro derivado (anote).
- Ideias (varie de verdade): A) sóbria corporativa (azul-marinho, petróleo, verde floresta, grafite, âmbar queimado, vinho); B) tons do azul da ID + verdes (escala fria, com o azul #0064CC no centro); C) escuros vibrantes (azul royal, verde esmeralda, laranja queimado, roxo, teal, verde-oliva). Ordem das etapas tem que ler como avanço (Postado = "pronto").
- Endereço para ele: `http://127.0.0.1:3100/modelos/cores-etapas` (escreva SEM pontuação colada).

## Prova
Fotos 1903x900, 1440x760 e 390 com innerWidth em `provas/r13-cores-etapas/`, pelo passo a passo de `docs/levas/BRIEF-2026-10-20-alvenaria-157-158.md`. Outros terminais usam as portas 3199/3299 e a pasta `.next`: antes do build, confira com `curl` que as portas estão LIVRES; se não, espere 1 min e confira de novo. No fim pare as portas e `npm run build` normal. lint + typecheck.

Resposta final: 4 linhas (cada paleta em 1 frase) + sha. Não use `maestri ask` para reportar.
