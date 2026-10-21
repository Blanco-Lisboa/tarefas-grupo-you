# BRIEF Alvenaria · 264 (script único de publicar)

Leia o item 264 da leva. Crie `scripts/publicar.sh` no grade-conteudo que faz numa tacada o que você fez à mão no 258/262:
1. recusa se houver mudança não commitada em src/ ou supabase/;
2. cria cópia limpa (git worktree desanexado no HEAD) em ../.publicar-auto (apaga uma sobra antes), copia .vercel/project.json, confere o vínculo tarefas-grupo-you e que o .vercelignore libera supabase/functions/_shared/pastas.ts;
3. npm ci + npm run build na cópia (para se falhar);
4. envia para produção com a mesma CLI fixada que o Natham usou (vercel@64.7.0, --prod --yes --scope=you-contabilidade) de dentro da cópia;
5. confere que a saída tem "Aliased https://tarefas-grupo-you.vercel.app" e imprime o id do deploy; sai com erro se não tiver;
6. remove a cópia (worktree remove --force + prune) mesmo se falhar no meio (trap).
NÃO rode a parte do envio. Teste só até o build com uma variável tipo PUBLICAR_SEM_ENVIO=1. NÃO mexa em arquivos de permissão (.claude/settings*). Commit "264:", anote no item 264.
Responda só na mensagem final: sha e o resultado do teste sem envio.
