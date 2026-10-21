# BRIEF · Alvenaria · item 214 (achado 3 do Drive) — o Natham APROVOU a recomendação

## O achado (RETOMADA 24/10 §3)
`supabase/functions/drive/acoes.ts:166`: o `confirmar_envio` aceita um arquivo sem registro de qualquer pasta de ocasião e o move para o card atual. Quem souber o id de um envio pendente de outro card pode vinculá-lo ao seu, até entre empresas. 3 tentativas anteriores reprovadas pela Lupa: `ef17003`, `be45ab8`, `f6cdf40` (leia as 3 e o que a Lupa disse em `docs/levas/2026-10-22-lupa-r*.md` antes de começar — não repita o mesmo caminho).

## Conserto aprovado
- O `sessao_envio` grava **para qual card** é o envio (id do card, junto do id do envio).
- O `confirmar_envio` **só aceita** confirmar um envio para o MESMO card gravado na sessão; qualquer outro card = recusa (erro claro, nada movido no Drive).
- Se o registro da sessão vive no banco e precisa de coluna nova: o 019 ainda NÃO foi aplicado, então ajuste o próprio 019 (idempotente) em vez de criar bloco novo, e diga isso no relatório. Se não precisa de banco, melhor.

## Prova
- Teste novo em `supabase/functions/drive/` que falha sem o conserto: envio do card A confirmado no card B = recusado; no card A = aceito; entre empresas = recusado.
- Todos os testes do Drive verdes + `npm run check` verde. Commit pelo index, mensagem começando com "214:".

## Território
Só `supabase/functions/drive/*` e o `supabase/019_*.sql` se precisar. NÃO aplicar nada no banco, NÃO fazer deploy de função, NÃO publicar. O Vitral está no Mapa e o Sextante na ficha: não toque nesses arquivos.
Responda SÓ na mensagem final: o que mudou, sha, saída dos testes.
