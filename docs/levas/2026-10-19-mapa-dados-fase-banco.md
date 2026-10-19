# Mapa da camada de dados atual (insumo da fase banco + login + Google Agenda)

Data: 19/10/2026. Só leitura: nenhum código foi alterado. Base: commit `b68e5b6`. Itens da leva lidos: 126, 133, 142, 143 (`docs/levas/2026-10-18-grade-de-conteudo-beec.md:147`, `:154`, `:163`, `:164`).

## Resumo do que a fase precisa (itens da leva)

- 126: login por pessoa. Caderno (tarefas, anotações, para amanhã, não esquecer) e Agenda são privados de cada um. "Criar tarefa para…" passa a entregar a tarefa no caderno do outro, que vê só aquela tarefa.
- 133: Conteúdos, Calendário de conteúdo, Mapa e Pastas são compartilhados entre os dois. Todo item SEM empresa é privado de quem criou, em qualquer tela.
- 142: Google Agenda de 4 pessoas (Natham, Matheus, Adrian, Lucas), filtro "Agendas" no Calendário. Natham vê as 4; Matheus vê a dele, a do Adrian e a do Lucas, nunca a do Natham. Pendente de decisão: Adrian e Lucas terão login? Como cada dono autoriza o Google.
- 143: login do Matheus = matheus.germano@assessoriabeec.com.br; o do Natham = natham.monteiro@youcontabilidade.com. Começar pelo /arquitetar e mostrar o plano antes de codar.

## 1. Entidades que existem hoje, com campos e tipos

Fonte dos tipos: `src/lib/dados/tipos.ts`, salvo indicação.

### 1.1 Tarefa (única tabela de "conteúdo" e "tarefa do caderno")

Conteúdo é um TIPO de tarefa, não uma entidade à parte (`tipos.ts:1`). O que separa "conteúdo" de "tarefa do caderno" é só ter `etapa`: o comentário em `exemplo.ts:16` diz que reunião e "outro" (sem etapa) são tarefas do Caderno. As duas telas leem a mesma lista.

`type Tarefa` em `tipos.ts:22-46`:

| Campo | Tipo | Linha | Observação |
|---|---|---|---|
| id | string | 23 | `crypto.randomUUID()` ao criar (`repositorio.ts:18`); exemplo usa `t01`, `t10`... |
| titulo | string | 24 | |
| tipo | TipoTarefa = "ideia" \| "roteiro" \| "gravacao" \| "edicao" \| "postagem" \| "reuniao" \| "outro" | 25, `:2`, `:12` | |
| empresaId | string | 26 | obrigatório no tipo, mas o Caderno trata `""` como "sem empresa" (`MenuTarefa.tsx:17`, `TelaTarefas.tsx:69`) |
| rede | Rede? = "instagram" \| "tiktok" \| "youtube" \| "kwai" | 27, `:3`, `:13` | |
| etapa | Etapa? = "roteiro" \| "gravacao" \| "edicao" \| "analise" \| "aprovado" \| "postado" | 28, `:4`, `:14` | presença = é conteúdo |
| responsavel | Responsavel = "natham" \| "matheus" | 29, `:5`, `:15` | união fixa de 2 nomes no código (também em `Pessoa.tsx:11-12`, `MenuTarefa.tsx:21`, `TelaTarefas.tsx:35`) |
| inicio | string? | 31 | texto local sem fuso: `"2026-10-21T14:00"` ou `"2026-10-21"` se diaInteiro; sem início = "sem data" |
| fim | string? | 32 | mesmo formato |
| diaInteiro | boolean | 33 | |
| cor | Etiqueta = "etiqueta-1".."etiqueta-16" | 34, `:6-10`, `:16` | no Caderno vira prioridade/não esquecer/rápida/sem (`MenuTarefa.tsx:23-28`: etiqueta-7, -1, -3, -5) |
| concluida | boolean? | 36 | ausente = não concluída |
| objetivo | string? | 38 | só postagem; aparece no Mapa |
| notas | string? | 39 | |
| links | Link[] | 40 | `Link = { rotulo: string; url: string }` (`:18`) |
| arquivos | Arquivo[] | 41 | ver 1.7 |
| tags | string[]? | 43 | ids de Tag |
| aprovador | string? | 45 | nome livre; só vale com tag de aprovação marcada (`Ficha.tsx:66`, `:109`) |

`NovaTarefa = Omit<Tarefa, "id"> & { id?: string }` (`tipos.ts:55`). Não existe campo de dono/criador: nada diz de quem é a tarefa além de `responsavel`.

### 1.2 Anotações do dia, "Para amanhã" e "Não esquecer" (Caderno, página da direita)

- "Anotações do dia" e "Não esquecer": texto livre, 1 string por dia cada, `maxLength` 4000 (`Agenda.tsx:48`, `:58`). Chaves `grade:caderno:<AAAA-MM-DD>:notas` e `grade:caderno:<AAAA-MM-DD>:lembrar` (`Agenda.tsx:27-28`). Tipos: `Armazem`, `EstadoNota = { chave: string; valor: string }` em `src/components/tarefas/notas.ts:2-3`.
- "Para amanhã" NÃO é entidade: é a lista derivada das tarefas do dia seguinte (`doDiaSeguinte`, `TelaTarefas.tsx:70-71`), entregue a `Agenda` como `amanha: Tarefa[]` (`Agenda.tsx:15`) e desenhada em `Agenda.tsx:53`.
- Não confundir com a etiqueta "Não esquecer" (cor `etiqueta-1` da tarefa, `MenuTarefa.tsx:25`): é outra coisa.
- A área "Sua agenda do Google aparece aqui" é só um espaço vazio (`Agenda.tsx:37-43`). Nenhuma integração com Google existe.

### 1.3 Empresa

`type Empresa = { id: string; nome: string; sigla: string }` (`tipos.ts:53`). Semente: `beec`/"Beec"/"BE" e `you`/"You"/"YO" (`exemplo.ts:4-7`). Criar/renomear/remover na tela Configurações (`TelaConfiguracoes.tsx:43`, `:56`, `:64`); a sigla é calculada pelo nome (`TelaConfiguracoes.tsx:7-9`). A cor da marca NÃO é campo: sai de `src/lib/cores-empresa.ts:11-20` (`TONS` fixo para beec e you; empresa nova escolhe cor por hash do id, `:27`). O logo/selo também é fixo por id em `src/components/ui/Marca.tsx` e `public/beec`, `public/marca`.

### 1.4 Tag e aprovadores

- `type Tag = { id: string; nome: string; cor: Etiqueta; aprovacao?: boolean }` (`tipos.ts:49`). Semente: uma tag, "Esperando aprovação", `aprovacao: true` (`repositorio.ts:7`). Só criar existe (`salvarTag`, `repositorio.ts:46`); não há editar nem excluir tag.
- Aprovadores NÃO são entidade: `APROVADORES = ["Natham","Matheus","Adrian"]` (`tipos.ts:51`) mais qualquer nome já digitado em alguma tarefa, calculado na hora (`Ficha.tsx:67`). Fica como texto livre no campo `aprovador` da tarefa.

### 1.5 Pessoas

Não existe entidade nem tabela. É a união `Responsavel = "natham" | "matheus"` (`tipos.ts:5`, `:15`) + nomes e fotos fixos em `src/components/ui/Pessoa.tsx:11-12` (fotos em `public/pessoas/natham.png`, `matheus.png`). Adrian aparece só como aprovador (texto). Lucas não existe no código.

### 1.6 Peça pronta (Pastas)

`type Peca` em `src/lib/dados/pecas.ts:10-24`:

| Campo | Tipo | Linha |
|---|---|---|
| id | string | 11 |
| empresaId | string | 12 |
| tipo | TipoPeca = "post" \| "carrossel" \| "video" \| "story" (`:7-8`) | 13 |
| titulo | string | 14 |
| meta | string? (formato, tamanho, duração) | 16 |
| link | string? (vídeo = link do Drive) | 18 |
| notas | string? | 19 |
| arquivo | Arquivo? | 21 |
| pastaId | string? | 23 |

Semente: 22 peças de exemplo (`pecas.ts:31-54`).

### 1.7 Anexo (Arquivo)

`type Arquivo = { nome: string; url?: string; tipo?: "imagem" | "video" }` (`tipos.ts:20`). Usado em `Tarefa.arquivos` e `Peca.arquivo`. `url` é um endereço `blob:` temporário criado com `URL.createObjectURL` (`src/components/ficha/Anexos.tsx:24`); o arquivo some ao recarregar a página. Não há upload nem armazenamento de arquivo. Comentário do próprio código: guardar de verdade depende do banco (`tipos.ts:19`, `Anexos.tsx:6-7`).

### 1.8 Pasta (Pastas)

`type Pasta = { id: string; nome: string; tipo?: TipoPeca; vazio?: string; ideias?: true }` (`src/lib/dados/pastas.ts:9`). Por empresa. De fábrica: Posts, Carrosséis, Vídeos, Stories, Ideias de conteúdo, e na You também "Adrian - Aprovar" (`pastas.ts:12-20`). Pastas criadas à mão nascem sem `tipo`. A peça aponta a pasta por `pastaId`; peças de exemplo sem `pastaId` caem na pasta do mesmo tipo (`pastas.ts:58`).

### 1.9 Ideia (Pastas > Ideias de conteúdo)

`type Ideia = { id: string; empresaId: string; categoria: string; titulo: string; texto: string; link?: string }` (`src/lib/dados/ideias.ts:6`). 10 ideias de exemplo por empresa (`ideias.ts:13-27`). Criar e editar existem (`gravarIdeia`, `:51`); não há excluir.

### 1.10 "Folhas" (Pastas)

Duas coisas com esse nome, nenhuma é entidade de dados:
- Caderno: a "folha que vira" é só animação (`src/components/tarefas/virar.ts`, `Folha.tsx`). O `LinhaFolha` (`Folha.tsx`) é um objeto de tela montado a partir da Tarefa em `TelaTarefas.tsx:75-83`.
- Pastas: "CardFolha" mostra uma Peca (`src/components/pastas/CardFolha.tsx`), estado de abertura é local de tela (`TelaPastas.tsx`).

### 1.11 Preferências de tela (não são dados de negócio)

| O quê | Chave localStorage | Onde |
|---|---|---|
| Menu recolhido | `grade:menu-recolhido` ("1"/"0") | `src/components/casca/menu-recolhido.ts:5-14` |
| Formato do Mapa (linha/fila) | `grade:mapa-formato` | `src/components/mapa/TelaMapa.tsx:31-34` |
| Filtro global de empresa (lista de ids) | `grade:filtro-empresa` | `src/lib/filtro-empresa.ts:6-23` |

Letra do Caderno: fixa no código (`LETRA_PRINCIPAL`, `src/components/tarefas/fontes.ts:16`), sem preferência gravada. Não existem Lucas, Adrian como usuário, "agendas", nem eventos do Google em nenhum tipo.

## 2. Onde cada coisa é guardada e quem lê/escreve

Resposta curta: existe uma camada única, mas ela está INCOMPLETA. `src/lib/dados/index.ts` é a porta de entrada declarada ("ÚNICA porta de entrada", `index.ts:1`) e o lint barra importar `exemplo` e `repositorio` das telas (`eslint.config.mjs:9-13`). Porém só 3 entidades passam por um repositório de fato. Peças, ideias e pastas têm cada uma seu próprio módulo com seu próprio mecanismo, e as notas do Caderno e as preferências são lidas direto por componentes de tela.

| Entidade | Onde mora hoje | Arquivo | Leitura (telas) | Escrita (telas) |
|---|---|---|---|---|
| Tarefa | variável de módulo em memória, inicia com 22 tarefas de exemplo; some ao recarregar | `src/lib/dados/repositorio.ts:5` | `useTarefas()` (`index.ts:10`) | `salvarTarefa` (`repositorio.ts:17`), `removerTarefa` (`:26`) |
| Empresa | memória, inicia com Beec e You | `repositorio.ts:6` | `useEmpresas()` (`index.ts:12`) | `salvarEmpresa` (`:31`), `removerEmpresa` (`:40`, leva as tarefas da empresa junto) |
| Tag | memória, inicia com 1 tag | `repositorio.ts:7` | `useTags()` (`index.ts:14`) | `salvarTag` (`:46`) |
| Peça | memória própria (não está no repositorio.ts), 22 exemplos; some ao recarregar | `src/lib/dados/pecas.ts:57` | `usePecas()` (`pecas.ts:74`) | `salvarPeca` (`:62`), `excluirPeca` (`:68`) |
| Ideia | localStorage `grade-conteudo:ideias:v1`, JSON por empresa (`Record<empresaId, Ideia[]>`), com cópia em memória se o navegador negar | `src/lib/dados/ideias.ts:8`, `:31-48` | `useIdeias(empresaId)` (`:68`), `lerIdeias` (`:65`) | `gravarIdeia` (`:51`) via `useIdeias().salvar` |
| Pasta | localStorage `grade-conteudo:pastas:v1`, JSON por empresa | `src/lib/dados/pastas.ts:11`, `:24-53` | `usePastas(empresaId)` (`:69`), `lerPastas` (`:55`) | `criarPasta` (`:63`), `renomearPasta` (`:64`), `excluirPasta` (`:66`) |
| Anotações do dia / Não esquecer | localStorage, 2 chaves por dia `grade:caderno:<dia>:notas` e `:lembrar` | `src/components/tarefas/Agenda.tsx:18-28` (helpers em `notas.ts`) | o próprio componente `Agenda` (hook local `useNota`) | idem, direto em `localStorage.setItem` (`Agenda.tsx:22`) |
| Anexos | `blob:` na memória do navegador, dentro de `Tarefa.arquivos`/`Peca.arquivo` | `Anexos.tsx:24` | via a tarefa/peça | via `salvarTarefa`/`salvarPeca` |
| Filtro de empresa, menu, formato do Mapa | localStorage (ver 1.11) | arquivos citados em 1.11 | hooks/funções locais | idem |
| Migração antiga | chave `grade:tarefas-feitas` lida e apagada, vira `concluida: true` | `TelaTarefas.tsx:54-61` | | |

Mecanismo comum: cada módulo tem um conjunto `ouvintes` e usa `useSyncExternalStore`; escrever troca o array/texto e avisa (`repositorio.ts:8-9`, `pecas.ts:58-59`, `ideias.ts:32-33`, `pastas.ts:26-27`). Por isso toda tela de dados é Client Component (`"use client"`). Servidor não lê nada: a página `src/app/tarefas/page.tsx` só devolve `<TelaTarefas />`; não há rota de API, Server Action, `proxy.ts` nem `middleware.ts` (conferido: nenhum dos dois existe em `src/`).

As escritas do repositório já são `async` e devolvem Promise (`repositorio.ts:17`, `:26`, `:31`, `:40`, `:46`) "no formato do futuro Supabase" (`docs/architecture.md`). As de Peça, Ideia e Pasta são síncronas (`pecas.ts:62`, `:68`; `ideias.ts:51`; `pastas.ts:63-66`).

Quem usa o quê (importações de `@/lib/dados`, conferidas por grep):
- Caderno (`src/components/tarefas/TelaTarefas.tsx:6`): `useTarefas`, `useEmpresas`, `salvarTarefa`, `removerTarefa`. Mais `Agenda.tsx` (notas direto no localStorage).
- Calendário (`calendario/TelaCalendario.tsx:3`): `useTarefas`, `salvarTarefa`. `Evento.tsx:3` usa `useEmpresas`.
- Conteúdos (`conteudos/TelaConteudos.tsx:9`): `salvarTarefa`, `useTarefas`, `useEmpresas`, `useTags`.
- Mapa (`mapa/TelaMapa.tsx:6`): `useTarefas`, `useEmpresas`. `mapa/EmOrdem.tsx:3`: `useEmpresas`.
- Ficha (modal de editar tarefa, `ficha/Ficha.tsx:15`): `salvarTarefa`, `removerTarefa`, `salvarTag`, `useEmpresas`, `useTags`, `useTarefas`. Usada por Caderno, Calendário, Conteúdos e Mapa.
- Pastas (`pastas/TelaPastas.tsx:3`): `usePecas`, `salvarPeca`, `excluirPeca`, `usePastas`, `useIdeias`, `useEmpresas`. `CardIdeias.tsx:3`: `useIdeias`.
- Configurações (`configuracoes/TelaConfiguracoes.tsx:4`): `useEmpresas`, `salvarEmpresa`, `removerEmpresa`, `useTarefas`, `usePecas`.
- `casca/EmConstrucao.tsx:2` e `casca/FiltroEmpresa.tsx:2`: `useTarefas` e `useEmpresas`.

Pontos que importam para desenhar o banco:
1. A visibilidade "sem empresa = privado" (133) hoje já tem um pedaço no front: o Caderno mostra tarefa sem empresa sempre, ignorando o filtro (`TelaTarefas.tsx:68-69`). Os outros (Calendário, Conteúdos, Mapa) usam `aplicar()` do filtro (`filtro-empresa.ts:37-40`), que esconde a tarefa sem empresa quando há empresa filtrada.
2. Nenhuma lista é filtrada por dono. Todas as telas leem `tarefas` inteiro e filtram na tela (empresa, etapa, data).
3. `Tarefa.responsavel` mistura "quem fará" com "de quem é o caderno". Hoje o Caderno mostra as tarefas dos dois (não filtra por responsável) e só exibe o nome na linha (`TelaTarefas.tsx:79`).
4. Empresa e Tag são globais; Pasta e Ideia são por empresa; Peça é por empresa + pasta. Nenhuma tem dono de pessoa.
5. Ideias/pastas/notas hoje vivem no navegador de quem usa: cada pessoa, em cada navegador, vê um conjunto diferente. Para compartilhar (133) viram tabelas.
6. `removerEmpresa` apaga as tarefas dela em cascata (`repositorio.ts:39-44`, comentário `ponytail`); peças, pastas e ideias da empresa NÃO são apagadas (ficam órfãs no localStorage / na lista de peças).

## 3. "Criar tarefa para…" do ⋮ e o campo responsável

Menu ⋮: `src/components/tarefas/MenuTarefa.tsx`. Opções do menu (linhas 76-98): Duplicar pro dia seguinte, Mover pro dia seguinte, Marcar horário…, Criar tarefa para…, Marcar pessoa…, Mudar empresa…, Etiqueta (4), Excluir.

- "Criar tarefa para…" abre a vista `"criar"` (`MenuTarefa.tsx:88`, `:125`), que lista as pessoas de `PESSOAS = [natham, matheus]` (`MenuTarefa.tsx:21`, desenhadas em `:52-62`). Clicar chama `acoes.criarPara(id, quem)` (`MenuTarefa.tsx:15`).
- Implementação (`TelaTarefas.tsx:185`): `criarPara = (id, quem) => comTarefa((t) => salvarTarefa({ ...t, id: undefined, responsavel: quem, concluida: false }))(id)`. Ou seja: COPIA a tarefa inteira (mesmo título, empresa, datas, etiqueta, notas, links, anexos, tags) sem `id` (gera nova), troca `responsavel` e desmarca `concluida`. Cai na MESMA lista global de tarefas, no mesmo dia. Não existe "entrega", notificação, remetente nem destinatário: nada registra quem criou. Pode escolher a si mesmo (a lista inclui as duas pessoas).
- "Marcar pessoa…" (`TelaTarefas.tsx:186`) só troca `responsavel` da própria tarefa (sem copiar). Mesma tela de escolha, com a pessoa atual marcada (`MenuTarefa.tsx:140`).
- Campo responsável: `Responsavel = "natham" | "matheus"`, obrigatório em `Tarefa` (`tipos.ts:29`). Aparece no Caderno como nome + avatar na linha (`TelaTarefas.tsx:79`, `:82`; avatar em `ui/Pessoa.tsx`), no filtro do Calendário (`calendario/Filtros.tsx:2`) e na Ficha (`RESPONSAVEIS`, `Ficha.tsx:15`). Tarefa nova escrita direto na linha da folha (`aoEscrever`, `TelaTarefas.tsx:245-251`) nasce `tipo: "outro"` com o `responsavel` escolhido na própria linha.
- Efeito para o plano: o "Criar tarefa para…" de hoje é a semente da entrega entre cadernos (126), mas hoje não separa nada: as duas pessoas veriam as mesmas listas.

## 4. Stack e como roda o `npm run check`

- Next `16.4.2` (`package.json`, versão instalada conferida em `node_modules/next/package.json`). React 19.3.0, TypeScript 5, Tailwind 4, ESLint 9, Vitest 5, Node 24.19.0 (`docs/setup.md`).
- App Router: sim. Rotas em `src/app/<tela>/page.tsx` (calendario, tarefas, conteudos, mapa, pastas, configuracoes, modelos, tarefas/letras) e `src/app/layout.tsx` com `Casca` (`layout.tsx:25`). `next.config.ts` liga `cacheComponents: true` e `partialPrefetching: true` (linhas 9-10) e usa Turbopack. `AGENTS.md` avisa que este Next tem mudanças incompatíveis: ler `node_modules/next/dist/docs/` antes de codar rotas, cache e auth.
- Dependências: nenhuma de Supabase (`@supabase/*`), auth (`next-auth`, `@auth/*`, `better-auth`, `jose`, `bcrypt`) ou Google (`googleapis`, `google-auth-library`) em `package.json`. Já instalados e NÃO conectados: `drizzle-orm ^0.45.4`, `pg ^8.23.1`, `zod ^4.6.7`, `pino ^10.4.0`, `server-only`; dev: `drizzle-kit ^0.31.11`, `eslint-plugin-drizzle`, `@next/env`. Também `gsap`, `clsx`, `tailwind-merge`.
- Núcleo de banco já pronto, vazio: `src/db/index.ts` (`getDb()`, Pool do `pg` com `max: 5`, `server-only`), `src/db/schema/index.ts` (vazio: `export {}`), `drizzle.config.ts` (lê `DATABASE_URL_UNPOOLED` ou `DATABASE_URL`, saída `./drizzle`, que ainda não existe), `src/lib/env.ts` + `env-schema.ts` (valida `DATABASE_URL` como `postgres://`), `src/lib/logger.ts`. `.env.example` tem `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `LOG_LEVEL`; `.gitignore` ignora `.env*` (menos o exemplo). Scripts `db:generate` e `db:migrate` existem; `db:generate` nunca foi validado (schema vazio, `docs/setup.md`).
- Regra do projeto: não criar projeto Supabase, não publicar, não fazer push sem pedido explícito (`AGENTS.md`).
- `npm run check` (`package.json`): `npm run lint && npm run typecheck && npm run lint:rules && npm test && npm run build`, em cadeia (para no primeiro que falhar).
  - `lint` = `eslint .`; inclui a regra que barra importar `@/lib/dados/*`, `exemplo` e `repositorio` fora de `src/lib/dados/**` (`eslint.config.mjs:9-13`).
  - `typecheck` = `tsc --noEmit`.
  - `lint:rules` = `node scripts/verify-quality-rules.mjs ./eslint-rules/index.cjs` (testa as regras locais em `eslint-rules/`).
  - `test` = `vitest run` (testes ao lado do código: `*.test.ts` em `lib/dados`, `components/*`, `lib/`).
  - `build` = `next build`.
  - Não rodei o `check` nesta tarefa (só leitura). Última medição registrada em `docs/setup.md` é antiga (bootstrap: 10 testes, 7 rotas); não vale como estado atual.

## 5. Deploy na Vercel

Não há deploy configurado no repositório:
- Não existe `vercel.json` na raiz, nem pasta `.vercel/` (conferido). `.gitignore` já ignora `.vercel` (linha "# vercel").
- Não há remoto de produção documentado em `README.md`/`docs/setup.md`. Existem skills da Vercel copiadas em `.claude/skills/` (`vercel-optimize` etc.) e `skills-lock.json`, que são material de apoio, não configuração de deploy.
- A regra do projeto proíbe publicar sem pedido explícito (`AGENTS.md`). O app hoje roda só em dev local (existe `dev-3100.log` na raiz, ignorado pelo git).
- Variáveis de ambiente necessárias hoje: nenhuma obrigatória (o banco não é chamado). Para a fase: `DATABASE_URL`, `DATABASE_URL_UNPOOLED` e as chaves do Supabase/Google ainda não existem em lugar nenhum.

## Lacunas que o plano da fase vai precisar decidir (não são código, só o que o mapa mostra)

1. Dono: não existe. Precisa de "usuário" (Natham, Matheus, e talvez Adrian/Lucas só como agendas observadas) ligado ao login.
2. `responsavel` hoje é união fixa de 2 nomes usada em ~8 arquivos: vira referência a usuário.
3. "Entrega" do "Criar tarefa para…": hoje é cópia na mesma lista; precisa de remetente, destinatário e a regra "o outro vê só aquela tarefa".
4. Compartilhado vs. privado (133): Conteúdos/Calendário/Mapa/Pastas compartilhados quando têm empresa; qualquer item sem empresa é privado de quem criou. Hoje o único tratamento disso é no front do Caderno.
5. Entidades que hoje moram no navegador e precisam virar tabela: ideias, pastas, anotações do dia, não esquecer. Peças e anexos precisam de armazenamento de arquivo (hoje `blob:` temporário).
6. Cor e logo da empresa são fixos no código por id; empresa nova usa hash. Se a empresa virar linha de tabela, decidir se a cor entra no cadastro (o comentário em `cores-empresa.ts:5` já prevê isso).
7. Tags: sem editar nem excluir; aprovadores: texto livre sem cadastro.
8. Google Agenda: nada existe (só o espaço vazio em `Agenda.tsx:37-43`); precisa decidir login do Google por dono e onde guardar os tokens.
