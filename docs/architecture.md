# Código e arquitetura

## Stack efetiva

Next.js 16.4.2 (App Router, Turbopack), React 19.3, TypeScript strict, Tailwind 4, ESLint 9, Vitest 5, Node 24, npm. Persistência (Drizzle, pg) instalada e desligada: Fase 2.

## Mapa do código

```text
src/app/                 rotas. layout.tsx (fontes + Casca), page.tsx (vai para /calendario)
src/app/<tela>/page.tsx  uma rota por tela: calendario, tarefas, conteudos, pastas, configuracoes
src/components/casca/    menu lateral, filtro de empresa, aviso "em construção" (dono: casca)
src/components/<tela>/   componentes de cada tela (um território por tela)
src/lib/dados/           camada de dados única (ver abaixo)
src/lib/filtro-empresa.ts  filtro global de empresa
src/styles/              beec-tokens.css (copiado da ID), etiquetas.css (paleta das tarefas)
src/db/, src/lib/env*, logger, utils   núcleo do kit para a Fase 2 (sem conexão)
public/beec/             logo e ícones SVG copiados da ID (ver ORIGEM-DA-IDENTIDADE.md)
```

## Fronteiras e fluxo

**Camada de dados (`@/lib/dados`).** Única porta de entrada. Telas só importam daí; o lint (`no-restricted-imports`) barra `@/lib/dados/exemplo` e `@/lib/dados/repositorio`.

- Tipos: `Tarefa`, `Empresa`, `NovaTarefa` e as listas `TIPOS`, `REDES`, `ETAPAS`, `RESPONSAVEIS`, `ETIQUETAS`.
- Leitura (hooks, reativos): `useTarefas(): Tarefa[]`, `useEmpresas(): Empresa[]`. Telas de dados são Client Components (`"use client"`), porque a memória vive no navegador.
- Escrita (assíncronas, já no formato do futuro Supabase): `salvarTarefa(nova)` (cria se não tem `id`, senão substitui), `removerTarefa(id)`, `salvarEmpresa(empresa)`, `removerEmpresa(id)` (leva as tarefas da empresa junto).
- Na Fase 2 só `repositorio.ts` troca por Supabase. A API pública de `index.ts` não muda.
- Datas: texto local sem fuso, `"2026-10-21T14:00"`, ou `"2026-10-21"` com `diaInteiro: true`. Sem `inicio` = "sem data".

**Filtro global de empresa (`@/lib/filtro-empresa`).** Lista vazia = Todas. Guardado em `localStorage` (`grade:filtro-empresa`), vale em todas as telas e visitas. As telas só consomem:

```tsx
const { aplicar, selecionadas, todas } = useFiltroEmpresa();
const visiveis = aplicar(useTarefas()); // funciona com qualquer lista que tenha empresaId
```

A interface (chips Todas, Beec, You) é `components/casca/FiltroEmpresa.tsx`, desenhada pela casca no topo de todas as telas, exceto Configurações. Tela nenhuma desenha o próprio filtro.

## Dados e migrations

Sem tabelas e sem conexão. `getDb()` só cria o pool quando chamado e nada o chama. Schema nasce na Fase 2 a partir do tipo `Tarefa`.

## Decisões

- Menu com sombra em camada irmã (`.menu-sombra`, box-shadow) e não `filter` no pai como a ID sugere: `filter` num ancestral cria uma "raiz de fundo" e mata o desfoque do vidro (`backdrop-filter`) do menu.
- Ícones do menu são os SVG da Beec pintados por máscara CSS, para poder ficar ouro no item ativo sem redesenhar.
- Filtro e dados usam `useSyncExternalStore` com armazenamento no módulo: sem Provider, sem dependência nova.
- Restrição de importação adicionada em `eslint.config.mjs` além do perfil do kit.

## Manutenção

Atualize junto de mudanças de estrutura, dados ou filtro.
