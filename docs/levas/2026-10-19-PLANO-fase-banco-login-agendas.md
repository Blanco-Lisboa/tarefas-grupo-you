# Fase banco + login + agendas — DESENHO (aguarda ok do Natham)

> Itens 126, 133, 142, 143 da leva `2026-10-18-grade-de-conteudo-beec.md`.
> Base: mapa da Alvenaria `2026-10-19-mapa-dados-fase-banco.md` (6035412).
> Nível: CONSTRUÇÃO (banco novo, login, arquivos, agenda de 4 pessoas). Nada é codado antes do "pode".

## 1. O que ele vai ver na prática
- Abre o endereço → tela "Entrar" (e-mail + senha). Natham e Matheus, cada um com o seu.
- **Caderno**: cada um vê só o seu. "Criar tarefa para… Matheus" entrega a tarefa no caderno dele.
- **Conteúdos, Calendário, Mapa, Pastas**: os dois veem o mesmo, ao vivo, de qualquer computador.
- **Item sem empresa**: só quem criou vê, em qualquer tela.
- **Anexos e folhas** (imagem/vídeo) ficam guardados de verdade, não somem ao recarregar.
- **Calendário** ganha o filtro "Agendas" (Natham, Matheus, Adrian, Lucas) com os compromissos do Google sobrepostos aos conteúdos. Natham vê as 4; Matheus vê a dele, Adrian e Lucas, nunca a do Natham.
- **Página da direita do Caderno**: o Google Agenda do próprio dono.

## 2. Decisões de arquitetura (com o porquê)
1. **Supabase novo só do Tarefas** (decidido 18/10) — banco + login + guarda de arquivos num lugar só. Custo: o plano Pro da You cobra ~US$ 10/mês por projeto a mais. O CRM não é tocado.
2. **A privacidade é TRAVA DO BANCO (RLS), não da tela.** Mesma regra do CRM: mesmo que a tela erre, o banco não entrega o caderno do Natham ao Matheus. Por isso o app fala com o banco **com a sessão de quem está logado** (biblioteca do Supabase), e não pela conexão direta `pg`/drizzle que já está instalada (ela passaria por cima da trava). Drizzle fica sem uso (pode sair depois).
3. **Login por e-mail + senha, cadastro fechado** — só quem o Natham convidar entra. Natham: natham.monteiro@youcontabilidade.com · Matheus: matheus.germano@assessoriabeec.com.br.
4. **Adrian e Lucas = "pessoas sem login"** (recomendado): aparecem como aprovador/responsável e como agenda observada. Dá para dar login depois sem refazer nada.
5. **Google Agenda: cada um COMPARTILHA a agenda com a conta do Natham** (recomendado), e UMA ligação lê as 4. Motivo: se cada um ligar o Google no app, o Google exige verificação do app; sem ela a ligação cai a cada 7 dias. Compartilhar é um clique no Google Agenda de cada um ("Compartilhar com pessoas específicas → Ver todos os detalhes").
6. **Atualização da agenda por aviso do Google (push), não por rotina de X em X min** — mesmo caminho que já funciona no CRM desde 13/10 (n8n `13PbdvnpT8BBz4Zd`), agora gravando no banco do Tarefas. Sem gastar a cota do n8n com consulta repetida.
7. **Arquivos**: imagem e vídeo curto guardados no Supabase (pasta privada, mesma regra de quem vê). Vídeo bruto grande segue por link do Drive (já existe). Limite proposto: 200 MB por arquivo.
8. **Começa limpo**: os dados de exemplo saem; ficam empresas (You, Beec), etapas, tags e as pastas padrão.

## 3. Regras de quem vê o quê (viram trava no banco)
| Coisa | Quem vê |
|---|---|
| Conteúdo COM empresa | os dois |
| Conteúdo SEM empresa | só quem criou |
| Tarefa do Caderno, anotações do dia, Não esquecer | só o dono do caderno |
| Tarefa enviada ("Criar tarefa para…") | dono = quem recebe; quem mandou: ver pergunta 3 |
| Pastas, folhas, ideias, tags | os dois (são sempre de uma empresa) |
| Agenda do Natham | só o Natham |
| Agendas Matheus, Adrian, Lucas | Natham e Matheus |

## 4. Tabelas (rascunho)
`pessoas` (natham, matheus, adrian, lucas; liga ao login quando tiver) · `empresas` (nome, cor, logo, ordem) · `tarefas` (conteúdo = tarefa com etapa, como hoje; + `dono_id`, `criado_por`, `enviada_por`) · `tarefa_tags` · `tags` · `anotacoes_dia` · `nao_esquecer` · `pastas` · `pecas` (folhas) · `ideias` · `arquivos` (anexo de tarefa ou de folha) · `agenda_eventos` (fonte, id do Google, título, início, fim) · `agenda_acesso` (quem vê qual fonte). Arquivos `.sql` numerados em `supabase/`, versionados no mesmo dia.

## 5. Ordem de execução (território por recruta)
- **Etapa 1 — SOLO, Alvenaria (base):** criar o projeto Supabase; tabelas + travas; login (tela Entrar, sair, porteiro das rotas); trocar `repositorio.ts` (tarefas/empresas/tags) da memória para o banco. **Prova:** logado como Matheus, ler 0 tarefas privadas do Natham (teste pelo banco e pela tela).
- **Etapa 2 — em paralelo, cada um no seu território:**
  - Pena (Caderno): dono, entrega do "Criar tarefa para…", anotações do dia e Não esquecer no banco.
  - Vitral (Pastas + Ficha): pastas, folhas, ideias e anexos no banco + guarda de arquivos.
  - Sextante (Calendário): filtro "Agendas" lendo `agenda_eventos` (com dado de teste até o Google ligar).
  - Régua (Codex): revisão das travas + teste de troca de pessoa.
- **Etapa 3 — Google:** n8n recebe o aviso das 4 agendas e grava no banco; página da direita do Caderno. Você publica o fluxo pelo painel do n8n (a trava não deixa o recruta publicar).
- **Etapa 4 — Publicar na Vercel** com login (endereço proposto: `tarefas-grupo-you.vercel.app`).

## 6. Riscos
- Agenda do Natham passa pelo n8n e fica no banco do Tarefas: a trava por fonte é provada trocando de pessoa (igual ao bloco 242 do CRM) antes de ligar o Matheus.
- Matheus é de outra empresa (assessoriabeec): a Beec precisa permitir compartilhar agenda para fora; se bloquear, a dele entra pela opção "cada um conecta".
- Nada no CRM muda; o fluxo do CRM `13PbdvnpT8BBz4Zd` não é editado (fluxo novo, separado).
- Next 16 tem mudanças de rota/cache/login: a Alvenaria lê `node_modules/next/dist/docs/` antes (regra do AGENTS.md).

## 7. Perguntas em aberto (ver chat)
1. Adrian e Lucas com login?  2. Google: compartilhar com a conta do Natham ou cada um conecta?  3. Tarefa enviada: some do caderno de quem mandou ou fica uma linha "enviada → Matheus"?  4. Ok para criar o Supabase novo (~US$ 10/mês)?
