# Brief para o agente do n8n: copiar os anexos postados para o Google Drive e limpar o Storage

Este documento é tudo o que você precisa. Você não tem acesso ao código do Tarefas e não precisa. Quem publica o fluxo é o Natham.

## 1. O que queremos

No sistema **Tarefas - Grupo You**, cada card de conteúdo pode ter anexos (vídeo, imagem, documento) guardados no Storage do Supabase (o "armário", pequeno e pago por espaço). Quando o card vai para **Postado**, o banco coloca os anexos numa **fila**. Seu fluxo (o motoboy):

1. leva cada anexo da fila para o **Google Drive** e devolve o **recibo** (id e link do arquivo no Drive);
2. uma vez por dia, **apaga do Storage** os anexos que já têm recibo e foram postados há 3 dias ou mais, e avisa o banco.

Sem recibo, o banco nunca libera a limpeza. Apagar do Storage só pela API (não por SQL: apagar a linha de `storage.objects` deixa o arquivo físico para trás).

Regras que valem sempre:
- **Fluxo novo e separado.** Não mexa em nenhum fluxo existente (em especial o do CRM `13PbdvnpT8BBz4Zd` e os da agenda do Tarefas). Pode abrir os da agenda para copiar o jeito de falar com o banco.
- **Não publique.** Deixe pronto e salvo. O Natham publica.
- **Nenhuma chave, senha ou token** escrito no fluxo, em nota, em comentário ou em exportação. Tudo no cofre de credenciais do n8n.
- **Conta do Drive: `contato@assessoriabeec.com.br`** (a mesma que o n8n já usa para a agenda) até o Natham dizer outra. Esta credencial precisa de escopo de **escrita no Drive** (a da agenda é só leitura do Calendar: crie uma credencial Google Drive própria, com `drive.file`, e peça ao Natham para autorizar).

**Pré-requisito (do Natham):** os arquivos `supabase/015`, `016` e `017` aplicados no banco do Tarefas, e o limite de upload do Storage conferido (ver `016`). Só comece depois de ele avisar.

## 2. O banco do Tarefas: como falar com ele

Mesmo modelo da agenda. Projeto Supabase `uruhjlurcxpjhhgvuzwt`. Todas as chamadas são **RPC** (`POST https://uruhjlurcxpjhhgvuzwt.supabase.co/rest/v1/rpc/<função>`) com cabeçalhos `apikey` e `Authorization: Bearer <chave de serviço>` (a mesma credencial da agenda, `service_role`, guardada no cofre do n8n) e corpo JSON. Só a chave de serviço executa estas funções; qualquer outra recebe 401/403.

## 3. Quando rodar

**A) Campainha (envio ao Drive).** O banco avisa seu fluxo por webhook quando entra anexo na fila (e de 5 em 5 minutos, só se tiver algo parado). Crie um nó **Webhook** de produção, com autenticação por cabeçalho `x-crm-secret` (Header Auth). O Natham grava no Vault do Supabase a URL de produção do webhook (`n8n_drive_url`) e a senha (`n8n_drive_secret`, o mesmo valor da sua credencial). O corpo do aviso é `{}`: ele não diz o que enviar, só "tem trabalho". Ao receber, rode a seção 4 em laço até a fila voltar vazia.

**B) Limpeza diária às 03:00 (hora de Brasília):** gatilho de agenda (Schedule). Rode a seção 5. Aproveite a mesma execução para rodar a seção 4 uma vez (rede de segurança se a campainha falhar).

## 4. Enviar ao Drive

**4.1 Pegar a fila:** `drive_fila` com `{"p_limite": 10}`. Devolve uma lista (vazia = nada a fazer; pare). Cada item:

```json
{
  "id": "6f1c...-uuid",
  "caminho": "tarefas/<id da tarefa>/<arquivo no balde>",
  "nome": "video-final.mp4",
  "tipo": "video",
  "tamanho": 83886080,
  "pasta": ["Postagens", "Beec", "Reels"],  // o 3º nível vem do campo formato do card (Reels, Post, Carrossel, Story ou "Sem formato"); use o que vier, não deduza pelo arquivo
  "nome_no_drive": "2026-10-22 Titulo do card.mp4"
}
```

O banco entrega o item e o "reserva" por **30 minutos** (vídeo de até 500 MB demora): se você não confirmar nesse prazo, outro disparo pega de novo; por isso o passo 4.4 procura o arquivo pela propriedade antes de criar. Se o card sair de Postado no meio, o item deixa de existir para o banco: confirmar depois não faz nada (e o arquivo no Drive pode ficar; não apague). Confirmar duas vezes o mesmo `id` é inofensivo.

**4.2 Pasta no Drive:** `pasta` é a lista de níveis, da raiz para dentro: **Postagens → empresa → formato**. Para cada nível, **ache a pasta pelo nome dentro da anterior; se não existir, crie** (nunca crie duplicada: busque por `name = '...' and '<pai>' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`). O primeiro nível ("Postagens") fica na raiz do "Meu Drive" da conta. Os nomes já vêm limpos (sem `/ \ : * ? " < > |`).

**4.3 Baixar do Storage:** crie uma URL assinada e baixe: `POST /storage/v1/object/sign/arquivos/<caminho>` com `{"expiresIn": 600}` e a chave de serviço; a resposta traz `signedURL` (prefixe com `https://uruhjlurcxpjhhgvuzwt.supabase.co/storage/v1`). Arquivos chegam a **500 MB**. ANTES de montar o fluxo, descubra com o Natham como este n8n executa e guarda binários: o modo `filesystem` (`N8N_DEFAULT_BINARY_DATA_MODE=filesystem`) **não funciona no modo de fila (queue mode)**, e carregar 500 MB na memória derruba o n8n. Se o seu n8n aceita `filesystem` (modo normal), use-o com **upload resumível** do Drive (`uploadType=resumable`). Se não aceita, não passe arquivo grande pelo n8n: processe só arquivos de até 50 MB e, para os maiores, confirme com `p_erro` e `"p_definitivo": true` (texto "arquivo grande demais para o n8n"); ele fica guardado no Storage e o Natham decide o que fazer. Avise o Natham do que descobriu.

**4.4 Subir:** crie o arquivo na pasta do último nível com o nome `nome_no_drive` e **grave nele a propriedade própria `appProperties = {"tarefas_anexo_id": "<id do item>"}`** (no corpo de criação do arquivo). O arquivo do Drive pertence ao anexo por ESSA propriedade, nunca por nome nem por tamanho. Antes de criar, procure (`files.list`, `q = "appProperties has { key='tarefas_anexo_id' and value='<id>' } and trashed = false"`, `fields = "files(id,size,webViewLink)"`): se achar um, é o seu de uma tentativa anterior; reaproveite-o só se o `size` for igual ao `tamanho` do item, senão apague **só esse arquivo seu** (o que tem a propriedade) e envie de novo. Nunca reaproveite arquivo que não tenha a propriedade. Não compartilhe com ninguém, não torne público: o link é só para quem já tem acesso à pasta.

**4.5 Confirmar:** `drive_confirmar`. Depois de criar, leia o arquivo no Drive (`files.get`, `fields = "id,size,webViewLink"`) e mande o que o Drive devolveu, não o que você esperava:

```json
{ "p_id": "6f1c...-uuid", "p_file_id": "<id do arquivo no Drive>", "p_link": "<webViewLink>", "p_pasta": "Postagens / Beec / Reels", "p_tamanho": 83886080 }
```

Sucesso exige `p_file_id`, `p_link` e `p_tamanho` igual ao `tamanho` do item (o banco recusa se diferir). Se algo falhar (Drive recusou, arquivo não baixou), confirme com erro: `{ "p_id": "...", "p_erro": "texto curto do que houve" }`. O mesmo item volta em ~5 minutos; na 5ª falha vira `falhou` e o banco mostra um aviso no card. Erro que não adianta repetir (ex.: arquivo grande demais para o seu n8n): acrescente `"p_definitivo": true` e ele vira `falhou` na hora, com o arquivo seguro no Storage. **Nunca** confirme sucesso sem ter o arquivo inteiro no Drive.

## 5. Limpar o Storage (diário)

**5.1** `drive_limpar_pendentes` com `{"p_limite": 50}`. Devolve `[{ "id": "...", "caminho": "tarefas/..." }]`: só anexos que têm recibo do Drive e cujo card está em Postado há 3 dias ou mais.

**5.2** Para cada um, chame **imediatamente antes de apagar** `drive_limpeza_autorizar` com `{"p_id": "..."}`: devolve `true` ou `false`. `false` = o card mudou (voltou de Postado, por exemplo): **não apague**, siga para o próximo. Com `true`, apague pela API do Storage: `DELETE /storage/v1/object/arquivos/<caminho>` com a chave de serviço. **404 (já não existe) conta como sucesso.** Qualquer outro erro: não confirme, siga para o próximo (volta amanhã).

**5.3** Confirme: `drive_limpeza_confirmar` com `{"p_id": "..."}`. O banco confere de novo o recibo, o Postado e os 3 dias; se recusar, devolve erro (não tente contornar; avise o Natham se acontecer logo depois de você ter apagado).

A linha do anexo continua no banco com o `drive_link`: o card passa a mostrar o link do Drive no lugar do arquivo.

## 6. O que NÃO fazer

- Não escreva direto nas tabelas (`arquivos`, `tarefas`); só as quatro funções acima.
- Não apague nada do Drive. Não apague do Storage nada que não tenha vindo de `drive_limpar_pendentes`.
- Não guarde o conteúdo dos arquivos em lugar nenhum além do Drive (nada de cópia em nota, Sheets, log).
- Se uma função devolver erro estranho (401, 404 de função, "anexo não existe"), pare e avise o Natham em vez de tentar variações.

## 7. Como saber que deu certo (teste, só depois do Natham aplicar o SQL)

1. O Natham cria um card de teste com 1 imagem pequena, leva a Aprovado e depois a Postado.
2. A campainha toca; `drive_fila` devolve 1 item com `pasta: ["Postagens", "<empresa>", "<formato do card>"]`.
3. O arquivo aparece em Drive: Postagens / empresa / Post, com nome `AAAA-MM-DD Título.ext`.
4. `drive_confirmar` volta `{"estado":"feito"}`; no card, o anexo mostra o link do Drive.
5. A limpeza só terá o que apagar 3 dias depois (para testar antes, o Natham muda `postado_em` do card de teste no SQL Editor; você não faz isso).
