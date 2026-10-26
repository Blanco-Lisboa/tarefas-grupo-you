# Brief — Garimpo — item 315, ESTUDO (só leitura, NÃO codar)

Projeto: `C:\Users\Natham Monteiro\Desktop\Sistemas-Grupo-You\grade-conteudo` (sistema Tarefas, Next.js + Supabase `uruhjlurcxpjhhgvuzwt` — NUNCA o do CRM).
Pedido do Natham: leia o item 315 em `docs/levas/2026-10-18-grade-de-conteudo-beec.md`.

Resumo: uma 2ª visão no menu Calendário (botão de troca) = "Calendário de postagens": o que cada empresa
(You, Beec, Tu Ecom) tem de postar em cada dia (ex.: seg = Reels You 17h + Reels Beec). Cada postagem
planejada vira tarefa no Caderno do Matheus (na linha do horário). Post feito direto pela Esteira (hoje vai
pro Mapa) também aparece nesse calendário.

## O que preciso (responda num arquivo, NÃO mexa em código nem em banco)
Escreva `docs/levas/2026-10-26-315-ESTUDO.md` com, em português simples + arquivo:linha:
1. Tela Calendário hoje: arquivos, de onde vêm os itens, como trocaria de visão (já existe abas/alternador em alguma tela que dê pra copiar o padrão?).
2. Card da Esteira: colunas relevantes (empresa, formato, postar_em, postado_em, etapa, responsável). Como um card "postado direto" chega ao Mapa — quais campos ficam preenchidos.
3. Caderno: como uma tarefa nasce no caderno de alguém (tabela, campos: responsável, data, linha_caderno/horário), e a regra "tarefa de caderno NUNCA vira card na Esteira/Mapa" — onde ela é aplicada.
4. Já existe algo de recorrência/semana-modelo em qualquer parte do banco ou código? (cron, pg_cron, funções).
5. Proposta curta (máx. 15 linhas) de onde guardar a "pauta de postagens" (tabela nova? reaproveitar tarefas?) e como a tarefa do Caderno do Matheus nasceria dela — com os riscos (duplicar tarefa, privacidade/RLS, Google Agenda: tarefa do Caderno NÃO vai pro Google).
Banco: só SELECT de leitura se precisar (via MCP do Supabase no projeto do Tarefas). Nada de escrita.
Commite só o arquivo do estudo. Resposta final: 5 linhas dizendo onde está o arquivo.
