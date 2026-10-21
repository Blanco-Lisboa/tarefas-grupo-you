# Sextante · item 219 · Aprovar/Consertar descem para o fim da ficha

Projeto: `Desktop/Sistemas-Grupo-You/grade-conteudo` (Next.js, servidor local 127.0.0.1:3100 já ligado; NÃO religar nem parar).
Pedido do Natham (leva `2026-10-18-grade-de-conteudo-beec.md`, item 219; print `docs/referencias/2026-10-21-item-218/219-ficha-botoes-embaixo.png`):
"Quero que os botões de aprovar e consertar fiquem no final do card, acima do rodapé. Com o Aprovar ao lado direito e consertar no esquerdo."

O que fazer:
- Na ficha (card flutuante), Aprovar e Consertar SAEM do topo e vão para o FIM do conteúdo rolável: depois de Notas, logo acima da barra fixa Cancelar/Salvar.
- Consertar à ESQUERDA, Aprovar à DIREITA. Mesmo visual de hoje (Aprovar verde cheio, Consertar contorno vermelho). Larguras iguais e alinhadas às bordas dos campos.
- Começar e Fechar continuam no topo.
- Regras de quando aparecem (quem aprova, etapa Em análise etc.) NÃO mudam — só a posição.
- Território: só os arquivos da ficha (`src/components/ficha/`). Nada de banco.

Pronto = `npm.cmd run check` verde + foto 1440 da ficha "Em análise" rolada até o fim (banco falso local, como nas provas r208) em `provas/r219-ficha/`, commit `219: ...`. Responda SÓ na mensagem final: sha + caminho da foto.
