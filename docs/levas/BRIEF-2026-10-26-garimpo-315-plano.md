# Brief — Garimpo — item 315, PLANO (só escrever o plano, NÃO codar)

Base: o teu estudo `2026-10-26-315-ESTUDO.md` + as respostas dele no item 315 da leva (linha "315 · respostas dele").
As 3 perguntas do teu §5 já estão respondidas lá: ele quer data avulsa E repetição semanal; SÓ o Natham edita
(Matheus e Adrian só veem — Adrian também NÃO edita); cumprido = só o card real postado (empresa+formato+dia), não a tarefa riscada à mão.

Escreva `docs/levas/2026-10-26-315-PLANO.md` (formato writing-plans: etapas, arquivos, critérios de pronto, prova). Decisões do Maestro para usar:
1. Postagem planejada tem: empresa (You/Beec/Tu Ecom, da tabela empresas), formato (reels/post/carrossel/story), redes (as mesmas do card), hora, responsável (padrão Matheus), título/observação opcional, e repetição: "só nesta data" OU "toda semana" nos dias marcados (seg..dom), com início e fim opcional. Apagar/editar uma repetida pergunta "só este dia / este e os próximos / todos" (padrão Google Agenda) — precisa de exceção por data.
2. Tela: botão de troca no Calendário "Tarefas | Postagens" no padrão do Mapa (lembra a escolha). Visões Semana e Mês no mínimo. Cada postagem = bloco na cor da empresa com logo + formato + hora; estados: planejada, feita (verde, com link pro card), faltou (vermelha, dia já passou). Post real sem planejamento (postado direto) aparece também, como "extra". Botão "+ Postagem" e edição só para o Natham.
3. Caderno: tarefa nasce no Caderno do responsável, na linha da hora, sem etapa e sem empresa_id (para nunca virar card), nunca vai pro Google. Gerada pelo banco de forma idempotente (índice único planejada+data), janela rolante (ex.: próximos 14 dias, cron diário) + regeração quando o Natham edita. Tarefa apagada à mão não renasce. Quando a postagem vira "feita", a tarefa do Caderno fica riscada sozinha.
4. Data do post real = `postado_em` (dia em São Paulo); se vazio, `postar_em`. Duas planejadas iguais no mesmo dia casam com até dois posts.
5. Banco: SQL em `supabase/_colar/2026-10-26-315-*.sql` (o Natham cola). Recriar função que já existe = partir do corpo de PRODUÇÃO. O app tem de funcionar antes e depois da colagem.
6. Divida o trabalho em TERRITÓRIOS para 3 terminais (ninguém escreve arquivo de outro): Banco (Etapa 1, solo, antes dos outros) · Tela do calendário de postagens · Caderno (risco + selo da tarefa gerada). Diga quais arquivos cada um toca.
7. No topo do plano, um resumo de 8 linhas em linguagem SIMPLES para o Natham (sem termo técnico), dizendo o que ele vai ver na tela.
Commite só o plano. Resposta final: 4 linhas.
