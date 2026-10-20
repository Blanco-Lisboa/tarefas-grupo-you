# Régua: Conteúdos e Mapa

- [x] 1 · Mapa, linha do tempo · o vidro recusado ainda pintava os cards; dia com várias atividades não parecia as folhas de Pastas e dia sozinho não tinha o brilho do menu · feio · CONSERTADO c9152c5
- [x] 2 · Mapa, celular · card à direita da haste aparecia cortado pela janela da linha do tempo · quebra · CONSERTADO 8fa5e5b + 2bc4aa0; falta conferir foto logada
- [x] 3 · Conteúdos, botão + · conteúdo novo de Matheus nascia atribuído a Natham (também achado 4 do Sextante) · quebra · CONSERTADO 6c2cf22; usa `useEu()` e só abre a criação após identificar a conta
- [x] 4 · Mapa, Fila · seletor de formato e passo usavam formato de pílula, fora da regra visual atual · feio · CONSERTADO b3f41b7
- [x] 5 · Conteúdos, Drive · link salvo sem `https://` abria como caminho dentro do sistema · quebra · CONSERTADO 095529f
- [x] 6 · Mapa, Fila · botão do dia fechado apontava para uma lista ausente do documento · melhoria · CONSERTADO f1d9073
- [x] 7 · Conteúdos, botão + · aviso de conta não identificada continuava visível depois de abrir a criação · melhoria · CONSERTADO f0c90d2
- [x] 8 · Mapa, folhas fechadas · o título visível ficava oculto do leitor de tela e os outros textos do botão sumiam na pilha · quebra · CONSERTADO 3c15d61
- [ ] 9 · Conteúdos, arrastar entre etapas · a camada de dados absorve falhas de gravação, então a tela não consegue mostrar o erro mesmo com `catch` · quebra · PARA: Vitral (`src/lib/dados/repositorio.ts`, `salvarTarefa`)
- [ ] 10 · Conteúdos, selo "fazendo agora" do item 170 · depende da API e da tabela de Vitral; integrar quando a etapa 1 estiver commitada · melhoria · NÃO MEXI: API ainda em desenvolvimento

FOTOS: alguém com acesso ao servidor de prova deve fotografar Conteúdos, Mapa Linha e Mapa Fila em 1903x900, 1440x760 e 390, sempre com `innerWidth` visível. No Mapa, mostrar 20/10 com várias atividades fechadas e abertas, um dia com uma atividade, começo/meio/fim da rolagem e o card perto da borda direita em 390. Em Conteúdos, incluir coluna vazia, vários cards, criação pela conta Matheus e arraste de etapa. Medir `scrollWidth > clientWidth`, clicar filtros, formato, cartões e botões +, e conferir o console com captura de erro provocada antes da medição. Conferir movimento e transparência reduzidos. O terminal da Régua não conseguiu ocupar a trava de fotos, já usada por outra frente.

Validação local: lint sem erros (8 avisos preexistentes fora deste território), typecheck e 43 testes passaram. Build e fotos aguardam a liberação da trava compartilhada ou execução pela equipe de fotos.
