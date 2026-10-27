-- 315 · O calendário de postagens passa a usar a mesma data do Mapa (quandoDe em src/lib/atraso.ts): card de Postagem pela data
-- programada (postar_em), senão o início; só sem nenhuma das duas, o momento em que foi para Postado. Antes valia postado_em primeiro.
-- APLICADO em 27/10/2026 pelo Claude com ok do Natham (migrations postagens_calendario_data_do_mapa e postagens_quando_do_post_grant).

create or replace function private.quando_do_post(p_tipo text, p_postar_em text, p_inicio text, p_postado_em timestamptz)
returns timestamp language sql immutable set search_path to '' as $$
  select coalesce(
    case when p_tipo = 'postagem' and p_postar_em ~ '^\d{4}-\d{2}-\d{2}' then left(p_postar_em, 16)::timestamp end,
    case when p_inicio ~ '^\d{4}-\d{2}-\d{2}' then left(p_inicio, 16)::timestamp end,
    p_postado_em at time zone 'America/Sao_Paulo')
$$;
revoke all on function private.quando_do_post(text, text, text, timestamptz) from public, anon;
grant execute on function private.quando_do_post(text, text, text, timestamptz) to authenticated;

create or replace function public.postagens_calendario(p_de date, p_ate date)
 returns table(planejada_id uuid, dia date, hora text, empresa_id text, formato text, redes text[], responsavel text, titulo text, repete text, estado text, card_id uuid, card_titulo text)
 language sql stable set search_path to ''
as $function$
  with plano as (
    select o.*, row_number() over (partition by o.empresa_id, o.formato, o.dia order by o.hora, o.planejada_id) n
    from private.ocorrencias(p_de, p_ate) o
  ),
  posts as (
    select x.*, x.quando::date as dia, row_number() over (partition by x.empresa_id, x.formato, x.quando::date order by x.quando, x.id) n
    from (select t.id, t.titulo, t.empresa_id, t.formato, t.responsavel_id,
            private.quando_do_post(t.tipo, t.postar_em, t.inicio, t.postado_em) quando
          from public.tarefas t where t.etapa = 'postado' and t.empresa_id is not null) x
    where x.quando::date between p_de and p_ate
  )
  select p.planejada_id, p.dia, p.hora, p.empresa_id, p.formato, p.redes, (select s.slug from public.pessoas s where s.id = p.responsavel_id),
    p.titulo, p.repete,
    case when r.id is not null then 'feita' when p.dia < (now() at time zone 'America/Sao_Paulo')::date then 'faltou' else 'planejada' end,
    r.id, r.titulo
  from plano p left join posts r on r.empresa_id = p.empresa_id and r.formato = p.formato and r.dia = p.dia and r.n = p.n
  union all
  select null, r.dia, to_char(r.quando, 'HH24:MI'), r.empresa_id, r.formato, null, (select s.slug from public.pessoas s where s.id = r.responsavel_id),
    null, null, 'extra', r.id, r.titulo
  from posts r
  where r.formato is null or not exists (select 1 from plano p where p.empresa_id = r.empresa_id and p.formato = r.formato and p.dia = r.dia and p.n = r.n)
  order by 2, 3
$function$;

create or replace function private.tarefas_risca_pauta()
 returns trigger language plpgsql security definer set search_path to ''
as $function$
declare v_dia date;
begin
  begin
    v_dia := private.quando_do_post(new.tipo, new.postar_em, new.inicio, new.postado_em)::date;
    perform private.riscar_postagens(new.empresa_id, v_dia, v_dia);
  exception when others then
    raise warning 'tarefas_risca_pauta: % (tarefa %)', sqlerrm, new.id;  -- ponytail: avisa e segue; o relógio de 5 em 5 minutos risca depois
  end;
  return null;
end $function$;
