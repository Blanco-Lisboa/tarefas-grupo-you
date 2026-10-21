# Alvenaria · item 244 · URGENTE · a montagem na Vercel falhou

O Natham rodou o envio da cópia `.publicar-drive` (commit `f74cc86`) e a montagem na Vercel falhou:
`npm run build` saiu com erro 1, logo depois de "Creating an optimized production build".
Registro da Vercel: `59NDiCSgxT6SdEwdHe7sX7qRtuRX` (projeto `tarefas-grupo-you`, time `you-contabilidade`).
A produção NÃO mudou (segue c5bb34b + 241).

1. Leia o log de montagem desse registro (MCP da Vercel ou o "inspect" do CLI com logs) — SÓ leitura, sem enviar nada.
2. Ache a causa. Suspeitas: variável de ambiente que a Vercel não tem e o código novo lê na montagem (218/229/239), `next.config.ts`/`tsconfig.json` do 218, algo fora do `.vercelignore`.
3. Reproduza local com os MESMOS nomes de variáveis que a Vercel tem (nomes pelo MCP; nunca imprima valores).
4. Conserte no main (commit `244: ...`), atualize a cópia `.publicar-drive` para o novo commit, build ok lá.
5. NÃO mexa em `next.config.ts`/`tsconfig.json`/`package.json` do REPO com a 3100 no ar sem avisar (derruba a 3100). Se for indispensável, diga antes.

Responda SÓ na mensagem final: causa em 2 linhas, sha, cópia atualizada.
