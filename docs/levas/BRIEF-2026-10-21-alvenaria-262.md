# BRIEF Alvenaria · 262 (preparar a publicação da rodada 259–261 (consertos da Lupa + links em chips))

O Natham disse "publica". Mesmo método do 241/244 (cópia limpa, como em Desktop/Sistemas-Grupo-You/.publicar-drive):
1. Cópia limpa (git worktree desanexado) no último commit de código desta rodada (HEAD de main, sem o tsconfig.json modificado e sem pastas de prova soltas), fora do repo, ex.: Desktop/Sistemas-Grupo-You/.publicar-262.
2. Confira o vínculo com o projeto tarefas-grupo-you da Vercel na cópia (como no 241) e o .vercelignore (precisa liberar supabase/functions/_shared/pastas.ts).
3. npm run check (ou build) verde DENTRO da cópia.
4. Não rode o envio (a trava do repo barra e é o Natham quem roda). Escreva em docs/levas/2026-10-21-PUBLICAR-262.md o comando exato, numa linha, que ele cola com "!" (cd na cópia + envio com --prod), e anote no item 262.
5. Commite a leva.

Responda só na mensagem final: sha publicado, caminho da cópia, build ok e a linha exata do comando.

Observação: a Lupa está re-revisando agora; prepare a cópia no último commit de CÓDIGO (2872a0e ou o HEAD se só tiver docs depois). Se a Lupa pedir conserto, o Maestro te chama de novo.
