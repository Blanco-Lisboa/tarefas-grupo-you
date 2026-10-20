# Achados da Pena (Caderno) · pente fino 20/10

Ordem do Maestro: 164, fotos do 163, achados 1 e 9 da Lupa, pente fino do Caderno. Fotos e medições em `provas/pena-pente-fino/` (banco de mentira próprio, 1903x900, 1440x760 e 390 com innerWidth; instrumento de erro provado antes: um erro provocado foi capturado, depois "sem erros de página").

- [x] 1 · Caderno · item 164: a linha vinha título · logo · responsável · etiqueta colada; agora logo · título · responsável · prioridade no fim (antes do ⋮). "Rápida" já existe (etiqueta-3), não inventei nada · quebra · CONSERTADO affaae7 (+ ajuste do celular no commit seguinte)
- [x] 2 · Caderno · 164 sem empresa: o título saía desalinhado das linhas com logo · feio · CONSERTADO affaae7 (espaço da logo reservado; medido: uma única coluna de títulos em 1903 e 1440)
- [x] 3 · Caderno · 164 no celular: com a ordem nova, responsável + prioridade quebravam em três linhas · feio · CONSERTADO (logo+título em cima, responsável+prioridade embaixo, prioridade na ponta direita; foto 164-celular-prioridades.png)
- [x] 4 · Caderno · 163 fotos: Excluir pergunta Apagar/Manter dentro do ⋮ (foco em Manter, Esc fecha, nada na linha) nas 3 larguras · prova · FEITO (163-excluir-no-menu-*.png)
- [x] 5 · Caderno · Lupa 1: no "Caderno de" outra pessoa a linha abria a Ficha com Salvar e Excluir · quebra · CONSERTADO 429dcdf (no caderno alheio o título não abre a ficha; medido: ficha aberta 0, campos 0, caixas 0, menus ⋮ 0). PARA: Sextante, se o Natham quiser ver a ficha do Matheus, a Ficha precisa de um modo "só leitura" (prop nova); hoje fica sem abrir
- [x] 6 · Caderno · Lupa 9: no caderno alheio a Agenda mostrava e deixava editar as notas do próprio Natham · quebra · CONSERTADO 429dcdf (Agenda esconde "Anotações do dia" e "Não esquecer" quando o caderno é de outra pessoa; fica "Para amanhã", que é do Matheus)
- [ ] 7 · Caderno alheio · sem menu ⋮, a prioridade encosta na borda direita (fica 24px mais à direita que no caderno do Natham) · feio · NÃO MEXI: só aparece na vista de leitura, sem prejuízo; reservar a coluna do ⋮ é uma linha, se ele reclamar
- [ ] 8 · /tarefas/letras · página de escolha da letra ainda existe; a letra em uso é Patrick Hand (a recomendada), mas o Natham nunca disse que escolheu (item 32a) · limpeza · NÃO MEXI: decisão dele; apagar quando ele responder
- [ ] 9 · Caderno · empresa sem arquivo de logo mostra o nome em texto no espaço da logo e empurra o título · feio · NÃO MEXI: hoje só Beec e You existem e as duas têm logo; se entrar empresa nova, ou entra o logo ou o texto precisa de limite
- [ ] 10 · Dados · Lupa 2 e 10 (tarefa do Matheus some do caderno do Natham; Natham não lê o caderno privado do Matheus) · quebra · NÃO MEXI: decisão do Natham (PARA-O-NATHAM)

Verificado sem achado: ordem e alinhamento em 3 larguras, nenhum transbordo de linha ou de página, título longo corta com reticências antes de empurrar a prioridade, alça de arrastar e ⋮ funcionando, Esc fecha o menu, console limpo. Lint (0 erros, 8 avisos que não são do Caderno), typecheck, 43 testes e build passando.
