# Pente fino da ID (item 53) · Pastas · Vitral

Comparado por foto: `provas/r2-id-vitral/id-*-pastas*.png` (a tela) ao lado de `prancha-cards-r1.png` e `prancha-prancha.png` (a ID, só leitura).
Fontes lidas: BRIEFING (§7, §9, §10, §14), tokens.css bloco FINAL, cards-r1, prancha.

| Elemento da tela | Par na ID | Resultado | Conserto |
|---|---|---|---|
| Roxo claro das pastas (`#470E96`, 60% roxo + 40% elétrico, inventado por mim) | Paleta A: só roxo `#2A075A`, grafite, card escuro, ouro | NÃO BATE (cor fora da ID; elétrico é só no claro e só em detalhe) | Saiu. Pasta feita só de roxo profundo + veias de grafite e card escuro + brilho de ouro; fundo da pasta com `--brilho-escuro` da ID |
| Vidro da frente (tom grafite 94%) | Card escuro / roxo profundo | NÃO BATE (escuro demais, Natham pediu mais claro) | Tinta passou a ser o roxo profundo (10% a 84%), o texto bege segue com contraste alto |
| Painel de cada versão (superfície com borda de 1px) | Card da `cards-r1`: superfície `#FFFDF8`, orelhas 22°, sombra no pai | NÃO BATE (retângulo reto com borda; a ID diz "ou borda ou sombra" e card com orelha leva a sombra no pai) | Painel com `.corte-22` (orelhas), sem borda, `--sombra-card-filtro` no pai |
| Sombra da pasta (preta 62%) | Sombra de card (`--sombra-card-filtro-escuro`), sem sombra longa | NÃO BATE (pesada demais no claro) | Camada de sombra em grafite a 42%, curta e difusa |
| Título "Pastas" (roxo, 31px) | Título no claro: roxo profundo, Bricolage 800 | BATE | Nada |
| Nome da empresa e contagem | Título de bloco roxo + rótulo em caixa alta com `--rotulo-letra` | BATE | Nada |
| Rótulos "Exata" e "Adaptada Beec" | Destaque no claro: elétrico, em detalhe | BATE | Nada |
| Linha entre empresas | `--cor-linha-forte` | BATE | Nada |
| Foco de teclado nas peças | No claro o foco é elétrico ou roxo; ouro no claro é proibido | BATE depois do conserto anterior (roxo) | Nada |
| Botão "Versão" | Botão da casa, raio 2px, reto, sem pílula | BATE (usa o `Selecao` da base) | Nada |
| "Ver todas" e lista de peças | Botão secundário e lista de card no claro | BATE (superfície, raio 2px, hover roxo a 6%) | Nada |
| Pasta "exata" (cantos redondos, quique) | Sem par: exceção aprovada (BRIEF §5) | Fica como é | Só as cores foram para a paleta |
| Pasta "adaptada" (aba e cantos a 22°, raio 2px, sem quique, curva da Beec) | Orelhas padrão (cima à esquerda + baixo à direita) e `--curva` | BATE | Nada |
| Ícone do menu "Pastas" e fontes | `icones/svg`, Bricolage + Host | BATE (vem da casca) | Nada |

Sem par na ID: a pasta de vidro em si (peça do componente "Glass Folder Cards"). Peça mais próxima usada: card escuro pequeno em roxo profundo (`#2A075A`) com brilho escuro.
