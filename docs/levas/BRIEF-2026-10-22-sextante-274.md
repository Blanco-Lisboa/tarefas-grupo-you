# BRIEF Sextante · item 274 (leia antes `_REGRAS-RODADA-268.md`)
Tempo real em tudo: o que o Natham, o Matheus ou o Adrian mudam (Esteira/cards, Calendário, Mapa, Caderno, Pastas, Ideias, tags, anexos) aparece na tela dos outros sem recarregar.
- Supabase Realtime (postgres_changes) nas tabelas usadas pelas telas; ao receber evento, recarregar/mesclar o dado daquela tela. Um canal por tela, desligado ao sair.
- SQL 028: `alter publication supabase_realtime add table ...` idempotente (só se ainda não estiver). Realtime respeita RLS — confira que o privado (caderno/agenda) não vaza.
- Antes do 028 colado, o código não pode quebrar (só não recebe eventos).
- Prova: duas abas logadas/de exemplo, muda numa, a outra muda sozinha (se a 3101 é banco falso local e não tem realtime, prove a assinatura e diga isso claramente).
