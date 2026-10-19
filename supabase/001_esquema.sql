-- Etapa 1 (19/10/2026): tabelas da fase banco+login. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM.
-- Idempotente. As travas (RLS) vêm em 002.
create schema if not exists private;

create table if not exists public.pessoas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('natham','matheus','adrian','lucas')),
  nome text not null,
  foto text,
  email text unique,
  user_id uuid unique references auth.users (id) on delete set null
);

create table if not exists public.empresas (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  sigla text not null,
  cor jsonb, -- {g,r,c,o} como em src/lib/cores-empresa.ts; nulo = a tela escolhe
  ordem int not null default 0
);

create table if not exists public.tags (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  cor text not null check (cor ~ '^etiqueta-([1-9]|1[0-6])$'),
  aprovacao boolean not null default false
);

create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null check (tipo in ('ideia','roteiro','gravacao','edicao','postagem','reuniao','outro')),
  empresa_id text references public.empresas (id) on delete restrict, -- nulo = sem empresa (privada)
  rede text check (rede in ('instagram','tiktok','youtube','kwai')),
  etapa text check (etapa in ('roteiro','gravacao','edicao','analise','aprovado','postado')), -- nulo = tarefa do caderno
  responsavel_id uuid not null references public.pessoas (id),
  inicio text check (inicio ~ '^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$'), -- data/hora local sem fuso, como no app
  fim text check (fim ~ '^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$'),
  dia_inteiro boolean not null default false,
  cor text not null default 'etiqueta-5' check (cor ~ '^etiqueta-([1-9]|1[0-6])$'),
  concluida boolean not null default false,
  objetivo text,
  notas text,
  links jsonb not null default '[]'::jsonb,
  aprovador text,
  dono_id uuid not null references public.pessoas (id),
  criado_por uuid not null references public.pessoas (id),
  enviada_por uuid references public.pessoas (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tarefas_dono_idx on public.tarefas (dono_id);
create index if not exists tarefas_enviada_idx on public.tarefas (enviada_por) where enviada_por is not null;
create index if not exists tarefas_empresa_idx on public.tarefas (empresa_id);
create index if not exists tarefas_inicio_idx on public.tarefas (inicio);

create table if not exists public.tarefa_tags (
  tarefa_id uuid not null references public.tarefas (id) on delete cascade,
  tag_id text not null references public.tags (id) on delete cascade,
  primary key (tarefa_id, tag_id)
);
create index if not exists tarefa_tags_tag_idx on public.tarefa_tags (tag_id);

create table if not exists public.anotacoes_dia (
  dono_id uuid not null references public.pessoas (id) on delete cascade,
  dia date not null,
  texto text not null default '' check (char_length(texto) <= 4000),
  primary key (dono_id, dia)
);

create table if not exists public.nao_esquecer (
  dono_id uuid not null references public.pessoas (id) on delete cascade,
  dia date not null,
  texto text not null default '' check (char_length(texto) <= 4000),
  primary key (dono_id, dia)
);

create table if not exists public.pastas (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas (id) on delete cascade,
  slug text, -- pastas de fábrica: post, carrossel, video, adrian, story, ideias
  nome text not null,
  tipo text check (tipo in ('post','carrossel','video','story')),
  vazio text,
  ideias boolean not null default false,
  ordem int not null default 0,
  unique (empresa_id, slug)
);

create table if not exists public.pecas (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas (id) on delete cascade,
  tipo text not null check (tipo in ('post','carrossel','video','story')),
  titulo text not null,
  meta text,
  link text,
  notas text,
  pasta_id uuid references public.pastas (id) on delete set null,
  criado_por uuid references public.pessoas (id),
  created_at timestamptz not null default now()
);
create index if not exists pecas_empresa_idx on public.pecas (empresa_id);

create table if not exists public.ideias (
  id uuid primary key default gen_random_uuid(),
  empresa_id text not null references public.empresas (id) on delete cascade,
  categoria text not null,
  titulo text not null,
  texto text not null,
  link text
);
create index if not exists ideias_empresa_idx on public.ideias (empresa_id);

create table if not exists public.arquivos (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid references public.tarefas (id) on delete cascade,
  peca_id uuid references public.pecas (id) on delete cascade,
  caminho text not null unique, -- caminho no bucket "arquivos": tarefas/<id>/<arquivo> ou pecas/<id>/<arquivo>
  nome text not null,
  tipo text not null check (tipo in ('imagem','video')),
  tamanho bigint not null check (tamanho >= 0),
  criado_por uuid references public.pessoas (id),
  created_at timestamptz not null default now(),
  check ((tarefa_id is not null)::int + (peca_id is not null)::int = 1)
);
create index if not exists arquivos_tarefa_idx on public.arquivos (tarefa_id);
create index if not exists arquivos_peca_idx on public.arquivos (peca_id);

create table if not exists public.agenda_eventos (
  id uuid primary key default gen_random_uuid(),
  fonte text not null check (fonte in ('natham','matheus','adrian','lucas')),
  google_id text not null,
  titulo text not null,
  inicio timestamptz not null,
  fim timestamptz,
  dia_inteiro boolean not null default false,
  local text,
  unique (fonte, google_id)
);
create index if not exists agenda_eventos_inicio_idx on public.agenda_eventos (fonte, inicio);

create table if not exists public.agenda_acesso (
  pessoa_id uuid not null references public.pessoas (id) on delete cascade,
  fonte text not null check (fonte in ('natham','matheus','adrian','lucas')),
  primary key (pessoa_id, fonte)
);
