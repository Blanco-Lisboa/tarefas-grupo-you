-- Semente: 4 pessoas, 2 empresas, 1 tag, pastas de fábrica, acesso às agendas. Sem dados de exemplo.
insert into public.pessoas (slug, nome, foto, email) values
  ('natham', 'Natham', '/pessoas/natham.png', 'natham.monteiro@youcontabilidade.com'),
  ('matheus', 'Matheus', '/pessoas/matheus.png', 'matheus.germano@assessoriabeec.com.br'),
  ('adrian', 'Adrian', null, null),
  ('lucas', 'Lucas', null, null)
on conflict (slug) do nothing;

insert into public.empresas (id, nome, sigla, cor, ordem) values
  ('beec', 'Beec', 'BE', '{"g":"#470E96","r":"#6E18E5","c":"#7319F1","o":"#CDB4F8"}', 1),
  ('you', 'You', 'YO', '{"g":"#E0430A","r":"#FE4901","c":"#FF9200","o":"#FFE0CC"}', 2)
on conflict (id) do nothing;

insert into public.tags (id, nome, cor, aprovacao) values
  ('tag-esperando-aprovacao', 'Esperando aprovação', 'etiqueta-1', true)
on conflict (id) do nothing;

-- Pastas de fábrica (como em src/lib/dados/pastas.ts): "Adrian - Aprovar" só na You; Ideias sempre no fim.
insert into public.pastas (empresa_id, slug, nome, tipo, vazio, ideias, ordem)
select e.id, p.slug, p.nome, p.tipo, p.vazio, p.ideias, p.ordem
from public.empresas e
join (values
  ('post', 'Posts', 'post', null, false, 1),
  ('carrossel', 'Carrosséis', 'carrossel', null, false, 2),
  ('video', 'Vídeos', 'video', null, false, 3),
  ('adrian', 'Adrian - Aprovar', 'video', 'Nenhum vídeo esperando o Adrian aprovar.', false, 4),
  ('story', 'Stories', 'story', null, false, 5),
  ('ideias', 'Ideias de conteúdo', null, null, true, 6)
) as p (slug, nome, tipo, vazio, ideias, ordem)
  on (e.id = 'you' or p.slug <> 'adrian')
where e.id in ('beec', 'you')
on conflict (empresa_id, slug) do nothing;

-- Quem vê qual agenda. Natham: as 4. Matheus: a dele, Adrian e Lucas (nunca a do Natham).
insert into public.agenda_acesso (pessoa_id, fonte)
select p.id, f.fonte
from public.pessoas p
join (values
  ('natham', 'natham'), ('natham', 'matheus'), ('natham', 'adrian'), ('natham', 'lucas'),
  ('matheus', 'matheus'), ('matheus', 'adrian'), ('matheus', 'lucas')
) as f (quem, fonte) on f.quem = p.slug
on conflict do nothing;

-- Se o usuário já existia antes da semente, liga agora.
update public.pessoas p set user_id = u.id
from auth.users u
where lower(p.email) = lower(u.email) and p.user_id is null;
