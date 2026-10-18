# Grade de conteúdo (nome provisório)

## Problema e objetivo

O Natham e o Matheus produzem conteúdo (vídeos, edição, gravação, roteiros, postagens) para todas as empresas do Grupo You. Hoje não há um lugar único com a agenda, a data de cada postagem e o que cada um faz em cada dia. O sistema deve ser esse lugar. Começa com duas empresas, Beec e You, e depois vira um "Tarefas gigante" para outros usos, por isso o modelo de dados não pode ser amarrado só a conteúdo.

## Público e papéis

- Natham e Matheus, no computador do escritório. Matheus cuida de vídeos, postagens, edição, gravações e alguns roteiros.
- Sem diferença de acesso por enquanto. O responsável de cada tarefa é `natham` ou `matheus`.

## Fluxos da versão inicial

1. **Calendário** (tela principal): ver e mover tarefas em dia, semana, mês e ano, com filtros de empresa, pessoa, rede, etapa e tipo. Cada tarefa tem a sua cor. Arrastar de um dia ou horário para outro. Coluna "sem data" para arrastar para o calendário.
2. **Tarefas**: caderno de papel com letra de mão. Tarefa com data aparece sozinha no calendário (é o mesmo dado).
3. **Conteúdos**: quadro com colunas por etapa (ideia, roteiro, gravação, edição, aprovado, postado).
4. **Pastas**: pastas de vidro por empresa (Posts, Carrosséis, Vídeos, Stories), em duas versões lado a lado, a exata e a adaptada à Beec.
5. **Configurações**: cadastro de empresas (incluir e tirar).
6. **Filtro global de empresa** (todas, uma ou várias), lembrado entre telas. Não existe "trocar de empresa": a visão é sempre geral.

## MVP

Fase 1, com dados de exemplo e tudo em memória: casca do app, camada de dados, as cinco telas. Fase 2: Supabase novo só deste sistema, login e publicação na internet (Vercel).

## Fora de escopo

- Postar sozinho nas redes (futuro, ferramentas de automação).
- Integração com o CRM da You (depois).
- Agenda do Google (a agenda é própria por enquanto).
- Qualquer coisa com a identidade visual de outra marca.

## Requisitos

- Modelo de dados em uma peça só: a tarefa. Conteúdo é um tipo de tarefa. Campos: id, titulo, tipo (ideia, roteiro, gravacao, edicao, postagem, reuniao, outro), empresaId, rede, etapa, responsavel, inicio, fim, diaInteiro, cor (etiqueta-1 a etiqueta-10), notas, links (Drive), arquivos. Sem data cai em "sem data". Empresa: id, nome, sigla.
- Redes: Instagram, TikTok, YouTube, Kwai.
- Vídeos ficam no Google Drive (o sistema guarda o link). Imagens e carrosséis ficam no sistema (Fase 2).
- Telas nunca importam dados de exemplo direto; tudo passa por `src/lib/dados/`.
- Identidade visual 100% Beec (ver `docs/design.md`). Texto da interface em português do Brasil com acentuação correta, sem travessão.
- Empresas aparecem por nome, num selo com as cores da Beec.

## Restrições e decisões técnicas

- Next.js (App Router), TypeScript, Tailwind, ESLint, `src/`, alias `@/*`, npm (pnpm não está instalado na máquina).
- Exceções à receita do kit, decididas pelo Natham em 16/10/2026: sem Caveman, sem Graphify, nada no escopo da máquina, Context7 só no projeto.
- Banco: Supabase novo, só na Fase 2. O núcleo Drizzle/pg/Zod/Pino está instalado, mas nada está conectado e não há tabelas.
- Separado do CRM. Nunca ler nem mexer no `Desktop/CRM-You`.

## Hipóteses e pendências

- "Kawai" foi entendido como Kwai (confirmar com o Natham).
- "Método do Matheus Borges" foi entendido como Matheus Gomes, Vibe Coding Toolkit (confirmar).
- Nome do sistema: aberto. A pasta usa `grade-conteudo` como nome provisório.
- Ao tirar uma empresa, as tarefas dela somem junto (hipótese reversível; na Fase 2 pode virar "arquivar").
- Ícones das redes TikTok, YouTube e Kwai: a ID da Beec só tem o de Instagram nos ícones principais. As telas mostram o nome da rede como texto até haver decisão.

## Critérios de aceitação

- Cada tela abre numa rota própria e o menu leva a ela; o filtro de empresa escolhido numa tela vale nas outras.
- Mover uma tarefa no calendário muda a data dela em todas as telas.
- Nenhuma tela importa `@/lib/dados/exemplo` (o lint barra).
- Visual confere com a ID da Beec: sem pílula, sem emoji, sem travessão, ouro só no escuro, elétrico só no claro.
- Os checks técnicos estão em `docs/quality.md`.

## Próxima entrega

As cinco telas, cada uma por um recruta diferente (calendário primeiro), trocando o aviso "em construção" pela tela real.

## Manutenção

Atualize este documento quando objetivo, escopo, restrições ou critérios de aceitação mudarem. Decisões técnicas e evidências ficam em `docs/architecture.md` e `docs/setup.md`.
