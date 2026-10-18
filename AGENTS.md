# Grade de conteúdo

Natham não é programador: traduza termo técnico na primeira vez, use analogia e diga o que muda na prática. Texto da interface e documentos em português do Brasil, sem travessão (— e –).

## Produto e stack

- Produto e escopo: `PRODUCT.md`. Setup e validações: `docs/setup.md`.
- Stack: Next.js 16.4 (App Router), React 19, TypeScript, Tailwind 4, ESLint 9, Vitest, Node 24, npm.
- Núcleo instalado e NÃO conectado (Fase 2): Drizzle ORM, pg, Zod, Pino.

## Comandos canônicos

- Instalar: `npm install`
- Desenvolver: `npm run dev`
- Lint: `npm run lint`
- Tipos: `npm run typecheck`
- Regras locais de lint: `npm run lint:rules`
- Testes: `npm test`
- Build: `npm run build`
- Verificar tudo: `npm run check`

## Regras do projeto

- Identidade visual SÓ Beec. Leia `docs/design.md` antes de mexer em tela. `ID-Visual-ALL` é só leitura, nunca editar.
- Telas importam dados SÓ de `@/lib/dados` (o lint barra `exemplo` e `repositorio`). Filtro de empresa só pelo hook `useFiltroEmpresa` de `@/lib/filtro-empresa`.
- Território: cada tela tem a sua rota em `src/app/<tela>/page.tsx` e os componentes em `src/components/<tela>/`. Fora do seu território, pare e avise.
- Sem Caveman, sem Graphify, nada no escopo da máquina (plugin, hook, ferramenta global). Context7 só no projeto (`.mcp.json`).
- Sem credencial em arquivo do repo; segredos em `.env.local` (ignorado pelo git).
- Não publicar, não criar projeto Supabase, não fazer push sem pedido explícito.
- Commit pelo índice (`git add <arquivos>` e `git commit` sem caminho), sem trocar de branch.
- Prova antes de dizer pronto: `npm run build` e `npm run lint` passando, mais captura de tela em 1903x900, 1440x760 e 390 com `innerWidth` na imagem, em `provas/<nome>/`.

## Ferramentas e estilo

Ponytail `full` (menor mudança completa), Superpowers e RTK já instalados na máquina. Código, documentos e commits com redação normal.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
