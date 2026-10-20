# Pente fino geral do sistema Tarefas · noite de 20/10 (o Natham foi para casa)

Palavras dele (resumo fiel): "Finalizando tudo, passa um pente fino em todo o sistema pra encontrar erros, bugs, etc. Teste ele por inteiro e conserte tudo que achar. Veja tudo que pode estar bugado e tudo que possa melhorar. Veja alinhamento, enquadramento, hierarquia e tudo mais. Use todas as skills necessárias, deixe o sistema funcionando liso, sem bugs, sem travamentos, arquitetura de código, de banco de dados, tudo redondo. Verifique tudo que te passei até agora e arrume o que puder. Veja TODAS as páginas, botões, menu lateral. Use o Codex pra conferir se não errou."
Mais: "a logo do Tarefas tá um pouco torta. Deixe ela no centro, dê um destaque, deixe visualmente bonitinha."

Base da noite: commit `201729c`. Tudo o que ele pediu hoje está na leva `docs/levas/2026-10-18-grade-de-conteudo-beec.md`, itens 154 a 173: LEIA os itens da sua área antes de começar (o que ele aprovou NÃO muda de cara; o que ele recusou não volta).

## Regras de todos (quebrar = estraga o trabalho dos outros)

1. Pasta `Desktop/Sistemas-Grupo-You/grade-conteudo`. Leia `AGENTS.md` e `docs/design.md`. Mesma branch, NUNCA trocar de branch, NUNCA publicar, NUNCA push.
2. **Território:** só edite os arquivos da sua área (lista abaixo). Achou problema fora dela? Escreva no seu arquivo de achados com "PARA: <dono>" e siga; o Maestro repassa.
3. **Commit pelo índice:** `git add <só seus arquivos>` e `git commit` SEM caminho; antes, `git diff --cached --stat` para conferir que só tem coisa sua. Um commit por conserto, mensagem dizendo o que e por quê.
4. **Banco real** (Supabase `uruhjlurcxpjhhgvuzwt`): só SELECT para investigar. Nada de apagar/alterar dado. Mudança de estrutura só pelo Vitral, em arquivo `supabase/NNN_*.sql` versionado. Se uma trava barrar algo, NÃO contorne: anote e siga.
5. **Fotos (tela logada):** passo a passo em `docs/levas/BRIEF-2026-10-20-alvenaria-157-158.md` (banco de mentira 3299 + app 3199). Só UM terminal pode usar `.next` e as portas por vez. **Trava:** antes de `next build`, rode `mkdir provas/.trava-fotos` (se der erro "já existe", outro está usando: espere 2 min e tente de novo); ao terminar as fotos, pare 3199/3299, rode `npm run build` normal e só então `rmdir provas/.trava-fotos`. Nunca apague a trava de outro. O servidor 3100 é do Natham: não pare nem reinicie.
6. Chrome só headless/fora da tela. Nunca mexer em mouse/teclado.
7. Teste DE VERDADE: clique em todo botão da sua área, abra todo menu, preencha todo campo, nas larguras 1903x900, 1440x760 e 390 (com `innerWidth` na foto). Meça transbordo (`scrollWidth > clientWidth`) em vez de confiar no olho. Console sem erro (prove que o instrumento captura provocando um erro antes de confiar no silêncio).
8. Visual: nada de pílula (cantos ~8px; redondo só foto/bolinha), acentuação certa em todo texto, nada encostando, alinhamentos consistentes, mesma peça = mesmo tratamento. Respeitar `prefers-reduced-motion`.
9. Prova antes de "pronto": `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` passando + fotos olhadas.
10. **Seu arquivo de achados:** `docs/levas/2026-10-20-PENTE-FINO/<seu-nome>.md`, uma linha por achado: `- [ ] N · tela · o que está errado · gravidade (quebra / feio / melhoria) · estado (CONSERTADO sha | PARA: dono | NÃO MEXI: por quê)`. Só você escreve nele.
11. Na resposta final para o Maestro: 5 linhas no máximo (quantos achados, quantos consertados, shas, o que ficou para outro). Não use `maestri ask` para reportar.

## Territórios

- **Alvenaria (base):** menu lateral / casca (`src/components/casca/`, inclui o LOGO do Tarefas: centralizar, dar destaque, deixar bonito), tela Entrar (`src/components/entrar/`, `src/app/entrar/`), Configurações, `src/app/globals.css`, `src/styles/`, `src/components/ui/` (Selecao, CampoData, Marca, Pessoa, Tag), páginas de `/modelos` que ainda existirem (apague as de decisões já tomadas: só fica `/modelos/fazendo-agora` até o selo entrar de verdade, e a página `/modelos` original se for do sistema).
- **Sextante:** Calendário (`src/components/calendario/`, `src/app/calendario/`) e a Ficha (`src/components/ficha/`). Depois do pente fino: o botão Começar/Parar do item 170 na ficha (ver seção 170).
- **Pena:** Caderno (`src/components/tarefas/`, `src/app/tarefas/`). PRIMEIRO os itens que ficaram pendentes: 164 (ordem da linha: `docs/levas/BRIEF-2026-10-20-pena-164.md`) e as fotos do 163.
- **Régua (Codex):** Conteúdos (`src/components/conteudos/`, `src/app/conteudos/`) e Mapa (`src/components/mapa/`, `src/app/mapa/`). Inclui: no celular o card do Mapa aparece cortado na borda direita (achado da Alvenaria no 171b). O terminal dela não sobe servidor de fotos: peça as fotos ao Maestro no arquivo de achados ("FOTOS: …").
- **Vitral:** Pastas (`src/components/pastas/`, `src/app/pastas/`), camada de dados (`src/lib/`), banco (`supabase/`), item 170 etapa 1 (já com ele). Revisão de arquitetura do banco: travas (RLS) de todas as tabelas, índices, `get_advisors` de segurança e desempenho (só leitura), consistência repo x banco (o que está no banco e não está em `supabase/*.sql`). Nada destrutivo.
- **Lupa (Codex, revisora, NÃO edita código):** ver `LUPA.md` nesta pasta.

## Item 170 (selo "fazendo agora")
Vitral faz banco + dados e escreve a API na leva (item 170). Quando estiver commitado: Sextante põe o botão Começar/Parar na ficha (e "Começar" no menu ⋮ do Caderno fica para a Pena, se a API permitir); Régua põe o marcador 5b no card de Conteúdos (desenho final em `/modelos/fazendo-agora`, commit do Vitral). Se o banco ficar barrado esperando o Natham colar o SQL, NÃO liguem o front: deixem pronto atrás da checagem "tabela existe".
