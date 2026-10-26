-- Item 312: a Tu Ecom vira empresa do Tarefas, como a You e a Beec.
-- Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. NÃO aplicado: o Natham cola no SQL Editor.
-- Antes de colar, o app já funciona (a Tu Ecom só some do filtro e das Pastas). Depois de colar, ela aparece como as outras.
-- Analogia: é o cadastro da empresa no "livro de empresas" do banco, mais as 4 pastas de fábrica (Posts, Carrosséis, Vídeos, Stories) e a de Ideias, iguais às da Beec.
-- A cor e a logo NÃO vêm daqui: moram no código (src/lib/cores-empresa.ts e public/marca/empresas/tu-ecom.png).
begin;

insert into public.empresas (id, nome, sigla, cor, ordem) values
  ('tu-ecom', 'Tu Ecom', 'TE', '{"g":"#0B241B","r":"#0F3D2E","c":"#1E5A45","o":"#A9C2B5"}', 3)
on conflict (id) do nothing;

-- Pastas de fábrica (como as da Beec em supabase/003_semente.sql). Sem a "Adrian - Aprovar": essa é só da You.
insert into public.pastas (empresa_id, slug, nome, tipo, vazio, ideias, ordem)
select e.id, p.slug, p.nome, p.tipo, p.vazio, p.ideias, p.ordem
from public.empresas e
join (values
  ('post', 'Posts', 'post', null, false, 1),
  ('carrossel', 'Carrosséis', 'carrossel', null, false, 2),
  ('video', 'Vídeos', 'video', null, false, 3),
  ('story', 'Stories', 'story', null, false, 4),
  ('ideias', 'Ideias de conteúdo', null, null, true, 5)
) as p (slug, nome, tipo, vazio, ideias, ordem)
  on true
where e.id = 'tu-ecom'
on conflict (empresa_id, slug) do nothing;

commit;

-- Conferência: a empresa tem que aparecer com 5 pastas de fábrica (e 'ideias' por último).
select e.id, e.nome, e.sigla, e.ordem, count(p.id) as pastas_de_fabrica
from public.empresas e
left join public.pastas p on p.empresa_id = e.id
where e.id = 'tu-ecom'
group by e.id, e.nome, e.sigla, e.ordem;
