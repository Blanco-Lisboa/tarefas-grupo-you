# Alvenaria · item 229 · atualizar o plano + ETAPA 1 (solo)

Projeto `Desktop/Sistemas-Grupo-You/grade-conteudo`. Supabase do Tarefas `uruhjlurcxpjhhgvuzwt`. NADA aplicado em produção: SQL vai para `supabase/_colar/` (o Natham cola); função drive NÃO é implantada. NÃO mexer em next.config.ts/tsconfig.json/package.json (derruba a 3100).

1. Atualize `docs/levas/2026-10-21-PLANO-229-drive-pastas.md` com as respostas dele (item 229 da leva):
   - Tela Pastas = só o Drive + Ideias (saem "+ Nova pasta", peças soltas, "Adrian - Aprovar"; entra "+ Novo tema" com Permanente; Ideias = cartão único no alto de cada empresa, fora do Drive).
   - Anexos antigos ficam só na ficha.
   - Permanente: Natham liga e desliga; Matheus pode LIGAR mas NÃO desliga (o banco tem que recusar, não só a tela). "Sem tema" nunca tem cadeado.
   - NOVO: o Matheus (e o Natham) pode pôr documentos nas pastas direto pela tela Pastas (subir arquivo numa pasta de Tema/conteúdo), além da ficha. Desenhe onde o arquivo entra quando sobe numa pasta de Tema sem ser de um card.
   - Divida o trabalho por território (você: banco + função drive + camada de dados; Vitral: tela Pastas; Sextante: ficha) com o contrato entre eles escrito (funções/tipos que a tela usa).
2. ETAPA 1 (só você, antes dos outros): o 019 revisado em `supabase/_colar/` + função drive + camada de dados (`src/lib/dados/`) + banco falso da 3101 com a árvore nova (Empresa → Formato → Tema → conteúdo, um Tema permanente, conteúdos postados há mais e menos de 7 dias). Testes do que é regra (7 dias, permanente, quem desliga, nome da pasta). `npm.cmd run check` verde. Commit `229-etapa1: ...`.
Responda SÓ na mensagem final: sha, o que os outros dois precisam saber (contrato em 10 linhas), e se surgiu decisão que só o Natham toma.
