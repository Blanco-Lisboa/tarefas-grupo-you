# FASE B · regras comuns dos 4 terminais das telas (18/10/2026)

Leia antes: `docs/levas/2026-10-18-BRIEF-comum.md` (decisões do Natham), `docs/levas/2026-10-18-grade-de-conteudo-beec.md`
(pedidos), `docs/architecture.md` e `src/lib/dados/` (contrato). A base foi montada pela Alvenaria.

## Contrato da base (não reescreva)
- Dados: `import { useTarefas, useEmpresas, salvarTarefa, removerTarefa, salvarEmpresa, removerEmpresa, type Tarefa } from "@/lib/dados"`.
  Telas com dados são `"use client"`. Escrita é assíncrona. Datas: texto local sem fuso (`"2026-10-21T14:00"`, ou
  `"2026-10-21"` com `diaInteiro: true`). Sem `inicio` = "sem data".
- Filtro de empresa: `const { aplicar } = useFiltroEmpresa()` de `@/lib/filtro-empresa`; `aplicar(lista)`. A casca já
  desenha o filtro. Nenhuma tela desenha outro filtro de empresa (filtros extras da própria tela, sim).
- Cores: tokens Beec em `src/styles/beec-tokens.css`, etiquetas em `src/styles/etiquetas.css` (`--etiqueta-1..10`).
  Ícones em `public/beec/icones/`, logo em `public/beec/logo/`. Nunca redesenhe ícone nem logo.

## Territórios (cada um escreve SÓ no seu)
| Terminal | Escreve em |
|---|---|
| Sextante (calendário) | `src/app/calendario/**`, `src/components/calendario/**`, `src/components/ficha/**` (ficha da tarefa, que os outros vão usar) |
| Pena (tarefas) | `src/app/tarefas/**`, `src/components/tarefas/**` |
| Vitral (pastas) | `src/app/pastas/**`, `src/components/pastas/**`, NOVOS arquivos `src/lib/dados/pecas*.ts` e UMA linha de export em `src/lib/dados/index.ts` |
| Régua (conteúdos + config) | `src/app/conteudos/**`, `src/components/conteudos/**`, `src/app/configuracoes/**`, `src/components/configuracoes/**`, `public/beec/icones/marcas/**`, `ORIGEM-DA-IDENTIDADE.md` |

Precisa mudar algo fora (tipo `Tarefa`, casca, tokens, `package.json`)? NÃO mude: escreva o pedido no seu relatório.
Instalar pacote novo: só se for indispensável, e diga qual e por quê no relatório (o `package.json` é de todos).

## Servidor e build
- Servidor COMPARTILHADO já rodando: `http://127.0.0.1:3100`. NÃO suba outro `next dev` e NÃO rode `next build`
  (os dois brigam pela pasta `.next`). Se cair, religue (PowerShell, na pasta `grade-conteudo`):
  `Start-Process -WindowStyle Hidden cmd.exe -ArgumentList '/c','npm run dev -- -p 3100 > dev-3100.log 2>&1'`
- Conferência sua: `npm run lint` e `npx tsc --noEmit`. O build final é feito no fim por um só terminal.

## Git
- Ninguém troca de branch. `git add <só seus arquivos>`, confira `git diff --cached --stat`, e `git commit -F <arquivo>`
  SEM caminho. Nunca `git add -A`/`.`. Não faça `git add` de `dev-3100.log`.

## Prova (antes de dizer pronto)
- Capturas Playwright (viewport) em 1903x900, 1440x760 e 390, com `innerWidth` impresso na imagem, em `provas/<seu-nome>/`.
  Chrome headless ou fora da tela. Nunca mexa no mouse/teclado do Natham.
- Console: capture os erros da página, e prove que a captura funciona provocando um erro de propósito uma vez.
- Confira a imagem você mesmo: acentuação, nada encostando, raio 2px (nada de pílula), regras da Beec.

## Relatório (resposta do seu turno, sem `maestri ask`)
O que fez · arquivos · como provou (comandos + resultado) · pedidos fora do seu território · pendências.
