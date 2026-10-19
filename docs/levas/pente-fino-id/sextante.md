# Pente fino da ID (item 53) · Sextante · base, casca/menu, botão de seleção e calendário

Comparado em 18/10/2026 com a ID da Beec (só leitura): `BRIEFING.md` (§9, §10 e §14), `identidade/tokens.css` (FINAL),
`identidade/prancha.html` seção 10 ("Botões, campos, cards, etiquetas e menus"), `identidade/menu-id.css` e o menu do
site em `identidade/aplicacoes-marca.html` (submenu). Fotos lado a lado em `provas/r2-id-sextante/lado-*.png`.

| Elemento do sistema | Peça da ID | Antes | Conserto |
|---|---|---|---|
| Botões da barra do calendário (Hoje, anterior, próximo) | Botão secundário `.btn-2` (placa a 22° com contorno roxo de 2px, texto reto 700 14px em caixa alta, anda 3px ao passar o mouse, foco em contorno elétrico a 22°) | NÃO BATE: retângulo reto, borda fina cinza, texto normal; setas em símbolo de texto | `.btn .btn-2` copiados da prancha para `globals.css`; setas = a seta da ID (`.seta`, traço 2,4 com ponta reta) |
| "+ Nova tarefa" | Botão principal `.btn` (placa roxa a 22°, um por tela) | NÃO BATE: placa sem caixa alta e sem o espaçamento de letra | `.btn` da ID |
| "Limpar filtros" | Link `.lnk` com sublinhado em ponta de barra elétrico | NÃO BATE: sublinhado comum do navegador | `.lnk` + `.sub` da ID |
| Botão de seleção (Empresa, Pessoa, Rede, Etapa, Tipo, Visão, Sem data) | Campo de seleção da prancha (reto, superfície, borda 1,5px em tinta 2, raio 2px, texto 16px, seta da ID; foco = borda roxa e anel elétrico) | NÃO BATE: borda fina cinza, texto 14px em negrito, seta desenhada à mão | Desenho do campo da ID; escolha única mostra o rótulo pequeno em caixa alta (o `.rotulo` da ID) e a escolha |
| Contador no botão de seleção | Selo da ID (placa roxa a 22°, texto reto) com número em Bricolage 800 | BATE | sem mudança (número subiu para 14px) |
| Lista que abre (opções do filtro, lista "Sem data") | Submenu do menu do site: vidro roxo profundo (`--vidro-roxo` + desfoque), orelhas a 22° (`--card-corte` 26px), sem borda nem sombra, texto bege, passar o mouse clareia 7% | NÃO BATE: caixa clara com sombra e caixa de marcar roxa | Vidro roxo com as duas orelhas; escolhido em ouro e negrito (ouro só no escuro, como o item ativo do menu); caixa de marcar com contorno bege suave e ouro quando marcada; na "Sem data", título bege com "data" em ouro e botão `.btn-claro` |
| Entrada da lista | Movimento da ID: rápido, da esquerda para a direita, sem quique | NÃO BATE: descia de cima | entra da esquerda para a direita |
| Menu lateral: itens | Menu da ID (`menu-id.css`): links 500 14px em bege suave, passar o mouse = bege, item ativo em OURO e negrito | NÃO BATE: bloco de fundo inventado (`#2D2537`) e traço ouro na borda | só a cor: ativo em ouro e negrito (ícone junto), sem bloco |
| Menu lateral: botão de recolher | Botão de menu da ID = as 3 barras (`.mid-burger`, `.b3`) em bege | NÃO BATE: ícone de painel desenhado | as 3 barras da ID |
| Menu lateral: logo | Logo bege do menu da ID, 118px | NÃO BATE: 100px | 118px |
| Menu lateral: fundo e posição | Menu da ID é suspenso em vidro roxo | EXCEÇÃO do Natham (itens 35 e 37): grudado na borda e grafite | mantido; anotado no `casca.css` |
| Bolinhas N e M | sem par na ID (a ID não tem avatar) | peça mais perto: o selo; mantidas como pedido no brief (§6) | sem mudança |
| Ícones do menu | Ícone A chapado (`-claro`), por arquivo SVG | BATE | sem mudança |
| Seleção de texto | Prancha: fundo roxo, letra bege | NÃO BATE: elétrico claro | roxo com bege |
| Tom do item ativo no escuro (`--cor-escuro-2/3`) | a ID não tem esse tom | NÃO BATE: cor inventada | tokens apagados |
| Altura dos controles (`--app-controle`) | Botão da ID: 15 + 14 + 15 = 44px | NÃO BATE: 36px | 44px; campo e botão de seleção na mesma altura |
| Título da tela | Título em Bricolage 800, palavra em destaque elétrico no claro (cor ou sublinhado, nunca os dois) | BATE | sem mudança |
| "Hoje" no calendário (número do dia) | Selo da ID (placa roxa a 22°, texto reto) | NÃO BATE: quadrado reto | placa inclinada a 22° (semana, dia e mês) |
| Mês atual na visão Ano | Linha de destaque em ponta de barra | NÃO BATE: borda reta | traço elétrico com as pontas cortadas a 22° |
| Painel do calendário | Card de informação com orelhas (padrão: cima à esquerda e baixo à direita) e sombra no pai | BATE | sem mudança |
| Rótulos (dia da semana, "Dia inteiro") | `.rotulo` (12px 600, caixa alta, espaçado, tinta 2) | BATE | sem mudança |
| Linha do "agora" e alvo de arrastar | Elétrico só em detalhe no claro | BATE | sem mudança |
| Tarefas coloridas e selo da empresa | Exceção aprovada (etiquetas) + selo da ID a 22° | BATE | sem mudança |
| Fundo da tela | Bege liso (`--cor-bege`) | BATE | sem mudança |

Para as outras telas: as peças `.btn`, `.btn-2`, `.btn-claro`, `.lnk` + `.sub`, `.seta` e `.b3` agora moram em
`src/app/globals.css`, copiadas da prancha (seção 10). Use as classes em vez de desenhar botão próprio. `--app-controle`
passou de 36 para 44px (altura do botão da ID). `--cor-escuro-2`, `--cor-escuro-3`, `--sombra-pop`, `--sombra-pop-filtro`
e `--app-controle-p` saíram (não eram da ID e ninguém usava).
