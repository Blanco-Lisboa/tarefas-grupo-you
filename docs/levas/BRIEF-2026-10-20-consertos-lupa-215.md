# BRIEF · consertos da Lupa 215 (achados em `docs/levas/2026-10-20-lupa-215.md`)

## Sextante — achados 1, 2 e 3
- **1+2 (Aprovar/Consertar na ficha):** fazer como o bloco Publicação já faz (`Publicacao.tsx:53-57`): Aprovar/Consertar gravam a FICHA INTEIRA (rascunho com as edições) junto com a nova etapa, numa gravação só. Enquanto grava: Aprovar, Consertar e Salvar ficam desligados (e mostram que está gravando). Depois, o rascunho passa a ter a etapa nova, então um Salvar seguinte não desfaz a decisão.
  Teste que falha sem o conserto: editar título → Aprovar → o card salvo tem o título novo e etapa aprovado; Salvar logo depois não volta para Em análise.
- **3 (tarefa some com o filtro ligado):** ao salvar uma tarefa SEM empresa com o filtro de empresa ligado, mostrar um aviso curto no padrão de avisos do sistema: "Salva sem empresa. Ela aparece com o filtro em Todas." (não mudar a regra do filtro). Teste/prova do aviso.
Commit "215-lupa-1-3:", npm run check verde (cópia limpa se a pasta tiver lixo de outra sessão), prova por foto do aviso.

## Alvenaria — achado 4
- `acoes.ts:158-166` / `103-115`: a checagem de "envio pertence a este card" tem de rodar ANTES de `pastaDoCard(B)`; pedido recusado não cria ocasião, pasta no Drive nem vínculo. Ampliar `revisao3.test.ts`: recusa no card B → nenhuma pasta criada, nenhuma ocasião nova, card B intacto.
Commit "215-lupa-4:", testes do Drive verdes. Nada de deploy, nada de banco.

Cada um: responda SÓ na mensagem final com o que mudou, sha e saída dos testes.
