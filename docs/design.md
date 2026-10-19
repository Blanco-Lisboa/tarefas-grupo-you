# Design e acessibilidade

## Direção

Visual 100% Beec. Fonte da verdade: `Desktop/ID-Visual-ALL/Beec/BRIEFING.md` (seção 14 vence) e `identidade/tokens.css` (bloco FINAL). Manual: `identidade/prancha.html`. A pasta da ID é só leitura.

## Sistema existente

- Tokens: `src/styles/beec-tokens.css` (cópia do bloco FINAL e das classes da casa). Não editar; mudou na ID, copiar de novo e anotar em `ORIGEM-DA-IDENTIDADE.md`.
- Camada do app: `src/app/globals.css` (`--app-*`, `--cor-realce-claro`) e as peças da prancha (`.btn`, `.btn-2`, `.btn-claro`, `.lnk`, `.sub`, `.seta`, `.b3`). Telas usam estes nomes.
- Cores: bege `#F6F2EA` (fundo), superfície `#FFFDF8`, grafite `#18131F` (bloco escuro grande), roxo `#2A075A` (botão, título, card escuro pequeno), kraft `#E6DCC8` (só apoio), ouro `#FFBF2F` (só detalhe e só no escuro), elétrico `#7319F1` (só detalhe e só no claro), tinta `#1A1024` (texto).
- Fontes (next/font/google): Bricolage Grotesque 800 (título e número) e Host Grotesk (texto). Números no desenho padrão, sem `tabular-nums`.
- Ponto único: ângulo de 22° (destaque, selo e botão inclinam; texto e campo nunca), orelhas (`.corte-22`, `.corte-22-esq`), ponta de barra nos sublinhados, sombra forte em um herói por tela.
- Logo e ícones: sempre os SVG copiados em `public/beec/`. Nunca redesenhar.
- Proibido: pílula (raio é 2px), roxo ou elétrico como letra no escuro, ouro no claro, azul com roxo, neon, rosa, magenta, lilás, degradê no logo, listras, degraus, 3D, orelha dobrada, selo em aba, emoji, travessão, qualquer coisa da You no visual (laranja, Clash Display, Geist), quique no movimento. Empresas aparecem por nome num selo com as cores da Beec.

Exceções aprovadas pelo Natham (só onde estão escritas):

- **Etiquetas**: `src/styles/etiquetas.css`, `--etiqueta-1..10` com `--etiqueta-N-texto`; contraste de cada par anotado no arquivo (todos acima de 4,5). Usar só em etiquetas e eventos.
- **Letra de mão**: só na tela Tarefas (caderno).
- **Pasta de vidro**: versão exata (cantos redondos, quique) ao lado da adaptada à Beec, só na tela Pastas.

## Interação

Casca (rodada 2, pente fino do item 53): menu lateral GRUDADO na borda e grafite liso (pedido do Natham; a ID tem o menu suspenso em vidro roxo), 208px aberto e 64px recolhido (56px no celular, sempre só ícones). O resto segue o menu da ID (`identidade/menu-id.css`): links em bege suave, passar o mouse = bege, item ativo em ouro e negrito, logo de 118px, botão "Recolher menu" com as 3 barras. O estado recolhido é lembrado entre recargas (`data-menu` no `<html>`). A área de conteúdo não tem largura máxima. Filtro de empresa é o botão de seleção (`src/components/ui/Selecao.tsx`): campo de seleção da ID, lista em vidro roxo com orelhas (submenu da ID). Botões: `.btn`, `.btn-2`, `.btn-claro`, `.lnk` + `.sub` em `globals.css`, copiados da prancha. Comparação peça a peça: `docs/levas/pente-fino-id/sextante.md`.

## Layout e revisão

Conferido em 1903x900, 1440x760 e 390 (capturas em `provas/alvenaria/`). Foco visível em elétrico (anel de 2px). Itens do menu têm `title` e `aria-current`; botões do filtro usam `aria-pressed`. Menu grafite: suave sobre grafite 10,60; ouro (ativo) sobre grafite 11,07. Capturas da rodada 2 em `provas/r2-sextante/`.

## Manutenção

Atualize quando a identidade ou as exceções mudarem.
