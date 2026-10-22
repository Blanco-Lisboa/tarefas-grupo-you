# RETOMADA — Tarefas, depois da rodada 268–287 (22/10 tarde)

**No ar:** dpl_D6kBLBfQHLxoeCHtCoQoumvYz6gQ (22/10 ~15h30). Itens 268–285 e 287 (B) publicados. Leva: `2026-10-18-grade-de-conteudo-beec.md` itens 268–287.

## Banco
- Colados: 027 + 028 (juntos, `supabase/_colar/2026-10-22-027-e-028.sql`).
- NÃO colados: **026** (Adrian; só depois de o Natham criar a conta, `2026-10-21-ADRIAN-PASSO-A-PASSO.md`) e **029** (`supabase/_colar/029-card-so-pela-esteira.sql`: card de conteúdo só se apaga por `apagar_card`; reforço, não urgente).
- Plano B do 287 (`2026-10-22-287-devolver.sql`): NÃO usar — o Natham descartou a recuperação ("ele vai subir na mão").

## Abertos (perguntar antes de fazer)
- 286 · notas do Matheus no caderno dele: "Criar modo escuro", "não consigo marcar como feito as tarefas na agenda" (o "trocar card depois do Aprovado" deve ter sido resolvido pelo 027).
- Supabase do Tarefas com aviso "EXCEEDING USAGE LIMITS" — oferecido investigar.
- Visão "Dia" do Caderno ainda mostra card de conteúdo COM data (só não deixa apagar por ali) — decisão dele se deve sumir também.
- Limites conhecidos: trava "vídeo novo não subiu" só em card Aprovado; marca abandonada bloqueia até alguém liberar ("Postar com o vídeo atual").

## Como publicar
O classificador barra `bash scripts/publicar.sh` até para recruta (Production Deploy). O Natham roda na sessão do Maestro:
`! cd "C:/Users/Natham Monteiro/Desktop/Sistemas-Grupo-You/grade-conteudo" && bash scripts/publicar.sh`
(sai com código 1 se não conseguir apagar `../.publicar-auto` — o envio já terminou; confira o "Deploy: dpl_...").

## Relatórios desta rodada
`2026-10-22-testes-276.md` (Régua, 2 testes), `2026-10-22-lupa-268-275.md` (Lupa Re-revisões 1–2 + Re-revisão 3 cruzada em Sonnet: Codex sem crédito), `2026-10-22-287-recuperacao.md`.

## Depois do fechamento (22/10 ~16h)
- **288 EM CURSO (Alvenaria):** o aviso "script tag while rendering" continua no modo dev (2627c41 não resolveu). Conferir o resultado dela antes de qualquer coisa.
- **289 — LIMITE DO SUPABASE (prioridade, pega o CRM):** org YOU Contabilidade (slug `deahdofuahftqpefsslo`, página https://supabase.com/dashboard/org/deahdofuahftqpefsslo/usage) estourou **Egress 321/250 GB (129%)** com spend cap LIGADO → risco de restrição no CRM e no Tarefas até 03/11. Próximo passo: ele troca "All projects" por cada projeto e manda print; decidir spend cap (recomendado desligar). Detalhe no item 289 da leva.
