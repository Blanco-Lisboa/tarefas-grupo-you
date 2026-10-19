# RODADA 3 · ID nova neutra (19/10/2026)

Leia ANTES: itens 56, 57 e 58 de `2026-10-18-grade-de-conteudo-beec.md` (a ordem dele, nas palavras dele) e
`docs/referencias/2026-10-19-id-nova/README.md` + as 7 imagens `ref-*.png` (ABRA as imagens, não só o texto).
`AGENTS.md` e `2026-10-18-BRIEF-comum.md` continuam valendo (território, prova, commit), MENOS o que fala da ID da Beec:
a Beec SAI. O sistema se chama "Tarefas" (provisório) e a ID é NEUTRA, moderna, pegada Apple: vidro fosco, poucas cores.

## Regras desta rodada
- Território: só os seus arquivos (abaixo). `globals.css`, `beec-tokens.css`, casca e as outras telas NÃO se mexem nesta rodada:
  a ID só vai para o sistema depois que o Natham escolher o modelo.
- Design: use as skills antes de desenhar (`impeccable`, `high-end-visual-design`, `minimalist-ui`, `refactoring-ui`,
  `web-typography`; `design-motion-principles` / `gsap-scrolltrigger` para movimento).
- Prova: build + lint + typecheck + fotos 1440x760 e 390 com `innerWidth` impresso NA imagem, em `provas/r3-<seu-nome>/`.
  Use Playwright com viewport (não `--window-size`), janela FORA da tela; nunca mexa no mouse/teclado do Natham.
  Item visual só fecha com a foto, e você mesmo olha a foto antes de dizer pronto (texto cortado, encostado, acento errado).
- Commit pelo índice só com os seus arquivos, sem trocar de branch, sem push. Não use `maestri ask` para andamento;
  só o relatório final.

## Sextante (Opus) · item 57 · os 5 modelos
Território: `src/app/modelos/` + `src/components/modelos/` (um arquivo por modelo + a página).
1. Pesquise: https://21st.dev/ (componentes de botão, card, vidro, sidebar, tipografia) e a linguagem da Apple
   (Human Interface Guidelines, materiais "Liquid Glass"/vibrancy, SF Pro). Anote em 5 linhas o que tirou de onde, no topo da página.
2. Página `/modelos`: os 5 modelos lado a lado (ou um embaixo do outro no celular), cada um com NOME curto e número 1 a 5,
   para ele dizer "quero o 3". "Coisas pontuais, não ID completa". Cada modelo mostra o MESMO conjunto, para comparar:
   - cores: fundo, superfície, texto, texto fraco, borda, UM acento (ou nenhum); com o código hex embaixo;
   - tipografia: título grande, subtítulo, texto, rótulo pequeno, um número grande (ex.: "12 conteúdos");
   - botões: primário, secundário, fantasma/link, botão só de ícone, e um botão de seleção (filtro "Empresa ▾") aberto e fechado;
   - um card de conteúdo (empresa, rede, título, data, etapa) e um painel de vidro fosco sobre um fundo com cor/imagem,
     para o vidro aparecer de verdade;
   - um pedacinho do menu lateral com o item ativo e o hover.
3. Os 5 têm que ser DIFERENTES de verdade (não 5 tons do mesmo). Ponto de partida sugerido, ajuste com a pesquisa:
   claro de vidro (ref-4), preto e branco editorial com serifa itálica (ref-3), escuro de vidro com um acento (ref-1/ref-2),
   cinza-azulado técnico com bordas finas (ref-7), branco com blocos pretos (ref-5). Todos sem marca de empresa.
4. Interação real nos botões (hover, foco, pressionado) e no seletor (abre/fecha). Respeitar `prefers-reduced-motion`.
5. Fontes: só via `next/font` dentro do seu território (Inter, Geist, Instrument Serif etc.). Sem dependência nova.
6. Entrada no menu: NÃO mexa na casca; a página abre direto em `127.0.0.1:3100/modelos`.

## Alvenaria (Sonnet) · item 58 · efeito do Mapa
Território: `src/app/mapa/` + `src/components/mapa/`. Autorizado: adicionar `gsap` ao `package.json`/lock (arquivo comum,
só essa dependência; SplitText e ScrollTrigger vêm no pacote `gsap`).
1. Referência do efeito: `docs/referencias/2026-10-19-id-nova/ref-1.png` + `timeline-21st.tsx.txt` (a essência está no comentário).
2. O pedido: "Devemos poder ver 1 semana, mas se rolar pra baixo, ele vai indo pro lado." Rolar a página para BAIXO anda a
   linha do tempo para o LADO (seção alta + miolo `sticky` + faixa que anda com `xPercent`, `scrub`). Cabe UMA semana na tela;
   vai de amanhã até o fim do mês (ou até a última postagem com data, o que vier depois), como o Mapa de hoje.
3. Marcos alternando em cima e embaixo da linha; cada um: bolinha + haste + OBJETIVO + DATA (sem horário) + empresa e rede.
   Aparecem com a animação da referência (haste cresce, texto sobe linha a linha) conforme chegam ao meio. Postado x a postar
   tem que dar para distinguir. Dados: os mesmos de hoje (`@/lib/dados`), nada inventado.
4. O Mapa mora DENTRO da casca (menu à esquerda): o `sticky` e as larguras são do miolo, não `100vw`. Celular 390: tem que funcionar.
5. Aparência NEUTRA provisória: preto, branco e cinzas, um acento só (laranja da referência ou cinza); a pele final vem do modelo
   que o Natham escolher. Não use as cores/peças da Beec.
6. `prefers-reduced-motion`: tudo montado, sem animação, e dá para ver o mês inteiro rolando para o lado normalmente.
7. Prova extra: fotos em 3 pontos da rolagem (início, meio, fim) em 1440 e 390, mostrando a faixa andando.

## ID ESCOLHIDA (item 60) · aplicar no sistema inteiro
Leia o item 60 da leva. Resumo: **modelo 1 Névoa** + o **contraste do 5** (alguns cards cheios em destaque, cantos bem
redondos, número grande sobre o bloco), mas o bloco de destaque é **AZUL**, não preto, e o **verde-lima sai**.
Azul: o `#0071E3` do modelo 1, **um pouco mais escuro, pouca coisa** (algo como `#0064CC`; confira contraste AA do branco sobre ele).
A Beec sai de vez: nenhum token, fonte, logo, orelha, corda de pontinhos ou cor da Beec em lugar nenhum.
Fonte da verdade da aparência: `src/components/modelos/Modelo1Nevoa.*` + o bloco de destaque de `Modelo5Contraste.*`.

### FASE 1 (solo) · Sextante · base + casca. Ninguém começa a Fase 2 antes desta commitada e provada.
1. Tokens novos do sistema (arquivo novo, ex.: `src/styles/tarefas-tokens.css`) e a camada do app em `globals.css` reescrita
   com eles: fundo, superfície, vidro (blur + borda clara), texto, texto fraco, borda, azul, azul de destaque (bloco),
   raios (os do modelo 1/5, NÃO 2px), sombras macias, espaço, tipo. `beec-tokens.css` deixa de ser importado (não apague;
   anote em ORIGEM-DA-IDENTIDADE.md que saiu e por quê).
2. Casca: menu no estilo do modelo 1 (vidro claro, item ativo como na amostra), logo vira o nome "Tarefas" (texto, sem marca),
   recolher continua lembrando o estado. Fonte do modelo 1 no `layout.tsx` no lugar da Bricolage/Host.
3. `Selecao` e as classes comuns (`.btn`, `.btn-2`, `.btn-claro`, `.lnk`) vestidas com o modelo 1, mesmo nome de classe
   (as telas não precisam trocar markup para herdar). Um bloco de destaque azul comum (ex.: `.bloco-destaque`) para as telas usarem.
4. Fotos 1440 e 390 de TODAS as telas depois da base (vão estar meio a meio, é esperado) + build + lint + typecheck.
5. Escreva aqui embaixo, "Base Névoa pronta": tokens, classes e como usar o bloco de destaque.

### FASE 2 (paralelo, depois da base) · cada um no seu território, só vestir com a base nova
- Sextante: calendário. Alvenaria: mapa (sai o laranja provisório; azul). Pena: tarefas (o caderno MANTÉM a letra de mão
  dentro da folha, pedido antigo dele; o resto em volta veste a Névoa). Vitral: pastas (pasta de vidro na Névoa). Régua: conteúdos,
  configurações e ficha. Critério: a tela parece o modelo 1 da página /modelos; nada da Beec sobra (procure por cor/classe velha).

### Base Névoa pronta (Fase 1, Sextante, 19/10)
Fotos: `provas/r3-base-nevoa/` (todas as telas em 1903, 1440 e 390; seleção aberta; menu recolhido; bloco e botões).
- **Tokens** (`src/styles/tarefas-tokens.css`): `--fundo` #E8E9EC, `--sup` #FFF, `--sup-2` #F7F7F9, `--texto` #1D1D1F,
  `--fraco` #636366, `--borda` #D2D2D7, `--linha`, `--realce` (hover), `--azul` **#0064CC** (branco sobre ele 5,68; ele sobre
  o fundo 4,68), `--azul-hover`, `--azul-claro`, `--no-azul` (texto sobre azul), `--no-azul-fraco` #DCE8F7 (4,58), `--foco`;
  vidro `--vidro`, `--vidro-forte`, `--vidro-linha`, `--vidro-desfoque`; raios `--raio-b` 10, `--raio-c` 16, `--raio-v` 20,
  `--raio-bloco` 22, `--raio-pilula`; sombras `--sombra`, `--sombra-alta`, `--sombra-lista`, `--sombra-bloco`; `--fonte` (Inter),
  `--titulo-peso/espaco/entrelinha`, escalas `--t-*` e `--s-*`, movimento `--dur*` e `--curva`. Camada `--app-*` igual
  (só `--app-controle` foi para 40px, o do modelo 1).
- **Classes** (mesmo nome, nova pele): `.btn` azul cheio · `.btn-2` vidro branco · `.btn-claro` sobre o azul · `.lnk` azul,
  sublinha no hover · `Selecao` em vidro (contador azul, caixa azul marcada). `.b3` e o sublinhado em ponta de barra saíram.
- **Bloco de destaque**: `<div class="bloco-destaque">` (azul cheio, canto 22, sombra azulada) com `.bloco-numero` (número
  grande leve), `.bloco-fraco` (texto secundário) e `.btn-claro` dentro. Poucos por tela: é o que puxa o olho.
- **Ponte** (`src/styles/ponte-beec.css`, TEMPORÁRIA): os nomes da Beec (`--cor-roxo`, `--cor-bege`, `.corte-22`, `.no-escuro`,
  `.destaque`...) apontam para a Névoa, para nada quebrar. Por isso hoje os títulos das telas saem azuis (eram roxos) e os
  blocos escuros saem azuis. Na Fase 2 cada dono troca os nomes velhos no seu território; o último apaga a ponte e o @import.
- Casca: menu de vidro claro grudado, nome "Tarefas" com a inicial num quadrado azul, ícones de traço, recolher lembra o estado.

### FASE 2 · liberada pelo Maestro em 19/10 (base 5e2f4a4 conferida por foto)
Leia ANTES a seção "Base Névoa pronta" acima (tokens, classes, `.bloco-destaque`, a ponte temporária).
Para cada dono, no seu território:
1. Troque todo nome velho da Beec (`--cor-roxo`, `.corte-22`, `.no-escuro`, `.destaque`, `--cor-*`, `--app-*` antigos, orelha,
   corda de pontinhos, placa, kraft, ouro) pelos tokens/classes da Névoa. Ao fim: `grep` no seu território sem nenhum nome velho.
2. Referência visual: o modelo 1 de `/modelos` (título em cor de TEXTO, não azul; azul só no que se clica e no bloco de destaque).
   Use o `.bloco-destaque` azul em 1 ou 2 pontos de destaque da tela (ex.: número do mês), não em tudo.
3. Achados do Maestro nas fotos da base: título da tela está saindo AZUL (efeito da ponte, deve ser cor de texto);
   coluna de "hoje" do calendário tem fundo bege (sobra da Beec); paleta de etiquetas (item 25) continua, mas confira se
   combina com a Névoa (tons um pouco mais suaves se gritar).
4. Prova: fotos 1903, 1440 e 390 da sua tela em `provas/r3-nevoa-<seu-nome>/` + lint + typecheck. Olhe as fotos antes de dizer pronto.
5. NÃO apague `ponte-beec.css` nem mexa em base/casca: se faltar algo na base, avise o Maestro.
Territórios: Sextante = calendário · Alvenaria = mapa (laranja sai, azul entra) · Pena = tarefas (letra de mão fica DENTRO da folha) ·
Vitral = pastas · Régua = conteúdos, configurações, ficha.
