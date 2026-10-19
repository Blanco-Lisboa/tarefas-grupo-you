# RODADA 4 · ajustes de tela + pastas de informação (19/10/2026, tarde)

Leia ANTES: itens 61 a 66 de `2026-10-18-grade-de-conteudo-beec.md` (as palavras dele) e ABRA as fotos de
`docs/referencias/2026-10-19-rodada-4/` (01 a 11). Continuam valendo `AGENTS.md`, `2026-10-18-BRIEF-comum.md` e a seção
"Base Névoa pronta" da RODADA-3 (tokens, `.btn*`, `.bloco-destaque`, `Selecao`). ID = Névoa; nada da Beec volta.

## Regras
- Território: só os seus arquivos (abaixo). Precisou de algo fora? Avise o Maestro, não mexa.
- Prova: lint + typecheck + fotos 1440x760 e 390 com `innerWidth` impresso NA imagem, em `provas/r4-<seu-nome>/`.
  Playwright com viewport, janela FORA da tela; nunca mexa no mouse/teclado do Natham. Olhe a foto antes de dizer pronto
  (texto cortado, encostado, acento, espaço sobrando). Prova de interação (arrastar, abrir) = foto antes/depois.
- Commit pelo índice só com os seus arquivos, sem trocar de branch, sem push. Sem `maestri ask` para andamento; só o relatório
  final (o que fez, sha, caminho das fotos).

## Alvenaria (Sonnet) · itens 61 e 62 · Mapa
Território: `src/app/mapa/`, `src/components/mapa/` e `src/lib/dados/exemplo.ts` (+ `exemplo.test.ts`) para os dados.
1. (61) O bloco azul "A POSTAR 8" fica bem menor (do porte dos números ao lado, não um cartão alto). Cabeçalho compacto:
   título, subtítulo e números alinhados numa faixa só, sem vão. O card branco da linha do tempo cabe INTEIRO na primeira tela
   (1440x760 e 1903x900): sem o vão vazio grande em cima dos marcos e embaixo do eixo; os marcos ocupam a altura do card.
   O efeito (rolar para baixo anda para o lado) continua.
2. (62) Dados de exemplo mais cheios: TODOS os dias do período com conteúdo, várias empresas (as que já existem nos dados),
   em etapas diferentes (roteiro, gravar, editar, postar...), redes variadas. Aleatório mas plausível e FIXO (sem
   `Math.random` em tempo de execução: gere a lista uma vez, ou use semente). Vários marcos no mesmo dia têm que caber sem
   sobrepor (empilhar / alternar em cima e embaixo). Os dados são os mesmos do calendário: confira que o calendário não
   quebra (foto do calendário também). Testes de `exemplo.test.ts` atualizados.

## Pena (Sonnet) · item 63 · Tarefas
Território: `src/app/tarefas/`, `src/components/tarefas/`.
1. O contador "0 de 2 feitas" vira do tamanho dos botões da linha (altura de controle, ~40px), sem o bloco alto.
2. Caderno sobe: tira o vão entre o filtro "Empresa" e a linha do título; a folha começa logo abaixo.
3. Arrastar a página para o lado muda o dia, como no caderno do CRM. Referência do CRM (só leitura):
   `C:\Users\Natham Monteiro\Desktop\CRM-You\js\` arquivos do caderno de tarefas (`app-tarefas*`; procure "arrast"/"pointer").
   Mouse e toque (pointer events), a folha acompanha o dedo e vira ao soltar; Anterior/Próximo continuam.
4. Depois que o Sextante publicar o calendário novo (item 64; o Maestro te repassa), troque o campo de data do caderno pelo
   componente dele. Não espere por isso para fazer 1 a 3.

## Sextante (Opus) · itens 64 e 66 · calendário de data + menu
Território: `src/components/ui/` (componente novo), `src/components/casca/`, e a TROCA do campo de data em todas as telas
MENOS tarefas (`src/components/tarefas/` e `src/app/tarefas/` são do Pena).
1. (66) Menu lateral um pouco mais estreito (hoje ~200px; algo como 176–184) e mais colado à esquerda. "Pouca coisa."
   Recolhido continua igual.
2. (64) Componente de data próprio (ex.: `src/components/ui/CampoData.tsx` + css) no lugar do `<input type="date">` nativo
   (foto 06). O painel que abre tem a MESMA pele do `Selecao` aberto (foto 07: vidro, sombra, cantos, item marcado azul,
   hover), com mês/ano, setas, grade de dias, hoje marcado, "Hoje" e "Limpar". Teclado (setas, Enter, Esc), fecha ao clicar
   fora, `prefers-reduced-motion`. Sem dependência nova. Mesmo valor (`AAAA-MM-DD`) para o resto do código não mudar.
   Data local de getFullYear/getMonth/getDate (nunca `toISOString`).
3. Troque todos os campos de data (ficha, calendário, conteúdos, configurações...) por ele. Ao terminar o componente,
   COMMITE primeiro e diga no relatório o caminho e o uso, para o Pena trocar o do caderno.
4. `grep 'type="date"'` no fim: só pode sobrar o do caderno (até o Pena trocar).

## Vitral (Sonnet) · item 65 · Pastas
Território: `src/app/pastas/`, `src/components/pastas/` e arquivo NOVO `src/lib/dados/ideias.ts` (mexer em
`tipos.ts`/`index.ts`/`pecas.ts`: avise o Maestro antes, são comuns).
1. Cada empresa com a cor DELA na pasta, em tom suave (pastel/dessaturado, vidro por cima), nada forte. Use a cor da empresa
   que já existe nos dados; o azul da Névoa continua só no que se clica.
2. Os cartões que saem da pasta deixam de baixar arquivo: clicar abre um CARD FLUTUANTE (janela por cima, pele da Névoa:
   vidro, cantos, sombra; fecha no X, Esc e clique fora) com as informações daquele item.
3. Toda empresa ganha a pasta "Ideias de conteúdo". Modelo: as Ideias do Yougram do CRM (fotos 09 e 10): categorias
   ("Formatos de conteúdo", "Ganchos", "Perfis - ..."), cada uma com N ideias; cada ideia tem título, texto e
   "Ver referência" (link em aba nova). No card flutuante: ver a lista, abrir uma ideia, adicionar e editar ideia (título,
   detalhe, link, categoria). Sem banco ainda: exemplos plausíveis + o que ele adicionar fica no navegador (localStorage
   com try/catch) até o Supabase.
4. Fotos: pastas fechadas (cores), pasta aberta, card flutuante aberto, ideia aberta, formulário de adicionar; 1440 e 390.

## Régua (Codex) · revisão no fim
Quando o Maestro chamar: revisão só leitura do delta da rodada 4 (bugs, contraste AA das cores suaves, teclado do
calendário, arraste no toque). Relatório com achados; quem conserta é o dono do território.

## Rodada 4b (itens 67–71, 19/10 tarde) — fotos 12 a 16
- **Sextante · 68:** item do menu "Tarefas" vira "Caderno" (o nome do sistema no topo e a rota /tarefas ficam). Foto do menu aberto e recolhido.
- **Pena · 68, 69, 70** (nesta ordem, um commit por item):
  - 68: título da tela "Tarefas" vira "Caderno" (e o rótulo do painel da esquerda, se fizer sentido; o painel da direita segue "Agenda do dia").
  - 69: alça ⠿ à esquerda de cada tarefa (aparece no hover, tooltip "Arrastar para mudar o horário"); arrastar para cima/baixo
    solta a tarefa na linha do horário escolhida (é o mesmo `posicao` = linha do horário que já existe). Teclado: alça focável +
    setas cima/baixo. Referência do CRM (só leitura): `Desktop/CRM-You/js/app-tarefas-linhas.js` e `app-tarefas-folha.js`.
    Não pode brigar com o arraste lateral da folha (item 63): começou na alça = arraste vertical da tarefa.
  - 70: botão ⋮ no fim de cada tarefa (aparece no hover/foco) abrindo menu com a pele do `Selecao`: Duplicar pro dia seguinte,
    Mover pro dia seguinte, Marcar horário, Criar tarefa para… (outra pessoa), Marcar pessoa…, Etiqueta (Prioridade, Não esquecer,
    Rápida, Sem — cores suaves da paleta de etiquetas), separador, Excluir em vermelho. "Ligar a um lead" NÃO entra (aqui não há
    leads); se der, troque por "Ligar a um conteúdo" usando os conteúdos que já existem, senão deixe de fora e diga no relatório.
    Referência: `Desktop/CRM-You/js/app-tarefas-menu.js`. Esc e clique fora fecham.
  - Antes de tudo: a foto 13 do Natham AINDA mostra as bolinhas; confira se o servidor 3100 está servindo o CSS novo (789f7f3).
- **Vitral · 71:** a cor de cada pasta passa a ser a cor DA MARCA: Beec = roxo da Beec (`Desktop/ID-Visual-ALL/Beec/`, SÓ LEITURA),
  You = laranja da You (o laranja do CRM: `Desktop/CRM-You/css/`, ou `ID-Visual-ALL` se houver pasta da You). Só a cor; nada da ID
  delas (fonte, logo, formas). Mantém o vidro e a arte da pasta, a cor tem que ser reconhecível (roxo é roxo, laranja é laranja).
  Texto da pasta com contraste AA sobre a cor. Anote no relatório os hex usados e de onde vieram.
