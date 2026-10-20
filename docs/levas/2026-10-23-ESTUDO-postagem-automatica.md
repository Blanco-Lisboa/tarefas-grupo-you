# ESTUDO · item 196 · postagem automática no Instagram e no Facebook da You

Feito pelo Sextante em 23/10, com a skill /arquitetar. **É só estudo:** nada foi construído, nenhum SQL foi aplicado e nada foi enviado à Meta. O banco foi lido sem alterar nada (projeto Tarefas `uruhjlurcxpjhhgvuzwt`).
Fontes: `2026-10-23-RETOMADA.md`, `Claude Agentes/MetaPro/Referencias/BRIEFING-POSTAGEM-AUTOMATICA.md`, a leva `2026-10-18-grade-de-conteudo-beec.md` (itens 193 a 207), os arquivos `supabase/015` e `016`, `src/components/ficha/Aprovacao.tsx` e o banco de produção.

---

## (a) Em linguagem simples: como vai funcionar

**A ideia.** Pense numa agência dos Correios que abre sozinha a cada minuto, mesmo com o seu PC desligado. Ela olha o quadro, pega os cards em "Aprovado" que já chegaram na hora, leva o vídeo ou a foto até a Meta (dona do Instagram e do Facebook) e volta com o comprovante, que é o link do post. Com o comprovante, o card vai para "Postado". Se a Meta recusar, o card continua em "Aprovado" com uma faixa vermelha explicando o motivo, e você recebe um aviso.

As peças, com o nome técnico traduzido:

| Peça | O que é, na prática |
|---|---|
| **Despertador** (pg_cron) | Um relógio dentro do banco de dados que toca a cada minuto. **Já existe:** é o `tarefas_postar_vencidos`. Hoje ele só arrasta o card para "Postado", sem postar nada. Vai passar a chamar o funcionário abaixo. |
| **Funcionário no servidor** (Edge Function `postar-meta`) | Um programa que roda na nuvem do Supabase, e não no seu PC. É o único que tem a chave do cofre. Ele faz a entrega na Meta. **Ainda não existe** (o servidor não tem nenhuma função hoje). |
| **Cofre** (Secrets) | Onde está guardado o `META_PUBLISHER_TOKEN`, o "crachá" do robô "You Publicador", que dá permissão para postar. O crachá nunca sai do cofre: só o funcionário o usa, lá dentro. |
| **API da Meta** (Graph API) | O balcão de atendimento da Meta feito para programas, e não para pessoas. Funciona em 2 passos: primeiro se entrega o pacote (um "contêiner", que é um rascunho guardado na Meta) e depois se manda publicar. Vídeo precisa de alguns minutos de processamento entre um passo e outro. |
| **Link assinado** (signed URL) | Um endereço temporário para o arquivo, como um convite que vence em 1 hora. A Meta não aceita receber o arquivo na mão: ela quer um endereço de onde baixar. |

**O nó do Drive (item 203).** Com a virada do 203, o vídeo fica no Drive do nathamsud@gmail.com, e não no Supabase. O link normal do Drive não serve para a Meta, porque ele abre uma *página* com o vídeo, e não o arquivo puro (é como mandar o endereço da vitrine em vez do produto). Por isso, **na hora de postar**, o funcionário:
1. baixa o arquivo do Drive, usando a mesma autorização do Google que o 203 vai pedir para você (1 clique);
2. guarda uma cópia temporária numa gaveta trancada do Supabase (balde privado `postagens`);
3. gera o convite de 1 hora e entrega à Meta;
4. quando a Meta confirma, apaga a cópia temporária. O original continua no Drive até a limpeza de 7 dias do 203.

Ou seja: **o seu arquivo nunca fica aberto ao público**. Nada precisa ser "compartilhado com qualquer pessoa" no Drive. A cópia temporária existe por poucos minutos.

**O que você vai ver na tela:**
- Card em "Aprovado" com data marcada: "Programado · 25/10 18:00 · Instagram + Facebook".
- Na hora marcada: "Postando…" (vídeo leva de 1 a 3 minutos).
- Deu certo: o card vai sozinho para "Postado" e mostra os links "Ver no Instagram" e "Ver no Facebook".
- Deu erro: o card fica em "Aprovado" com uma faixa vermelha ("A Meta recusou: imagem precisa ser JPG"), o botão "Tentar de novo" e um aviso no seu celular.
- Botão **"Postar agora"** no card Aprovado, para urgência e para o primeiro teste. Ele pede confirmação.

---

## (b) O que já existe e o que falta

### Já existe (conferido na produção em 23/10)
| Item | Estado |
|---|---|
| Lado da Meta: app "Claude - Publisher", robô "You Publicador", página e Instagram da You, 6 permissões | Pronto (provado pelo MetaPro em 19/10) |
| Chave `META_PUBLISHER_TOKEN` no cofre do projeto Tarefas | Pronta (não foi lida aqui, conforme a trava) |
| `tarefas.formato` (reels, post, carrossel, story) | Existe. Hoje os 7 cards estão sem formato |
| `tarefas.postar_em` (texto "AAAA-MM-DDTHH:mm" na hora de Brasília) | Existe. O gatilho 015 recusa data impossível e só o Natham ou o aprovador mexe nela depois de Aprovado |
| Despertador `tarefas_postar_vencidos`, a cada minuto | Existe e está ativo. **Hoje ele move para "Postado" SEM postar** (era o combinado do 195 até o 196 existir) |
| Tela: Aprovar/Consertar, "Programar postagem" com formato obrigatório e data e hora (Sextante, commits 612eebe até bc1d8df) | Pronta, **ainda não publicada** |
| Anexos no Storage: balde privado `arquivos` de 500 MB e tabela `arquivos` (199) | Banco aplicado, tela pronta e não publicada. Tabela vazia em produção |
| pg_net (o banco consegue chamar a internet) e Vault (cofre de senhas do banco) | Instalados. O padrão de chamada com `timeout_milliseconds := 55000` já é usado no 012 |
| Plano Pro do Supabase | Sim: a função no servidor pode rodar até 400 s, com 256 MB de memória |

### Falta
| Falta | Por quê |
|---|---|
| **Legenda.** Não há coluna de legenda (só `notas` e `objetivo`, que são internas) | A Meta precisa do texto do post |
| **Onde postar.** `tarefas.rede` só aceita UM valor (instagram, tiktok, youtube ou kwai) e **não tem Facebook** | Você quer escolher Instagram, Facebook ou os dois |
| **Registro da postagem** (status, id e link do post, erro, tentativas) | Para saber o que saiu, mostrar o link e nunca postar duas vezes |
| **Ordem dos arquivos** (`arquivos` não tem ordem) | O carrossel precisa da sequência certa |
| **Funcionário `postar-meta`** | É ele que posta. Hoje não há nenhuma função no servidor |
| **Despertador novo** | Trocar "mover para Postado" por "chamar o funcionário" (na mesma hora em que o funcionário entra no ar) |
| **Senha entre o banco e o funcionário** (no Vault e nos Secrets) | Só o despertador pode acionar o funcionário |
| **Balde temporário `postagens`** | A cópia de 1 hora para a Meta baixar |
| **Autorização do Google para LER o Drive no servidor** | Vem do 203. **Requisito para o 203:** guardar essa autorização no cofre do Supabase, onde o funcionário consegue usar |
| **Limite global de envio do Storage** (está no padrão de 50 MB) | Pendência antiga sua: sem subir no painel, a cópia temporária de um vídeo acima de 50 MB falha |
| **Tela:** campo Legenda, Instagram/Facebook, "Postar agora", "Postando…", faixa vermelha, links do post, checagens antes de programar | Hoje só há formato e data |
| **Aviso para o seu celular** | Falta escolher o canal (pergunta 3) |

---

## (c) Plano em passos

**Ordem geral:** o 203 (vídeo no Drive) vem antes, como já está na fila. Mas os passos 1 a 4 abaixo **não dependem do Drive**: dá para construir e testar com arquivo no Supabase (o 199 já funciona) e, no fim, plugar o Drive (passo 5). Assim o 196 não fica parado esperando o 203.

**Passo 0 · Suas respostas (seção f).** Sem elas, não dá para fechar a tela nem o banco.

**Passo 1 · Banco, arquivo `supabase/019_postagem.sql`** (aplicado por você no SQL Editor, como no 014 a 016):
- `tarefas.legenda text` (até 2.200 caracteres, o limite do Instagram).
- `tarefas.postar_redes text[]`: subconjunto de {instagram, facebook}. É separado de `rede`, que continua servindo ao Mapa e ao TikTok.
- `arquivos.ordem int` (sequência do carrossel).
- Tabela `postagens`, **uma linha por card e por rede**: `tarefa_id`, `rede`, `status` (fila, enviando, processando, postado, erro), `conteiner_id`, `post_id`, `link`, `erro`, `tentativas`, `pego_em`, `postado_em`. A regra `unique(tarefa_id, rede)` garante que **o mesmo card nunca gera dois posts na mesma rede**. Só leitura para quem vê o card; só o funcionário escreve.
- `private.postar_vencidos()` reescrita: **não move mais o card**. Se existir card vencido ou em processamento, chama o funcionário com `net.http_post(..., timeout_milliseconds := 55000)` e a senha do Vault. Se não existir nenhum, não chama nada (custo zero nos minutos parados).
- RPC `postar_agora(id)`: confere se quem chama é o Natham ou o aprovador, marca a hora como "agora" e chama o funcionário na mesma hora.
- Trava: enquanto uma postagem estiver "enviando" ou "processando", ninguém arrasta o card de "Aprovado".
- O card vai para "Postado" quando TODAS as redes escolhidas estiverem postadas. Isso é feito pelo funcionário, com a chave de serviço, e passa pelo gatilho 015 normalmente.
- Card de empresa diferente da You: recusado com o motivo "a Beec ainda não está ligada".

**Passo 2 · Funcionário `supabase/functions/postar-meta/`.** Ele trabalha **em etapas, um pouco a cada minuto**, e nunca tudo de uma vez:
1. **Pega** os cards vencidos de forma atômica (atômico = tudo ou nada, como uma catraca que só deixa passar um). Isso usa `UPDATE postagens SET status='enviando' WHERE status='fila' ... RETURNING`, e quem não pegou não posta.
2. **Prepara:** copia o arquivo para `postagens` e gera o convite de 1 hora.
3. **Entrega à Meta** e guarda o `conteiner_id` ANTES de publicar.
   - Instagram: post com foto (`image_url`), Reels (`REELS`), carrossel (itens com `is_carousel_item` e depois um `CAROUSEL`) e Story (`STORIES`).
   - Facebook: a chave da página é pedida na hora e fica só na memória. Foto vai por `/photos`, carrossel por várias fotos num post só (`attached_media`), Reels pelo fluxo próprio de Reels da página e Story pelos endpoints de story da página (se você quiser, pergunta 7).
4. **Nos minutos seguintes**, confere `status_code` do contêiner. Quando der `FINISHED`, chama `media_publish`, grava o id e o link, apaga a cópia temporária e, se for o caso, move o card.
5. **Erro:** grava a mensagem da Meta traduzida, marca erro, tenta de novo **no máximo 1 vez** sozinho e avisa você.
6. **Chave só no cabeçalho** (`Authorization`), nunca no endereço (que aparece em log). O log nunca mostra a chave.
7. **Chave de segurança `POSTAR_DE_VERDADE`**, desligada por padrão: o funcionário faz tudo e para antes do `media_publish`. Só é ligada com o seu OK, no dia do primeiro post real.
8. **Versão da API da Meta:** fixar a mais nova no dia da construção (a v23.0 funcionou em 19/10).

Por que em etapas: uma função no servidor vive no máximo 400 s, e um Reels pode levar minutos para a Meta processar. Esperar tudo de uma vez pode estourar o tempo e deixar o card pela metade. Em etapas, cada minuto faz um pedaço curto, e o pedaço "publicar" só acontece uma vez.

**Passo 3 · Tela (ficha e card da Esteira):**
- Campo "Legenda" na ficha, com contador 0/2200.
- No "Programar postagem": formato (já existe), Instagram/Facebook, data e hora (já existe).
- **Checagem antes de programar**, que mostra o que falta em vez de deixar a Meta recusar: legenda, pelo menos 1 arquivo, Reels = 1 vídeo, carrossel = de 2 a 10 arquivos, imagem em JPG (o Instagram só aceita JPG), empresa You.
- Card Aprovado: "Programado · data · redes", botão "Postar agora" (com confirmação), "Postando…", faixa vermelha com o motivo e "Tentar de novo".
- Card Postado: links "Ver no Instagram" e "Ver no Facebook". Isso ajuda o 204 (histórico no Mapa).

**Passo 4 · Prova sem a Meta.** Teste com uma Meta falsa (um servidor de mentira na própria máquina, que responde como a Meta) e com o banco falso local (método das fotos do 195): agendado, postar agora, erro, dois despertadores ao mesmo tempo (tem que sair um post só) e chave nunca aparecendo no log. Fotos da tela.

**Passo 5 · Plugar o Drive (depois do 203).** Antes de copiar para `postagens`, o funcionário baixa o arquivo do Drive (pelo id do arquivo, que o 203 grava). Ele faz isso **em fluxo**, passando o arquivo aos pedaços sem segurar tudo na memória, porque a memória do funcionário é de 256 MB e um vídeo pode ser maior. **Primeiro teste:** o MAIOR vídeo real que vocês têm, só copiando, sem a Meta. Se em fluxo não couber, o plano B é mandar o vídeo direto do Drive para o envio retomável da Meta (`rupload.facebook.com`), sem cópia no Supabase.

**Passo 6 · Ir para o ar, só com o seu OK por escrito em cada ponto:**
1. Você cola o 019 no SQL Editor e sobe o limite global do Storage.
2. Sobe o funcionário com `POSTAR_DE_VERDADE` desligado. Primeira chamada à Meta só para conferir a cota (`content_publishing_limit`), que é leitura e não posta.
3. Teste até o contêiner, sem publicar (precisa do seu OK, porque já é uma chamada de escrita na Meta, mesmo sem post).
4. **Primeiro post real:** foto e legenda aprovadas por você no chat, com "Postar agora". Print do perfil.
5. Card agendado para dali a 10 minutos, com o seu PC desligado. Print com o horário.
6. Erro de propósito (PNG ou link quebrado): faixa vermelha e aviso. Print.
7. Busca pela chave no repositório e nos logs: zero ocorrências.

Depois das suas respostas, este plano vira o plano completo no formato writing-plans (com o SQL e o código de cada tarefa) para os terminais.

---

## (d) Riscos

| Risco | O que pode acontecer | Como o plano evita |
|---|---|---|
| **Post em dobro** | Dois despertadores pegam o mesmo card, ou o "publicar" dá timeout mas saiu | Catraca atômica, `unique(tarefa_id, rede)` e `conteiner_id` guardado antes. Depois de um timeout, o funcionário **confere** se o contêiner já está `PUBLISHED` antes de tentar de novo |
| **"Postado" de mentira** | Hoje o despertador já move para Postado sem postar. Se o funcionário entrar no ar e o despertador velho continuar, o card some de "Aprovado" e nada é postado | Trocar o despertador e subir o funcionário **no mesmo passo** do Passo 6 |
| **Chave vazar** | Chave aparecer em log, no navegador ou no repositório | Só no cofre, só no cabeçalho, log sem a chave e busca no fim (prova 7) |
| **Vídeo grande** | Memória de 256 MB, limite global de 50 MB e 400 s de vida | Cópia em fluxo, você sobe o limite, teste com o maior vídeo e plano B |
| **Autorização do Google morrer em 7 dias** | Se o app do Google ficar no modo "Teste", a autorização expira toda semana e os posts com vídeo do Drive param | **Requisito para o 203:** tela de consentimento do Google no modo "Em produção" |
| **Arquivo mexido no Drive** | O Matheus apaga ou move o vídeo antes da hora | O sistema acha o arquivo pelo id, e não pelo nome. Se o arquivo sumiu: erro claro no card |
| **Meta recusar o formato** | PNG, proporção ou duração fora da regra, mais de 10 itens | A tela confere antes de deixar programar |
| **Limite de 50 posts por dia via API** | Na prática, longe de ser atingido | Consulta à cota antes do primeiro post |
| **Robô perder a permissão** | Alguém remove o "You Publicador" no portfólio | Erro claro "a chave perdeu acesso", sem tentar de novo |
| **App da Meta em modo de desenvolvimento** | Por ser conta da própria You, provavelmente não precisa de revisão da Meta | Confirmado no teste do contêiner (Passo 6.3), antes de qualquer post |
| **Arrastar o card no meio da postagem** | Card vai para outra coluna com o post meio feito | Trava do banco durante "enviando/processando" |
| **Versão da API envelhecer** | A Meta desliga versões depois de ~2 anos | Versão escrita num lugar só, fácil de trocar |

Fora do escopo (igual ao briefing): Beec, TikTok, Kwai e YouTube.

---

## (e) Quantos terminais e quais modelos

**4 terminais.** O 1 começa sozinho, porque define o "contrato" (nomes de colunas e tabela). Depois o 2 e o 3 trabalham em paralelo, e o 4 revisa.

| # | Terminal | O que faz | Modelo |
|---|---|---|---|
| 1 | Banco (papel da Alvenaria) | `019_postagem.sql`, arquivo único para colar, provas só de leitura | **Sonnet** |
| 2 | Funcionário (`postar-meta`) | Edge Function, Meta falsa para teste, cópia do Drive, chave de segurança | **Opus**. Justificativa: é a única peça que publica para fora **sem volta** (post público com a marca da You), mexe com a chave e precisa garantir "nunca duas vezes" entre banco, Drive e Meta, com timeouts. Um erro aqui é um post duplicado ou errado no perfil, e não um botão torto |
| 3 | Tela (Sextante, dono da ficha e do card) | Legenda, redes, Postar agora, estados, checagens, fotos | **Sonnet** |
| 4 | Lupa | Revisa o 019 e o funcionário antes de qualquer coisa ir para o ar (só aponta, não edita) | **Sonnet** |

---

## (f) Perguntas que só você responde

1. **Onde postar.** No "Programar postagem", embaixo dos botões de formato (Reels, Post, Carrossel, Story), aparecem dois botões que acendem: **[Instagram] [Facebook]**. Os dois vêm acesos e você apaga o que não quiser. Pode ser assim?
2. **Legenda.** Na ficha do card, logo abaixo do título, entra uma caixa **"Legenda"** com um contador "0/2200" no canto. Quem escreve é o Matheus e você confere ao aprovar? A mesma legenda vale para o Instagram e para o Facebook?
3. **Aviso de erro.** Quando der erro, além da faixa vermelha no card, por onde você quer o aviso: **WhatsApp** (como os seus avisos de hoje) ou **Telegram** (como sugere o briefing do MetaPro)?
4. **"Postar agora".** O botão fica ao lado de "Programar postagem" no card Aprovado e, ao clicar, aparece: "Postar agora no Instagram e no Facebook da You? Não dá para desfazer." [Cancelar] [Postar]. Pode ser assim?
5. **Imagem que não é JPG.** O Instagram só aceita JPG. Quando o arquivo for PNG, o card mostra "Esta imagem precisa ser JPG (no Canva: Baixar → JPG)" e não deixa programar. Ou você prefere que o sistema converta sozinho (mais trabalho e risco de perder qualidade)?
6. **Tamanho dos vídeos.** Qual é o tamanho do maior Reels de vocês (em MB)? E você pode subir hoje, no painel do Supabase (Storage → Settings → "Upload file size limit"), o limite para 500 MB? É 1 campo e 1 botão "Save". Eu guio clique por clique.
7. **Story no Facebook.** Story vai só para o Instagram ou também para o Facebook?
8. **Erro e nova tentativa.** Quando der erro, o sistema tenta sozinho mais 1 vez e depois para, com o botão "Tentar de novo" na faixa vermelha. Está bom assim?
9. **Primeiro post real.** Qual card (foto ou vídeo e legenda) você quer usar no primeiro teste no perfil @you.contabilidade? Você aprova aqui no chat antes.

**O que é da sua parte, além das respostas:** subir o limite do Storage (pergunta 6), dar o clique de autorização do Google do 203, colar o 019 no SQL Editor, dar o OK por escrito para subir o funcionário e aprovar o primeiro post. **O lado da Meta (app, robô, chave e permissões) já está pronto e não precisa de nada seu.**

**O que dá para fazer já, sem você:** escrever o 019 (sem aplicar), o funcionário com a Meta falsa e a tela com o banco falso. Ou seja, os Passos 1 a 4 inteiros. Só o Passo 5 espera o 203, e só o Passo 6 espera você.

---

## (g) Respostas do Natham (23/10)

**Estado:** NADA construído. Aguardando ele fechar as decisões ("decidir tudo antes").

- **Despertador:** NÃO quer relógio tocando a cada minuto procurando card ("não quero gastar execuções atoa"). Quer que acione só quando ele mandar: Programar ou Postar agora.
  - Proposta do Maestro (APROVADA, item 1 abaixo): ao clicar Programar, o banco cria UM alarme de uso único para aquele horário (pg_cron com data exata, que se apaga depois de rodar). O cron de todo minuto `tarefas_postar_vencidos` sai. Vídeo só ganha mais 2 ou 3 conferências curtas logo após a entrega.
- **Vídeo sempre na MÁXIMA qualidade:** o sistema nunca recomprime; manda o arquivo original.
- **1 · Instagram + Facebook acesos:** SIM.
- **2 · Legenda:** SIM, "ele gera e eu posso editar" (resposta completa logo abaixo).
- **2 · Legenda, fechada em 23/10:** o Matheus cola a descrição quando sobe o conteúdo. O Natham vê o conteúdo e a descrição juntos para validar.
  - Aprova o conteúdo e não a descrição: ele mesmo edita a descrição e aprova em seguida.
  - Reprova o conteúdo: o card volta para Edição com a etiqueta Consertar em VERMELHO e com ícone de conserto.
  - **O que o Aprovar/Consertar da rodada 193-207 já faz** (conferido no código, Sextante 612eebe a bc1d8df, NÃO publicado):
    - Aprovar e Consertar aparecem só no card da Esteira em "Em análise", para o Natham e o aprovador (na ficha não, porque o Salvar dela desfaria a aprovação).
    - Consertar já leva o card para Edição e liga a etiqueta. O banco (015) apaga a etiqueta quando o card sai de Edição.
    - A etiqueta já é vermelha (cor de "atrasado"), com o texto "CONSERTO" e um brilho passando (`selo-conserto` em `aprovacao.css`). Aparece só no card da Esteira.
  - **Diferença para o que ele pediu:**
    1. Falta o **ícone de conserto** na etiqueta. Já estava na fila de aparência do Sextante deixá-la no formato da etiqueta "Começar", menor e sem foto.
    2. Falta o **campo de descrição (legenda)**. Editar e depois aprovar funciona no fluxo atual: ele abre a ficha, corrige, salva (o card continua em "Em análise") e clica Aprovar no card.
    3. Falta **ver o conteúdo junto da descrição na hora de aprovar**. É o player do item 206, que entra com o 203.
    4. **Brecha a fechar no banco:** hoje a trava do 015 só protege o `postar_em` depois de Aprovado. Sem trava, o Matheus poderia mudar a legenda de um card já aprovado e o sistema postaria um texto que o Natham não viu. Proposta: depois de Aprovado, só o Natham ou o aprovador muda a legenda (e os anexos), igual ao `postar_em`.
  - **DECIDIDO pelo Natham (23/10):** depois de Aprovado, legenda e anexos só mudam pelo Natham ou por quem aprovou. A trava fica no banco, igual à do `postar_em` (015).
- **3 · Aviso de erro:** WhatsApp.
- **4 · Postar agora:** SIM, com botão de confirmar.
- **5 · PNG:** ele quer aceitar PNG. Proposta: aceita PNG e converte para JPG na qualidade máxima só na hora de mandar ao Instagram (o app do Instagram já faz isso hoje); o Facebook recebe o PNG original.
  - **Atualização 23/10:** ele quer mandar o PNG como está e deixar a Meta converter. Alerta do Maestro: pela API, a regra oficial do Instagram é só JPG (o app converte, mas a API pode recusar).
  - Proposta: no teste do Passo 6.3 (só até o rascunho, sem publicar, com o OK dele), mandar 1 PNG. Se a Meta aceitar, fica assim. Se recusar, o sistema converte só para o Instagram (ver a observação do Sextante sobre a conversão no servidor).
- **6 · Vídeo:** no DRIVE, como no 203 (pastas no Drive), NÃO no Supabase, por limite de armazenamento. Proposta: o vídeo vai do Drive direto para a Meta pelo envio em partes (resumable), sem cópia no Supabase, e o limite de 500 MB deixa de ser necessário. Foto pequena pode usar cópia de minutos.
- **7 · Story:** Instagram E Facebook.
- **8 · Tentar 1 vez sozinho:** SIM.
- **9 · Primeiro post:** testar na prática depois de pronto. A trava continua: foto e legenda aprovadas por ele antes.

**Observações do Sextante para o desenho (não são decisão):**
- O pg_cron instalado (1.6.4) não tem "rodar uma vez numa data". O alarme único se faz com a expressão do minuto, hora, dia e mês exatos, e o próprio trabalho se desagenda ao rodar. Reprogramar = trocar o alarme pelo mesmo nome; desaprovar ou arrastar o card = apagar o alarme. As 2 ou 3 conferências do vídeo podem ser alarmes únicos encadeados do mesmo jeito.
- Converter PNG para JPG dentro da função do servidor exige uma biblioteca em JavaScript puro (as nativas, como sharp, não rodam lá) e cabe no limite de 2 s de processamento só para imagens de tamanho normal. Provar com o maior PNG real antes de fechar.

### Respostas do Natham às 16 decisões abertas (23/10)

- **1 · Alarme de uso único:** SIM. O relógio de todo minuto (`tarefas_postar_vencidos`) sai.
- **2 · Saiu numa rede e falhou na outra:** SIM, como recomendado. O card fica em Aprovado com a faixa vermelha "Saiu no Instagram, falhou no Facebook", o link do que saiu e o botão "Tentar de novo só no Facebook". Só vai para Postado quando as duas saírem; nunca repete a rede que já saiu.
- **3 · Cancelar um programado = arrastar** para fora de Aprovado: SIM.
  - **PEDIDO NOVO:** botão de LIXEIRA no canto inferior ESQUERDO da ficha de edição (rodapé, do lado oposto de Cancelar e Salvar), que abre uma confirmação de exclusão do card.
  - Fechado depois (Natham e Matheus podem excluir). Combinado: card programado perde o alarme junto; card Postado: o post continua na rede (excluir o card não apaga o post).
- **4 · WhatsApp de erro:** só para ele por enquanto (Matheus depois).
- **5 · Avisos na ALEXA:** "post feito" e "post com erro" vão para a Alexa, como no CRM, cada um com o seu som. Fica para o FIM.
  - Fechado depois: o WhatsApp de erro continua JUNTO com a Alexa.
- **6 · "Postar agora":** só ele e o aprovador: SIM.
- **7 · Só a You** (Beec depois): SIM.
- **8 · Uma legenda para as duas redes:** SIM.
- **9 · Reels no Facebook sai como Reels:** SIM.
- **10 · Carrossel com vídeo:** só no Instagram, a tela avisa e apaga o botão do Facebook: SIM.
- **11 · CAPA:** ele quer mandar a capa que eles fazem junto com o Reels → **campo Capa na ficha**.
  - Instagram: a API aceita capa própria (`cover_url`).
  - Facebook Reels: conferido em 23/10, o guia oficial da Reels Publishing API (developers.facebook.com/docs/video-api/guides/reels-publishing) **não documenta campo de capa**. Fontes de terceiros se contradizem: Ayrshare diz que aceita e Later diz que não. A conferir no teste do rascunho (Passo 6.3). Se não der, o Reels do Facebook sai com o quadro que a Meta escolher e o do Instagram com a capa deles.
  - Do mesmo guia: o Facebook limita a **30 Reels por API a cada 24 h** por página. Longe do uso deles.
- **12 · O que a API não faz** (música da biblioteca, filtros, figurinhas, link no Story, Story sem legenda): ciente. Marcar pessoas, localização e colaborador fica FORA agora: SIM.
- **13 · Google em modo "Produção"** (requisito do 203), com o clique em "app não verificado" > Avançado > Continuar: SIM.
- **14 · Teste do PNG no rascunho** (Passo 6.3, sem publicar): SIM.
- **15 · Ordem:** publicar a rodada 193-207 primeiro e construir TUDO. Ele só vai postar quando tudo estiver pronto.
- **16 · 4 terminais** (Banco, Tela e Lupa em Sonnet; a função que posta em Opus): SIM.
- **Primeiro post real:** é o ÚLTIMO passo, depois de tudo pronto e testado com a Meta falsa. A trava continua: foto e legenda aprovadas por ele no chat.

**Fechado em 23/10 (depois desta rodada):**
- **Lixeira:** o Natham E o Matheus podem excluir um card.
- **Avisos de erro:** o WhatsApp continua JUNTO com a Alexa (os dois).

**Ainda em aberto:** capa própria no Reels do Facebook (resposta no teste do rascunho).

### Card que NÃO é post (decisão do Natham, 23/10)

- **Botão "Concluir"** no card da Esteira, no lugar de Aprovar e Consertar, para todo card cujo Tipo não é Postagem. Concluir **APAGA o card**: ele some de vez e não guarda histórico. Por isso não precisa de `concluida_em` nem de `concluida_por`, e não existe filtro "Concluídos" (as propostas anteriores caem).
- **Aprovado e Postado só para Tipo Postagem.**
- **Princípio dele:** nada guardado à toa. No Supabase não fica vídeo nenhum, só no Drive. 7 dias depois de postado, o arquivo sai do Drive (203).
- **Abertas na hora, fechadas logo abaixo:**
  - (a) Concluir pede confirmação?
  - (b) O card POSTADO continua no Mapa como histórico (só texto e link do post, sem arquivo, como o 204 previa) ou também é apagado depois de 7 dias?
- **Observações do Sextante para o desenho (não são decisão):**
  - Apagar o card tem de apagar junto os anexos dele (Supabase e Drive). Senão sobra arquivo órfão, que é justamente o "guardado à toa".
  - O 203 dizia que o anexo de card SEM empresa fica privado no Supabase. Com "no Supabase não fica vídeo nenhum", faltava decidir para onde vai o vídeo de um card sem empresa (fechado abaixo: não aceita).

**Fechado em 23/10 (respostas às abertas acima).** Motivo dele: não acumular informação desnecessária.
- **(a)** Concluir PEDE confirmação antes de apagar.
- **(b)** Card POSTADO fica no MAPA como histórico, só com o link da postagem, SEM foto ou vídeo vinculados (o arquivo sai do Drive em 7 dias).
- **(c)** Vídeo em card sem empresa: NÃO aceita. Para anexar, tem de escolher a empresa.
- **(d)** Apagar card (Concluir ou lixeira) apaga os anexos dele no Drive.

**Conferência final da seção (g), 23/10:** nenhuma decisão do Natham ficou aberta. Resta só 1 ponto técnico, que o teste responde e não ele: se o Reels do Facebook aceita capa própria (Passo 6.3). Duas leituras do Sextante, a confirmar no plano:
- O histórico do Mapa (b) guarda os campos do 204 (título, formato, rede, data) mais o link, sem arquivo.
- Apagar card (d) apaga também os anexos que estiverem no Supabase (imagem e documento de card sem empresa), e não só os do Drive.

### Seção 9 do BRIEFING do MetaPro (doc oficial conferida em 20/10) · muda 3 pontos

- **API da Meta: v26.0** (no lugar da v23.0 do teste de 19/10).
- **PNG:** pela API, o Instagram aceita SÓ JPG, em foto, carrossel e capa do Reel ("JPEG is the only image format supported"). A decisão do Natham "mandar o PNG e a Meta converte" **não é possível pela API**. Fica assim: **o sistema converte PNG para JPG sozinho, na qualidade máxima, só para o Instagram**. O Facebook recebe o PNG original. Para ele não muda nada: continua anexando PNG. **O teste do PNG no Passo 6.3 cai** (a doc já respondeu).
- **Capa do Reel no Instagram:** vai junto no envio (`cover_url`), em JPG, até 8 MB, 9:16. Resolvido.
- **Capa do Reel no Facebook:** existe, mas é um passo SEPARADO depois de publicar (`POST /{video-id}/thumbnails`, arquivo até 10 MB, `is_preferred=true`). Exige 2 permissões que o robô "You Publicador" NÃO tem (`pages_read_user_content` e `pages_manage_engagement`). Para usar, o Natham gera a chave de novo com essas 2 a mais e libera "Atividade da comunidade" da página para o robô. **DECISÃO DO NATHAM PENDENTE:** gerar a chave de novo (Facebook com a capa deles) ou Facebook sem capa própria (a Meta escolhe o quadro).
- Com isso, o ponto técnico "capa no Reels do Facebook" deixa de esperar o teste: a resposta é "dá, com as 2 permissões".

### Achado ao montar o plano (23/10)
- A **lixeira no rodapé da ficha JÁ EXISTE** (item 179, canto inferior esquerdo, com confirmação "Apagar / Cancelar"). Ela só aparece para o DONO do card (`podeApagar`: quem criou ou quem enviou). Por isso o Natham não a vê nos cards criados pelo Matheus. O pedido vira: **mostrar a lixeira também ao Natham e ao Matheus em todo card de conteúdo**, e fazer o apagar levar junto os arquivos do Drive.

### Capa do Reels (decisão do Natham, 23/10)
- **D1 = NÃO agora:** capa própria no Reels do Facebook fica para DEPOIS (sem gerar chave nova). O Facebook sai com o quadro que a Meta escolher.
- **Instagram:**
  - (a) com capa própria: vai a capa (JPG 9:16 até 8 MB; convertida se for PNG);
  - (b) sem capa própria: a ficha mostra o vídeo com uma barrinha para escolher o QUADRO da capa, e o sistema manda o momento escolhido (`thumb_offset`, em milissegundos) para a Meta, sem mexer no vídeo;
  - (c) sem nada: primeiro quadro.
- Ele aceita post sem capa.
- Banco: coluna `tarefas.capa_quadro_ms` (travada depois de Aprovado, como a legenda). Tela: Sextante. Envio: Correio. Vídeo tocando na ficha para a barrinha: Vitral (endereço assinado de 10 min que serve o vídeo do Drive por pedaços).
