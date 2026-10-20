# Prova do 203 (Drive) e 204 (Mapa): tudo com Google FALSO

Nada aqui fala com o Google ou com o Supabase de verdade.

- Testes (rodam no `npm test`): `supabase/functions/drive/drive.test.ts` e `supabase/functions/google-autorizar/autorizar.test.ts`, com `_shared/google-falso.ts` (Drive e OAuth falsos) e `drive/supabase-falso.ts` (banco falso).
- Fotos e fluxo no navegador: `banco-falso.mjs` (porta 3296: banco + funções + Drive falsos) e o app em modo desenvolvimento na porta 3196 apontando para ele
  (`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3296 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=falsa npx next dev -p 3196`), depois `node provas/r203-drive/fotos.mjs`. Resultado em `resultado.txt`.

## Spikes (plano V0)

| Spike | O que o falso prova | PENDENTE-GOOGLE (só com o Google real, Etapa 5) |
|---|---|---|
| S1 navegador para o Drive direto | a sessão é aberta com o `Origin` do app; o navegador manda partes de 8 MB com `Content-Range`, retoma a parte que falhou (até 3 vezes) e recebe o `id` | **O Google devolver CORS** para esse `PUT` vindo do navegador. Se não devolver: plano B (a função `drive` recebe as partes), avisar o Maestro |
| S2 vídeo grande em fluxo | `baixarDoDrive` devolve o `Response` sem ler o corpo; o fluxo passa direto a outro `fetch` | 256 MB e 2 s de CPU com o maior vídeo real (ler o log da função) |
| S5 vídeo por pedaços (Range) | `link_video` assina por 10 min; o GET repassa `Range` e devolve 206 com `Content-Range`; link adulterado, vencido ou de outro arquivo é recusado | O Drive real honrar `Range` em `files/{id}?alt=media` e o `<video>` pular para qualquer ponto |

Também só com o real: `about.get` com escopo `drive.file` (mostra "Ligado como ...") e a compartilha da pasta com o Matheus (D3: `DRIVE_COMPARTILHAR_COM`).
