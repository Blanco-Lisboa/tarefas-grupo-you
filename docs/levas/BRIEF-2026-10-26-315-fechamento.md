# Brief — fechamento do 315 (Garimpo depois Chaveiro)

## Garimpo (passo 1)
Mova a leitura da série que está em `src/components/calendario/postagens/serie.ts` para `src/lib/dados/postagens-planejadas.ts` (o Banco terminou; o arquivo agora é seu nesta tarefa), com teste, e apague `serie.ts`. Nada mais. `npm run check` verde. Commit "315-fecho:". Resposta: 3 linhas.

## Chaveiro (passo 2, revisão — Lupa)
Revise o 315 inteiro (commits com prefixos 315-banco, 315-2A, 315-2B, 315-fecho) contra o SQL `supabase/_colar/2026-10-26-315-01-pauta.sql`: a tela e o Caderno usam as colunas/funções com os nomes certos (as três pontas: coluna no banco, parâmetro da função, o que o app manda)? O app funciona antes e depois da colagem? A ficha de uma tarefa da pauta, salva pelo Matheus, bate no CHECK `planejada_id is null or etapa is null`? A Ficha de editar "todos" preserva início/dias? Só o Natham vê os botões e o banco recusa os outros?
Conserte o que achar (teto de 3 tentativas por achado), prova no banco local, `npm run check` verde, commits "315-lupa:". Atualize a sub-linha do 315 na leva com os achados e o estado. Resposta: até 8 linhas, incluindo a ORDEM certa para o Natham: publicar e colar o SQL.
