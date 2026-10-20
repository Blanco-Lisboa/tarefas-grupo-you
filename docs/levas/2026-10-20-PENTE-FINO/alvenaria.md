# Achados da Alvenaria (pente fino 20/10)

- [x] 1 · menu · logo do Tarefas colada à esquerda e imagem alta parecendo torta · feio · CONSERTADO 370fe79 (selo branco 40px centrado, nome ao lado; recolhido/celular só o selo, centrado a 0,5px do eixo)
- [x] 2 · /modelos · página de escolha da ID (decisão do item 60 já tomada) e 5 modelos ainda no sistema · melhoria · CONSERTADO 74bf4ec (apagado; fica só /modelos/fazendo-agora)
- [x] 3 · Configurações · CSS morto do Renomear/Tirar (item 172) · melhoria · CONSERTADO 858743e
- [x] 4 · Configurações no celular · título "Empresas" recuado 16px em relação ao título da página · feio · CONSERTADO (commit seguinte)
- [x] 5 · Entrar e nova-senha · sem sobra horizontal nas 3 larguras, sem erro de console · OK, nada a mexer
- [x] 6 · menu · todos os itens navegam, recolher lembra após recarregar, duplicada em Configurações avisa · OK
- [ ] 7 · Calendário, Mapa, Conteúdos, Pastas · elementos passam da borda da janela dentro de rolagem própria (grade, linha do tempo, colunas); sem sobra na página · melhoria · PARA: Sextante / Régua / Vitral conferirem que é rolagem intencional (no celular /pastas `gf-art` passa da borda)
- [x] 8 · design.md e tarefas-tokens.css apontavam para o modelo Névoa apagado (achado 6 da Lupa) · limpeza · CONSERTADO (commit seguinte): agora apontam para tarefas-tokens.css e globals.css
- [x] 9 · chip de tag e contador da seleção em pílula (achado 7 da Lupa) · feio · CONSERTADO (commit seguinte): cantos 8px e 6px; token --raio-pilula removido (sem uso)

## Veredito das fotos do Mapa (item 176), commit 3c15d61 · fotos em provas/pente-regua/ (3 larguras; zoom-20-* = 3 conteúdos fechado/aberto, zoom-22-* = dia solto, pastas-* = referência)
Console sem erro nas 3 larguras. Dia solto: brilho `menu-brilho` anima (fundo muda a cada 600 ms) e para com movimento reduzido. Dia com vários: título + contador 1/3, 2/3, 3/3 visíveis em cada folha, aberto mostra as 3 cartas completas. Bate com o pedido na ideia. Diferenças concretas:
- [ ] PARA: Régua · 1440/1903 `zoom-20-1440.png` · as folhas do Mapa estão INCLINADAS e a 1ª é mais estreita (efeito de leque); nas Pastas as folhas são retas, mesma largura, só deslocadas para cima/lado. O Natham pediu "exatamente" como as Pastas: tirar a rotação e igualar a largura · feio
- [ ] PARA: Régua · `zoom-20-1440.png` · a carta da frente (3/3) fica bem mais alta que as de trás (título quebra em 2 linhas + empresa/rede/etapa); nas Pastas a frente mostra o conteúdo em tamanho próprio, as de trás só a faixa do título. Conferir se é isso mesmo que ele quer ver; cores diferentes por etapa (pêssego/lilás/verde-água) também não existem nas folhas das Pastas (mesma cor da pasta) · decisão dela, avisar o Maestro
- [ ] PARA: Régua · 390 `mapa-20-390.png` · a haste azul atravessa o texto "Ter, 20/10" (data riscada pela linha). Dar fundo/deslocar a data ou parar a haste atrás do rótulo · feio
- Dia solto (`zoom-22-1440.png`): card branco com brilho OK; sobra um vazio embaixo do texto (card mais alto que o conteúdo) · melhoria, PARA: Régua
Nota: banco-falso.mjs ganhou 2 conteúdos tipo "postagem" em 20/10 (só os de tipo postagem entram no Mapa).
- [x] 10 · Ficha 390 · chip da tag cortado sem reticências no botão Tags (achado 15 do Sextante) · feio · CONSERTADO (commit seguinte): reticência não funciona em caixa flex; o chip virou bloco em linha (foto do aprovador mantém o espaço). Provado numa caixa de 70px: "Espera…" (provas/pente-alvenaria/chip.mjs e chip.png). Falta só ver na ficha real quando a trava de fotos estiver livre
- [x] 11 · chip de tag em pílula (achado 16 do Sextante) · já resolvido em f7eafd6 (canto 8px), conferido
