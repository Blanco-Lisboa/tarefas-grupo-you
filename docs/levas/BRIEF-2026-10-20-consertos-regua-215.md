# BRIEF · consertos do pente fino visual (Régua 215+216, `docs/levas/2026-10-20-regua-215.md`)

Pedido dele: "deixe todos os elementos muito bem enquadrados, alinhados e bem encaixados, sem muitos espaços vazios... com hierarquia". Use as skills `refactoring-ui` e `impeccable` (modo polish) como régua. Só PC (1440 e 1903). Prova = foto antes/depois olhada por você + medida no navegador.

## Sextante (achados 1 a 5)
1. **Esteira corta a coluna Postado em 1440.** Preferência: as 6 colunas cabem inteiras em 1440 (largura da coluna calculada pelo espaço, com mínimo legível; cards se adaptam). Se em 1440 o card ficar ilegível, mantenha a rolagem mas com setas/controle de deslocamento NO TOPO do quadro. Medir: scrollWidth == clientWidth em 1440, ou setas visíveis.
2. **Calendário: cards simultâneos perdem o nome** ("Ca...", "De..."). Nome com pelo menos uma linha útil: hora/selo vão para outra linha ou, com 2+ cards na mesma hora, o grupo mostra os títulos legíveis. Medir área visível do título ≥ 1 linha inteira legível.
3. **Ficha Postado contraditória:** em Postado, sem "Começar" no cabeçalho e sem "Anexe o vídeo para escolher o quadro da capa"; a ficha mostra o estado concluído (links do post). Conferir também Aprovado/Programado: nenhum botão ou texto de etapa anterior.
4. **Capa do Reels com vão de 76px:** miniatura menor (altura ≈ altura dos controles) ou controles ocupando a altura; nada de buraco.
5. **Descrição do post nasce com 5 linhas:** começa com 2 linhas e cresce com o texto até um limite (depois rola).
Commit "215-regua-1-5:" (pode ser mais de um).

## Vitral (achado 6)
6. **Pastas em 1440: nome e contagem encolhem** (≈13px e 11px visíveis). Nome legível e contagem ≥ 12px visíveis: ajustar a escala do conjunto ou tirar o texto da transformação. Conferir que o Mapa (pastas por empresa) segue igual ou melhor. Commit "215-regua-6:".

## Pena (achado 7)
7. **Caderno: textos de ajuda com contraste ~3:1** ("Escreva o que quiser lembrar deste dia", "Recados soltos, que não são tarefa"). Tirar a opacidade 0,7 / usar cinza que dê ≥ 4,5:1, mantendo o ar de letra de mão. Commit "215-regua-7:".

Todos: `npm run check` verde (cópia limpa se a pasta tiver lixo de outra sessão), commit pelo index SÓ com os seus arquivos (no 215 já houve commit levando arquivo de outro), nada de banco, nada de publicar. Responda SÓ na mensagem final: o que mudou, sha, fotos.
