# BRIEF Alvenaria · item 246 (apagar a pasta "Ideias de conteúdo" duplicada da Beec)

Pedido do Natham (literal): "eu criei uma pasta de ideias de conteúdo mas eu não sei como excluir ela... apaga ela, criei ela mas nao tinha visto a do lado que também era de ideias".
Na tela /pastas, empresa Beec, há DUAS: a do sistema ("Ideias de conteúdo · 10 ideias · só aqui") e a que ele criou pelo "+ Nova pasta" (cadeado = Permanente, "Pasta vazia"). Apagar SÓ a que ele criou.

Banco = Supabase do Tarefas (ref uruhjlurcxpjhhgvuzwt). NUNCA o do CRM.

1. Ache a linha exata (SELECT) da pasta livre "Ideias de conteúdo" da Beec criada hoje: confirme que é UMA, vazia (sem arquivo/conteúdo dentro) e que não é a pasta de ideias do sistema. Veja se ela tem pasta correspondente no Drive (id do Drive na linha).
2. Apague pelo caminho que o próprio sistema usa ao excluir pasta livre (para Drive e banco ficarem coerentes): tire o Permanente e exclua. Se só der por SQL, apague só aquela linha pelo id. Se o classificador barrar SQL em produção, monte o arquivo em supabase/_colar/ com o DELETE por id e o SELECT de conferência, e me avise — não contorne.
3. Se havia pasta no Drive dela e o caminho do sistema não a levou para a lixeira, diga (não apague no Drive à mão).
4. Prova: SELECT depois mostrando que só sobrou a de ideias do sistema na Beec.
5. Anote no item 246 da leva (docs/levas/2026-10-18-grade-de-conteudo-beec.md) e commite a leva.

Responda só na mensagem final: id apagado, como apagou, Drive (sim/não) e a prova.
