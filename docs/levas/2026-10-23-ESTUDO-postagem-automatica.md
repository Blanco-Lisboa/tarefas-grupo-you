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
