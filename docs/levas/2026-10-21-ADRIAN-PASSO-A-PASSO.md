# Passo a passo: o Adrian vira usuário (item 266)

Para: Natham. Um passo por linha. Ordem: **criar a conta, colar o SQL, eu confiro, só então publicar.** Se aparecer algo diferente do "Você deve ver", PARE e mande o print (sem senha na imagem).

Palavras: **Supabase** é onde ficam as tarefas (projeto **Tarefas - Grupo You**, nunca o do CRM). **SQL** é uma instrução para o banco. **Auto Confirm** pula o e-mail de confirmação: a conta já nasce pronta.

## Bloco 1 · Criar a conta (Supabase)

1. Abra https://supabase.com/dashboard e entre.
2. Clique no projeto **Tarefas - Grupo You**.
3. No menu da esquerda, clique em **Authentication**.
4. Dentro dele, clique em **Users**.
5. Clique no botão verde **Add user**.
6. Clique em **Create new user**.
7. Em **Email address**, digite `adrian@youcontabilidade.com`.
8. Em **Password**, digite uma senha que só você e o Adrian vão saber (a senha não vai no chat nem em arquivo).
9. Marque a caixa **Auto Confirm User**.
10. Clique em **Create user**.
11. Você deve ver: `adrian@youcontabilidade.com` na lista de **Users**. Responda: "conta criada".

## Bloco 2 · Colar o SQL

12. No menu da esquerda, clique em **SQL Editor**.
13. Clique em **New query**.
14. Abra o arquivo `grade-conteudo\supabase\_colar\026-adrian-vira-usuario.sql`, selecione tudo (Ctrl+A) e copie (Ctrl+C).
15. Clique dentro da janela do SQL Editor e cole (Ctrl+V).
16. Clique no botão verde **Run**.
17. Você deve ver: **Success. No rows returned**. Responda: "SQL colado".

## Bloco 3 · Eu confiro (você não faz nada)

18. Eu rodo só consultas de leitura: o Adrian está ligado ao login, as três funções aceitam o Adrian, e ele vê a agenda do Matheus e as dele, nunca a sua.
19. Eu respondo "conferido, pode publicar".

## Bloco 4 · Publicar

20. Só depois do "conferido, pode publicar", publicamos pelo script de sempre (`2026-10-21-PUBLICAR.md`).
21. Depois de publicar, o Adrian entra com `adrian@youcontabilidade.com` e a senha do passo 8 e confere: Esteira, **Aprovar** e **Consertar** num card, e o seletor **Caderno de** com Matheus.

## Se der erro

- No passo 10 aparecer "email already registered": a conta já existe. Pule para o Bloco 2.
- No passo 16 aparecer erro vermelho: PARE, mande o print.
- Nada disso muda o que o Matheus e você veem hoje.
