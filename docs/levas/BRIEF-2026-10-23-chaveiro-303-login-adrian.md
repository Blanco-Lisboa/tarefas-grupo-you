# Brief — Chaveiro · item 303, login do Adrian no Tarefas (23/10/2026)

Projeto: `C:\Users\Natham Monteiro\Desktop\Sistemas-Grupo-You\grade-conteudo` (Next.js + Supabase
**"Tarefas - Grupo You", ref `uruhjlurcxpjhhgvuzwt`**. NUNCA tocar no CRM `xtclayekvviccrasxgos`).
Você foi aberto na pasta do CRM só para não travar no "confia nesta pasta?": use caminhos absolutos
e `git -C <pasta do Tarefas>`.

## Pedido do Natham
"quero dar permissão pro Adrian entrar, como mando o convite certo pra ele poder acessar? Veja se
consegue chamar ele você mesmo, tente fazer sozinho sem eu ter que fazer na mão!!!"
E-mail do Adrian: **adrian@youcontabilidade.com**.

Contexto: a decisão 144 era "Adrian sem login, só agenda" — agora ele quer login. Acesso padrão
(igual ao Matheus): o próprio Caderno privado + Esteira/Calendário/Mapa/Pastas compartilhados. A agenda
do Adrian segue a regra já decidida (ele NÃO vê as agendas dos outros). Se o código/RLS tratar Adrian
de outro jeito, reporte antes de mudar.

## Tarefa
1. Leia como o Matheus foi criado e ligado ao perfil (leva `docs/levas/2026-10-18-grade-de-conteudo-beec.md`,
   busque "Matheus" / "perfil" / "convite"; migrations em `supabase/`). Descubra o que uma conta nova
   precisa: usuário no Auth + linha de perfil/responsável? gatilho que cria sozinho? lista de e-mails
   permitidos? Confira o estado real pelo MCP do Supabase (SELECT).
2. Faça o convite SEM o Natham pôr a mão, se houver caminho seguro: convite por e-mail do Supabase
   Auth (o e-mail do Supabase tem limite de ~2/hora — 1 convite cabe). Não extraia nem imprima chave
   `service_role`; se o único caminho exigir isso ou o classificador barrar, PARE e prepare o passo
   para o Natham: UM clique por vez, com o nome exato do botão no painel (Authentication → Users →
   …), e o SQL de perfil num arquivo único em `supabase/_colar/` se precisar.
3. Garanta que, ao entrar, o Adrian cai ligado ao perfil dele (não numa tela vazia/erro) e que o RLS
   o deixa ver só o que deve. Se precisar de bloco SQL novo, versione em `supabase/` com número.
4. Registre na leva o estado do item 303 (linha já existe) e commite pelo index (`git -C ... commit`
   sem caminho, mensagem por `-F`). Sem push, sem publicar.

## Reporte
Resposta final curta ao Maestro: convite enviado sim/não (com prova: SELECT em auth.users mostrando
invited_at, sem dados sensíveis), perfil ligado, o que falta o Natham ou o Adrian fazer.
