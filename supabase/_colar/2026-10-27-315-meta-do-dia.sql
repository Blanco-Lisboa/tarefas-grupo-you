-- 315 · Meta do dia: postagem planejada SEM hora (hora nula). Aparece só no calendário (não gera tarefa no Caderno) e é conferida
-- como as outras (mesma empresa + formato + dia). Na conferência, as com hora casam primeiro (order by hora deixa a nula por último).
-- APLICADO em 27/10/2026 pelo Claude com ok do Natham (migration postagens_meta_sem_hora).
-- Pode rodar duas vezes: as trocas de texto não acham nada na segunda e o "do" confere que a função ficou certa.
alter table public.postagens_planejadas alter column hora drop not null;

do $$
declare v_def text;
begin
  -- salvar_planejada: hora vazia ("") vira nula (o check de formato da hora só vale quando há hora)
  select pg_get_functiondef('public.salvar_planejada(jsonb, text, date)'::regprocedure) into v_def;
  v_def := replace(v_def, $x$v_redes, p->>'hora', v_resp$x$, $x$v_redes, nullif(p->>'hora', ''), v_resp$x$);
  v_def := replace(v_def, $x$hora = p->>'hora',$x$, $x$hora = nullif(p->>'hora', ''),$x$);
  if v_def like $x$%v_redes, p->>'hora'%$x$ or v_def like $x$%hora = p->>'hora',%$x$ then raise exception 'salvar_planejada: troca da hora incompleta'; end if;
  execute v_def;

  -- gerar_tarefas_postagens: meta (sem hora) não vira tarefa no Caderno
  select pg_get_functiondef('private.gerar_tarefas_postagens(integer, uuid)'::regprocedure) into v_def;
  if v_def not like '%x.hora is not null%' then
    if v_def not like '%where p_planejada is null or x.planejada_id = p_planejada loop%' then raise exception 'gerar_tarefas_postagens mudou; revisar'; end if;
    v_def := replace(v_def, 'where p_planejada is null or x.planejada_id = p_planejada loop',
      'where (p_planejada is null or x.planejada_id = p_planejada) and x.hora is not null loop  -- meta do dia: só no calendário');
    execute v_def;
  end if;
end $$;
