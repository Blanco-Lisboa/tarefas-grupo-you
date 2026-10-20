# Brief para o agente do n8n: ligar o Google Agenda ao sistema Tarefas

Este documento é tudo o que você precisa. Você não tem acesso ao código do Tarefas e não precisa. Quem publica o fluxo é o Natham.

## 1. O que queremos

O sistema **Tarefas - Grupo You** tem um Calendário. Queremos que os compromissos do Google Agenda apareçam nele. Você vai criar **um fluxo novo e separado** no n8n que lê o Google Agenda e entrega os compromissos ao banco do Tarefas, chamando uma função que já está pronta lá (a "porta de entrada", `agenda_receber`).

Analogia: o banco é uma caixa de correio com uma fenda que só aceita carta de quem tem a chave. Seu fluxo é o carteiro: pega os compromissos no Google e põe na fenda. Você não abre a caixa, só entrega.

Regras que valem sempre:
- **Não mexa em nenhum fluxo que já existe**, em especial o do CRM (`13PbdvnpT8BBz4Zd`). Pode abrir para ver como o aviso do Google (push) foi feito lá e copiar o jeito, nada além disso.
- **Não publique.** Deixe o fluxo pronto e salvo. O Natham publica.
- **Nenhuma chave, senha ou token** escrito no fluxo, em nota, em comentário ou em exportação. Tudo no cofre de credenciais do n8n (ver seção 6).
- Este fluxo **só lê** o Google. Nunca cria, altera ou apaga compromisso lá.

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
| `lucas` | agenda do Lucas | **sem decisão do Natham** | não ligar; o fluxo deve aceitar entrar depois |

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
  { "gravados": 12, "removidos": 1, "varridos": 0, "varredura_ignorada": false }
  ```
  `gravados` = compromissos entregues; `removidos` = apagados pelo aviso de cancelamento; `varridos` = apagados pela varredura; `varredura_ignorada: true` = a varredura veio com lista vazia e o banco, por segurança, não apagou nada.
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
8. Só então ligue `matheus`. Depois `adrian`, quando o Natham avisar que compartilhou. `lucas` só se o Natham decidir.

## 12. Entrega

Deixe o fluxo **salvo, sem publicar** e responda ao Natham com: o nome do fluxo, a tabela `p_fonte -> calendarId` que você achou (sem nenhuma chave), qual gatilho usou (aviso do Google ou a cada 15 min) e o resultado de cada teste da seção 11. **O Natham publica pelo painel do n8n.**
