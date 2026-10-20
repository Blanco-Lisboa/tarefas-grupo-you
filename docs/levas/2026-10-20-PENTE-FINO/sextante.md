# Achados do Sextante (Calendário + Ficha) · pente fino 20/10

Teste de verdade: `provas/pente-fino-sextante/teste.mjs` (banco de mentira 3299 + app 3199): 4 visões, Anterior/Próximo/Hoje, teclas, os 4 filtros + Limpar, Empresa, Sem data, ficha nova e existente (cada seletor, Começa, Postagem→Objetivo, tag de aprovação→Quem aprova, link, notas, Nova tag + Esc, Salvar, Esc), arrastar Sem data→grade, Mês/Ano levando ao Dia/Mês, Matheus logado, banco recusando o Salvar, duplo clique. 1903x900, 1440x760 e 390: 0 transbordo, 0 erro de página/console (instrumento provado com erro provocado). Fotos na mesma pasta.

- [ ] 1 · Calendário · arrastar tarefa sem hora (Sem data ou dia inteiro) para um horário inventava fim de 1 h que a ficha (sem Termina desde o 159) não mostra nem deixa tirar · quebra · CONSERTADO e6c4b69
- [ ] 2 · Calendário · "+ Nova tarefa" vinha sempre com Natham de responsável, mesmo com o Matheus logado (o Caderno já usa quem está logado, item 155) · quebra · CONSERTADO bab94fe
- [ ] 3 · Calendário · clique no vazio da grade mandava fim de 1 h que a ficha ignorava (código morto, contradiz o 159) · melhoria · CONSERTADO bab94fe
- [ ] 4 · Conteúdos · "+" da coluna cria tarefa com Natham de responsável mesmo com o Matheus logado (mesma causa do 2: `tarefaEmBranco({ etapa })` sem `responsavel: eu`) · quebra · PARA: Régua (uma linha: `useEu()` e `responsavel: eu ?? "natham"`)
- [ ] 5 · Ficha · se o banco recusar o Salvar/Excluir, a ficha fechava e o que foi escrito se perdia (Lupa 3) · quebra · CONSERTADO 7f6b62c (usa useErroDados, sem mexer no repositório; aviso no pé da ficha porque o aviso da casca fica atrás dela; provado com o banco recusando: ficha aberta, texto intacto, aviso)
- [ ] 6 · Ficha · dois cliques rápidos em Salvar podiam criar a tarefa duas vezes (cada envio gera id novo) · quebra · CONSERTADO 7f6b62c ("Salvando..." travado; provado: duplo clique = 1 envio)
- [ ] 7 · Ficha (dados) · se criar a tag falhar, salvarTag devolve a tag mesmo assim e a ficha a marca; o Salvar seguinte falha por tag inexistente · feio · PARA: Vitral (salvarTag devolver null na falha; a ficha só marca se vier tag)
- [ ] 8 · Calendário · etapa e selo da empresa em pílula (Lupa 8), número do mês e botão de criar pelo teclado também · feio · CONSERTADO e9fc1ab (4px/6px; "hoje" da semana segue bolinha)
- [ ] 9 · Calendário, Mês · a 1440x760 todas as semanas cresciam até a mais cheia (163px) e a última semana sumia embaixo; com 3 tarefas num dia estreito elas se espremiam uma por cima da outra · quebra · CONSERTADO e9fc1ab (mês de 5 semanas cabe inteiro; só a semana cheia cresce)
- [ ] 10 · Calendário · etiqueta branca "Sem empresa" nos blocos cortava o título dos blocos de 30 min ("Ligar pa...") · feio · CONSERTADO 1657172 (o fundo cinza já diz)
- [ ] 11 · Calendário · seta do botão Sem data era outro desenho, mais grossa que a de todos os botões de seleção · feio · CONSERTADO 1657172
- [ ] 12 · Ficha, 390 · link do Drive com nome e endereço lado a lado: o nome virava um campinho e o endereço cortava · feio · CONSERTADO 7f6b62c (nome em cima, endereço embaixo)
- [ ] 13 · Ficha · botões de Responsável 38px ao lado do Começa 40px (desalinhados) · feio · CONSERTADO 7f6b62c
- [ ] 14 · Ficha · "Caderno de" outra pessoa abria a ficha com Salvar e Excluir (Lupa 1) · quebra · CONSERTADO na ficha e6ab1a6 (prop `soLer`: campos travados, só "Fechar"; fotos ficha-so-ler-1440/390 com build temporário) · PARA: Pena ligar no Caderno: `<Ficha ... soLer={alheio} />`
- [ ] 15 · Ficha, 390 · chip da tag no botão Tags aparece cortado sem reticências ("Esperan") quando não cabe · feio · PARA: Alvenaria (Chips em `Selecao.tsx`/`selecao.css`: o 1º chip fica mesmo sem caber; dar `min-width: 0` e reticências)
- [ ] 16 · ui · chip de tag (`tag.css`, 999px) ainda em pílula (regra 8) · feio · PARA: Alvenaria
- [ ] 17 · Ficha · Começa de tarefa nova sem data abre as rodas em 00:00 · NÃO MEXI: decisão do item 84
