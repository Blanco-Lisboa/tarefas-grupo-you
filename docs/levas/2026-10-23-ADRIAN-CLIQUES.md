# Adrian entrar no Tarefas — 2 passos, um clique por vez (23/10/2026)

Projeto do Supabase: **Tarefas - Grupo You** (NÃO o YOU-CRM).

Conferido por SELECT (só leitura): o 027 e o 028 **já estão no banco** e a conta do Adrian já está ligada ao perfil (bloco 030).
O 026 **cola limpo hoje**: o que ele repete (e-mail, login, aprovar) vira "nada a fazer"; o que ele traz de novo é
"trocar Quem aprova" e "ler o caderno do Matheus" para o Adrian, e as 3 agendas dele em `agenda_acesso` (hoje 0).
Ordem: só o 026 falta (027 e 028 já foram). Pode colar de novo sem estragar nada.

## Passo 1 — colar o 026
1. Abra o arquivo no Bloco de Notas: `C:\Users\Natham Monteiro\Desktop\Sistemas-Grupo-You\grade-conteudo\supabase\026_adrian_vira_usuario.sql`
2. Selecione tudo (Ctrl+A) e copie (Ctrl+C).
3. Abra o painel do Supabase, entre no projeto **Tarefas - Grupo You**.
4. Menu da esquerda: **SQL Editor**.
5. Clique em **New query** (ou "+").
6. Cole (Ctrl+V).
7. Clique no botão verde **Run**.
8. Esperado: "Success. No rows returned". Se aparecer erro vermelho, não tente de novo: me mande a mensagem.

> O que isso dá ao Adrian: aprovar/programar como você e o Matheus, ler o caderno do Matheus e ver as agendas do Matheus e as dele. Nunca o seu caderno nem a sua agenda. Se não quiser isso, pule o Passo 1: ele entra igual ao Matheus (só o caderno dele e as telas compartilhadas).

## Passo 2 — reenviar o convite
O convite de 22/10 nunca foi aberto e já deve ter vencido.
1. No mesmo projeto, menu da esquerda: **Authentication**.
2. Clique em **Users**.
3. Ache a linha **adrian@youcontabilidade.com** (estado: "Waiting for verification").
4. Clique nos **três pontinhos (⋯)** no fim da linha.
5. Clique em **Send invitation** (se não existir, use **Send magic link**; se nenhum aparecer: **Delete user** e depois **Invite user** com o mesmo e-mail — o perfil religa sozinho pelo gatilho).
6. Avise o Adrian para abrir o e-mail (olhar o spam) e definir a senha no link. O envio do Supabase tem limite de cerca de 2 e-mails por hora: faça uma vez só.

## Como saber que deu certo
Peça ao Adrian para entrar. Ele deve cair no Tarefas com o nome dele, sem tela vazia nem erro.
