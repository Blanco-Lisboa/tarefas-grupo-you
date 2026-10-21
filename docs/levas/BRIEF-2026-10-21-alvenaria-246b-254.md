# BRIEF Alvenaria · 246 (2ª volta) + 254

1. O Natham colou o supabase/_colar/023 e FALHOU: "ERROR 42501: pasta com cadeado nao se apaga" (gatilho private.pasta_livre_cadeado). Refaça o 023 numa transação: primeiro tira o cadeado (Permanente) SÓ daquela pasta (id 4402d8ca-470f-4cba-af86-c743fdd3903a), depois o DELETE como estava. Leia o gatilho do cadeado antes, para ter certeza de que desligar o Permanente não é barrado também (no SQL Editor ele roda como postgres).
2. Item 254 (leia na leva): no mesmo arquivo, devolva para a categoria Ganchos as 2 ideias da You "Você está pagando imposto a mais" e "Ninguém te conta isso sobre [TEMA]" que estão em "Perfis - Contabilidade". Ache os ids com SELECT antes (pode consultar o banco, só leitura) e faça o UPDATE por id, não por título.
3. No fim do arquivo, SELECTs de conferência (pasta livre da Beec = 0 linhas; as 2 ideias em Ganchos).
4. Teste o arquivo inteiro dentro de BEGIN … ROLLBACK se o classificador deixar; se não, revise de olho. NÃO aplique (o Natham cola). Commite o 023 e anote nos itens 246 e 254 da leva.

Responda só na mensagem final: o que mudou no 023 e se testou com ROLLBACK.
