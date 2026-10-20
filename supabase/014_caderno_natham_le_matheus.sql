begin;
-- Item 193-banco (rodada 193-198, 22/10). Projeto Tarefas - Grupo You (uruhjlurcxpjhhgvuzwt). NUNCA no CRM. Idempotente. Depende do 002 e do 006.
--
-- As anotações da página da direita do caderno ("Anotações do dia" e "Não esquecer") já têm tabela desde o 001:
--   anotacoes_dia (dono_id, dia, texto)  = "Anotações do dia"  (campo 'notas' da tela)
--   nao_esquecer  (dono_id, dia, texto)  = "Não esquecer"      (campo 'lembrar' da tela)
-- chave primária (dono_id, dia): um texto por pessoa por dia, então a tela grava com upsert onConflict 'dono_id,dia'.
-- Em produção as duas estão vazias (conferido 22/10): nada a migrar no banco; o que está no navegador sobe pela tela.
--
-- Hoje a trava deixa SÓ o dono ler e escrever. Aqui entra uma regra a mais, só de LEITURA:
-- o Natham lê as do Matheus (mesma função private.natham_le_matheus do 006). Analogia: o Natham ganha a chave de LEITURA da
-- gaveta do Matheus; a gaveta do Natham continua com uma chave só. Matheus nunca lê as do Natham; ninguém escreve no caderno do outro.
-- As duas políticas se somam (ou é o dono, ou é o Natham lendo o Matheus).
drop policy if exists anotacoes_natham_le_matheus on public.anotacoes_dia;
create policy anotacoes_natham_le_matheus on public.anotacoes_dia for select to authenticated
  using ((select private.natham_le_matheus(dono_id)));
drop policy if exists nao_esquecer_natham_le_matheus on public.nao_esquecer;
create policy nao_esquecer_natham_le_matheus on public.nao_esquecer for select to authenticated
  using ((select private.natham_le_matheus(dono_id)));

-- Agenda do Matheus que "não aparece" para o Natham: NÃO é trava. agenda_acesso já dá natham -> matheus e a leitura
-- (agenda_copias_le) está certa. Em produção agenda_copias tem matheus = 1 evento, natham = 106, contato = 4 (22/10):
-- o n8n quase não trouxe a agenda do Matheus. Conferir o fluxo dessa fonte no n8n (fonte 'matheus').
commit;
