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
roteiro `capturar.mjs`). Build, lint, tipos e testes passando. Valores abaixo atualizados em 19/10 para o pente fino da ID
(`e10393e`, item 55).

**O que mudou nos tokens.** `src/styles/beec-tokens.css` NÃO mudou (é cópia fiel da ID e não se edita). As escolhas do
sistema ficam na "camada do app", no topo de `src/app/globals.css`, só com valores da ID:
- Espaço: `--app-respiro` (16, topo e vão entre blocos), `--app-margem` (24; 12 no celular), `--app-vao` (8, entre controles).
- Tipo: `--app-t-titulo` (31, título da tela), `--app-t-secao` (20), `--app-t-texto` (14), `--app-t-rotulo` (12).
  Os 49/61 da ID ficam para peça de marca; título de tela de trabalho é 31.
- Controles: `--app-controle` (44, TODO botão, campo e botão de seleção de uma barra; 44 = altura do botão da ID,
  15 + 14 + 15).
- Cor: `--cor-realce-claro` (hover no claro, roxo a 6%, nunca cinza). No escuro não há tom inventado: grafite e card
  escuro da ID (`--cor-grafite`, `--cor-card-escuro`); lista que abre = `--vidro-roxo`. Raio continua só `--raio` (2px).
- Fundo da tela agora é bege LISO (o brilho roxo saiu do `body`). Barra de rolagem, cursor e caixa de marcar também
  vestem a paleta; seleção de texto = roxo com letra bege (igual à prancha).
- Saíram no pente fino (e10393e), por não serem da ID: `--app-controle-p`, `--cor-escuro-2`, `--cor-escuro-3`,
  `--sombra-pop` e `--sombra-pop-filtro`. Não use.

**Botões e link da ID** (classes comuns em `globals.css`, copiadas da prancha). Toda tela usa estas classes; ninguém
desenha botão próprio. A altura já vem de `--app-controle`.
```tsx
<button className="btn">+ Nova tarefa</button>               // principal: placa roxa a 22°, caixa alta. UM por tela
<button className="btn btn-2">Hoje</button>                  // secundário: contorno roxo (sempre junto com .btn)
<button className="btn btn-claro">+ Tarefa sem data</button> // secundário em fundo escuro (vidro, grafite)
<button className="lnk"><span className="sub">Limpar filtros</span></button>  // link: o .sub dá o sublinhado em ponta de barra
<svg className="seta" viewBox="0 0 24 24" aria-hidden><path d="M4 12h15M13 6l6 6-6 6" /></svg>  // seta da ID, dentro do botão
<span className="b3"><i /><i /><i /></span>                  // as 3 barras (marcador, botão de menu)
```
Ao passar o mouse o botão anda 3px para a direita; o foco do teclado é contorno elétrico também a 22°. Dentro de
`.no-escuro` o sublinhado e as 3 barras viram ouro sozinhos. Para mudar só a largura ou o espaço de um botão na sua tela,
acrescente uma classe sua (ex.: `className="btn cal-nova"`), sem mexer em cor, ângulo ou altura.

**Casca.** Menu grafite grudado na borda (208px; recolhido 64px; celular 56px), ícones na mesma coluna aberto ou recolhido,
"Recolher menu" no pé (com as 3 barras da ID), estado lembrado. Desde o pente fino: logo de 118px e item ativo em ouro e
negrito, sem bloco de fundo (menu da ID). Entrada "Mapa" leva a `/mapa` (em construção, é da Alvenaria). A área de conteúdo
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
Desde o pente fino o botão é o campo de seleção da ID (reto, borda 1,5px, texto 16px, seta da ID) e a lista é o submenu
do site (vidro roxo com orelhas a 22°, texto bege, escolhido em ouro). Com escolha, o botão ganha borda roxa e o contador
(selo inclinado a 22°). A lista abre por cima de tudo (fecha com Esc ou
clique fora), presa ao botão, e vira para cima ou para o lado se faltar espaço. Para enfileirar vários na mesma barra:
`display: flex; gap: var(--app-vao)`. O filtro de empresa da casca já usa este componente.

**Aviso.** No servidor de desenvolvimento (porta 3100) o selo "N" do Next fica no canto de baixo à esquerda, por cima do
"Recolher menu". Some na versão publicada. Se incomodar: `devIndicators: { position: "bottom-right" }` no
`next.config.ts` (arquivo comum, não mexi).

## PENTE FINO DA ID (item 53) · todos, cada um no seu território
O Natham reprovou: "muita coisa diferente da ID visual da Beec". Critério agora é FIDELIDADE à ID, elemento por elemento.
1. Leia a ID COMPLETA (só leitura): `Desktop\ID-Visual-ALL\Beec\BRIEFING.md` inteiro (a seção 14 e o log de decisões vencem),
   `identidade\tokens.css` (bloco FINAL), `identidade\prancha.html`, e as pranchas de elementos/cards/gráficos/ícones/menu
   (`identidade\elementos-r*.html` na última rodada aprovada, `cards-r1.html`, `graficos-r*.html`, `icones-r1.html`, `menu-id.*`).
   Abra as pranchas no navegador (Playwright, fora da tela) e COMPARE com a sua tela lado a lado, por foto.
2. Monte a lista em `docs/levas/pente-fino-id/<seu-nome>.md`: cada elemento da sua tela → elemento da ID correspondente →
   BATE / NÃO BATE (o que difere: cor, forma, raio, borda, sombra, fonte, peso, espaçamento, ícone, movimento) → conserto.
   Elemento sem par na ID: diga qual peça da ID mais perto você usou.
3. Conserte tudo que NÃO BATE no seu território. Cópia de peça da ID para o projeto: anote a origem (ORIGEM-DA-IDENTIDADE.md é comum: avise o Maestro).
4. Prova: foto da sua tela ao lado da prancha da ID, em `provas/r2-id-<seu-nome>/`, + build + lint. Commit pelo índice só com os seus arquivos.

Territórios: Sextante = base (tokens app, casca/menu, Selecao) + calendário · Alvenaria = mapa (o NÓ DE CONEXÃO tem que ser a
conexão 06 "Quadro com ramos" aprovada em 14/10, nas cores decididas, ver BRIEFING) · Pena = tarefas · Vitral = pastas ·
Régua = conteúdos, configurações e ficha.
