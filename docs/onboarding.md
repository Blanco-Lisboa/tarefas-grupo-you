# Preparação local

## Pré-requisitos

Node 24 e npm (versões usadas: Node 24.19, npm 11.17). Git. Nenhuma credencial.

## Primeira execução

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Cai direto no Calendário.

## Banco

Não há banco na Fase 1. Na Fase 2: Supabase novo, só deste sistema, com a URL em `.env.local` (ignorado pelo git; nomes em `.env.example`).

## Verificar

`npm run check` roda lint, tipos, regras locais, testes e build, sem conectar a nada.

## Agentes

Leia `AGENTS.md`. Cada tela é de um recruta: rota em `src/app/<tela>/` e componentes em `src/components/<tela>/`. Briefing e pedidos em `docs/levas/`.

## Dificuldades conhecidas

- O pnpm não está instalado; o projeto usa npm.
- O npm avisa que `unrs-resolver` e `esbuild` têm scripts de instalação não aprovados; build, lint e testes passam sem eles.
- `npm audit` aponta vulnerabilidades altas herdadas do template do Next (ver `docs/setup.md`).
