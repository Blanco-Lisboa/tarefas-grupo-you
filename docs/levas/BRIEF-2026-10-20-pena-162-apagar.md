# Brief da Pena (20/10) · item 162 · APAGAR (autorizado pelo Natham)

O Natham respondeu à sua lista: "só deixa o post dele de amanhã que tá em análise, de resto tu apaga". Ou seja: das 11 tarefas com responsável Matheus criadas pelo Natham em 19-20/10, **fica só "Post - Reels"** (etapa analise, 20/10 08:30, 1 tag). As outras **10** saem: eqw (as 2), Postar video (as 2), postar, asdasd, asdasdaw, eq, qw, qweq, we.

Banco real Supabase, projeto `uruhjlurcxpjhhgvuzwt`.
1. ANTES: SELECT das 11 de novo (mesmo filtro da sua lista) e confirme: são exatamente 10 candidatas, nenhuma é "Post - Reels", nenhuma tem tag em `tarefa_tags`. Se o número ou os títulos não baterem, PARE e responda sem apagar.
2. `delete from tarefas where id in (<os 10 ids>) returning id, titulo;` (por id, nunca por filtro de título/data).
3. DEPOIS: SELECT mostrando que sobrou só "Post - Reels" desse grupo, com a tag dela intacta.
Se alguma trava/classificador barrar o DELETE, NÃO contorne: responda com o SQL exato pronto para o Natham colar no SQL Editor.
Registre na leva (`docs/levas/2026-10-18-grade-de-conteudo-beec.md`, item 162): o que foi apagado (10 títulos + ids), a prova do depois, estado FEITO. Commit da leva.

Resposta final: 3 linhas (apagadas: N; sobrou: ...; sha). Não use `maestri ask` para reportar.
