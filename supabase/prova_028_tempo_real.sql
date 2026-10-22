-- Prova do 028 (item 274), no Postgres local de supabase/prova_local (rodar.sh) + 028 + 'create publication supabase_realtime'.
-- Esperado: natham vê agenda:*, caderno:*, cartao:*; matheus só caderno:* e cartao:* dele; adrian nada. Nenhuma linha é apagada (sem DELETE no Realtime).
insert into auth.users(id,email) select gen_random_uuid(), slug||'@t.com' from public.pessoas on conflict do nothing;
update public.pessoas p set user_id=u.id from auth.users u where u.email=p.slug||'@t.com';
insert into public.agenda_acesso(pessoa_id,fonte) select id,'natham' from public.pessoas where slug='natham' on conflict do nothing;
insert into public.agenda_acesso(pessoa_id,fonte) select id,'matheus' from public.pessoas where slug in ('matheus','natham') on conflict do nothing;
truncate public.aviso_mudanca;
insert into public.tarefas(titulo,tipo,dono_id,criado_por,responsavel_id,dia_inteiro,cor) select 'priv','outro',id,id,id,false,'etiqueta-5' from public.pessoas where slug='natham';
insert into public.tarefas(titulo,tipo,dono_id,criado_por,responsavel_id,dia_inteiro,cor) select 'priv','outro',id,id,id,false,'etiqueta-5' from public.pessoas where slug='matheus';
insert into public.anotacoes_dia(dono_id,dia,texto) select id,current_date,'x' from public.pessoas where slug='matheus';
insert into public.agenda_copias(chave,fonte,google_id,titulo,inicio) values ('k1','natham','g1','seg','2026-10-22');
delete from public.tarefas where titulo='priv';
select 'TOTAL', count(*) from public.aviso_mudanca;
