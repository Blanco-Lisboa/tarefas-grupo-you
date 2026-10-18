# Qualidade

## Comandos

| Comando | O que faz |
|---|---|
| `npm run lint` | ESLint (presets Next, teto de 350 linhas, logger, fronteira de dados, guardas Drizzle, importação só de `@/lib/dados`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint:rules` | self-check das regras locais |
| `npm test` | Vitest (env, logger, pool, dados de exemplo) |
| `npm run build` | build de produção |
| `npm run check` | todos acima, em sequência, sem conectar a banco |

## Regras de base

Copiadas do kit (`eslint-rules/`). Ajuste local: `no-restricted-imports` impede telas de importar `@/lib/dados/exemplo` ou `@/lib/dados/repositorio`.

## Estratégia de testes

Lógica com teste: env, logger, ciclo do pool, integridade dos dados de exemplo. Telas e fluxos de interface ainda não têm teste: entram junto de cada tela. Prova visual por captura em 1903x900, 1440x760 e 390.

## Revisão após implementação ou correção

Sugerir de 3 a 8 ciclos de code review, conforme o risco (convenção do kit, não garantia).

## Dependências e entrega

Sem publicação nem push neste setup. Auditoria registrada em `docs/setup.md`.
