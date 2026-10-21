# Retrato da postagem automática (item 196)

**Resposta curta:** hoje o sistema **não publica no Instagram nem no Facebook**. A palavra “Postado” pode aparecer mesmo sem postagem real.

## O que roda hoje

- O site publicado é o `c5bb34b`, sem os itens 196 e 203. Os SQLs 014 a 016, 020 e 021 foram colados; o 019 não. Fonte: leva 18/10, itens 195, 196 e publicação de 23/10; RETOMADA de 24/10.
- Quando chega a hora de um card Aprovado, o relógio do banco (`015`, a cada minuto) **só muda sua etapa para Postado**. Ele não chama a Meta nem manda aviso de postagem. A publicação nas redes continua manual. Fonte: `supabase/015_aprovacao_em_analise.sql:76-85,124` e `2026-10-23-PUBLICAR-193-207.md:61`.
- “Postado” hoje é uma etiqueta do sistema, não comprovante de publicação. Os SQLs 020 e 021 tratam agenda e troca de aprovador; não ligam o envio à Meta.

## Construído, mas fora de produção

- O 019 prepara os alarmes por card, o registro separado de Instagram/Facebook e o Drive; substitui o relógio do 015. Ainda está só em arquivo (`supabase/_colar/019_postagem_drive.sql`).
- A função `postar-meta` foi escrita para publicar nos perfis Instagram/Facebook da You, registrar o resultado por rede, tentar de novo e só marcar Postado após todas as redes escolhidas saírem. A função `drive`, a autorização Google e a interface nova também estão no projeto. Os testes usaram Meta, Google e banco falsos; nada disso foi implantado. Fonte: RETOMADA de 24/10 e `supabase/functions/postar-meta/estado.ts`.
- O envio real tem uma chave de segurança: apenas `POSTAR_DE_VERDADE=sim` publica. O estudo diz que o segredo da Meta já existe, mas não há confirmação atual de seu funcionamento em produção. O aviso de erro por WhatsApp depende de configuração no n8n.

## Ordem para ligar de verdade

1. **Recrutas:** corrigir e revisar os bloqueios da Lupa do 229/236, inclusive a troca do relógio, os cards já programados, anexos antigos e a compatibilidade da tela publicada. Conferir o 019 final e a consulta prévia de vídeos no Supabase; nenhum vídeo antigo pode ficar lá antes da colagem.
2. **Natham:** informar o e-mail Google do Matheus, preparar o Google Cloud com consentimento em Produção e cadastrar os segredos Google. Confirmar no painel, sem expor a chave, que `META_PUBLISHER_TOKEN` está disponível para a função.
3. **Recrutas:** testar de novo banco, Drive, interface e `postar-meta` juntos com serviços falsos; preparar o procedimento de troca e a checagem dos cards que vencerem durante ela.
4. **Natham, com recrutas acompanhando:** cadastrar `POSTAR_DE_VERDADE=nao`, implantar as funções antes da troca do relógio, fazer a consulta prévia, colar o 019 revisado e publicar a interface compatível na mesma janela; então autorizar o Drive. Conferir os alarmes e os cards existentes. A ordem antiga da RETOMADA de 24/10, que colava o 019 antes das funções, precisa ser revista.
5. **Recruta do n8n:** ligar o aviso de erro por WhatsApp para o Natham. **Recrutas:** testar Drive e rascunhos reais na Meta com a publicação ainda desligada.
6. **Natham:** aprovar foto e legenda do primeiro teste real, autorizar `POSTAR_DE_VERDADE=sim` e o primeiro post. **Recrutas:** acompanhar o resultado nas duas redes, os links gravados e um agendamento completo. Alexa fica para depois.

## Está certa?

**Ainda não dá para dizer que sim.** O caminho foi construído e simulado, mas não foi provado com Drive e Meta reais. Colar o 019 sozinho pode parar até a mudança de etapa que funciona hoje; a Lupa registrou também risco para cards perto da hora e anexos antigos. Há incompatibilidade com a interface publicada e o aviso WhatsApp ainda depende do n8n. A leva registra esses consertos como item 236 pendente. Fonte: `2026-10-21-lupa-229.md` e leva 18/10, itens 236 e 237.

Este retrato usa código e registros do projeto. Não houve consulta ao banco de produção nesta sessão; o MCP do Supabase não estava disponível.
