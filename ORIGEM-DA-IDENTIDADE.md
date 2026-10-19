# Origem da identidade visual

Tudo copiado em 18/10/2026 de `C:\Users\Natham Monteiro\Desktop\ID-Visual-ALL\Beec\identidade\` (SÓ LEITURA; nada foi alterado lá). Se a ID mudar, copiar de novo e atualizar esta lista.

| Arquivo no projeto | Origem (dentro de `identidade\`) | Observação |
|---|---|---|
| `src/styles/beec-tokens.css` | `tokens.css` | Linhas 8 a 170 (bloco FINAL) e 246 a 257 (classes da casa `.destaque`, `.no-escuro`, `.corte-22`, `.corte-22-esq`, `.corte-sombra`, `.corte-sombra-escuro`). Blocos LEGADO ficaram de fora. Uma linha de cabeçalho foi acrescentada. |
| `public/beec/logo/*.svg` (14 arquivos) | `logo\svg\*.svg` | Pasta inteira: ícones, logos bege, grafite, ouro, roxo, adesivo (com e sem grão) e `favicon.svg`. |
| `public/beec/icones/*.svg` (66 arquivos) | `icones\svg\*.svg` | 22 ícones em 3 versões (`nome`, `nome-claro`, `nome-liso`). |
| `public/beec/icones/marcas/*.svg` (10 arquivos) | `icones\svg\marcas\*.svg` | Subpasta completa copiada em 18/10/2026: Google, Meta, TikTok, WhatsApp e YouTube, nas versões padrão e lisa. |
| `src/app/globals.css`, bloco "Peças copiadas da ID" | `prancha.html`, CSS da seção 10 ("Botões, campos, cards, etiquetas e menus") | Copiado em 18/10/2026 (pente fino, item 53, commit `e10393e`). Peças: `.btn` com `::before`, `:hover` e foco (linhas 231 a 236), `.btn-2` e `.btn-claro` (237, 238, 241, 242), `.lnk` (244), `.sub` (45 e 46), `.b3` (309 e 310), `.seta` (1347), as versões no escuro (foco bege do botão, 243; sublinhado ouro, 47; 3 barras em ouro, 311) e o botão parado para quem pede menos movimento (581). Mudanças: o `.btn` troca `padding: 15px 30px` por `height: var(--app-controle)` (44px, a mesma altura) com `padding: 0 30px` e ganha o reset de botão do navegador (borda, fundo, cursor, centralizar); as versões no escuro passam a valer só dentro de `.no-escuro` (a classe da casa em `tokens.css`), no lugar das classes de seção da prancha. Ficaram de fora: `.btn-ouro`, `.btn i`, os estados de demonstração (`.is-hover`, `.is-foco`) e os desligados (`.btn-off*`). |

Arquivos novos do projeto, que NÃO vêm da ID:

- `src/styles/etiquetas.css`: paleta das etiquetas das tarefas (exceção aprovada, brief seção 5).
- `src/components/ui/selecao.css` e `src/components/casca/casca.css`: escritos no projeto, seguindo o desenho da ID sem
  copiar código (botão de seleção = campo da `prancha.html` seção 10, lista = submenu do site em `aplicacoes-marca.html`;
  menu = `menu-id.css`, menos o grudado e o grafite, que são pedido do Natham). A origem de cada escolha está no topo
  de cada arquivo.
- Fontes Bricolage Grotesque e Host Grotesk: baixadas pelo `next/font/google` (Google Fonts, licença OFL), não copiadas da ID.
