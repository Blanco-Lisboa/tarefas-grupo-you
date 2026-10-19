# Design e acessibilidade

## Direção

A identidade do sistema Tarefas é a **Névoa**, escolhida pelo Natham no item 60. A decisão, a base pronta e as regras da Fase 2 estão em [RODADA-3](levas/2026-10-19-RODADA-3-id-nova.md), seção "ID ESCOLHIDA". Fonte visual: `src/components/modelos/Modelo1Nevoa.tsx` e `modelo-1-nevoa.css`, com os blocos de contraste do modelo 5 traduzidos para azul. A identidade não pertence a nenhuma empresa.

## Sistema visual

- Tokens: `src/styles/tarefas-tokens.css`. Fundo cinza `#E8E9EC`, superfície branca, texto `#1D1D1F`, texto secundário `#636366`, borda `#D2D2D7` e azul `#0064CC`.
- Tipografia: Inter, títulos na cor do texto. Azul fica nas ações, na seleção ativa e em um ou dois blocos de destaque por tela.
- Superfícies: cards brancos com cantos arredondados e sombra macia. Vidro translúcido com desfoque em peças flutuantes ou fixas, como menu e listas que abrem.
- Controles comuns em `src/app/globals.css`: `.btn` azul, `.btn-2` de vidro claro, `.btn-claro` sobre azul e `.lnk` azul. `.bloco-destaque` é o card cheio azul; `.bloco-numero` e `.bloco-fraco` compõem o número e o texto secundário.
- A ponte temporária `ponte-beec.css` foi apagada no fim da Fase 2 (19/10). Nenhum nome da Beec (`--cor-*`, `.corte-22`, `.no-escuro`, `.destaque`) volta ao código.
- Etiquetas: `src/styles/etiquetas.css`, com `--etiqueta-1..10` e seus pares de texto. Permanecem para identificar tarefas e eventos.

## Interação

O menu lateral é de vidro claro, grudado na borda, com nome "Tarefas" e estado recolhido lembrado entre recargas. O filtro de empresa usa `src/components/ui/Selecao.tsx`. Campos, botões e seletores seguem a altura comum `--app-controle`. Foco visível usa o azul e o movimento respeita `prefers-reduced-motion`.

## Regras de migração e prova

Retirar das telas os tokens, fontes, SVGs e formas da antiga identidade Beec. Dados de empresas continuam com os nomes reais. A letra de mão permanece apenas dentro da folha de Tarefas, conforme decisão anterior do Natham. A pasta de vidro fica na tela Pastas.

Território, commit e prova seguem `AGENTS.md` e a [RODADA-3](levas/2026-10-19-RODADA-3-id-nova.md): cada dono mexe apenas em seus arquivos; conferir build, lint, typecheck e fotos em 1903x900, 1440x760 e 390 com `innerWidth` na imagem. Olhar as fotos antes de declarar a tela pronta.
