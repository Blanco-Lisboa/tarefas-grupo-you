-- Prova do 028 (item 274) por perfil. Roda no Postgres local de supabase/prova_local (sh supabase/prova_local/rodar.sh), depois:
--   create publication supabase_realtime;  e o 028.   Uso: docker exec -i pg236 psql -U postgres -v ON_ERROR_STOP=1 -q -f - < este arquivo
-- Cenário: Natham e Matheus têm um card pessoal cada; Matheus anota no caderno; compromisso só da agenda do Natham; vínculo do Google num card do Natham.
insert into auth.users(id,email) select gen_random_uuid(), slug||'@t.com' from public.pessoas on conflict do nothing;
update public.pessoas p set user_id=u.id from auth.users u where u.email=p.slug||'@t.com';
insert into public.agenda_acesso(pessoa_id,fonte) select id,'natham' from public.pessoas where slug='natham' on conflict do nothing;
insert into public.agenda_acesso(pessoa_id,fonte) select id,'matheus' from public.pessoas where slug in ('matheus','natham') on conflict do nothing;
truncate public.aviso_mudanca;
insert into public.tarefas(id,titulo,tipo,dono_id,criado_por,responsavel_id,dia_inteiro,cor) select ('00000000-0000-4000-8000-00000000000'||(case slug when 'natham' then 1 else 2 end)::text)::uuid,'priv-'||slug,'outro',id,id,id,false,'etiqueta-5' from public.pessoas where slug in ('natham','matheus');
insert into public.anotacoes_dia(dono_id,dia,texto) select id,current_date,'x' from public.pessoas where slug='matheus';
insert into public.agenda_copias(chave,fonte,google_id,titulo,inicio) values ('k1','natham','g1','seg','2026-10-22');
insert into public.agenda_saida_vinculo(tarefa_id,pessoa_id,calendar_id,google_event_id) select '00000000-0000-4000-8000-000000000001'::uuid,id,'c','e' from public.pessoas where slug='natham';
delete from public.tarefas where titulo='priv-natham' and false; -- (exclusão de card privado: gera só aviso por pessoa, nunca evento DELETE)
\echo '== linhas no total (visão do dono do banco)'
select count(*) from public.aviso_mudanca;
select set_config('request.jwt.claims', json_build_object('sub',(select user_id from public.pessoas where slug='natham'))::text, false) \gset
\echo '== NATHAM lê'
set role authenticated; select split_part(chave,':',1) as tipo, case when chave !~ ':' then '-' when split_part(chave,':',1) = 'agenda' then split_part(chave,':',2) else (select slug from public.pessoas where id = split_part(chave,':',2)::uuid) end as de_quem from public.aviso_mudanca order by 1,2; reset role;
select set_config('request.jwt.claims', json_build_object('sub',(select user_id from public.pessoas where slug='matheus'))::text, false) \gset
\echo '== MATHEUS lê'
set role authenticated; select split_part(chave,':',1) as tipo, case when chave !~ ':' then '-' when split_part(chave,':',1) = 'agenda' then split_part(chave,':',2) else (select slug from public.pessoas where id = split_part(chave,':',2)::uuid) end as de_quem from public.aviso_mudanca order by 1,2; reset role;
select set_config('request.jwt.claims', json_build_object('sub',(select user_id from public.pessoas where slug='adrian'))::text, false) \gset
\echo '== ADRIAN lê'
set role authenticated; select split_part(chave,':',1) as tipo, case when chave !~ ':' then '-' when split_part(chave,':',1) = 'agenda' then split_part(chave,':',2) else (select slug from public.pessoas where id = split_part(chave,':',2)::uuid) end as de_quem from public.aviso_mudanca order by 1,2;
\echo '== ADRIAN tenta apagar/escrever aviso e ler a tabela do vínculo (todos devem falhar)'
\set ON_ERROR_STOP off
delete from public.aviso_mudanca; insert into public.aviso_mudanca(chave) values ('esteira'); select * from public.agenda_saida_vinculo;
