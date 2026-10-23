# RETOMADA — rodada 23/10 (pasta Ideias + Esteira), itens 298–302

## No ar (dpl_BqVhfsfy…, 23/10 ~13h, aprovado pelo Natham: "Certo. publica")
- **298** Ideias: ⋮ em cada coluna → Renomear, Mover p/ esquerda/direita, Apagar (só coluna vazia). Ordem no banco (`ideias_categorias.ordem`). 1c984a0.
- **299** Ideias: links sem limite, 2 por linha; texto "Ver referência" inteiro e × com folga. 71c0718 + 95c2514.
- **300** Ideias: folha = Título → Descrição → Prints → Links; Ctrl+V cola print, miniatura, clique amplia, × + "Apagar?" remove; limite 10 MB; Storage balde `arquivos`, gaveta `ideias/` (decisão dele: ficar no Supabase). 0c6e40c + 95c2514.
- **301** Aviso "Hydration failed" na 3100 = extensão de tradução do Chrome; script de boot tira as 2 divs dela por 5 s. a5cd973.
- **302** Esteira: tag livre, clipe abaixo da logo da rede, mesma altura do card. 23f6500 + 109a3ba.
- SQL colados e conferidos (Alvenaria, só leitura): `supabase/_colar/2026-10-23-298-ordem-das-colunas.sql`, `2026-10-23-300-prints-das-ideias.sql`.

## Abertos / vale saber
- Mover coluna é por botão, sem arrastar (se ele pedir arrastar, é volta do 298).
- Print apagado: se o Storage falhar ao apagar o arquivo, sobra arquivo solto (sem efeito na tela).
- `tsconfig.json` aparece modificado sem commit = reformatação do servidor de dev do Next; não commitar.
- `npm run check` completo não fecha por lixo em `provas/` (lint) — src/ e scripts/ limpos. `scripts/exemplo-banco.mjs` encostado no teto de 350 linhas.
- Pendências antigas seguem em `2026-10-22-RETOMADA-noite-caderno.md` (286 perguntado, 029 e 026 não colados, spend cap, postagem automática).
- Terminais: TODOS retirados a pedido dele. Retirar terminal só quando ELE mandar (não é regra automática).
