# Alvenaria · item 241 · Política de Privacidade pública (o Google exige)

O Google só deixa o app "Tarefas Grupo You" ir para Produção (passo A7) com página inicial + Política de Privacidade PÚBLICAS. Nenhuma existe hoje (site da You não resolve; site da Beec não tem; o Tarefas só tem /entrar público, controle em `src/proxy.ts`).

1. `src/app/privacidade/page.tsx` estática, sem login, em português simples:
   - quem somos: Grupo You, ferramenta de uso interno (Natham e Matheus);
   - o que o app acessa no Google: só a permissão `drive.file` — apenas pastas e arquivos que o próprio Tarefas cria no Drive de nathamsud@gmail.com; não lê o resto do Drive;
   - para quê: guardar vídeos e arquivos dos conteúdos;
   - onde fica: Supabase e Google Drive;
   - por quanto tempo: conteúdo vai para a lixeira do Drive 7 dias depois de postado, exceto temas/pastas permanentes;
   - não vende nem compartilha com terceiros;
   - como revogar: https://myaccount.google.com/permissions;
   - contato: nathamsud@gmail.com; data: 21/10/2026.
   Visual simples, no estilo do sistema.
2. Exceção em `src/proxy.ts` para `/privacidade` (igual `/entrar`).
3. Commit no main: `241: ...`.
4. Cópia limpa FORA do repo: `Desktop/Sistemas-Grupo-You/.publicar-privacidade`, `git worktree` desanexado no commit que está no ar (`c5bb34b`) + SÓ o commit 241 aplicado por cima (cherry-pick). Copie o vínculo do projeto (`.vercel/project.json` do repo) e confira projectId e projectName = `tarefas-grupo-you`. Rode o build lá.
5. NÃO coloque no ar (é do Natham). Na resposta, descreva o comando como "o comando de envio da Vercel para produção, sem a resposta automática" — sem escrever o comando literal (a trava do repo barra mensagens que o citam).
6. Teste: `/privacidade` abre sem login no 3100.

Responda SÓ na mensagem final: sha do main, sha da cópia, build ok, e o endereço exato da página depois de no ar.
