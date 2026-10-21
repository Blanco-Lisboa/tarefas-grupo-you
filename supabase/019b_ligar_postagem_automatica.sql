-- 019b · LIGA a postagem automática (item 236). Cole SÓ DEPOIS de: (1) o 019 colado, (2) a função postar-meta IMPLANTADA (com POSTAR_DE_VERDADE=nao para o primeiro teste)
-- e (3) a interface nova publicada. Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente (pode colar de novo).
-- O que faz: liga o interruptor; cada card Aprovado de Postagem com hora ganha o alarme (hora já vencida ou a ≤ 1 minuto TOCA JÁ, nenhum fica sem relógio);
-- e tira o relógio de todo minuto do 015 (o Natham não quer execução à toa).
-- Para desfazer: update private.interruptores set ligado = false where nome = 'postagem_automatica';  e rode  select cron.schedule('tarefas_postar_vencidos', '* * * * *', $c$select private.postar_vencidos()$c$);
begin;
do $$ begin
  if to_regprocedure('private.armar_alarme(text,uuid,timestamptz)') is null or to_regclass('private.interruptores') is null then
    raise exception '019b NAO APLICADO: cole o 019 (v2) antes.';
  end if;
end $$;
update private.interruptores set ligado = true where nome = 'postagem_automatica';
do $$ declare r record; begin
  for r in select id, postar_em from public.tarefas where etapa = 'aprovado' and tipo = 'postagem' and postar_em is not null loop
    -- hora no passado: toca agora (chama a função); no futuro (inclusive dentro do próximo minuto): arma (ou refaz) o alarme pelo minuto cheio seguinte
    perform private.armar_alarme('postar', r.id, r.postar_em::timestamp at time zone 'America/Sao_Paulo');
  end loop;
end $$;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'tarefas_postar_vencidos') then perform cron.unschedule('tarefas_postar_vencidos'); end if;
end $$;
commit;
