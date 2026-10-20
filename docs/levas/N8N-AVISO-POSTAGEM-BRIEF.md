# BRIEF para o agente do n8n · aviso de postagem (item 196)

Escrito pelo Correio (dono da função `postar-meta` do sistema Tarefas) em 20/10/2026. Destino: o agente que mexe no n8n da You (N8N-You).
Nada aqui publica post nem toca na Meta. É só o aviso para o celular do Natham.

## 1. O que é, em linguagem simples
Quando um card de Postagem do sistema Tarefas não consegue sair no Instagram ou no Facebook, a função `postar-meta` (no servidor do Supabase) manda um recado para um endereço do n8n (webhook). O n8n transforma o recado numa mensagem de WhatsApp **só para o Natham**. O Matheus entra depois.

Analogia: a função é o carteiro que voltou com a carta; o n8n é a recepcionista que liga para o Natham avisando.

## 2. O fluxo a criar
Nome: **Tarefas - Aviso postagem**.

1. **Webhook** (POST), caminho `tarefas-aviso-postagem`, responde **na hora** com 200 (modo "Respond immediately"). A função não espera o WhatsApp.
2. **Conferir o segredo:** o cabeçalho `x-tarefas-segredo` tem de ser igual ao segredo guardado. Use a autenticação "Header Auth" do próprio nó Webhook (nome do cabeçalho `x-tarefas-segredo`), com uma credencial nova do n8n. Errado = 401 e para.
3. **Montar a mensagem** (texto abaixo).
4. **Mandar o WhatsApp pelo mesmo caminho dos avisos de hoje do Natham.** Confira no N8N-You qual fluxo/credencial ele já usa para os avisos dele e reaproveite. Não crie número nem serviço novo.

## 3. O que chega (corpo JSON)
```json
{
  "tipo": "erro",
  "tarefa_id": "0b7e2c1a-1111-4222-8333-944455556666",
  "titulo": "Reels Outubro Rosa",
  "redes": ["facebook"],
  "motivo": "A Meta recusou: proporção da imagem ou do vídeo fora da regra da Meta.",
  "links": [{ "rede": "instagram", "link": "https://www.instagram.com/p/XYZ/" }]
}
```
- `tipo`: hoje só `"erro"`. Na Etapa 7 chega também `"feito"` (post publicado).
- `redes`: a rede que falhou (uma por aviso).
- `links`: o que já saiu do mesmo card (pode vir vazio). Serve para "saiu no Instagram, falhou no Facebook".
- O aviso só vem quando o erro é **definitivo** (a função já tentou sozinha 1 vez, ou é um erro que tentar de novo não resolve). Modo de teste não avisa.

## 4. Texto do WhatsApp
```
Postagem com erro: {{titulo}}
Rede: {{redes}}
Motivo: {{motivo}}
{{#se links}}Já saiu: {{rede}} {{link}}{{/se}}
Abra o card no sistema Tarefas e use "Tentar de novo".
```
Nomes das redes com maiúscula (Instagram, Facebook).

## 5. Ligar o fluxo ao sistema (com o Natham, depois do 019 aplicado)
1. O segredo já existe no cofre do banco (Vault, nome `tarefas_aviso_segredo`, sorteado pelo 019). O Natham lê no SQL Editor do projeto **Tarefas** (`uruhjlurcxpjhhgvuzwt`, nunca o CRM):
   `select decrypted_secret from vault.decrypted_secrets where name = 'tarefas_aviso_segredo';`
   e cola na credencial "Header Auth" do n8n. Não colar em chat, arquivo ou print.
2. Com o fluxo ativo, o endereço de produção do webhook vai para o cofre (1 linha, no SQL Editor):
   `select vault.create_secret('<endereço de produção do webhook>', 'tarefas_aviso_url');`
   Enquanto esse endereço não existir, a função simplesmente não avisa (a postagem não quebra).

## 6. Como testar sem post real
Com o fluxo em modo de teste, mandar o corpo do item 3 com o segredo certo (deve chegar o WhatsApp) e com um segredo errado (deve dar 401 e não mandar nada). Nenhuma chamada à Meta.

## 7. Etapa 7 (fim): Alexa
No mesmo fluxo, separar por `tipo`: `"feito"` e `"erro"` vão também para a Alexa, cada um com o seu som, como já é feito no CRM. O WhatsApp de erro continua junto com a Alexa. A função passa a mandar `"feito"` nessa etapa.

## 8. Travas
- Nada é ativado em produção sem o OK do Natham.
- Este fluxo não recebe nem guarda nenhuma chave da Meta.
- Não registrar o segredo em log, nota ou mensagem.
