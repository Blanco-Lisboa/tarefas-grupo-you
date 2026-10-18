# Setup e evidências

## Origem e contexto

Bootstrap em 18/10/2026 pela receita 11 do Vibe Coding Toolkit (`_kit`, commit `f13bb35`, lido do disco), feito pela recruta Alvenaria (Fase A). Windows 11, Node 24.19.0, npm 11.17.0. Sem pnpm instalado: npm.

## Decisões e fontes

- Base: `create-next-app@latest` com TypeScript, Tailwind, ESLint, App Router, `src/`, `@/*`, npm, sem React Compiler. Resultado: Next 16.4.2, React 19.3.0.
- Exceções do Natham (16/10/2026): sem Caveman, sem Graphify, nada no escopo da máquina, Context7 só no projeto. Banco só na Fase 2: núcleo Drizzle/pg/Zod/Pino instalado, sem conexão, sem tabelas, sem Supabase.
- `@next/env` alinhado ao Next (16.4.2); `@types/node@24`.
- Perfil de lint completo do kit (`next-app.config.mjs.example`) mais uma regra local de importação (ver `docs/architecture.md`).

## Componentes

| Componente | Estado |
|---|---|
| Skills Vercel (8 web) e `find-skills` | configurado em `.claude/skills/` (cópia, escopo do projeto) e `skills-lock.json`; descoberta em sessão nova não testada |
| Context7 | `.mcp.json` do projeto (sem segredos); consulta real não testada |
| Ponytail, Superpowers, RTK | da máquina, já instalados; reaproveitados |
| Caveman, Graphify | não instalados, por decisão |
| Receita 10 (setup da máquina) | não executada, por decisão |

## Documentação criada

`README.md`, `PRODUCT.md`, `AGENTS.md`, `CLAUDE.md` (importa `AGENTS.md`), `docs/architecture.md`, `docs/design.md`, `docs/onboarding.md`, `docs/quality.md`, `docs/setup.md`, mais `ORIGEM-DA-IDENTIDADE.md` e `docs/levas/`.

## Verificações

- `npm run lint`: sem avisos. `npm run typecheck`: sem erros. `npm run lint:rules`: 3 regras ok. `npm test`: 4 arquivos, 10 testes passando. `npm run build`: sem erros, 7 rotas estáticas.
- Captura da casca em 1903x900, 1440x760 (aberto e recolhido) e 390, em `provas/alvenaria/`, com Chrome headless (Playwright). Filtro "Beec" marcado em /calendario continuou marcado em /tarefas (23 de 42 tarefas visíveis).
- Console: o script não registrou mensagens, mas não foi provado que o log captura; não vale como "console limpo".
- `npm audit --omit=dev`: 0 vulnerabilidades. `npm audit` completo: 9 (4 moderadas, 5 altas), todas em ferramentas de desenvolvimento (cadeia `drizzle-kit`/esbuild); sem correção sem downgrade forçado, não aplicada.
- Não validado: `db:generate` (schema vazio de propósito), conexão com banco (não existe).

## Pendências e próxima entrega

- Ícones TikTok, YouTube e Kwai: só há o de Instagram nos ícones principais da ID (`marcas\` não foi copiada).
- Persistência do estado "menu recolhido" entre visitas: não feita.
- Próxima entrega: as cinco telas, uma por recruta, começando pelo Calendário.
