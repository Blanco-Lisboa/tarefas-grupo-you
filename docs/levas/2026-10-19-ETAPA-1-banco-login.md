# Etapa 1 (SOLO, Alvenaria) — banco + travas + login + repositório

> Plano aprovado: `2026-10-19-PLANO-fase-banco-login-agendas.md` (itens 144 e 145 da leva). Leia o plano inteiro e o seu mapa `2026-10-19-mapa-dados-fase-banco.md` antes.
> Ninguém mais começa até esta etapa estar commitada e provada.

## Projeto Supabase
- **Tarefas - Grupo You**, ref `uruhjlurcxpjhhgvuzwt`, sa-east-1 (criado pelo Maestro em 19/10).
- ⚠️ O ref `xtclayekvviccrasxgos` é o CRM EM PRODUÇÃO. **Nunca** rode nada nele. Confira o `project_id` em TODA chamada do MCP.
- Todo SQL aplicado vira arquivo numerado em `supabase/NNN_assunto.sql` no MESMO dia (idempotente: `create ... if not exists`, `create or replace`, `drop policy if exists`).

## 1. Banco (TODO o esquema desta fase, para os outros não tocarem em SQL)
Tabelas do plano §4: `pessoas`, `empresas`, `tarefas`, `tags`, `tarefa_tags`, `anotacoes_dia`, `nao_esquecer`, `pastas`, `pecas`, `ideias`, `arquivos`, `agenda_eventos`, `agenda_acesso`. Campos: espelhe os tipos de hoje (`src/lib/dados/tipos.ts`) + o que a fase pede:
- `pessoas`: slug `natham|matheus|adrian|lucas`, nome, foto, `user_id` (auth.users, nulo para Adrian/Lucas = sem login).
- `tarefas`: `dono_id` (de quem é o caderno), `criado_por`, `enviada_por` (nulo se não foi enviada), `responsavel_id` (pessoa), `empresa_id` (nulo = sem empresa), `etapa` (nulo = tarefa do caderno; preenchida = conteúdo).
- `arquivos`: caminho no Storage, tipo, tamanho, ligado a UMA tarefa ou UMA peça.
- `agenda_eventos`: fonte (`natham|matheus|adrian|lucas`), id do Google, título, início, fim (`timestamptz`), local. `agenda_acesso`: (pessoa, fonte). Semente: Natham → 4 fontes; Matheus → matheus, adrian, lucas.

**Travas (RLS ligado em TODAS; nada para `anon`).** Função `minha_pessoa()` (SECURITY DEFINER, `stable`, `search_path` fixo) devolve a pessoa do `auth.uid()`.
- `tarefas` LÊ: `dono_id = minha_pessoa()` OU `enviada_por = minha_pessoa()` OU (`etapa is not null` E `empresa_id is not null`). Conteúdo sem empresa: só o dono (= quem criou).
- `tarefas` ESCREVE: insere com `criado_por = minha_pessoa()`; pode mandar com `dono_id` = outra pessoa só se `enviada_por = minha_pessoa()`. Altera/apaga o que você lê, menos a tarefa enviada (quem mandou só lê).
- `anotacoes_dia`, `nao_esquecer`: só o dono.
- `pastas`, `pecas`, `ideias`, `tags`, `empresas`: os dois (todo logado com pessoa).
- `arquivos` + Storage: bucket PRIVADO `arquivos`, limite 200 MB, `image/*` e `video/*`; quem vê o arquivo = quem vê a tarefa/peça dona.
- `agenda_eventos`: lê só se (minha_pessoa(), fonte) está em `agenda_acesso`. Ninguém escreve pelo app (só o n8n na Etapa 3).
- Semente: pessoas (4), empresas You e Beec (cores de `src/lib/cores-empresa.ts`), tags e pastas padrão de hoje. **Sem os dados de exemplo.**

**Prova obrigatória no banco** (troca de papel, como o bloco 242 do CRM): com `set_config('request.jwt.claims', ...)` + `set local role authenticated`, para Matheus: 0 tarefas privadas do Natham, 0 eventos da fonte natham, vê o conteúdo COM empresa, não vê o conteúdo SEM empresa do Natham. Cole SQL + saída no relatório.

## 2. Login
- `@supabase/supabase-js` + `@supabase/ssr`. Antes de codar, leia `node_modules/next/dist/docs/` (Next 16: rota, cache, proxy/middleware, auth) — regra do AGENTS.md.
- No `.env.local` (ignorado pelo git): URL e chave PUBLICÁVEL (use `get_project_url` e `get_publishable_keys` do MCP). **`service_role` nunca** em arquivo do repo nem no navegador. `.env.example` ganha só os NOMES.
- Tela `/entrar` (e-mail + senha, visual Névoa), "Sair" no menu, porteiro que manda para `/entrar` quem não está logado, e `/entrar/nova-senha` (o convite do Supabase cai aqui para a pessoa definir a senha).
- Cadastro FECHADO (desligar "allow signups" se o MCP permitir; se não, anote para o Natham desligar no painel).
- Contas: NÃO crie usuário nem senha. Quando a tela estiver pronta, me diga e eu peço ao Natham para convidar pelo painel: natham.monteiro@youcontabilidade.com e matheus.germano@assessoriabeec.com.br. A ligação `pessoas.user_id` se faz por e-mail (gatilho em `auth.users` ou função que liga no 1º login — escolha e explique).

## 3. Repositório
- `src/lib/dados/repositorio.ts` (tarefas, empresas, tags) passa da memória para o banco, com a sessão de quem está logado (para a trava valer). Mantenha a API que as telas já usam (`useTarefas`, `useEmpresas`...) o máximo possível; escrita otimista com desfazer se falhar.
- `responsavel` deixa de ser `"natham" | "matheus"` fixo e vira pessoa do banco (4 pessoas). Ajuste o mínimo nas telas para compilar; o comportamento novo do Caderno (entrega, "enviada →") é da Pena na Etapa 2 — não faça.
- Peças, pastas, ideias, anexos, notas do dia e Não esquecer: NÃO mexa (Etapa 2: Vitral e Pena).

## Pronto =
- `npm run check` verde (cole o fim da saída).
- Prova do banco (acima) colada.
- Fotos com Chrome FORA da tela (nunca mexa no mouse/teclado do Natham) de `/entrar` em 1903x910 e 390, e de uma tela qualquer depois de "logado" — se ainda não houver usuário, mostre o porteiro mandando para `/entrar`. Em `provas/r6-login/`.
- Commits pequenos, mensagem clara. Sem push, sem Vercel.
- Relatório ao Maestro: `maestri ask "Claude Code" "<resumo + shas + o que falta do Natham>"`.
- Parou por credencial, coisa fora do projeto ou contradição no plano: pare e me chame. O resto (nome, ordem, defeito do plano): conserte, anote aqui no fim e siga.

## Anotações da Alvenaria ao fechar (19/10)
- **Banco pronto no ref `uruhjlurcxpjhhgvuzwt`** (só ele): `supabase/001..004` + prova `supabase/prova_travas.sql` e saída em `prova_travas.saida.txt`. O MCP recusou blocos grandes ("requestState expirado"), então o SQL foi aplicado em pedaços (migrations 002a..002e, 004a/b); os arquivos `.sql` do repo estão inteiros e idempotentes. Avisos de segurança do Supabase: nenhum.
- **Ligação login↔pessoa:** gatilho `liga_pessoa` em `auth.users` (depois de inserir). Quando o convite do painel cria o usuário, o e-mail casa com `pessoas.email` e preenche `user_id`. Escolhi o gatilho porque a pessoa já está ligada antes de abrir o 1º link.
- **Para o Natham, no painel do Supabase (o MCP não alcança):** (1) Authentication > Providers > Email: desligar "Allow new users to sign up" (cadastro fechado); (2) Authentication > URL Configuration: Site URL = endereço do app (hoje `http://localhost:3100`, depois o da Vercel) e liberar `/entrar` nas Redirect URLs, porque o convite cai em `/entrar#...` e a tela manda para `/entrar/nova-senha`; (3) convidar os 2 e-mails (Authentication > Users > Invite).
- **Defeito do plano corrigido:** `tarefas.empresa_id` é `on delete restrict` (não cascade): com cascade, o Matheus apagando uma empresa apagaria o caderno privado do Natham. O app apaga primeiro as tarefas que a pessoa vê e depois a empresa; se sobrar tarefa privada do outro, o banco recusa e o app avisa.
- **Para a Etapa 2 (Pena):** `Tarefa` ganhou `dono`, `criadoPor`, `enviadaPor` (só leitura) e `NovaTarefa.enviarPara` (cria a tarefa já no caderno do outro; o banco grava `enviada_por`). O "Criar tarefa para…" de hoje ainda só troca `responsavel` (não mexi). `useEu()` diz quem está logado; `useErroDados()`/`limparErro` alimentam o aviso vermelho (`AvisoErro` na Casca).
- **Limites conhecidos:** anexos (`arquivos`) ainda não vão ao banco: ficam na tela até recarregar (Etapa 2, Vitral). A busca traz até 1000 tarefas (limite padrão do Supabase). Atualiza ao voltar para a aba, não ao vivo. Tarefa copiada por "Criar tarefa para…" que é conteúdo (com etapa e empresa) vira conteúdo compartilhado; a enviada por quem a copiou fica só-leitura para ele (regra do brief), vale rever na Etapa 2.
- **Não testado:** entrar com conta real (nenhuma conta foi criada, como pedido). Provado: o banco por troca de papel; o porteiro (`/calendario` sem login vai para `/entrar`); erro de senha errada contra o Supabase real; build, lint, tipos e 43 testes. As consultas do repositório (inclusive o `select` com `tarefa_tags`) só rodam de verdade no 1º login: se algo falhar, aparece o aviso vermelho.
- **Fotos:** `provas/r6-login/` (entrar e porteiro em 1903 e 390, mais o erro de senha). `npm run check` verde.
