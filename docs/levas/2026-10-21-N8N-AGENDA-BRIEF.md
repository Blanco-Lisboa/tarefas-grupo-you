# Brief para o agente do n8n: ligar o Google Agenda ao sistema Tarefas

Este documento é tudo o que você precisa. Ele tem DOIS fluxos: a **IDA** (Google para o Tarefas, seções 1 a 12) e a **VOLTA** (Tarefas para o Google, seção 13). Você não tem acesso ao código do Tarefas e não precisa. Quem publica o fluxo é o Natham.

## 1. O que queremos

O sistema **Tarefas - Grupo You** tem um Calendário. Queremos que os compromissos do Google Agenda apareçam nele. Você vai criar **um fluxo novo e separado** no n8n que lê o Google Agenda e entrega os compromissos ao banco do Tarefas, chamando uma função que já está pronta lá (a "porta de entrada", `agenda_receber`).

Analogia: o banco é uma caixa de correio com uma fenda que só aceita carta de quem tem a chave. Seu fluxo é o carteiro: pega os compromissos no Google e põe na fenda. Você não abre a caixa, só entrega.

Regras que valem sempre:
- **Não mexa em nenhum fluxo que já existe**, em especial o do CRM (`13PbdvnpT8BBz4Zd`). Pode abrir para ver como o aviso do Google (push) foi feito lá e copiar o jeito, nada além disso.
- **Não publique.** Deixe o fluxo pronto e salvo. O Natham publica.
- **Nenhuma chave, senha ou token** escrito no fluxo, em nota, em comentário ou em exportação. Tudo no cofre de credenciais do n8n (ver seção 6).
- O fluxo da **IDA** (seções 1 a 12) **só lê** o Google, com credencial só de leitura. Nunca cria, altera ou apaga compromisso lá. Quem escreve no Google é só o fluxo da **VOLTA** (seção 13), separado e com credencial própria.

Pré-requisito (do Natham, antes de você testar): ele aplica o arquivo `supabase/008_agenda_porta_de_entrada.sql` no banco do Tarefas. Se a função ainda não existir, a chamada responde erro 404 com `PGRST202`; é só avisar o Natham.

## 2. Conta Google e quais agendas ler

O n8n conecta **uma única conta Google: `contato@assessoriabeec.com.br`**, com permissão **somente leitura** (escopo `calendar.readonly`). Nunca conecte a conta pessoal de ninguém.

Nessa conta existem 5 agendas. Cada uma vira um valor de `p_fonte` (o nome que o banco usa):

| p_fonte | Agenda | Como é a permissão | Situação |
|---|---|---|---|
| `contato` | a própria agenda da contato@ | dona | ligar agora |
| `natham` | agenda pessoal do Natham (`nathamsud@gmail.com`) | compartilhada, só leitura ("Ver detalhes dos eventos") | já compartilhada, ligar agora |
| `matheus` | agenda do Matheus | compartilhada, só leitura | já compartilhada, ligar agora |
| `adrian` | agenda do Adrian | ainda não compartilhada | **depois** (deixe o fluxo pronto para entrar só acrescentando uma linha) |
| `lucas` | agenda do Lucas | **decidido (21/10): o Lucas não entra** | não ligar; o 010 também tira o Lucas de quem vê as agendas |

### Como achar o `calendarId` de cada uma
Não adivinhe. Pergunte ao Google quais agendas essa conta enxerga:

`GET https://www.googleapis.com/calendar/v3/users/me/calendarList` (com a credencial Google do n8n, ou o nó Google Calendar, "Calendar > Get Many", se existir na sua versão).

A resposta é uma lista; cada item tem:
- `id`: **este é o calendarId**. Para agenda de pessoa costuma ser o e-mail dela (a da contato@ também aparece como `contato@assessoriabeec.com.br`).
- `summary`: o nome que aparece no Google (use para reconhecer qual é qual).
- `accessRole`: `owner` na da contato@; `reader` nas compartilhadas (se vier `freeBusyReader`, só mostra "ocupado" sem detalhes: avise o Natham, o compartilhamento está sem "Ver detalhes dos eventos").

Monte a tabela `p_fonte -> calendarId` e **guarde-a no próprio fluxo como configuração (não é segredo)**. Se uma agenda esperada (natham, matheus) não aparecer na lista, pare e avise o Natham em vez de seguir.

## 3. Quando rodar (recomendação)

**Recomendo: aviso do Google (push/watch) + uma varredura completa por dia.** É o mesmo caminho que já funciona no CRM e não gasta execução à toa quando ninguém mexe na agenda.

**A) Aviso do Google (cada agenda tem o seu):**
1. Crie um webhook de produção no n8n (endereço HTTPS público do n8n).
2. Para cada agenda, registre um canal: `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/watch` com corpo `{"id": "<uuid novo>", "type": "web_hook", "address": "<webhook do n8n>", "token": "<segredo no cofre>"}`.
3. O canal vence em alguns dias. **Renove todo dia** (junto com a varredura da parte B): registre um canal novo antes do antigo vencer.
4. Quando o webhook receber um aviso, confira o `token`. Se o cabeçalho `X-Goog-Resource-State` for `sync`, é só o aviso de que o canal nasceu: ignore. Se for `exists`, algo mudou: descubra de qual agenda (cabeçalho `X-Goog-Channel-ID` -> qual `p_fonte`) e leia **só o que mudou**: `events.list` com `updatedMin` = agora menos 30 minutos.
5. Esses 30 minutos de sobra são de propósito: reenviar o mesmo compromisso **não duplica nada** (seção 7), então sobrepor é de graça e protege contra aviso perdido.

**B) Varredura diária às 05:00 (hora de Brasília):** para cada agenda, leia a janela inteira (seção 4) e envie com `p_varredura_de` e `p_varredura_ate` (seção 5). Isso apaga do banco o que sumiu do Google sem aviso e é a rede de segurança.

**Se o aviso do Google der trabalho demais:** plano B aceitável é rodar a leitura da janela inteira (com varredura) **a cada 15 minutos**, sem webhook. Funciona igual, só gasta mais execuções do n8n (96 por dia, ou 480 se for uma execução por agenda). Prefira a opção A.

## 4. Janela de datas e como ler cada agenda

Sempre estas opções em `events.list` (`GET /calendar/v3/calendars/{calendarId}/events`):
- `timeMin` = hoje **menos 45 dias** (meia-noite de Brasília) e `timeMax` = hoje **mais 180 dias**. É a janela que o sistema mostra; sempre mande as duas, senão evento repetido sem fim se expande para sempre.
- `singleEvents=true`: evento repetido (toda segunda, por exemplo) chega **desmembrado, uma ocorrência por data**. É assim que o sistema quer.
- `showDeleted=true`: traz também os apagados (seção 8).
- `timeZone=America/Sao_Paulo`.
- `maxResults=250` e siga `nextPageToken` até acabar. **Só considere a leitura concluída se a última página veio sem erro** (importante para a varredura, ver seção 5).

Ignore (não envie) os compromissos que não são compromisso de verdade: `eventType` igual a `workingLocation` (local de trabalho) e `birthday` (aniversário automático). O resto (`default`, `outOfOffice`, `focusTime`) pode enviar.

## 5. O que enviar: formato EXATO

Uma chamada por agenda (`p_fonte`). **No máximo 1000 eventos por chamada.** No aviso do Google (parte A) o lote é pequeno. Na varredura diária (parte B) a agenda inteira da janela vai **numa chamada só**: o banco compara o que apagar com a lista daquela mesma chamada, então dividir a varredura em lotes apagaria os compromissos dos lotes anteriores. Se alguma agenda passar de 1000 compromissos na janela, não divida: avise o Natham.

Corpo da chamada (JSON):

```json
{
  "p_fonte": "contato",
  "p_eventos": [
    {
      "id": "abc123xyz",
      "ical_uid": "abc123xyz@google.com",
      "titulo": "Reunião - Caderno",
      "inicio": "2026-10-22T14:00:00-03:00",
      "fim": "2026-10-22T15:00:00-03:00",
      "dia_inteiro": false,
      "local": "Sala 2",
      "particular": false
    },
    {
      "id": "def456_20261026T110000Z",
      "ical_uid": "def456@google.com",
      "inicio_original": "2026-10-26T08:00:00-03:00",
      "titulo": "Treino",
      "inicio": "2026-10-26T08:00:00-03:00",
      "fim": "2026-10-26T09:00:00-03:00"
    },
    {
      "id": "ghi789",
      "ical_uid": "ghi789@google.com",
      "titulo": "Feriado",
      "inicio": "2026-11-02",
      "fim": "2026-11-03",
      "dia_inteiro": true
    },
    {
      "id": "jkl000",
      "ical_uid": "jkl000@google.com",
      "particular": true,
      "inicio": "2026-10-25T10:00:00-03:00",
      "fim": "2026-10-25T11:00:00-03:00"
    },
    { "id": "mno111", "status": "cancelled" }
  ]
}
```

Os dois últimos campos, só na **varredura diária** (seção 3B), sempre juntos:

```json
{ "p_varredura_de": "2026-09-06T00:00:00-03:00", "p_varredura_ate": "2027-04-18T00:00:00-03:00" }
```
(os mesmos `timeMin` e `timeMax` usados na leitura). Mande a varredura **só se todas as páginas do Google foram lidas sem erro**. Se o Google deu erro no meio, não mande varredura (mande sem os dois campos, como no aviso): ela apaga o que "não veio".

### De onde vem cada campo (resposta do Google -> nosso campo)

| Nosso campo | Vem do Google | Observação |
|---|---|---|
| `id` | `id` | **obrigatório**. Em evento repetido, o `id` da ocorrência (tem a data no fim). |
| `status` | `status` | mande `"cancelled"` só quando o Google disser isso; senão, não mande o campo. |
| `ical_uid` | `iCalUID` | é o que impede duplicar. Mande sempre que vier. |
| `inicio_original` | `originalStartTime.dateTime` (ou `.date`) | **só** em ocorrência de evento repetido. Nos demais, não mande. |
| `titulo` | `summary` | se não vier, não mande o campo. |
| `particular` | `visibility` | `true` se for `private` ou `confidential`; senão `false` ou omita. |
| `inicio` | `start.dateTime` (ou `start.date`) | **obrigatório** (menos no cancelado). |
| `fim` | `end.dateTime` (ou `end.date`) | opcional. |
| `dia_inteiro` | existe `start.date` (sem hora)? | `true` quando o Google manda só a data. |
| `local` | `location` | opcional. |
| `tarefa_id` | `extendedProperties.private.tarefa_id` | **só** se vier. É a marca dos eventos que o próprio Tarefas criou (volta, seção 13): o banco IGNORA esses, senão a tarefa apareceria 2 vezes no Calendário. Evento apagado (`cancelled`) vem sem isso: mande como está, não faz mal. |

Regras do formato:
- `inicio` e `fim` com horário: **sempre com o fuso na ponta** (`-03:00`), exatamente como o Google manda. Sem fuso o banco entende errado.
- Dia inteiro: só a data (`"2026-11-02"`), e o `fim` é o **dia seguinte**, do jeito que o Google manda. Não ajuste.
- Não invente campo novo. Campo desconhecido é ignorado, mas faltar `id` derruba o lote inteiro.
- Os nomes são exatos, em minúsculas, com sublinhado.

## 6. Como chamar

- **Endereço:** `POST https://uruhjlurcxpjhhgvuzwt.supabase.co/rest/v1/rpc/agenda_receber`
- **Cabeçalhos:**
  - `Content-Type: application/json`
  - `apikey: <a chave>`
  - `Authorization: Bearer <a chave>` (só se a chave for do tipo antigo, ver abaixo)
- **A chave: pegar no cofre do n8n.** Não cole a chave em lugar nenhum. O Natham cria a credencial no n8n (tipo "Header Auth", com o nome `Supabase Tarefas - chave de serviço`); você só **seleciona** essa credencial no nó HTTP Request. Se ela ainda não existir, peça ao Natham para criá-la.
  - Se a chave começa com `sb_secret_`: mande **só** o cabeçalho `apikey`.
  - Se começa com `eyJ` (chave antiga, `service_role`): mande `apikey` **e** `Authorization: Bearer` com o mesmo valor.
- **Quem pode chamar:** só quem tem a chave de serviço. Sem a chave (ou com a chave pública do site) o banco responde `permission denied`. É de propósito.
- **Resposta de sucesso** (200), exemplo:
  ```json
  { "gravados": 12, "removidos": 1, "varridos": 0, "varredura_ignorada": false, "ignorados": 0 }
  ```
  `ignorados` = eventos que vieram com `tarefa_id` (criados pelo Tarefas) e foram deixados de lado de propósito; `gravados` = compromissos entregues; `removidos` = apagados pelo aviso de cancelamento; `varridos` = apagados pela varredura; `varredura_ignorada: true` = a varredura veio com lista vazia e o banco, por segurança, não apagou nada.
- **Erros:** `400` com texto (`fonte invalida`, `evento sem id`, `evento X sem inicio`): corrija o lote. `401/403` ou `permission denied`: credencial errada. `404` com `PGRST202`: o Natham ainda não aplicou o 008. Em qualquer erro, **o lote inteiro é desfeito** (nada entra pela metade): pode reenviar o mesmo lote depois de corrigir.

## 7. Repetição e duplicidade

- **Não tente evitar duplicata no n8n.** Mande tudo do jeito que o Google entrega. O banco decide.
- O mesmo compromisso pode estar em duas agendas (exemplo: "Reunião - Caderno" na contato@ e na do Natham). Ele tem o mesmo `iCalUID` nas duas, e o banco guarda **uma vez só**, anotando que aparece nas duas. Por isso mande **cada agenda na sua chamada, com o seu `p_fonte`**, sem juntar.
- Reenviar o mesmo lote 10 vezes dá o mesmo resultado que enviar 1 vez.
- Se a mesma reunião chega com horário novo, o banco atualiza.

## 8. Compromisso apagado ou cancelado

Com `showDeleted=true`, o Google devolve o compromisso apagado como `{ "id": "...", "status": "cancelled" }` (quase sem outros campos). Mande-o como está, dentro de `p_eventos`:
`{ "id": "mno111", "status": "cancelled" }`.
O banco tira o compromisso **daquela agenda**; se ele não estiver em nenhuma outra, some de vez. Se o `id` não existir lá, tudo bem: não dá erro.
Para ocorrência cancelada de evento repetido, mande o `id` da ocorrência (o que tem a data no fim).

## 9. Compromisso particular e sem título

Na agenda compartilhada, o dono pode marcar um compromisso como particular; o Google então não entrega o título. Faça assim:
- `visibility` igual a `private` ou `confidential` -> envie `"particular": true` e **não envie `titulo`**. O sistema mostra "Ocupado".
- Compromisso comum sem título (`summary` vazio, não particular) -> não envie `titulo`; o sistema mostra "(Sem título)".
- Não invente título como "Particular" ou "Sem nome".

## 10. Fuso horário

Tudo em **America/Sao_Paulo** (Brasília, -03:00). Peça `timeZone=America/Sao_Paulo` ao Google e preserve o `-03:00` no que enviar. O sistema converte para a hora de Brasília ao mostrar.

## 11. Como testar (nesta ordem; avise o Natham em cada passo que depender dele)

1. **Teste de recusa:** chame a função **sem** a chave. Tem de dar erro (`permission denied`/401). Se aceitar, **pare e avise**: a trava falhou.
2. **Teste com 1 evento falso**, `p_fonte` `contato`:
   `{"id":"teste-n8n-1","ical_uid":"teste-n8n-1@n8n","titulo":"TESTE n8n (apagar)","inicio":"2027-03-01T10:00:00-03:00","fim":"2027-03-01T11:00:00-03:00"}`
   Esperado: `gravados: 1`. Peça ao Natham para olhar na tabela `agenda_eventos` do Supabase (uma linha, `fontes = {contato}`).
3. **Repita a mesma chamada.** Esperado: `gravados: 1` de novo e **continua uma linha só**.
4. **Apague o teste:** `{"id":"teste-n8n-1","status":"cancelled"}`. Esperado: `removidos: 1`, a linha some.
5. **Leitura real, só da `contato`:** rode a janela inteira (seção 4) e envie. Peça ao Natham para conferir 3 compromissos que ele conhece.
6. **A "Reunião - Caderno":** ela está na contato@ e na do Natham. Rode a `contato` e depois a `natham`. Esperado: no banco, **uma linha só**, com `fontes = {contato, natham}`.
7. **Apagar de verdade:** o Natham apaga um compromisso de teste no Google. Em até alguns minutos (ou na varredura) ele deve sumir do banco.
8. Só então ligue `matheus`. Depois `adrian`, quando o Natham avisar que compartilhou. `lucas` não entra (decisão do Natham, 21/10).

## 12. Entrega

Deixe o fluxo **salvo, sem publicar** e responda ao Natham com: o nome do fluxo, a tabela `p_fonte -> calendarId` que você achou (sem nenhuma chave), qual gatilho usou (aviso do Google ou a cada 15 min) e o resultado de cada teste da seção 11. **O Natham publica pelo painel do n8n.**


## 13. A VOLTA: do Tarefas para o Google (fluxo novo, separado da IDA)

Pré-requisito: o Natham aplica `supabase/010_agenda_saida_tarefas_para_o_google.sql` (depois do 008). Sem ele, as duas funções abaixo respondem `404` com `PGRST202`: avise o Natham.

### 13.1 O que queremos
Quando alguém cria, muda a data/hora/título/responsável ou apaga uma **tarefa com data** no Tarefas, o evento correspondente aparece, muda ou some **na agenda do Google do RESPONSÁVEL** da tarefa. Tarefa do Matheus vai para a agenda do Matheus, não para a do Adrian nem para a contato@. Tarefa sem data não vai. Quem não tem agenda mapeada (Adrian, por ora) não manda nada.

Analogia: o banco tem uma **fila de saída** (as encomendas a entregar). Seu fluxo é o motoboy: a cada 1 ou 2 minutos pergunta "o que tem pra entregar?", entrega no Google e avisa o banco "entregue".

### 13.2 Credencial (não reaproveite a da IDA)
- Crie uma **segunda** credencial Google no n8n, também da conta `contato@assessoriabeec.com.br`, chamada `Google Agenda - escrita`, com o escopo `https://www.googleapis.com/auth/calendar.events`. A credencial da IDA continua só de leitura (`calendar.readonly`).
- A conta contato@ **só consegue escrever na agenda de alguém que deu a ela a permissão "Fazer alterações nos eventos"** (passo do Natham, 13.8). Sem isso o Google responde `403` ou `404`.
- Chave do banco: a mesma credencial Header Auth da IDA (`Supabase Tarefas - chave de serviço`), mesmas regras da seção 6. Nenhuma chave em nó, nota ou exportação.

### 13.3 O desenho do fluxo (nome sugerido: `Tarefas - Agenda - volta`)
1. **Gatilho:** Schedule, a cada 2 minutos.
2. **HTTP Request** `POST https://uruhjlurcxpjhhgvuzwt.supabase.co/rest/v1/rpc/agenda_saida_pendentes`, corpo `{"p_limite": 20}`. A resposta é uma **lista**; faça uma saída por item (Split Out). Lista vazia = o fluxo termina ali.
3. **Switch** em `acao`: `criar`, `editar`, `apagar` (13.5).
4. Em cada ramo, a chamada ao Google. **Uma de cada vez** (não em paralelo) e **com erro tratado por item**: um item que falha não pode parar os outros (ative "continuar em caso de erro" no nó do Google).
5. **HTTP Request** `POST .../rest/v1/rpc/agenda_saida_confirmar` com o resultado (13.6), **sempre**, deu certo ou errado.

Se o fluxo cair no meio, nada se perde: o banco devolve o item de novo depois de 5 minutos sem confirmação. `editar` e `apagar` repetidos não duplicam nada; só `criar` repetido duplicaria (se o Google criou mas a confirmação não chegou). Por isso **confirme logo depois de cada chamada ao Google**, antes de passar ao próximo item.

### 13.4 O que o banco entrega (cada item da lista)
| Campo | Quando vem | Significado |
|---|---|---|
| `id` | sempre | número do item da fila. Volta em `p_id` |
| `acao` | sempre | `criar`, `editar` ou `apagar` (o banco decide) |
| `tarefa_id` | sempre | vai no evento como `extendedProperties.private.tarefa_id` |
| `calendar_id` | sempre | agenda do Google onde agir (a URL leva este valor, com `@` codificado) |
| `google_event_id` | `editar` e `apagar` | id do evento no Google. Em `criar` vem `null` |
| `titulo` | `criar`, `editar` | vira `summary` |
| `inicio`, `fim` | `criar`, `editar` | prontos para o Google (abaixo) |
| `dia_inteiro` | `criar`, `editar` | `true` = usa `date`; `false` = usa `dateTime` |
| `fuso` | `criar`, `editar` | sempre `America/Sao_Paulo` |

Com hora: `inicio` e `fim` vêm como `2026-10-22T14:00:00` (hora de Brasília, **sem** fuso na ponta; o fuso é o campo `fuso`). Dia inteiro: vêm como `2026-10-22` e `2026-10-23`, e o `fim` **já é o dia seguinte**, como o Google exige. **Não ajuste nada.**

### 13.5 O que mandar ao Google (API `https://www.googleapis.com/calendar/v3`, sempre com `sendUpdates=none`, para ninguém receber e-mail)
- **criar** `POST /calendars/{calendar_id}/events?sendUpdates=none`
  ```json
  { "summary": "<titulo>",
    "start": { "dateTime": "<inicio>", "timeZone": "America/Sao_Paulo" },
    "end":   { "dateTime": "<fim>",    "timeZone": "America/Sao_Paulo" },
    "description": "Criado pelo Tarefas - Grupo You",
    "extendedProperties": { "private": { "tarefa_id": "<tarefa_id>" } } }
  ```
  Em dia inteiro: `"start": { "date": "<inicio>" }` e `"end": { "date": "<fim>" }`. **A marca `extendedProperties.private.tarefa_id` é obrigatória**: é ela que impede o loop e a duplicata (a IDA a repassa como `tarefa_id`, seção 5).
- **editar** `PATCH /calendars/{calendar_id}/events/{google_event_id}?sendUpdates=none` com `summary`, `start` e `end`. A tarefa pode ter passado de "com hora" para "dia inteiro" (ou ao contrário), então zere o outro campo: com hora, `start`/`end` levam `"date": null`; dia inteiro, levam `"dateTime": null` e `"timeZone": null`.
- **apagar** `DELETE /calendars/{calendar_id}/events/{google_event_id}?sendUpdates=none`. Resposta `404` ou `410` (já não existe) conta como **sucesso**.

### 13.6 Avisar o banco (as TRÊS PONTAS batendo)
`POST .../rest/v1/rpc/agenda_saida_confirmar`, uma vez por item, corpo:
```json
{ "p_id": 41, "p_google_event_id": "abc123xyz", "p_erro": null }
```
| Coluna no banco (`agenda_saida`) | Parâmetro da função | Campo no n8n |
|---|---|---|
| `id` | `p_id` | `id` do item que veio da lista |
| `google_event_id` (e `agenda_saida_vinculo.google_event_id`) | `p_google_event_id` | `id` da resposta do Google em `criar`; o próprio `google_event_id` do item em `editar`; em `apagar` mande `null` |
| `ultimo_erro` | `p_erro` | texto curto do erro do Google (código e mensagem). `null` quando deu certo |

Resposta: `{"estado": "feito"}`, ou `{"estado": "pendente"}` (vai tentar de novo em 5 minutos), ou `{"estado": "falhou"}` (5 erros seguidos: o item sai da fila; avise o Natham). Erro `400` com `salvar precisa de p_google_event_id` = faltou o `id` do Google em `criar` ou `editar`.

Os outros campos da lista (`titulo`, `inicio`, `fim`, `dia_inteiro`, `fuso`, `calendar_id`, `tarefa_id`) **não** voltam na confirmação: o banco já os guardou ao entregar o item.

### 13.7 As agendas (quem recebe a tarefa de quem)
A tabela `agenda_pessoa` do banco liga cada pessoa à agenda dela. Hoje só o Natham tem linha (`nathamsud@gmail.com`; confirme na `calendarList` que é esse mesmo o `id`). Quando o Natham liberar a agenda do Matheus (13.8), **você descobre o `calendarId` exato** pela `calendarList` (seção 2, mesmo método) e o Natham grava uma linha:
```sql
insert into public.agenda_pessoa (pessoa_id, calendar_id)
select id, '<calendarId do Matheus>' from public.pessoas where slug = 'matheus'
on conflict (pessoa_id) do update set calendar_id = excluded.calendar_id;
```
O Adrian entra do mesmo jeito, só depois. **O que já existia antes do 010 não é enviado**: só tarefa criada ou mudada depois da linha entrar no mapa. Marcar a tarefa como feita não muda o evento no Google.

### 13.8 Passos do Natham (antes de ligar a volta)
1. **Natham, na agenda pessoal dele** (`nathamsud@gmail.com`): Configurações da agenda > "Compartilhar com pessoas específicas" > `contato@assessoriabeec.com.br` > permissão **"Fazer alterações nos eventos"** (hoje está "Ver todos os detalhes do evento").
2. **Matheus, na agenda dele:** o mesmo, para a contato@.
3. **Adrian (depois):** o mesmo, para a contato@. **Ninguém compartilha nada com o Adrian:** ele não vê as agendas do Natham nem do Matheus, para não poluir a dele. O Natham e o Matheus passam a ver a do Adrian (isso já está no banco).
4. Natham aplica o 010 quando o Maestro avisar que está pronto.
5. Natham publica o fluxo da volta no painel do n8n (como na IDA).

A permissão "Fazer alterações nos eventos" também deixa a IDA continuar lendo: ela inclui ver tudo.

### 13.9 Testes da volta (nesta ordem; avise o Natham onde depender dele)
1. **Recusa:** chame `agenda_saida_pendentes` sem a chave. Tem de dar `permission denied`. Se aceitar, **pare e avise**.
2. **Fila vazia:** com a chave, `{"p_limite": 20}` devolve `[]`.
3. **Criar:** o Natham cria no Tarefas uma tarefa de teste com data e hora, responsável Natham, título `TESTE volta (apagar)`. Em até 2 minutos o evento aparece na agenda pessoal dele. Confira `extendedProperties.private.tarefa_id` no evento.
4. **Sem duplicar:** rode a IDA da `natham`. Esperado: `ignorados: 1` e a tarefa continua **uma vez só** no Calendário do Tarefas (como tarefa, não como compromisso).
5. **Editar:** o Natham muda hora e título. O MESMO evento muda no Google (não nasce outro).
6. **Trocar de responsável** para o Matheus (depois de 13.7): o evento some da agenda do Natham e nasce na do Matheus.
7. **Dia inteiro:** tarefa de dia inteiro com início e fim em dias diferentes. No Google, o último dia aparece incluído.
8. **Apagar:** o Natham apaga a tarefa. O evento some do Google.
9. **Erro (opcional):** tire a permissão de escrita de uma agenda e crie uma tarefa para ela: o item deve voltar `pendente` e, após 5 tentativas, `falhou`, sem travar os outros.
10. Só então o fluxo fica ligado. O Adrian entra por último, quando o Natham avisar que a agenda dele está liberada para a contato@.

### 13.10 Entrega da volta
Fluxo **salvo, sem publicar**. Responda ao Natham com: o nome do fluxo, o `calendarId` de cada pessoa que você achou (sem nenhuma chave) e o resultado de cada teste de 13.9.
