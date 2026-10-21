# Passo a passo: ligar o Google Drive (antes de publicar o site novo)

Para: Natham. Cada passo é UM clique ou UMA colagem. Em cada passo está o nome exato do botão, o que você deve ver e o que me responder.
Regra de ouro: se aparecer algo diferente do "Você deve ver", PARE e mande o print (sem incluir senha, chave ou segredo na imagem).

## Palavras que aparecem aqui (tradução)

- **Google Cloud**: o "painel de obras" do Google, onde se pede permissão para o Tarefas mexer no seu Drive.
- **Tela de consentimento**: a janela que o Google mostra perguntando "você deixa o Tarefas criar pastas no seu Drive?".
- **Credencial (ID do cliente e Chave secreta)**: o "crachá e a senha do crachá" que o Tarefas usa para falar com o Google. Quem tem os dois fala em nome do app. Por isso eles NUNCA vão para o chat, nem em print.
- **Supabase**: onde ficam guardadas as tarefas. O nosso projeto se chama **Tarefas - Grupo You** (código `uruhjlurcxpjhhgvuzwt`). **Nunca** o projeto do CRM.
- **Segredo (Secret)**: um "cofre" do Supabase para guardar crachás e senhas. Você digita ou cola; ninguém vê o valor depois.
- **Função**: um pedaço de programa que mora no servidor e faz o trabalho pesado (falar com o Drive, falar com a Meta). Precisa ser "implantada" (enviada ao servidor) uma vez.
- **Cópia limpa**: uma cópia congelada do projeto no último ponto que a revisão liberou, para publicar só o que está pronto (lição de 23/10).

## ANTES DE COMEÇAR (confira esta lista; se faltar algo, me avise e eu resolvo antes)

1. **Conta Google certa**: você precisa estar entrando com a conta **nathamsud@gmail.com** (a dos 2 TB) neste navegador. Não use a conta da empresa.
2. **E-mail Google do Matheus**: ainda NÃO temos. Preciso dele para compartilhar a pasta "Tarefas · Conteúdos" com ele. Sem isso a pasta fica só sua. Me mande o e-mail antes do Bloco B.
3. **Acesso ao Supabase**: você deve conseguir entrar em https://supabase.com/dashboard e ver o projeto **Tarefas - Grupo You**. Se pedir para criar conta nova ou não achar o projeto, pare e me avise.
4. **Chave da Meta já no cofre**: o estudo diz que o segredo `META_PUBLISHER_TOKEN` já está lá. O Bloco B só confere se o NOME aparece (não mostra o valor).
5. **Cópia limpa pronta**: quem prepara é um recruta, não você. Ele cria a pasta `Sistemas-Grupo-You\.publicar-drive` (cópia do último commit que a Lupa liberou, já ligada à Vercel) e me diz o número do commit. Sem ela, os Blocos C e F não começam. Eu te aviso quando estiver pronta.
6. **Revisão da Lupa**: a Re-revisão 2 liberou colar o 019 (Bloco D), mas NÃO liberou publicar o site (Bloco F) antes de a Lupa conferir o commit final. Eu te digo "pode publicar" antes do Bloco F.
7. **Combinado até o Bloco D terminar**: ninguém anexa VÍDEO nos cards (vídeo guardado no Supabase faz o 019 parar sozinho).
8. **Terminal normal do Windows**: o Bloco C usa o "Windows PowerShell" comum (não o Claude Code), porque lá você digita um código de acesso que nenhum agente deve ver. Ele já vem no Windows.
9. **Horário**: faça o Bloco D (colar o 019) quando nenhum card Aprovado estiver para postar nos próximos 10 minutos. A consulta do passo D1 mostra se há algum.

---

## BLOCO A · Google Cloud (permissão do Google): 11 passos

Abra https://console.cloud.google.com em uma aba. (Mantenha também uma segunda aba no Supabase aberta: no final deste bloco você cola o crachá lá.)

**A1. Entrar com a conta certa.** Canto superior direito: confirme que a foto/letra é da conta **nathamsud@gmail.com**. Se aparecer "Aceitar termos de serviço", marque e clique **Concordar e continuar**.
Você deve ver: o painel do Google Cloud. Responda: "A1 ok".

**A2. Criar o projeto.** Clique no seletor de projetos (a caixa no topo, ao lado do logo "Google Cloud") > **Novo projeto**. Em **Nome do projeto** escreva `Tarefas Grupo You`. Clique **Criar**. Espere o aviso de "projeto criado" (sino no topo) e clique **Selecionar projeto**.
Você deve ver: o nome "Tarefas Grupo You" no topo. Responda: "A2 ok".

**A3. Ligar a API do Drive.** Menu lateral (três tracinhos) > **APIs e serviços** > **Biblioteca**. Na busca digite `Google Drive API`, clique no cartão **Google Drive API** e depois no botão azul **Ativar**.
Você deve ver: a página "API ativada" com gráficos. Responda: "A3 ok".

**A4. Tela de consentimento, parte 1.** Menu > **APIs e serviços** > **Tela de permissão OAuth**. Se aparecer "A plataforma Google Auth ainda não foi configurada", clique **Vamos começar**. Preencha **Nome do app**: `Tarefas Grupo You`; **E-mail para suporte do usuário**: escolha `nathamsud@gmail.com`; clique **Próxima**.
Você deve ver: a etapa "Público-alvo". Responda: "A4 ok".

**A5. Tela de consentimento, parte 2.** Em **Público-alvo** marque **Externo** > **Próxima**. Em **Dados de contato** escreva `nathamsud@gmail.com` > **Próxima**. Marque **Concordo com a Política de dados do usuário dos serviços de API do Google** > **Continuar** > **Criar**.
Você deve ver: a página "Visão geral" da plataforma de autenticação. Responda: "A5 ok".

**A6. Dizer o que o app pode fazer (uma única permissão pequena).** Menu da esquerda da plataforma: **Acesso a dados** > **Adicionar ou remover escopos**. Na caixa **Filtro** digite `drive.file`. Marque a linha cujo escopo termina em `/auth/drive.file` (descrição: "Ver, editar, criar e excluir apenas os arquivos do Google Drive específicos que você usa com este app"). Clique **Atualizar** (no fim do painel) e depois **Salvar**.
Por quê só esta: ela só deixa o Tarefas mexer nas pastas e arquivos que ELE mesmo criar. Não enxerga o resto do seu Drive, e por ser uma permissão pequena o Google não exige análise do app.
Você deve ver: "drive.file" listado em "Seus escopos não confidenciais". Responda: "A6 ok".

**A7. Publicar em Produção (importante).** Menu da esquerda: **Público-alvo** > botão **Publicar app** > **Confirmar**.
Por quê: em "Teste" o Google apaga o acesso a cada 7 dias e o Drive pararia sozinho.
Você deve ver: **Status de publicação: Em produção**. Responda: "A7 ok".

**A8. Criar o crachá, parte 1.** Menu da esquerda: **Clientes** > **Criar cliente**. Em **Tipo de aplicativo** escolha **Aplicativo da Web**. Em **Nome** escreva `Tarefas Drive`.
Você deve ver: a seção "URIs de redirecionamento autorizados". Responda: "A8 ok".

**A9. Endereço de volta (copie EXATAMENTE).** Em **URIs de redirecionamento autorizados** clique **+ Adicionar URI** e cole exatamente esta linha (sem espaço no fim):
`https://uruhjlurcxpjhhgvuzwt.supabase.co/functions/v1/google-autorizar`
Deixe **Origens JavaScript autorizadas** VAZIO (não precisa). Clique **Criar**.
Você deve ver: uma janela "Cliente OAuth criado" com **ID do cliente** e **Chave secreta do cliente**. **NÃO feche esta janela nem tire print dela.** Responda: "A9 ok" (só isso, sem valores).

**A10. Guardar o ID do cliente no cofre.** Abra a aba do Supabase: https://supabase.com/dashboard > projeto **Tarefas - Grupo You** (confira o nome no topo: não pode ser o do CRM) > menu da esquerda **Edge Functions** > aba **Secrets** > **Add new secret** (ou "Add another"). Em **Name** escreva exatamente `GOOGLE_CLIENT_ID`. Em **Value**, volte à janela do Google, clique no ícone de copiar ao lado de **ID do cliente** e cole aqui. Clique **Save** (Salvar).
Você deve ver: `GOOGLE_CLIENT_ID` na lista, com o valor escondido. Responda: "A10 ok".

**A11. Guardar a Chave secreta no cofre.** Mesma tela do Supabase: **Add new secret**. **Name**: `GOOGLE_CLIENT_SECRET`. **Value**: volte ao Google, clique no ícone de copiar ao lado de **Chave secreta do cliente**, cole aqui. **Save**. Só agora feche a janela do Google (**OK**).
Você deve ver: `GOOGLE_CLIENT_SECRET` na lista. Responda: "A11 ok".

**Recruta confere depois do Bloco A** (leitura, sem ver valores): na lista de Secrets do Supabase aparecem os NOMES `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`; no Google Cloud o projeto "Tarefas Grupo You" está **Em produção** com o escopo `drive.file` e o URI de redirecionamento igual ao do passo A9 (comparar letra por letra).

### PAUSA 1: me avise "Bloco A ok" e eu confiro com o recruta antes do Bloco B.

---

## BLOCO B · Mais segredos no Supabase (pelo painel): 5 passos

Na mesma tela: Supabase > **Tarefas - Grupo You** > **Edge Functions** > **Secrets**.

**B1. Modo de teste da postagem.** **Add new secret**. **Name**: `POSTAR_DE_VERDADE`. **Value**: `nao` (minúsculo, sem acento). **Save**.
Por quê: trava de segurança. Enquanto estiver `nao`, o sistema NUNCA publica de verdade no Instagram nem no Facebook; só prepara rascunho. Trocar para `sim` é só no fim, com sua aprovação.
Você deve ver: `POSTAR_DE_VERDADE` na lista. Responda: "B1 ok".

**B2. E-mail do Matheus.** **Add new secret**. **Name**: `DRIVE_COMPARTILHAR_COM`. **Value**: o e-mail Google do Matheus (o que você vai me passar). **Save**.
Por quê: é para quem a pasta "Tarefas · Conteúdos" será compartilhada, para ele ver e anexar.
Responda: "B2 ok".

**B3. Conferir a chave da Meta (só o nome).** Na lista de Secrets, procure `META_PUBLISHER_TOKEN`. NÃO clique para ver o valor.
Você deve ver: o nome na lista. Se NÃO existir, responda "B3 falta" e eu te passo o que fazer (não invente nenhuma chave).

**B4. Conferir os nomes finais.** Role a lista e confira que existem estes quatro nomes e mais o da Meta:
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `POSTAR_DE_VERDADE`, `DRIVE_COMPARTILHAR_COM` e `META_PUBLISHER_TOKEN`.
Responda: "B4 ok" ou diga qual nome falta.

**B5. Conferir o projeto.** Clique no nome do projeto no topo do Supabase e confirme que é **Tarefas - Grupo You**.
Responda: "B5 ok".

**Recruta confere depois do Bloco B:** os cinco NOMES acima aparecem na lista de Secrets (nunca os valores); `POSTAR_DE_VERDADE` está `nao` (o recruta não vê o valor: o teste do Bloco E confirma pela tela, que mostrará "modo de teste").

### PAUSA 2: me avise "Bloco B ok".

---

## BLOCO C · Implantar as 3 funções no servidor: 6 passos

Aqui você usa o **Windows PowerShell** comum (não o Claude Code, não o terminal do VS Code). Motivo: o primeiro comando pede um código de acesso que só você deve ver.
Antes: o recruta já criou a cópia limpa `Sistemas-Grupo-You\.publicar-drive` e me disse o commit. Eu te confirmo que está pronta.

**C1. Abrir o PowerShell.** Tecla Windows, digite `PowerShell`, aperte **Enter** (abre a janela azul "Windows PowerShell").
Você deve ver: uma linha com `PS C:\Users\Natham Monteiro>`. Responda: "C1 ok".

**C2. Entrar na cópia limpa.** Cole e aperte Enter:
```
cd "C:\Users\Natham Monteiro\Desktop\Sistemas-Grupo-You\.publicar-drive"
```
Você deve ver: a linha agora termina em `\.publicar-drive>`. Se disser "não encontra o caminho", a cópia limpa ainda não existe: pare e me avise.

**C3. Entrar na sua conta do Supabase (uma vez).** Cole e aperte Enter:
```
npx supabase@2.121.0 login
```
(Se perguntar "Ok to proceed? (y)", digite `y` e Enter.) O navegador abre numa página do Supabase mostrando um **código de verificação**. Copie o código, volte ao PowerShell, cole no lugar de "Enter your verification code" e aperte Enter.
Você deve ver: "You are now logged in. Happy coding!". NÃO me mande o código. Responda: "C3 ok".

**C4. Implantar a função do Drive.** Cole e aperte Enter:
```
npx supabase@2.121.0 functions deploy drive --project-ref uruhjlurcxpjhhgvuzwt --no-verify-jwt --use-api
```
Você deve ver, no fim: "Deployed Functions on project uruhjlurcxpjhhgvuzwt: drive" (pode vir com um link). Responda: "C4 ok".

**C5. Implantar a função da autorização do Google.** Cole e Enter:
```
npx supabase@2.121.0 functions deploy google-autorizar --project-ref uruhjlurcxpjhhgvuzwt --no-verify-jwt --use-api
```
Você deve ver: "Deployed Functions ... google-autorizar". Responda: "C5 ok".

**C6. Implantar a função da postagem.** Cole e Enter:
```
npx supabase@2.121.0 functions deploy postar-meta --project-ref uruhjlurcxpjhhgvuzwt --no-verify-jwt --use-api
```
Você deve ver: "Deployed Functions ... postar-meta". Depois feche o PowerShell. Responda: "C6 ok".

Por que `--no-verify-jwt`: cada função confere sozinha quem está chamando (a do Drive confere o seu login; a de postagem confere uma senha interna que só o banco conhece). É o combinado da revisão. Nenhuma delas faz nada sozinha: só o banco (depois do 019b, que NÃO está neste guia) ou você, pela tela, chamam.
Se aparecer erro de "project ref" ou "config.toml", pare e mande o print do erro (sem o código de acesso).

**Recruta confere depois do Bloco C** (leitura): a lista de funções do projeto `uruhjlurcxpjhhgvuzwt` mostra `drive`, `google-autorizar` e `postar-meta` como **ACTIVE**; uma chamada de teste sem login a `drive` responde "Entre no sistema" (401), e a `postar-meta` sem senha responde 401. Nenhuma das três executa nada de verdade nesse teste.

### PAUSA 3: me avise "Bloco C ok".

---

## BLOCO D · Consulta prévia e colar o 019 v2 (só depois da Lupa ter revisado): 7 passos

O 019 é o pacote do banco (tabelas de pastas, temas, registro de postagem, alarmes). Nesta versão (v2) ele é **seguro colar antes do site novo**: o relógio de postagem antigo continua, e a postagem automática nasce DESLIGADA.
Onde: https://supabase.com/dashboard > **Tarefas - Grupo You** > menu da esquerda **SQL Editor**.

**D1. Abrir o arquivo da consulta.** No Explorador de Arquivos, abra a pasta `Sistemas-Grupo-You\.publicar-drive\supabase\_colar` e dê duplo clique em **019-0-consulta-previa.sql** (se perguntar com qual programa abrir, escolha **Bloco de Notas**). Aperte **Ctrl+A** e depois **Ctrl+C**.
Responda: "D1 ok".

**D2. Rodar a consulta.** No SQL Editor clique **New query** (nova consulta), cole com **Ctrl+V** e clique **Run** (ou Ctrl+Enter).
Você deve ver: uma tabela pequena. Procure a coluna `o_que`:
- linhas **VIDEO NO SUPABASE (tem de ser zero)**: NÃO pode haver nenhuma. Se houver, **PARE** e me mande o print: o 019 não pode ser colado.
- linhas **CARD APROVADO COM HORA**: anote quantas são e as horas (se alguma é para os próximos 10 minutos, espere passar).
- linha **CARD POSTADO**: a quantidade em `id`.
Responda: "D2: zero vídeos, N aprovados com hora, M postados" (com os números).

**D3. Abrir o arquivo do 019.** No Explorador, na mesma pasta `_colar`, dê duplo clique em **019_postagem_drive.sql** (Bloco de Notas). **Ctrl+A**, **Ctrl+C**. (É um arquivo grande; é normal.)
Responda: "D3 ok".

**D4. Colar e rodar.** No SQL Editor clique **New query** (uma consulta NOVA, não a anterior), **Ctrl+V** e clique **Run**.
Você deve ver: "Success. No rows returned". Se aparecer erro em vermelho, **PARE** e mande o print (um erro que comece com "019 NAO APLICADO" é a trava de segurança dos vídeos: nada foi mudado).
Responda: "D4 ok" ou o print.

**D5. Rodar de novo para provar que é seguro repetir.** Repita D4 uma vez (Ctrl+V na mesma consulta e **Run**). Deve dar "Success" de novo.
Responda: "D5 ok".

**D6. Conferir que o site antigo continua vivo.** Abra https://tarefas-grupo-you.vercel.app, entre, abra a **Esteira** e arraste um card de teste de uma coluna para outra e de volta.
Você deve ver: tudo funcionando como antes, sem aviso de erro. Responda: "D6 ok".

**D7. Conferir o relógio antigo.** Nada a fazer: o recruta confere. Responda: "D7 pronto para o recruta".

**Recruta confere depois do Bloco D** (leitura, pode ser colado no SQL Editor com **Run**; cada uma devolve uma linha):
- `select ligado from private.interruptores where nome = 'postagem_automatica';` → **false** (postagem automática desligada).
- `select count(*) from cron.job where jobname = 'tarefas_postar_vencidos';` → **1** (o relógio antigo continua).
- `select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('ocasioes','pastas_livres','postagens','drive_pastas');` → **4**.
- A consulta do D2 de novo: mesmos números de "Aprovado com hora" e "Postado" (nenhum card sumiu nem mudou).
- `select count(*) from cron.job where jobname like 'tarefas_postar_%' and jobname <> 'tarefas_postar_vencidos';` → igual ao número de cards Aprovados com hora FUTURA do D2.

### PAUSA 4: me avise "Bloco D ok".

---

## BLOCO E · Ligar o Drive e testar (pela sua cópia local, sem publicar nada): 7 passos

Por que pela sua cópia: o botão **Ligar Google Drive** só existe no site novo. Sua cópia em http://127.0.0.1:3100 já é o site novo e fala com o banco de verdade, então o Drive fica ligado ANTES de publicarmos. (O Google deixa voltar para esse endereço local.)

**E1. Abrir.** Em uma aba, abra http://127.0.0.1:3100 e entre com o seu login de sempre. Se não abrir, me avise (eu confiro se o servidor está ligado).
Você deve ver: o Tarefas. Responda: "E1 ok".

**E2. Ir para Configurações.** Menu lateral esquerdo: **Configurações**.
Você deve ver: o bloco **Google Drive** com o texto "Ainda não está ligado. Ligue para anexar vídeos e fotos nos cards." Responda: "E2 ok".

**E3. Ligar.** Clique no botão **Ligar Google Drive**.
Você deve ver: a página do Google "Escolha uma conta". Se der erro aqui, mande o print.

**E4. Escolher a conta e permitir.** Clique em **nathamsud@gmail.com**. Na tela seguinte o Google diz que **Tarefas Grupo You** quer "ver, editar, criar e excluir apenas os arquivos do Google Drive específicos que você usa com este app". Clique **Continuar** (ou **Permitir**). Se aparecer o aviso "O Google não verificou este app", NÃO continue: mande o print.
Você deve ver: volta para o Tarefas, em Configurações, com **Ligado como nathamsud@gmail.com**. Responda: "E4 ok".

**E5. Testar um anexo (card de teste).** Esteira > clique **+** na coluna **Roteiro** > no título escreva `TESTE Drive apagar`, escolha a **Empresa** (You) > **Salvar**. Abra o card, em **Anexos** anexe uma **imagem pequena** e clique **Salvar**.
Você deve ver: a imagem na ficha, sem aviso vermelho. Responda: "E5 ok".

**E6. Ver a pasta no Drive e na tela Pastas.** Abra https://drive.google.com (conta nathamsud@): deve existir a pasta **Tarefas · Conteúdos** > **You** > **Sem formato** > **Sem tema** > **TESTE Drive apagar**, com a imagem. No Tarefas, clique **Pastas** > **You** > **Sem formato**: o card aparece. Peça ao Matheus para abrir a pasta pelo e-mail dele (deve aparecer em "Compartilhados comigo").
Responda: "E6 ok" e diga se o Matheus enxergou a pasta.

**E7. Apagar o teste.** Abra o card **TESTE Drive apagar** e clique no ícone da **lixeira** (Apagar tarefa) e confirme.
Você deve ver: o card some; no Drive a pasta **TESTE Drive apagar** vai para a lixeira do Google. Responda: "E7 ok".

**Recruta confere depois do Bloco E** (leitura): `select count(*) from vault.secrets where name = 'google_drive_refresh_token';` → **1** (o Drive está autorizado; o valor nunca é lido); `select count(*) from drive_pastas where chave like 'empresa:%';` → **1** (a pasta da You foi criada); a ficha e a tela Pastas mostraram "modo de teste" (não "vai ao ar") no que se refere à postagem; nenhuma linha de `postagens` foi criada (nada tentou postar).

### PAUSA 5: me avise "Bloco E ok". Só depois eu digo "pode publicar" (precisa da Lupa conferir o commit final).

---

## BLOCO F · Publicar o site novo (da cópia limpa): 6 passos

**F1. Esperar o meu "pode publicar".** Eu só digo depois de a Lupa liberar o commit exato que está na cópia limpa e de eu conferir que é o mesmo número.
Responda: "F1: recebi o pode publicar do commit XXXX".

**F2. Publicar.** Abra o **Claude Code** (a conversa de sempre). Cole a linha abaixo INTEIRA, com o `!` na frente, e aperte Enter:
```
! cd "C:\Users\Natham Monteiro\Desktop\Sistemas-Grupo-You\.publicar-drive" && npx vercel@64.7.0 deploy --prod --yes --scope you-contabilidade
```
É você quem roda: a trava não deixa o agente publicar. Se perguntar algo ("Set up and deploy?", "Link to existing project?"), NÃO responda: pare e mande o print.
Você deve ver, em 1 a 3 minutos: uma linha `Production https://tarefas-grupo-...vercel.app` e, no fim, `tarefas-grupo-you.vercel.app`, sem a palavra Error. Responda: "F2 ok".

**F3. Você e o Matheus recarregam.** Feche TODAS as abas do Tarefas e abra de novo https://tarefas-grupo-you.vercel.app (ou **Ctrl+F5**). O Matheus também.
Responda: "F3 ok".

**F4. Conferir que é o site novo.** Abra **Pastas**: você deve ver **+ Nova pasta** e as pastas por empresa. Abra **Configurações**: **Google Drive: Ligado como nathamsud@gmail.com**. Abra um card em **Aprovado** com data: o bloco de publicação deve falar em "hora marcada" ou "modo de teste" (não em "vai ao ar").
Responda: "F4 ok".

**F5. Teste rápido de pasta livre.** Em **Pastas** clique **+ Nova pasta**, nome `Teste livre apagar`, deixe o cadeado desligado, **Criar**; depois no menu da pasta apague (confirme). Ela deve sumir (e ir para a lixeira do Drive).
Responda: "F5 ok".

**F6. Se algo der errado: voltar atrás.** Abra https://vercel.com > projeto **tarefas-grupo-you** > **Deployments** > na versão anterior de **Production** clique nos três pontinhos > **Instant Rollback** > confirme; depois **Ctrl+F5**. Nada do banco precisa mudar (o 019 v2 funciona com o site antigo).
Responda: "F6 lido".

**Recruta confere depois do Bloco F** (leitura): a lista de deployments da Vercel mostra o novo como Production READY com o commit combinado; o interruptor continua `false`; `POSTAR_DE_VERDADE` continua `nao`; nenhum card mudou de etapa sozinho além do esperado.

---

## O QUE NÃO ESTÁ NESTE GUIA (de propósito)

- **019b (liga a postagem automática de verdade)**: só depois do aviso de erro por WhatsApp no n8n e de testes de rascunho. É outro guia.
- **Trocar `POSTAR_DE_VERDADE` para `sim`**: só com a sua aprovação de foto e legenda do primeiro post real.
- Nenhum passo deste guia faz o sistema publicar no Instagram ou no Facebook.

## Resumo de tempo e pausas

Blocos A (11 passos), B (5), C (6), D (7), E (7), F (6): 42 passos no total, com pausa para eu conferir entre cada bloco. Cada bloco leva uns 10 a 20 minutos.
