# Sextante · item 223 · BUG: Matheus não consegue escolher "Quem aprova"

Projeto: `Desktop/Sistemas-Grupo-You/grade-conteudo` (servidor 3100 com banco REAL: não parar, não religar).
Print do Natham: `docs/referencias/2026-10-21-item-218/223-quem-aprova-matheus.png` (é a tela DELE, Natham, com o campo aberto).
Relato: "O botão de quem aprova, pro matheus, não consegue selecionar quem vai aprovar. Ele tem que conseguir selecionar quem aprova."

1. Reproduza logado como Matheus (banco falso local com o usuário Matheus). Ache a causa raiz: campo desativado por regra de tela (só quem aprova / só Natham?), seleção que não grava, ou recusa do banco (RLS/função). Se a causa for banco, escreva o SQL em UM arquivo `supabase/_colar/NNN-....sql` (idempotente) e NÃO aplique; diga na resposta.
2. Conserte: Matheus escolhe Natham, Matheus, Adrian ou Ninguém e o valor fica salvo depois de recarregar. Teste automatizado que falha sem o conserto.
3. Conferir também: no print do Natham os botões Consertar/Aprovar aparecem PEQUENOS e à esquerda (largura do texto), enquanto na sua foto do 219 cada um ocupa metade. Descubra por quê (aba dele com versão velha? caso de ficha diferente, ex. com Tags/Quem aprova preenchidos?). Se for defeito, conserte para meia largura cada em todos os casos.

Pronto = check verde + teste + foto 1440 como Matheus com o campo escolhido, em `provas/r223-quem-aprova/`, commit `223: ...`. Responda SÓ na mensagem final: causa raiz em 2 linhas, sha, foto, e se precisa de SQL.
