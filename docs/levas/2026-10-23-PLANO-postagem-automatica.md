# Postagem automática (196) + Vídeo no Drive (203) + Concluir/lixeira/trava · Plano de Implementação

> **Pra o agente:** SUB-SKILL: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans pra implementar tarefa a tarefa. Passos usam checkbox `- [ ]` pra tracking.

**Objetivo:** card de Postagem aprovado posta sozinho no Instagram e no Facebook da You na hora marcada (ou em "Postar agora"), com o arquivo vindo do Drive do nathamsud@gmail.com, e vai para Postado; erro deixa faixa vermelha e avisa o Natham.
**Arquitetura:** o banco é o relógio: cada card programado ganha UM alarme de uso único (pg_cron) que chama a função `postar-meta` no servidor do Supabase; ela pega o card numa catraca atômica, busca o arquivo no Drive, entrega à Meta (API v26.0) e grava o resultado. O vídeo sobe do navegador DIRETO para o Drive (função `drive` abre a sessão de envio) e nunca passa pelo Supabase; do Drive ele vai direto para a Meta por envio retomável. Card que não é post termina em "Concluir", que apaga o card e os arquivos.
**Stack:** Next.js 16.4 + React 19 + TypeScript (ler `node_modules/next/dist/docs/` antes de codar, ver `AGENTS.md`); Supabase Postgres (pg_cron 1.6.4 em GMT, pg_net 0.20.4, Vault); Edge Functions (Deno, plano Pro: 400 s, 256 MB, 2 s de CPU por pedido); Google Drive API v3 (escopo `drive.file`); Meta Graph API v26.0; n8n só para o aviso (WhatsApp, Alexa no fim).
**Spec:** `docs/levas/2026-10-23-ESTUDO-postagem-automatica.md` (seções a até g, todas as decisões do Natham) + `Claude Agentes/MetaPro/Referencias/BRIEFING-POSTAGEM-AUTOMATICA.md` (seções 1 a 9). Item 203 na leva `2026-10-18-grade-de-conteudo-beec.md`.

## Restrições globais
- Projeto Supabase `uruhjlurcxpjhhgvuzwt` (Tarefas). NUNCA o do CRM (`xtclayekvviccrasxgos`).
- `META_PUBLISHER_TOKEN` nunca sai dos Secrets: não ler, não imprimir, não logar, não copiar. Na chamada à Meta vai SÓ no cabeçalho `Authorization: Bearer`, nunca no endereço (o endereço aparece em log).
- Nenhuma chave em arquivo do repo. Segredos novos ficam no Vault (sorteados por SQL) ou nos Secrets (colados pelo Natham no painel).
- `POSTAR_DE_VERDADE` desligado por padrão: a função faz tudo e para antes de publicar. Só liga com OK escrito do Natham.
- Nenhuma chamada à Meta real até a Etapa 5. Antes disso: Meta falsa.
- `apply_migration` em produção é barrado pelo classificador: SQL vai em arquivo único em `supabase/_colar/` e o Natham cola no SQL Editor. Depois, conferência só de leitura.
- Nada publicado sem o Natham (ele roda o comando de publicar). `npm run check` verde e fotos em 1903x900, 1440x760 e 390 em `provas/<nome>/` antes de dizer pronto.
- Telas importam dados só de `@/lib/dados`. Commit pequeno por tarefa, com o número do item (196, 203, 205...) e só os seus arquivos (`git add <arquivos>`).
- Vídeo nunca no Supabase. Vídeo nunca é recomprimido: vai o arquivo original.
- Texto da interface e documentos em português do Brasil, sem travessão.
- Ninguém edita arquivo de outro território. Precisa de algo de fora? Pede ao dono pelo Maestro.

## Território e modelos

| Terminal | Modelo | Território (só ele edita) |
|---|---|---|
| **Alvenaria** | Sonnet | `supabase/0NN_*.sql`, `supabase/_colar/`, `supabase/prova_*.sql` |
| **Vitral** | Sonnet | `supabase/functions/drive/`, `supabase/functions/google-autorizar/`, `supabase/functions/_shared/google.ts`, `src/lib/dados/drive.ts`, `src/components/ficha/Anexos.tsx`, `src/components/ficha/CampoOcasiao.tsx` (novo), `src/components/pastas/*`, `src/components/mapa/*`, bloco "Google Drive" em `src/components/configuracoes/` |
| **Sextante** | Sonnet | `src/components/ficha/Ficha.tsx`, `Aprovacao.tsx`, `aprovacao.css`, `ficha.css`, `src/lib/dados/tipos.ts`, `src/lib/dados/repositorio.ts` (menos a função `sincronizarAnexos`, que é do Vitral), `src/lib/dados/index.ts`; no card da Esteira (`TelaConteudos.tsx`) só o encaixe de `Aprovacao`/`SeloConserto` e a recusa de soltar card que não é post em Aprovado/Postado (combinar com a Régua antes) |
| **Correio** (NOVO) | **Opus** | `supabase/functions/postar-meta/`, `scripts/meta-falsa.mjs`, `docs/levas/N8N-AVISO-POSTAGEM-BRIEF.md`. Justificativa do Opus: é a única peça que publica para fora sem volta (post público com a marca da You), mexe com a chave da Meta e precisa garantir "nunca duas vezes" entre banco, Drive e Meta, com timeout no meio |
| **Lupa #2** | Codex | Só revisa e aponta, não edita. Por ser Codex, não consegue `maestri ask` de volta: pedir o resultado "só na mensagem final" e ler o retorno do ask |

---

## Ordem das etapas

| Etapa | Quem | Depende de |
|---|---|---|
| **0 · Publicar a rodada 193-207** (pendentes de aparência da RETOMADA fechados antes: faixa "Esperando aprovação" em card Aprovado e etiqueta Conserto (Sextante); faixa "Sem data" (Vitral)) | Natham roda o comando de publicar | `npm run check` verde |
| **1 · Contrato no banco (SOLO)** | Alvenaria escreve o 019; Lupa revisa | Etapa 0 |
| **2 · Construção em paralelo** | Vitral, Correio, Sextante | 019 revisado (não precisa estar aplicado: todos trabalham com banco falso, Drive falso e Meta falsa) |
| **3 · Prova sem nada real + revisão** | os três + Lupa | Etapa 2 |
| **4 · Ir para o ar desligado** (`POSTAR_DE_VERDADE` = não) | Natham cola o 019, cola os Secrets, roda o deploy guiado, publica | Etapa 3 + Google configurado (D2) |
| **5 · Testes reais sem publicar** (Drive de verdade, rascunho na Meta) | Vitral, Correio | Etapa 4 + OK do Natham |
| **6 · Primeiro post real** (ÚLTIMO passo) | Correio, com o Natham | Etapa 5 + foto e legenda aprovadas por ele no chat |
| **7 · Alexa** (fim) | Correio (brief) + agente do n8n | Etapa 6 |

---

## Contrato (o que a Etapa 1 entrega e todo mundo consome)

**Tabela `tarefas`** (colunas novas): `legenda text` (até 2200), `postar_redes text[]` (subconjunto de `{instagram,facebook}`, padrão os dois), `ocasiao_id uuid` (FK `ocasioes`, `on delete set null`).
**Tabela `arquivos`** (colunas novas): `drive_id text unique` (arquivo no Drive; aí `caminho` é nulo), `ordem int` (carrossel), `papel text` (`anexo` | `capa`). Regras: exatamente um lugar (`caminho` XOR `drive_id`); vídeo só com `drive_id`; capa é imagem e no máximo 1 por card.
**Tabela `ocasioes`** (nova): `id, empresa_id, nome, drive_pasta_id, criado_por, created_at`; nome único por empresa (sem diferenciar maiúscula). Leitura: qualquer pessoa logada. Escrita: só a função `drive`.
**Tabela `drive_pastas`** (nova): `chave text pk` (`raiz` ou `empresa:<id>`), `drive_id text`. Só a função `drive`.
**Tabela `postagens`** (nova): uma linha por card e por rede. `tarefa_id, rede, status (fila|enviando|processando|postado|erro), conteiner_id, post_id, link, erro, tentativas, pego_em, postado_em`, `unique(tarefa_id, rede)`. Leitura: quem vê o card. Escrita: só a função `postar-meta`.
**Balde `postagens`** (novo, privado, imagens até 50 MB): cópia de minutos da foto/capa para a Meta baixar. Só a função.
**Balde `arquivos`**: deixa de aceitar `video/*`.

**RPCs para a tela (`authenticated`):**
- `postar_agora(p_tarefa uuid)`: só Natham/aprovador, card Postagem em Aprovado. Marca a hora como agora e dispara.
- `tentar_de_novo(p_tarefa uuid)`: só Natham/aprovador. Volta as redes com erro para a fila e dispara.
- `pode_mexer_anexos(p_tarefa uuid) returns boolean`: a função `drive` chama com a chave do usuário antes de abrir envio.
- `pode_apagar_tarefa(p_tarefa uuid) returns boolean`: idem antes de apagar.
- `salvar_tarefa(p jsonb, p_tags text[])`: passa a aceitar `legenda`, `postar_redes`, `ocasiao_id` (chave ausente = mantém o valor).

**RPCs só para as funções (`service_role`):**
- `pegar_postagens(p_tarefa uuid) returns setof postagens`: a catraca.
- `armar_alarme_servico(p_tipo text, p_tarefa uuid, p_minutos int)`: rearmar (nova tentativa, conferir vídeo).
- `ler_segredo_servico(p_nome text) returns text`: lê do Vault só os nomes da lista (`tarefas_funcoes_segredo`, `google_drive_refresh_token`, `tarefas_aviso_url`, `tarefas_aviso_segredo`).
- `guardar_google_token(p text)`: grava/atualiza o refresh token do Google no Vault.

**Alarmes (pg_cron, nome `tarefas_<tipo>_<id do card>`, hora em GMT):**
- `postar`: armado quando o card fica Aprovado com `postar_em`; desarmado quando sai de Aprovado ou é apagado. Hora no passado ou em menos de 1 min = dispara na hora.
- `limpar`: armado quando o card entra em Postado, para daqui a 7 dias; chama a função `drive` (`acao: limpar`).
- Ao tocar: o alarme se apaga e faz `net.http_post` (timeout 55000) para `/functions/v1/postar-meta` ou `/functions/v1/drive` com o cabeçalho `x-tarefas-segredo` e corpo `{ "acao": "<tipo>", "tarefa_id": "<id>" }`.

**Funções no servidor (Edge Functions), todas com `--no-verify-jwt` e checagem própria:**
- `postar-meta` (Correio): `POST {acao: "postar", tarefa_id}` com `x-tarefas-segredo`. Responde 202 na hora e trabalha em segundo plano (`EdgeRuntime.waitUntil`).
- `drive` (Vitral): `POST` com `Authorization: Bearer <chave do usuário>` para `sessao_envio`, `confirmar_envio`, `criar_ocasiao`, `renomear_ocasiao`, `apagar_anexo`, `apagar_tarefa`; com `x-tarefas-segredo` só para `limpar`.
- `google-autorizar` (Vitral): `GET ?inicio=1` (com a chave do Natham) devolve o endereço do Google; `GET ?code=..&state=..` é a volta do Google.
- `_shared/google.ts` (Vitral, o Correio consome): `tokenGoogle(): Promise<string>` e `baixarDoDrive(driveId: string): Promise<Response>` (corpo em fluxo, sem carregar na memória).

---

## Etapa 1 · Banco (Alvenaria, SOLO)

### Tarefa 1: `supabase/019_postagem_drive.sql`

**Arquivos:**
- Criar: `supabase/019_postagem_drive.sql`
- Criar: `supabase/_colar/019_postagem_drive.sql` (cópia idêntica, para colar)
- Apagar: `supabase/017_drive_fila_e_limpeza.sql` e `supabase/018_vault_segredo_drive.sql` (nunca aplicados; substituídos pelo 203). Anotar na leva.

**Interfaces:** Produz tudo da seção "Contrato".

- [ ] **Passo 1: escrever o SQL abaixo.** Conferir antes, só com leitura, que o 015 e o 016 estão como no repo (`pg_get_functiondef` de `private.tarefas_aprovacao`, `public.salvar_tarefa`, `private.pode_alterar_arquivo`).

```sql
begin;
-- 019 · contrato do 196 (postagem IG/FB) + 203 (arquivo no Drive) + Concluir/lixeira/trava depois de Aprovado.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 002, 006, 009, 015, 016.

-- 1. Card: legenda, redes e ocasião
alter table public.tarefas
  add column if not exists legenda text,
  add column if not exists postar_redes text[] not null default '{instagram,facebook}',
  add column if not exists ocasiao_id uuid;
alter table public.tarefas drop constraint if exists tarefas_legenda_ok;
alter table public.tarefas add constraint tarefas_legenda_ok check (char_length(legenda) <= 2200);
alter table public.tarefas drop constraint if exists tarefas_postar_redes_ok;
alter table public.tarefas add constraint tarefas_postar_redes_ok check (postar_redes <@ array['instagram', 'facebook']);

-- 2. Ocasião = pasta do Drive dentro da empresa (Tarefas · Conteúdos → Empresa → Ocasião). Só a função drive escreve.
create table if not exists public.ocasioes (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas(id),
  nome text not null check (btrim(nome) <> ''),
  drive_pasta_id text unique,
  criado_por uuid references public.pessoas(id),
  created_at timestamptz not null default now()
);
create unique index if not exists ocasioes_nome_unico on public.ocasioes (empresa_id, lower(btrim(nome)));
alter table public.ocasioes enable row level security;
drop policy if exists ocasioes_le on public.ocasioes;
create policy ocasioes_le on public.ocasioes for select to authenticated using ((select private.minha_pessoa()) is not null);
alter table public.tarefas drop constraint if exists tarefas_ocasiao_fk;
alter table public.tarefas add constraint tarefas_ocasiao_fk foreign key (ocasiao_id) references public.ocasioes(id) on delete set null;

create table if not exists public.drive_pastas (chave text primary key, drive_id text not null);
alter table public.drive_pastas enable row level security;  -- sem política: só a chave de serviço

-- 3. Arquivos: Drive, ordem do carrossel e capa
alter table public.arquivos
  add column if not exists drive_id text unique,
  add column if not exists ordem int not null default 0,
  add column if not exists papel text not null default 'anexo';
alter table public.arquivos alter column caminho drop not null;
alter table public.arquivos drop constraint if exists arquivos_um_lugar;
alter table public.arquivos add constraint arquivos_um_lugar check ((caminho is null) <> (drive_id is null));
alter table public.arquivos drop constraint if exists arquivos_video_no_drive;
alter table public.arquivos add constraint arquivos_video_no_drive check (tipo <> 'video' or drive_id is not null);
alter table public.arquivos drop constraint if exists arquivos_papel_ok;
alter table public.arquivos add constraint arquivos_papel_ok check (papel in ('anexo', 'capa') and (papel <> 'capa' or tipo = 'imagem'));
create unique index if not exists arquivos_uma_capa on public.arquivos (tarefa_id) where papel = 'capa';
update storage.buckets set allowed_mime_types = array_remove(allowed_mime_types, 'video/*') where id = 'arquivos';

-- 4. Quem mexe em anexo: quem pode alterar o card E, depois de Aprovado, só o Natham ou o aprovador (decisão de 23/10).
create or replace function private.pode_mexer_anexos(p_tarefa uuid) returns boolean
language sql stable set search_path = ''
as $$
  select exists (select 1 from public.tarefas t where t.id = p_tarefa
    and (select private.pode_alterar(t.dono_id, t.enviada_por, t.etapa, t.empresa_id))
    and (t.etapa is null or t.etapa not in ('aprovado', 'postado') or (select private.pode_aprovar(t.aprovador))))
$$;
revoke all on function private.pode_mexer_anexos(uuid) from public, anon;
grant execute on function private.pode_mexer_anexos(uuid) to authenticated;
create or replace function public.pode_mexer_anexos(p_tarefa uuid) returns boolean
language sql stable security invoker set search_path = '' as $$ select private.pode_mexer_anexos(p_tarefa) $$;
revoke all on function public.pode_mexer_anexos(uuid) from public, anon;
grant execute on function public.pode_mexer_anexos(uuid) to authenticated;

create or replace function private.pode_alterar_arquivo(caminho text) returns boolean
language sql stable set search_path = ''
as $$
  select case split_part(caminho, '/', 1)
    when 'tarefas' then exists (select 1 from public.tarefas t where t.id::text = split_part(caminho, '/', 2)
      and (select private.pode_mexer_anexos(t.id)))
    when 'pecas' then (select private.minha_pessoa()) is not null
    else false
  end
$$;

-- Linha com drive_id só nasce e só sai pela função drive (senão alguém apontaria para outro arquivo do Drive e a limpeza o apagaria).
drop policy if exists arquivos_cria on public.arquivos;
create policy arquivos_cria on public.arquivos for insert to authenticated with check (
  criado_por = (select private.minha_pessoa()) and drive_id is null
  and ((tarefa_id is not null and (select private.pode_mexer_anexos(tarefa_id)))
       or (peca_id is not null and (select private.minha_pessoa()) is not null))
);
drop policy if exists arquivos_apaga on public.arquivos;
create policy arquivos_apaga on public.arquivos for delete to authenticated using (
  drive_id is null
  and ((tarefa_id is not null and (select private.pode_mexer_anexos(tarefa_id)))
       or (peca_id is not null and (select private.minha_pessoa()) is not null))
);

-- 5. Lixeira: além do dono, o Natham e o Matheus apagam card de conteúdo (decisão de 23/10).
create or replace function private.sou_natham_ou_matheus() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.pessoas p where p.user_id = (select auth.uid()) and p.slug in ('natham', 'matheus')) $$;
revoke all on function private.sou_natham_ou_matheus() from public, anon;
grant execute on function private.sou_natham_ou_matheus() to authenticated;
drop policy if exists tarefas_apaga on public.tarefas;
create policy tarefas_apaga on public.tarefas for delete to authenticated using (
  (select private.pode_apagar(dono_id, enviada_por))
  or (etapa is not null and empresa_id is not null and (select private.sou_natham_ou_matheus()))
);
create or replace function public.pode_apagar_tarefa(p_tarefa uuid) returns boolean
language sql stable security invoker set search_path = ''
as $$
  select exists (select 1 from public.tarefas t where t.id = p_tarefa and (
    (select private.pode_apagar(t.dono_id, t.enviada_por))
    or (t.etapa is not null and t.empresa_id is not null and (select private.sou_natham_ou_matheus()))))
$$;
revoke all on function public.pode_apagar_tarefa(uuid) from public, anon;
grant execute on function public.pode_apagar_tarefa(uuid) to authenticated;
-- Card com arquivo no Drive só se apaga pela função drive (ela tira o arquivo do Drive antes; nada fica órfão).
create or replace function private.tarefas_apagar_com_drive() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and exists (select 1 from public.arquivos a where a.tarefa_id = old.id and a.drive_id is not null) then
    raise exception 'card com arquivo no Drive se apaga pela lixeira ou pelo Concluir' using errcode = '42501';
  end if;
  return old;
end $$;
drop trigger if exists tarefas_apagar_com_drive on public.tarefas;
create trigger tarefas_apagar_com_drive before delete on public.tarefas for each row execute function private.tarefas_apagar_com_drive();

-- 6. Gatilho de aprovação (015) + Aprovado/Postado só para Tipo Postagem + trava de legenda, formato e redes depois de Aprovado.
create or replace function private.tarefas_aprovacao() returns trigger
language plpgsql set search_path = ''
as $$
declare v_entra_aprovado boolean; v_entra_postado boolean;
begin
  if new.postar_em is not null then
    begin perform new.postar_em::timestamp;
    exception when others then raise exception 'postar_em invalido: %', new.postar_em using errcode = '22007'; end;
  end if;
  if new.etapa in ('aprovado', 'postado') and new.tipo is distinct from 'postagem' then
    raise exception 'so card do tipo Postagem vai para Aprovado ou Postado; os outros terminam em Concluir' using errcode = '23514';
  end if;
  v_entra_aprovado := new.etapa = 'aprovado' and (tg_op = 'INSERT' or old.etapa is distinct from 'aprovado');
  v_entra_postado := new.etapa = 'postado' and (tg_op = 'INSERT' or coalesce(old.etapa, '') not in ('aprovado', 'postado'));
  if tg_op = 'UPDATE' then
    if (new.conserto and not old.conserto) or v_entra_aprovado or v_entra_postado
       or new.aprovador is distinct from old.aprovador
       or (old.etapa in ('aprovado', 'postado') and new.etapa in ('aprovado', 'postado') and (
            new.postar_em is distinct from old.postar_em or new.legenda is distinct from old.legenda
            or new.formato is distinct from old.formato or new.postar_redes is distinct from old.postar_redes)) then
      if not (select private.pode_aprovar(old.aprovador)) then
        raise exception 'so o Natham ou o aprovador do card aprova, programa, muda o que vai para a rede ou manda consertar' using errcode = '42501';
      end if;
    end if;
  else
    if new.conserto then raise exception 'conserto so nasce de "Consertar" em um card existente' using errcode = '42501'; end if;
    if (v_entra_aprovado or v_entra_postado) and not (select private.pode_aprovar(new.aprovador)) then
      raise exception 'so o Natham ou o aprovador do card cria um card ja aprovado' using errcode = '42501';
    end if;
  end if;
  if new.etapa is distinct from 'edicao' then new.conserto := false; end if;
  if new.etapa is null or new.etapa not in ('aprovado', 'postado') then new.postar_em := null; end if;
  return new;
end $$;

-- 7. salvar_tarefa (015) + legenda, postar_redes, ocasiao_id. Chave ausente no JSON = mantém o valor atual.
create or replace function public.salvar_tarefa(p jsonb, p_tags text[] default '{}') returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  r public.tarefas;
  v_linhas int;
begin
  r := jsonb_populate_record(null::public.tarefas, p);
  if r.id is null then raise exception 'salvar_tarefa: falta o id'; end if;
  if exists (select 1 from public.tarefas where id = r.id) then
    update public.tarefas t set
      titulo = r.titulo, tipo = r.tipo, empresa_id = r.empresa_id, rede = r.rede, etapa = r.etapa,
      responsavel_id = r.responsavel_id, inicio = r.inicio, fim = r.fim, dia_inteiro = r.dia_inteiro, cor = r.cor,
      concluida = r.concluida, objetivo = r.objetivo, notas = r.notas, links = r.links, aprovador = r.aprovador,
      postar_em = case when p ? 'postar_em' then r.postar_em else t.postar_em end,
      formato = case when p ? 'formato' then r.formato else t.formato end,
      conserto = case when p ? 'conserto' then coalesce(r.conserto, false) else t.conserto end,
      legenda = case when p ? 'legenda' then r.legenda else t.legenda end,
      postar_redes = case when p ? 'postar_redes' then coalesce(r.postar_redes, '{instagram,facebook}') else t.postar_redes end,
      ocasiao_id = case when p ? 'ocasiao_id' then r.ocasiao_id else t.ocasiao_id end
    where t.id = r.id;
    get diagnostics v_linhas = row_count;
    if v_linhas = 0 then raise exception 'sem permissao para alterar a tarefa'; end if;
    delete from public.tarefa_tags where tarefa_id = r.id;
  else
    insert into public.tarefas (id, titulo, tipo, empresa_id, rede, etapa, responsavel_id, inicio, fim, dia_inteiro, cor,
      concluida, objetivo, notas, links, aprovador, dono_id, criado_por, enviada_por, vai_pro_google, postar_em, formato,
      legenda, postar_redes, ocasiao_id)
    values (r.id, r.titulo, r.tipo, r.empresa_id, r.rede, r.etapa, r.responsavel_id, r.inicio, r.fim, r.dia_inteiro, r.cor,
      r.concluida, r.objetivo, r.notas, r.links, r.aprovador, r.dono_id, r.criado_por, r.enviada_por, coalesce(r.vai_pro_google, false),
      r.postar_em, r.formato, r.legenda, coalesce(r.postar_redes, '{instagram,facebook}'), r.ocasiao_id);
  end if;
  insert into public.tarefa_tags (tarefa_id, tag_id) select r.id, unnest(p_tags);
end $$;
revoke all on function public.salvar_tarefa(jsonb, text[]) from public, anon;
grant execute on function public.salvar_tarefa(jsonb, text[]) to authenticated;

-- 8. Registro da postagem (uma linha por card e por rede: o unique impede post duplicado na mesma rede)
create table if not exists public.postagens (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  rede text not null check (rede in ('instagram', 'facebook')),
  status text not null default 'fila' check (status in ('fila', 'enviando', 'processando', 'postado', 'erro')),
  conteiner_id text, post_id text, link text, erro text,
  tentativas int not null default 0,
  pego_em timestamptz, postado_em timestamptz,
  unique (tarefa_id, rede)
);
alter table public.postagens enable row level security;
drop policy if exists postagens_le on public.postagens;
create policy postagens_le on public.postagens for select to authenticated
  using (exists (select 1 from public.tarefas t where t.id = tarefa_id));  -- a trava de leitura de tarefas decide

-- 9. Segredos (Vault). O da campainha é sorteado aqui; ninguém precisa vê-lo.
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'tarefas_funcoes_segredo') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'tarefas_funcoes_segredo');
  end if;
  if not exists (select 1 from vault.secrets where name = 'tarefas_aviso_segredo') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'tarefas_aviso_segredo');
  end if;
end $$;
create or replace function public.ler_segredo_servico(p_nome text) returns text
language sql stable security definer set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_nome
    and p_nome in ('tarefas_funcoes_segredo', 'google_drive_refresh_token', 'tarefas_aviso_url', 'tarefas_aviso_segredo')
$$;
revoke all on function public.ler_segredo_servico(text) from public, anon, authenticated;
grant execute on function public.ler_segredo_servico(text) to service_role;
create or replace function public.guardar_google_token(p text) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'google_drive_refresh_token';
  if v_id is null then perform vault.create_secret(p, 'google_drive_refresh_token'); else perform vault.update_secret(v_id, p); end if;
end $$;
revoke all on function public.guardar_google_token(text) from public, anon, authenticated;
grant execute on function public.guardar_google_token(text) to service_role;

-- 10. Alarmes de uso único (pg_cron em GMT). Analogia: um despertador por card, que toca uma vez e se joga fora.
create or replace function private.alarme_nome(p_tipo text, p_tarefa uuid) returns text
language sql immutable set search_path = '' as $$ select 'tarefas_' || p_tipo || '_' || p_tarefa::text $$;

create or replace function private.alarme_tocou(p_tipo text, p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_nome text := private.alarme_nome(p_tipo, p_tarefa); v_segredo text;
begin
  if exists (select 1 from cron.job where jobname = v_nome) then perform cron.unschedule(v_nome); end if;
  select decrypted_secret into v_segredo from vault.decrypted_secrets where name = 'tarefas_funcoes_segredo';
  perform net.http_post(
    url := 'https://uruhjlurcxpjhhgvuzwt.supabase.co/functions/v1/' || case p_tipo when 'limpar' then 'drive' else 'postar-meta' end,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-tarefas-segredo', v_segredo),
    body := jsonb_build_object('acao', p_tipo, 'tarefa_id', p_tarefa),
    timeout_milliseconds := 55000);  -- pg_net padrão é 5 s (memória pgnet-timeout)
end $$;
revoke all on function private.alarme_tocou(text, uuid) from public, anon, authenticated;

create or replace function private.armar_alarme(p_tipo text, p_tarefa uuid, p_quando timestamptz) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_utc timestamp := p_quando at time zone 'UTC';
begin
  if p_quando <= now() + interval '1 minute' then perform private.alarme_tocou(p_tipo, p_tarefa); return; end if;
  perform cron.schedule(private.alarme_nome(p_tipo, p_tarefa),
    format('%s %s %s %s *', extract(minute from v_utc)::int, extract(hour from v_utc)::int, extract(day from v_utc)::int, extract(month from v_utc)::int),
    format('select private.alarme_tocou(%L, %L::uuid)', p_tipo, p_tarefa));
end $$;
revoke all on function private.armar_alarme(text, uuid, timestamptz) from public, anon, authenticated;

create or replace function private.desarmar_alarme(p_tipo text, p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from cron.job where jobname = private.alarme_nome(p_tipo, p_tarefa)) then
    perform cron.unschedule(private.alarme_nome(p_tipo, p_tarefa));
  end if;
end $$;
revoke all on function private.desarmar_alarme(text, uuid) from public, anon, authenticated;

create or replace function private.tarefas_alarmes() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.desarmar_alarme('postar', old.id);
    perform private.desarmar_alarme('limpar', old.id);
    return old;
  end if;
  if new.etapa = 'aprovado' and new.postar_em is not null then
    if tg_op = 'INSERT' or old.etapa is distinct from 'aprovado' or old.postar_em is distinct from new.postar_em then
      perform private.armar_alarme('postar', new.id, new.postar_em::timestamp at time zone 'America/Sao_Paulo');
    end if;
  else
    perform private.desarmar_alarme('postar', new.id);
  end if;
  if new.etapa = 'postado' and (tg_op = 'INSERT' or old.etapa is distinct from 'postado') then
    perform private.armar_alarme('limpar', new.id, now() + interval '7 days');
  elsif new.etapa is distinct from 'postado' then
    perform private.desarmar_alarme('limpar', new.id);
  end if;
  return new;
end $$;
drop trigger if exists tarefas_alarmes on public.tarefas;
create trigger tarefas_alarmes after insert or update of etapa, postar_em or delete on public.tarefas
  for each row execute function private.tarefas_alarmes();

-- O relógio de todo minuto (015) sai: o Natham não quer execução à toa (23/10).
do $$ begin
  if exists (select 1 from cron.job where jobname = 'tarefas_postar_vencidos') then perform cron.unschedule('tarefas_postar_vencidos'); end if;
end $$;
drop function if exists private.postar_vencidos();

-- 11. RPCs da tela
create or replace function public.postar_agora(p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_antes text; v_agora text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI');
begin
  select postar_em into v_antes from public.tarefas t
  where t.id = p_tarefa and t.etapa = 'aprovado' and t.tipo = 'postagem' and (select private.pode_aprovar(t.aprovador));
  if not found then raise exception 'so o Natham ou o aprovador posta agora, e so card de Postagem em Aprovado' using errcode = '42501'; end if;
  update public.tarefas set postar_em = v_agora where id = p_tarefa;  -- o gatilho de alarmes dispara se a hora mudou
  if v_antes is not distinct from v_agora then perform private.alarme_tocou('postar', p_tarefa); end if;
end $$;
revoke all on function public.postar_agora(uuid) from public, anon;
grant execute on function public.postar_agora(uuid) to authenticated;

create or replace function public.tentar_de_novo(p_tarefa uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.tarefas t where t.id = p_tarefa and t.etapa = 'aprovado' and (select private.pode_aprovar(t.aprovador))) then
    raise exception 'so o Natham ou o aprovador tenta de novo' using errcode = '42501';
  end if;
  update public.postagens set status = 'fila', erro = null where tarefa_id = p_tarefa and status = 'erro';
  perform private.alarme_tocou('postar', p_tarefa);
end $$;
revoke all on function public.tentar_de_novo(uuid) from public, anon;
grant execute on function public.tentar_de_novo(uuid) to authenticated;

-- 12. RPCs das funções (só chave de serviço)
-- A catraca: cria as linhas das redes escolhidas e passa para 'enviando' só o que ninguém pegou.
-- 'enviando' parado há mais de 10 min = a função caiu no meio; volta a ser pego, e a função confere na Meta antes de publicar de novo.
create or replace function public.pegar_postagens(p_tarefa uuid) returns setof public.postagens
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.postagens (tarefa_id, rede)
  select t.id, r from public.tarefas t, unnest(t.postar_redes) r
  where t.id = p_tarefa and t.etapa = 'aprovado' and t.tipo = 'postagem' and t.empresa_id = 'you' and t.postar_em is not null
    and t.postar_em <= to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI')
  on conflict (tarefa_id, rede) do nothing;
  return query
  -- tentativas conta só envio novo (fila); voltar de 'processando' para conferir o vídeo não gasta tentativa
  update public.postagens p set status = 'enviando', pego_em = now(), tentativas = p.tentativas + (p.status = 'fila')::int
  from public.tarefas t
  where p.tarefa_id = p_tarefa and t.id = p.tarefa_id and t.etapa = 'aprovado'
    and (p.status in ('fila', 'processando') or (p.status = 'enviando' and p.pego_em < now() - interval '10 minutes'))
  returning p.*;
end $$;
revoke all on function public.pegar_postagens(uuid) from public, anon, authenticated;
grant execute on function public.pegar_postagens(uuid) to service_role;

create or replace function public.armar_alarme_servico(p_tipo text, p_tarefa uuid, p_minutos int) returns void
language sql security definer set search_path = ''
as $$ select private.armar_alarme(p_tipo, p_tarefa, now() + make_interval(mins => p_minutos)) $$;
revoke all on function public.armar_alarme_servico(text, uuid, int) from public, anon, authenticated;
grant execute on function public.armar_alarme_servico(text, uuid, int) to service_role;

-- 13. Balde temporário da foto/capa para a Meta baixar (minutos; a função apaga depois). Vídeo nunca entra aqui.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('postagens', 'postagens', false, 52428800, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

notify pgrst, 'reload schema';
commit;
```

- [ ] **Passo 2: conferir à mão os pontos que a Lupa vai olhar:** (a) nenhum card de produção fica inválido (hoje: 2 Postagem em Edição/Análise, nenhum não-post em Aprovado/Postado); (b) `cron.timezone` = GMT (conferido 23/10); (c) `extensions.gen_random_bytes` existe (mesmo uso do 018); (d) o gatilho `tarefas_antes` não conflita com os novos.
- [ ] **Passo 3: `supabase/prova_postagem.sql`** (roda SÓ depois de aplicado, com OK do Natham, dentro de `begin ... rollback`): cria card Postagem You em Aprovado com `postar_em` daqui a 5 min e confere 1 linha em `cron.job` com o nome `tarefas_postar_<id>`; muda para Edição e confere que o job sumiu; tenta `etapa='aprovado'` num card Tipo Gravação e confere o erro 23514; chama `pegar_postagens` duas vezes seguidas (como `service_role`) e confere que a segunda devolve 0 linhas. Saída em `supabase/prova_postagem.saida.txt`.
- [ ] **Passo 4: commit** `019: contrato do 196/203 (postagem, Drive, alarmes, trava, lixeira); 017 e 018 saem`.
- [ ] **Passo 5: Lupa #2 revisa o 019** (só aponta). Corrigir e recomitar até liberar. Só então a Etapa 2 começa.

---

## Etapa 2 · Construção em paralelo

### Vitral · 203 (Drive) + 204 (Mapa)

#### Tarefa V0: provas de conceito (spikes) com Drive falso agora e Drive real na Etapa 5
- [ ] **S1 · navegador → Drive direto (CORS).** Sessão de envio retomável criada no servidor com o cabeçalho `Origin: <endereço do app>` e `PUT` em partes de 8 MB (múltiplo de 256 KB) feito pelo navegador para o endereço da sessão. Critério: o navegador recebe a resposta final com o `id` do arquivo. Se o Google não devolver CORS: plano B = a função `drive` recebe as partes e repassa (avisar o Maestro: muda o custo de execução).
- [ ] **S2 · vídeo grande em fluxo.** `baixarDoDrive(id)` devolve o `Response` do `files/{id}?alt=media` sem ler o corpo; repassar o `body` direto para outro `fetch` (sem `arrayBuffer()`). Critério: o maior vídeo real deles passa dentro de 256 MB e 2 s de CPU (ler o uso no log da função). Se não: avisar o Maestro (plano B = n8n faz o transporte do vídeo).

#### Tarefa V1: `supabase/functions/_shared/google.ts` + `google-autorizar`
**Interfaces:** Produz `tokenGoogle(): Promise<string>` (troca o refresh token do Vault por um token de acesso de 1 h; guarda em memória até 5 min antes de vencer) e `baixarDoDrive(driveId): Promise<Response>`.
- [ ] `google-autorizar`: `GET ?inicio=1` com a chave do Natham (conferir `slug='natham'` com a chave dele) → devolve `{ url }` do Google com `access_type=offline`, `prompt=consent`, escopo `https://www.googleapis.com/auth/drive.file`, `state` = HMAC (com `tarefas_funcoes_segredo`) de `natham|<hora>` válido por 10 min. Volta do Google: confere o `state`, troca o `code`, grava o refresh token com `guardar_google_token`, redireciona (302) para `/configuracoes?drive=ok`.
- [ ] Segredos usados: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (Secrets, colados pelo Natham). Nada em log.
- [ ] Configurações: bloco "Google Drive" só para o Natham: "Ligado como nathamsud@gmail.com" ou botão "Ligar Google Drive".

#### Tarefa V2: `supabase/functions/drive/index.ts`
Todas as ações com a chave do usuário criam DOIS clientes: um com a chave do usuário (para as checagens passarem pela trava do banco) e um de serviço (para gravar o que só a função grava).
- [ ] `sessao_envio {tarefa_id, nome, tipo, tamanho, papel}`: `pode_mexer_anexos` (como usuário) = true; card com empresa (sem empresa: recusa vídeo, e imagem/documento seguem no Supabase pelo caminho do 199). Garante as pastas: `drive_pastas['raiz']` ("Tarefas · Conteúdos", compartilhada como editor com o e-mail do Matheus, ver D3), `drive_pastas['empresa:<id>']`, e a ocasião do card. Card sem ocasião: cria uma com o título do card como nome sugerido e grava `tarefas.ocasiao_id`. Abre a sessão retomável dentro da pasta da ocasião e devolve `{ sessao_url }`.
- [ ] `confirmar_envio {tarefa_id, drive_id, nome, tipo, tamanho, papel, ordem}`: confere no Drive (`files/{id}?fields=parents,size,mimeType`) que o arquivo está na pasta certa e tem o tamanho dito; insere em `arquivos` com a chave de serviço (`drive_id`, `caminho` nulo, `criado_por` = pessoa do usuário).
- [ ] `criar_ocasiao {empresa_id, nome}` e `renomear_ocasiao {ocasiao_id, nome}`: grava em `ocasioes` e cria/renomeia a pasta no Drive (acha pelo id, não pelo nome).
- [ ] `apagar_anexo {arquivo_id}`: `pode_mexer_anexos` como usuário; manda o arquivo para a lixeira do Google (`files/{id}` com `trashed: true`) e apaga a linha.
- [ ] `apagar_tarefa {tarefa_id}`: `pode_apagar_tarefa` como usuário. Arquivos do Drive para a lixeira do Google; objetos do Supabase removidos; linhas de `arquivos` apagadas (serviço); por último, `delete` da tarefa COM A CHAVE DO USUÁRIO. Falhou o Drive: para tudo e devolve "Não consegui apagar no Drive, tente de novo" (nada some pela metade).
- [ ] `limpar {tarefa_id}` (só com `x-tarefas-segredo`): card em Postado. Manda os arquivos do Drive para a lixeira, remove do Supabase, apaga as linhas de `arquivos`. O card e `postagens` ficam (histórico do Mapa).

#### Tarefa V3: `src/lib/dados/drive.ts` + `Anexos.tsx` + `sincronizarAnexos`
- [ ] `enviarParaDrive(tarefa, arquivo, papel, ordem, aoProgredir)`: chama `sessao_envio`, envia em partes de 8 MB com `Content-Range`, retoma a parte que falhou (até 3 vezes), chama `confirmar_envio`. Exportado por `@/lib/dados`.
- [ ] `sincronizarAnexos` (repositorio.ts, trecho do Vitral): card com empresa → Drive para TODO tipo (imagem, vídeo, documento); sem empresa → Supabase como hoje, sem vídeo. Remover anexo do Drive → `apagar_anexo`.
- [ ] `Anexos.tsx`: vídeo em card sem empresa é recusado com "Escolha a empresa para anexar vídeo"; anexo do Drive abre no player do Drive (`https://drive.google.com/file/d/<id>/preview` num `iframe` dentro do diálogo grande, item 206); barra de progresso no envio; prop `papel="capa"` (aceita 1 imagem) para o Sextante usar no campo Capa; ordem arrastável quando `formato='carrossel'`.

#### Tarefa V4: Ocasião + Pastas
- [ ] `CampoOcasiao.tsx` (o Sextante encaixa na ficha): lista das ocasiões da empresa do card + "+ Nova"; editar o nome renomeia no Drive.
- [ ] Tela Pastas: cada ocasião aparece como pasta da empresa, com os cards dela.

#### Tarefa V5: Mapa (204)
- [ ] Card Postado no Mapa mostra título, formato, redes, data e os links "Ver no Instagram"/"Ver no Facebook" (de `postagens.link`), sem arquivo.

### Correio · 196 (função `postar-meta`)

#### Tarefa C0: spikes (Meta falsa agora; Meta real só na Etapa 5)
- [ ] **S3 · item de vídeo no carrossel do Instagram por envio retomável.** Conferir na doc v26.0 se `upload_type=resumable` vale para item de carrossel (`is_carousel_item=true`, `media_type=VIDEO`). Se não valer, o vídeo do carrossel precisa de endereço público: PARAR e levar ao Natham (D6).
- [ ] **S4 · PNG → JPG no servidor.** Biblioteca em JavaScript puro (ex.: `imagescript` via `jsr:`/`deno.land`, sem dependência nativa). Critério: o maior PNG real deles convertido em menos de 2 s de CPU, sRGB, qualidade máxima que caiba em 8 MB (100, depois 95, depois 92).

#### Tarefa C1: lógica (módulos sem Deno, testáveis no Vitest)
**Arquivos:** `supabase/functions/postar-meta/estado.ts`, `meta.ts`, `jpg.ts`, `index.ts` (fino: `Deno.serve`, segredo, `waitUntil`).
**Interfaces:** consome `pegar_postagens`, `armar_alarme_servico`, `ler_segredo_servico`, `tokenGoogle`/`baixarDoDrive` (Vitral). Base da API configurável por ambiente: `META_BASE` (padrão `https://graph.facebook.com/v26.0`) e `RUPLOAD_BASE` (padrão `https://rupload.facebook.com`), para a Meta falsa.

- [ ] **Entrada:** confere `x-tarefas-segredo` contra `ler_segredo_servico('tarefas_funcoes_segredo')` (comparação de tempo constante). Errado = 401 sem detalhe. Certo = 202 na hora e o trabalho segue em `EdgeRuntime.waitUntil`.
- [ ] **Catraca:** `pegar_postagens(tarefa_id)`. Zero linhas = alguém já pegou: termina.
- [ ] **Por rede pega**, lê o card (legenda, formato, `arquivos` por `ordem`, capa) com a chave de serviço:

| Formato | Instagram (`/{ig-id}`) | Facebook (`/{page-id}`, chave da página pedida na hora com `GET /{page-id}?fields=access_token`, só em memória) |
|---|---|---|
| post (1 imagem) | `POST /media` `image_url` (JPG, convertido se PNG) + `caption` → `POST /media_publish` | `POST /photos` `url` (original) + `message` |
| carrossel (2 a 10) | itens `is_carousel_item=true` (imagem: `image_url`; vídeo: ver S3) → `media_type=CAROUSEL` `children` + `caption` → `media_publish` | só imagens: cada uma `POST /photos` `published=false` → `POST /feed` `attached_media` + `message` (com vídeo: o Facebook nem é escolhido, a tela apaga o botão) |
| reels (1 vídeo) | `POST /media` `media_type=REELS` `upload_type=resumable` `caption` `cover_url` (capa JPG ≤ 8 MB, se houver) → bytes do Drive em fluxo para `RUPLOAD_BASE/ig-api-upload/v26.0/{conteiner}` (`Authorization: OAuth`, `offset: 0`, `file_size`) → `status_code` até `FINISHED` → `media_publish` | `POST /video_reels` `upload_phase=start` → bytes em fluxo para `RUPLOAD_BASE/video-upload/v26.0/{video_id}` → `upload_phase=finish` `video_state=PUBLISHED` `description`. Capa: só se D1 = sim (`POST /{video-id}/thumbnails` `is_preferred=true`) |
| story (1 imagem ou vídeo) | `media_type=STORIES` (imagem: `image_url`; vídeo: retomável como o Reels) → `media_publish` | imagem: `POST /photos` `published=false` → `POST /photo_stories` `photo_id`; vídeo: `POST /video_stories` `upload_phase=start` → rupload → `finish` |

- [ ] **Foto e capa para a Meta:** copia do Drive para o balde `postagens` (converte para JPG se for para o Instagram), gera link assinado de 1 h, apaga o objeto ao terminar (deu certo ou erro).
- [ ] **Antes de publicar:** grava `conteiner_id` (ou `video_id` no Facebook) em `postagens`. Se a linha voltou de "enviando parado" (função caiu): Instagram → `GET /{conteiner}?fields=status_code`; `PUBLISHED` = buscar o id/permalink e marcar postado SEM publicar de novo. Facebook sem como conferir (foto/carrossel) → marcar erro "estado incerto: confira a página antes de tentar de novo" (nunca repostar às cegas).
- [ ] **`POSTAR_DE_VERDADE` ≠ `sim`:** faz tudo até antes de `media_publish` / `finish PUBLISHED` / `photos published=true`, marca erro "modo de teste: parou antes de publicar" e não avisa ninguém.
- [ ] **Vídeo processando:** confere `status_code` a cada 15 s por até 5 min dentro da mesma execução. Não terminou: status `processando` + `armar_alarme_servico('postar', id, 5)` (até 3 vezes; depois, erro "a Meta não terminou de processar").
- [ ] **Deu certo:** grava `post_id`, `link` (Instagram: `GET /{media-id}?fields=permalink`; Facebook: `https://www.facebook.com/<post_id>`), `postado_em`, status `postado`. Todas as redes do card postadas → `update tarefas set etapa='postado' where id=... and etapa='aprovado'` (o banco arma a limpeza de 7 dias).
- [ ] **Erro:** status `erro`, `erro` = mensagem da Meta traduzida (tabela curta: formato, proporção, tamanho, permissão perdida, limite diário). `tentativas < 2` e o erro não é de permissão → status `fila` + `armar_alarme_servico('postar', id, 10)`. Sempre avisa (Tarefa C3).
- [ ] **Nunca:** chave no endereço, chave em log, `console.log` do pedido inteiro. O log guarda só `tarefa_id`, rede, etapa e código de erro.

#### Tarefa C2: Meta falsa + testes
- [ ] `scripts/meta-falsa.mjs`: servidor local (porta própria) que responde como a Graph API e o rupload (contêiner, `status_code` IN_PROGRESS → FINISHED, publish, erros forçados por título do card: "ERRO-PNG", "ERRO-PERMISSAO", "TIMEOUT-PUBLISH").
- [ ] Vitest (`supabase/functions/postar-meta/*.test.ts`, incluir no `vitest.config.mts`): agendado posta; Postar agora; dois disparos ao mesmo tempo = 1 post por rede; timeout no publish + nova pegada = NÃO publica de novo; erro → 1 nova tentativa e para; Facebook falha e Instagram não = card fica em Aprovado e a nova tentativa não repete o Instagram; PNG vira JPG só para o Instagram; nenhuma linha de log contém o valor da chave (chave falsa conhecida no teste).

#### Tarefa C3: aviso
- [ ] Erro (e, na Etapa 7, "post feito") → `POST` para `ler_segredo_servico('tarefas_aviso_url')` com `x-tarefas-segredo` = `tarefas_aviso_segredo` e corpo `{ tipo: "erro" | "feito", titulo, redes, motivo, links }`. Sem URL cadastrada: só não avisa (não quebra a postagem).
- [ ] Escrever `docs/levas/N8N-AVISO-POSTAGEM-BRIEF.md` para o agente do n8n: fluxo "Tarefas - Aviso postagem" com webhook que responde na hora, confere o segredo e manda WhatsApp SÓ para o Natham pelo mesmo caminho dos avisos dele de hoje (o agente confere no N8N-You qual é); Alexa entra no mesmo fluxo na Etapa 7, cada tipo com seu som, como no CRM.

### Sextante · ficha, card e regras de tela

#### Tarefa S1: dados (`tipos.ts`, `repositorio.ts`, `index.ts`)
- [ ] `Tarefa` ganha `legenda?: string`, `postarRedes: ("instagram" | "facebook")[]`, `ocasiaoId?: string`, `postagens: Postagem[]`; `Arquivo` ganha `driveId?`, `ordem`, `papel`. `Postagem = { rede, status, link?, erro?, postadoEm? }`.
- [ ] Carregar `postagens` junto das tarefas; salvar `legenda`, `postar_redes`, `ocasiao_id` no `salvar_tarefa`.
- [ ] Exportar `postarAgora(id)` e `tentarDeNovo(id)` (RPCs).
- [ ] `podeApagar`: dono/enviou OU (conteúdo e eu ∈ {natham, matheus}). `removerTarefa`: card com algum anexo → função `drive` `apagar_tarefa`; sem anexo → `delete` direto como hoje.
- [ ] Commit antes do Vitral mexer em `sincronizarAnexos` (avisar o Vitral pelo Maestro).

#### Tarefa S2: ficha (`Ficha.tsx`)
- [ ] Caixa "Legenda" abaixo do título, contador "0/2200" (só em card de conteúdo).
- [ ] Campo "Capa" (componente `Anexos` do Vitral com `papel="capa"`) só quando o formato é Reels.
- [ ] `CampoOcasiao` (Vitral) em card com empresa.
- [ ] Depois de Aprovado: legenda, formato, anexos e capa só leitura para quem não aprova (o banco já recusa; a tela não oferece).
- [ ] Lixeira (já existe, item 179): passa a aparecer pelo novo `podeApagar`; o "Apagar" chama `removerTarefa` (que leva o Drive junto).

#### Tarefa S3: card da Esteira (`Aprovacao.tsx`)
- [ ] Card cujo Tipo NÃO é Postagem: botão "Concluir" em qualquer etapa, no lugar de Aprovar/Consertar → confirmação "Concluir e apagar este card? Não dá para desfazer." [Cancelar] [Concluir] → `removerTarefa`.
- [ ] Programar postagem: formato (já existe) + [Instagram] [Facebook] acesos por padrão + data e hora (sem hora no passado). Carrossel com vídeo: Facebook apagado e travado, com "Carrossel com vídeo só vai para o Instagram". Card da Beec: no lugar do botão, "A Beec ainda não está ligada à postagem automática".
- [ ] Checagem antes de programar ou postar agora (mostra o que falta, não deixa seguir): legenda (menos Story); Post = 1 imagem; Reels = 1 vídeo; Carrossel = 2 a 10; Story = 1 imagem ou vídeo; pelo menos 1 rede.
- [ ] "Postar agora" ao lado de "Programar postagem" (só Natham/aprovador) → "Postar agora no Instagram e no Facebook da You? Não dá para desfazer." [Cancelar] [Postar] → `postarAgora`.
- [ ] Estados do card Aprovado: "Programado · 25/10 18:00 · Instagram + Facebook"; "Postando…" (alguma linha `enviando`/`processando`); faixa vermelha com o motivo e "Tentar de novo" (`tentarDeNovo`); saiu numa e falhou noutra: "Saiu no Instagram, falhou no Facebook: <motivo>" + "Ver no Instagram" + "Tentar de novo só no Facebook".
- [ ] Card Postado: "Ver no Instagram" / "Ver no Facebook".
- [ ] `SeloConserto`: ícone de conserto (chave inglesa) antes do texto, formato da etiqueta "Começar" (pendente de aparência da RETOMADA).

#### Tarefa S4: soltar card na Esteira (combinar com a Régua)
- [ ] Card que não é Postagem solto em Aprovado/Postado volta para onde estava, com "Só card de Postagem vai para Aprovado e Postado. Para terminar, use Concluir."

#### Tarefa S5: provas
- [ ] Banco falso local (método de `provas/r195-aprovacao/`): fotos 1903x900, 1440x760 e 390 de Programar, Postar agora, Postando, erro parcial, Postado com links, Concluir, lixeira do Matheus num card do Natham. `npm run check` verde.

---

## Etapa 3 · Prova sem nada real + revisão
- [ ] Correio: testes do Vitest verdes com a Meta falsa. Vitral: S1/S2 com Drive falso. Sextante: fotos.
- [ ] Busca no repositório pela chave e por `access_token=`: zero ocorrências.
- [ ] Lupa #2 revisa as três frentes (foco: catraca, publicar duas vezes, chave em log, trava depois de Aprovado, apagar sem órfão). Corrigir até liberar.

## Etapa 4 · Ir para o ar desligado (Natham, guiado clique por clique)
- [ ] Colar `supabase/_colar/019_postagem_drive.sql` no SQL Editor. Alvenaria confere só com leitura e roda `prova_postagem.sql` (com rollback).
- [ ] Secrets no painel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `POSTAR_DE_VERDADE=nao` (`META_PUBLISHER_TOKEN` já está).
- [ ] Deploy das 3 funções (se o MCP for barrado, o Natham roda `! npx supabase functions deploy <nome> --no-verify-jwt --project-ref uruhjlurcxpjhhgvuzwt`).
- [ ] Publicar o front.
- [ ] "Ligar Google Drive" em Configurações (1 clique dele).
- [ ] URL do webhook do aviso no Vault (1 linha de SQL, quando o fluxo do n8n existir).

## Etapa 5 · Testes reais sem publicar (com OK do Natham)
- [ ] Vitral: anexar o maior vídeo real num card de teste → aparece no Drive na pasta certa, toca no player; apagar o card → vai para a lixeira do Google.
- [ ] Correio: `GET /{ig-id}/content_publishing_limit` (leitura). Card de teste com `POSTAR_DE_VERDADE=nao` em Reels com capa, Post com PNG e Carrossel: tudo até o contêiner, sem publicar. Confere se o app da Meta precisa de revisão.

## Etapa 6 · Primeiro post real (ÚLTIMO passo)
- [ ] Natham aprova no chat a foto e a legenda. `POSTAR_DE_VERDADE=sim`. "Postar agora" → print do perfil.
- [ ] Card programado para daqui a 10 min com o PC dele DESLIGADO → print + horário.
- [ ] Erro de propósito → faixa vermelha + WhatsApp → print.
- [ ] Busca pela chave nos logs das funções: zero.

## Etapa 7 · Alexa (fim)
- [ ] Agente do n8n acrescenta a Alexa ao fluxo de aviso ("post feito" e "post com erro", cada um com seu som, como no CRM). A função passa a mandar também o tipo "feito".

---

## O que depende do Natham

| # | O quê | Quando |
|---|---|---|
| D0 | Publicar a rodada 193-207 (comando de sempre) | Antes de tudo |
| D1 | **Capa no Reels do Facebook:** gerar a chave do robô de novo com `pages_read_user_content` + `pages_manage_engagement` e liberar "Atividade da comunidade"? Sim = Facebook com a capa deles; não = a Meta escolhe o quadro | Antes da Etapa 2 (muda a Tarefa C1) |
| D2 | Google: criar o projeto e a autorização no Google Cloud com o nathamsud@gmail.com (guiado), colar `GOOGLE_CLIENT_ID`/`SECRET` nos Secrets, tela de consentimento em "Em produção" | Antes da Etapa 4 (S1/S2 reais) |
| D3 | E-mail Google do Matheus para compartilhar a pasta "Tarefas · Conteúdos" (o cadastro tem `matheus.germano@assessoriabeec.com.br`: é conta Google?) | Antes da Etapa 4 |
| D4 | Colar o 019, rodar o deploy guiado, publicar o front, clicar "Ligar Google Drive" | Etapa 4 |
| D5 | OK para as chamadas reais sem publicar; depois aprovar o 1º post e ligar `POSTAR_DE_VERDADE` | Etapas 5 e 6 |
| D6 | (Só se o S3 falhar) Carrossel com vídeo: cópia de minutos do vídeo no Supabase só para a Meta baixar, ou carrossel só com fotos | Se acontecer |

Não precisa mais: subir o limite global do Storage para 500 MB (vídeo não passa pelo Supabase).

## Riscos principais (detalhe no ESTUDO, seção d)
- Post em dobro → catraca, `unique(tarefa_id, rede)`, contêiner gravado antes de publicar, conferência depois de queda.
- Alarme que não toca → `prova_postagem.sql` confere o job; o card mostra "Programado" só se o alarme existe (Sextante lê `postar_em` + etapa; a prova da Alvenaria garante o par).
- Autorização do Google vencendo → tela de consentimento "Em produção" (D2).
- Vídeo grande no servidor → S2 antes de tudo; plano B no n8n.
- Matheus mudar o que foi aprovado → trava no banco (019, itens 4 e 6).
