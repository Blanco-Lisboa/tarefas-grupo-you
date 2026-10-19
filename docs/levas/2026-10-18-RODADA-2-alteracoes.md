# RODADA 2 · Alterações do Natham (18/10/2026, noite)

Leia ANTES: `2026-10-18-BRIEF-comum.md` (inteiro) e os itens **35 a 49** de `2026-10-18-grade-de-conteudo-beec.md`.
Esses itens são a ordem dele, na linguagem dele. Este arquivo só diz QUEM faz O QUÊ e EM QUE ORDEM.

## Regras desta rodada
- Território continua valendo (AGENTS.md). Fora do seu território: pare e avise o Maestro.
- **Exceção ao BRIEF-comum §2, só para a Pena:** pode LER o caderno do CRM como referência visual e de
  comportamento (`Desktop\CRM-You\tarefas.html`, `js\app-tarefas*.js`, `css\app-tarefas*.css`). Só leitura:
  nada se edita lá. O código aqui é React/TS do projeto, não cópia do ES5 de lá.
- Design: use as skills de design antes de desenhar (`impeccable`, `refactoring-ui`, `visual-design-foundations`;
  `design-motion-principles` para animação). O Natham achou a ID "muito, muito fraca, tudo mal encaixado, cores
  não legais": encaixe, espaçamento, alinhamento e cor são o critério de pronto, não só "funciona".
- Prova (AGENTS.md): build + lint + capturas 1903x900, 1440x760 e 390 com `innerWidth` na imagem, em
  `provas/r2-<seu-nome>/`. Item visual só fecha com a foto.
- Commit pelo índice, sem trocar de branch, sem push.
- Não use `maestri ask` para reportar: a sua resposta final do turno volta sozinha para o Maestro.

## FASE 1 (solo) · Sextante (Opus) · base visual + casca
Ninguém começa a Fase 2 antes desta estar commitada e provada.
1. **Item 49, a parte da base:** revisar `src/styles/beec-tokens.css` e `src/app/globals.css`: escala de espaçamento,
   tipografia, cores de superfície, raios, sombras. Origem das cores: a ID da Beec (BRIEF-comum §4).
2. **Itens 35 a 38, o menu lateral** (`src/components/casca/`): mais FINO, sem espaço vazio, GRUDADO na borda
   (deixa de flutuar), cor GRAFITE, realce do item ativo/hover bem encaixado, botão de RECOLHER (só ícones) que
   LEMBRA o estado entre recargas (`localStorage` com try/catch).
3. **Item 41:** tudo mais para cima (respiro do topo da casca).
4. **Itens 40 e 46, a parte da casca:** a área de conteúdo permite tela de ponta a ponta (sem largura máxima
   presa na casca); cada tela decide o seu miolo.
5. **Item 42, a peça comum:** criar UM componente de "botão de seleção" (clica, abre a lista de opções, escolha
   única ou várias, com contador quando há escolha) em `src/components/ui/`, e converter o `FiltroEmpresa` para ele.
   As telas reaproveitam este componente; ninguém faz o seu próprio.
6. Entrada **"Mapa"** no menu, apontando para `/mapa` com `EmConstrucao` (a tela é da Alvenaria na Fase 2).
7. Escrever no fim deste arquivo, seção "Base pronta": o que mudou nos tokens e como usar o botão de seleção.

## FASE 2 (paralelo, depois da base) · cada um no seu território
- **Sextante (calendário)**: itens 39, 40, 41, 42 + tapa visual (49) em `src/components/calendario/`.
  "Sem data" vira botão que abre a lista; calendário de ponta a ponta; filtros Pessoa/Rede/Etapa/Tipo viram
  botões de seleção (o componente da base); "+ Nova tarefa" fica como está.
- **Pena (tarefas)**: itens 43, 44, 45 + 49 em `src/components/tarefas/`. Caderno igual ao do CRM no formato grande,
  com o calendário ao lado e os horários 07:00–22:00 na margem; fontes de mão de agora mantidas; quadrado de check
  com o desenho atual, VERDE, com a mesma animação do check do CRM (`css\app-tarefas-check.css`), com cara de caneta.
- **Vitral (pastas)**: itens 46, 47 + 49 em `src/components/pastas/`. Ponta a ponta; fundo bege claro; pastas um
  pouco mais claras (nas duas versões, exata e adaptada, até ele escolher).
- **Alvenaria (mapa)**: item 48, território novo `src/app/mapa/` + `src/components/mapa/`. Linha do tempo de amanhã
  (19/10) até o fim do mês, nós de conexão; cada conteúdo com data de postagem é um nó (mesma fonte de dados da
  agenda, via `@/lib/dados`, então os dois lados ficam sempre iguais); o nó mostra objetivo + data (sem horário);
  marca o que já foi postado. Se faltar o campo "objetivo" no modelo de dados (`src/lib/dados/tipos.ts`), é
  arquivo comum: avise o Maestro antes de mexer.
- **Régua (Codex)**: tapa visual (49) em `src/components/conteudos/` e `src/components/configuracoes/`; trocar
  filtros de escolha pelo botão de seleção da base. No fim, revisão de tudo (só lê e aponta).

## Base pronta
Fase 1 fechada pelo Sextante em 18/10/2026. Provas: `provas/r2-sextante/` (`antes-*` e `depois-*` em 1903, 1440 e 390;
roteiro `capturar.mjs`). Build, lint, tipos e testes passando.

**O que mudou nos tokens.** `src/styles/beec-tokens.css` NÃO mudou (é cópia fiel da ID e não se edita). As escolhas do
sistema ficam na "camada do app", no topo de `src/app/globals.css`, só com valores da ID:
- Espaço: `--app-respiro` (16, topo e vão entre blocos), `--app-margem` (24; 12 no celular), `--app-vao` (8, entre controles).
- Tipo: `--app-t-titulo` (31, título da tela), `--app-t-secao` (20), `--app-t-texto` (14), `--app-t-rotulo` (12).
  Os 49/61 da ID ficam para peça de marca; título de tela de trabalho é 31.
- Controles: `--app-controle` (36, TODO botão, campo e botão de seleção de uma barra) e `--app-controle-p` (28).
- Cor: `--cor-realce-claro` (hover no claro, roxo a 6%, nunca cinza); `--cor-escuro-2` (hover no grafite) e
  `--cor-escuro-3` (ativo no grafite). Raio continua só `--raio` (2px).
- Sombra: `--sombra-pop` (coisa que flutua) e `--sombra-pop-filtro` (a mesma, para caixa com orelha, no pai).
- Fundo da tela agora é bege LISO (o brilho roxo saiu do `body`). Barra de rolagem, seleção de texto, cursor e caixa de
  marcar também vestem a paleta.

**Casca.** Menu grafite grudado na borda (208px; recolhido 64px; celular 56px), ícones na mesma coluna aberto ou recolhido,
"Recolher menu" no pé, estado lembrado. Entrada "Mapa" leva a `/mapa` (em construção, é da Alvenaria). A área de conteúdo
não tem largura máxima: quem quiser miolo estreito põe na própria tela. Topo: a barra da casca (filtro de empresa) começa
a 16px do alto, alinhada com o logo; a tela começa logo abaixo, 16px depois.

**Botão de seleção** (`@/components/ui/Selecao`). Toda escolha entre opções usa ele; ninguém faz o seu próprio.
```tsx
import { Selecao } from "@/components/ui/Selecao";

<Selecao
  rotulo="Rede"                                   // texto do botão
  opcoes={REDES.map((r) => ({ valor: r, rotulo: NOMES.rede[r] }))}  // antes?: ReactNode (ex.: bolinha N/M)
  valor={filtros.rede}                            // lista do que está escolhido ([] = nada)
  aoMudar={(rede) => mudar({ ...filtros, rede })} // recebe a lista nova
  // multipla={false}   uma escolha só: o botão mostra o nome escolhido e a lista fecha ao escolher
  // rotuloTodos="Todas" primeira linha que limpa a escolha
/>
```
Com escolha, o botão ganha borda roxa e o contador (selo inclinado a 22°). A lista abre por cima de tudo (fecha com Esc ou
clique fora), presa ao botão, e vira para cima ou para o lado se faltar espaço. Para enfileirar vários na mesma barra:
`display: flex; gap: var(--app-vao)`. O filtro de empresa da casca já usa este componente.

**Aviso.** No servidor de desenvolvimento (porta 3100) o selo "N" do Next fica no canto de baixo à esquerda, por cima do
"Recolher menu". Some na versão publicada. Se incomodar: `devIndicators: { position: "bottom-right" }` no
`next.config.ts` (arquivo comum, não mexi).
