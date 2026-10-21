# Plano do item 229 · Drive e tela Pastas no formato do Natham

Só plano. Nada aplicado, nada codado. Autora: Alvenaria (24/10, via /arquitetar, nível Construção). Supabase do Tarefas = `uruhjlurcxpjhhgvuzwt` (nunca o do CRM).
Fontes lidas: item 229, 203, 204 da leva; RETOMADAs 23 e 24/10; `supabase/_colar/019_postagem_drive.sql`; `supabase/functions/drive/acoes.ts`; `src/lib/dados/{drive,pastas,pecas,ideias}.ts`; `src/components/pastas/TelaPastas.tsx`.

## 1. O que o Natham decidiu (resumo)

- Drive: `Tarefas · Conteúdos → Empresa → Formato → Tema (ou "Sem tema") → pasta do conteúdo ("<Formato> <tema> - <título>")`, com os arquivos do card dentro.
- Tela Pastas mostra as mesmas pastas, na mesma ordem.
- 7 dias depois de Postado o conteúdo vai para a lixeira do Drive e some da tela Pastas; o card fica no Mapa como histórico.
- "Permanente" no Tema: desligado por padrão, cadeado na pasta, liga e desliga no ⋮. Desligar recomeça a contar 7 dias. Apagar o card de propósito leva os arquivos junto, mesmo em Tema permanente.

## 2. Estado real hoje (conferido no repo; nada disso está em produção)

- Em produção só existem 014, 015 e 016. O 019 e a função `drive` nunca foram aplicados, e o Google ainda não foi autorizado. **Não existe pasta nem card no Drive real**: o desenho novo nasce sem nada para migrar. Esse é o melhor momento para mudar.
- O 019 hoje: tabela `ocasioes` (com `drive_pasta_id`), `drive_pastas(chave, drive_id)` (só a chave de serviço lê), gatilho `tarefas_alarmes` (Postado arma o alarme `limpar` para daqui a 7 dias), alarme de uso único com sentinela a cada 12 min, `armar_alarme_servico` e `desarmar_alarme_servico`.
- A função `drive` hoje cria `Raiz → Empresa → Ocasião` e, quando o card não tem tema, **inventa um tema com o título do card**. Isso sai.
- A tela Pastas mistura duas coisas: (a) pastas de navegador (`pastas.ts`, `pecas.ts`, `ideias.ts`, tudo em localStorage, Fase 1) e (b) os Temas do 203, que já saem de banco. O formato do Natham troca (a) pelo que vem dos cards.

## 3. Desenho (a decisão central)

**A tela Pastas passa a ser uma leitura do banco, sem estado próprio.** Um conteúdo aparece nela quando o card tem Empresa e pelo menos um arquivo no Drive (linha em `arquivos` com `drive_id`). A posição vem de `empresa_id`, `formato` e `ocasiao_id` (nulo = "Sem tema", formato nulo = "Sem formato"). Quando a limpeza dos 7 dias apaga as linhas de `arquivos`, o conteúdo some da tela sozinho, sem regra extra na tela. O card continua no Mapa.

**O Drive é espelho dessa mesma regra.** A função `drive` mantém as pastas em `drive_pastas` por chave (tabela que já existe e já é genérica):

| chave | pasta |
|---|---|
| `empresa:<empresa>` | Empresa (já existe) |
| `formato:<empresa>:<formato>` | Reels, Carrossel, Post, Stories ou Sem formato |
| `tema:<tema ou sem>:<empresa>:<formato>` | Tema dentro do Formato (o mesmo Tema tem uma pasta em cada Formato) |
| `card:<tarefa>` | pasta do conteúdo, nome `<Formato> <tema> - <título>` (sem tema: `<Formato> - <título>`) |

Por isso o `ocasioes.drive_pasta_id` deixa de servir: um Tema não é mais uma pasta só.

## 4. O que muda, por camada

**Banco (SQL v2 do 019, ver seção 6)**
- `ocasioes`: entra `permanente boolean not null default false`; sai `drive_pasta_id`.
- Gatilho, alarme, sentinela e `armar/desarmar_alarme_servico` ficam como estão. O leitor (`ocasioes_le`) já cobre a coluna nova, e quem escreve continua sendo só a função `drive`.

**Função `drive` (`supabase/functions/drive/acoes.ts`)**
- `pastaDoCard` vira "garantir a cadeia Empresa → Formato → Tema → pasta do conteúdo" e deixa de criar tema com o título do card.
- **Ação nova `organizar_card`** (idempotente): calcula onde a pasta do conteúdo deve estar e como se chama, e se ela existe e está diferente, **move** e **renomeia** pelo id (o Drive não perde `drive_id`, então anexos, player e capa continuam). A ficha chama depois de salvar quando título, formato, tema ou empresa mudaram e o card já tem pasta. `confirmar_envio` já move o arquivo para a pasta atual: passa a usar a mesma conta.
- `criar_ocasiao` ganha `permanente` (padrão falso). `renomear_ocasiao` renomeia as pastas do Tema e as pastas dos conteúdos dele (o nome delas leva o tema).
- **Ação nova `permanente_ocasiao`** (liga/desliga). Ao desligar, rearma `limpar` por 7 dias (`armar_alarme_servico`, 10080 min) para cada card Postado desse Tema que ainda tem arquivo. Ao ligar, só marca (os alarmes se desfazem sozinhos no próximo toque).
- `limpar` (o alarme dos 7 dias): se o Tema do card é permanente, **desarma** o alarme (`desarmar_alarme_servico`) e sai sem apagar. Isso é obrigatório: sem desarmar, o sentinela de 12 min tocaria de novo até o teto. Se não é permanente, apaga os arquivos como hoje **e manda para a lixeira a pasta do conteúdo** (`card:<tarefa>`), tirando a chave de `drive_pastas`. Repetir é seguro (lixeira de coisa que já foi conta como feita).
- `apagar_tarefa` (apagar de propósito, Concluir, lixeira): como hoje, leva os arquivos, **e agora a pasta do conteúdo**, mesmo em Tema permanente.
- `apagar_anexo` do último arquivo do card: manda também a pasta vazia para a lixeira, para o Drive e a tela Pastas não divergirem.
- Pastas de Formato e de Tema que ficam vazias no Drive **não** são limpas (só poluição visível no Drive; a tela Pastas não mostra pasta vazia). Pode virar limpeza depois.

**pg_cron**: nenhum job novo. Mesmo alarme de 7 dias depois do Postado. Só muda o que a função faz quando ele toca (acima).

**n8n**: nada. O desenho de n8n do 202 já foi substituído pelo 203; o brief `N8N-AVISO-POSTAGEM-BRIEF.md` é de aviso e não toca em Drive.

**Camada de dados (`src/lib/dados`, território da Alvenaria)**
- `Ocasiao` ganha `permanente`. `drive.ts` ganha `organizarCard(tarefaId)`, `criarTema(empresaId, nome, permanente)` e `ligarPermanente(temaId, ligado)`.
- Função pura nova `arvoreDePastas(tarefas, ocasioes, empresaId)` com teste (vitest): devolve Formato → Tema → conteúdos. A tela só desenha; a regra "aparece / some" fica num lugar com teste.
- Sai: `pastas.ts`, `pecas.ts` (e o que só eles usam). `ideias.ts` fica fora (pergunta 1).

**Tela Pastas (Vitral)**: por empresa, uma fileira de pastas de Formato; abrir um Formato mostra os Temas; abrir um Tema mostra os conteúdos (a folha atual, com o arquivo e o player). Cadeado na pasta do Tema permanente. O ⋮ do Tema ganha "Permanente" (liga/desliga) além de Renomear. O botão "+ Nova pasta" vira "+ Novo tema" (nome + interruptor Permanente). Ao desligar o Permanente, aviso: "Os conteúdos já postados deste tema serão apagados do Drive 7 dias depois de agora."

**Ficha (Sextante)**: o campo Tema ganha "Criar tema" com o interruptor Permanente; a ficha chama `organizarCard` depois de salvar quando mudou título, formato, tema ou empresa; texto de ajuda do Tema explica a pasta e o cadeado. Card sem tema não cria nada (vai para "Sem tema").

## 5. Ordem de construção (quem faz o quê)

0. O Natham responde as 3 perguntas e aprova este plano. Só então começa código.
1. **Alvenaria (base + banco)**, primeiro, porque define o contrato para os outros dois:
   - 019 v2 em `supabase/_colar/`; as quatro ações novas e a mudança de `limpar`/`apagar_*` na função `drive`, com testes no Drive falso (`google-falso.ts`, `drive.test.ts`).
   - `lib/dados`: tipos, as três funções, `arvoreDePastas` com teste, e o emulador do banco de exemplo (seção 7).
   - Entrega o contrato: as 3 assinaturas e `arvoreDePastas` (tipo de retorno).
2. **Vitral (tela Pastas)** e 3. **Sextante (ficha)** em paralelo, depois que a Alvenaria publicar o contrato no repo. Cada um só mexe no próprio território (`components/pastas/`, `components/ficha/`).
4. **Lupa** revisa a diferença do 019 e a função `drive` (como nas 5 passadas anteriores). Fotos de prova na 3101.
5. **O Natham** cola o 019 v2 no SQL Editor (a trava barra `apply_migration`), publica a função `drive`, autoriza o Google e põe os segredos. A Alvenaria só confere com leitura e faz o primeiro teste real com um card dele.

## 6. SQL: qual arquivo se cola

**Cola-se só o 019, revisado (v2), no mesmo nome `supabase/_colar/019_postagem_drive.sql`.** O arquivo antigo é substituído e não se cola. Como o 019 nunca foi aplicado, um segundo arquivo teria de criar a tabela e logo alterar, e a Lupa já liberou o resto. A diferença da v2 para a que ela liberou é pequena e listada, para ela revisar só isso:
1. `ocasioes`: `+ permanente boolean not null default false`, `- drive_pasta_id`.
2. Nenhuma outra linha muda (gatilho, alarme, sentinela, alarmes de serviço, travas e permissões ficam).
O SQL não é escrito agora; entra na etapa 1.

## 7. O que dá para provar e o que não dá

**No banco falso (3101), antes de publicar:**
- A árvore da tela Pastas (Empresa → Formato → Tema → conteúdos) com os cards de exemplo (inclusive os dois Reels com vídeo): cadeado, ⋮, "+ Novo tema", aviso ao desligar. O `scripts/exemplo-banco.mjs` ganha `permanente` nos temas e responde as ações `criar_ocasiao`, `permanente_ocasiao` e `renomear_ocasiao` em memória. Também simula "sumiu depois de 7 dias" (card Postado sem arquivo).
- `arvoreDePastas` com testes de unidade: sem tema, sem formato, Postado sem arquivo, tema permanente.
- Fotos 1440 (e 1903 e 390 pelo padrão do projeto).

**No Drive falso (testes da função `drive`):** a cadeia de quatro níveis; mover e renomear no `organizar_card`; formato trocado depois do upload; `limpar` normal, `limpar` em Tema permanente (desarma, não apaga), `apagar_tarefa` em Tema permanente (apaga); desligar Permanente (rearma 7 dias). Só confirma o contrato com o Google falso.

**Só depois de aplicado, com Drive e banco reais (não dá antes):** o gatilho e o cron de verdade, as cotas do Drive, o tempo real de mover pasta, o compartilhamento com o Matheus. Plano: um card de teste, com `limpar` armado para 1 minuto, na mão da Alvenaria e do Natham.

## 8. Riscos

- **Pastas e cards já existentes no Drive real:** nenhum (nada aplicado). O risco é só o inverso: se alguém aplicar o 019 antigo e subir arquivo antes da v2, nasce a estrutura "Ocasião" velha. Mitigação: o 019 antigo sai de `_colar/` quando a v2 entrar; a prévia 3398/3101 é banco falso e não vale.
- **Anexos antigos no Supabase (016):** cards com empresa que anexaram antes do 203 ficam no balde do Supabase, fora do Drive, e **não aparecem na tela Pastas**. Pergunta 2.
- **Renomear título, formato, tema ou empresa depois de criado:** vira mover e renomear a pasta do conteúdo, pelo id (o Drive não quebra link, player nem capa). Se o salvar acontece no meio de um envio, o `confirmar_envio` já leva o arquivo para a pasta atual. Se o Drive falhar na hora, o card salva e a próxima gravação refaz (a ação é idempotente); a ficha mostra aviso.
- **Formato trocado depois do upload:** coberto pelo `organizar_card` (a pasta muda de Formato). Formato nulo cai em "Sem formato" e, ao escolher um, a pasta se muda.
- **Renomear um Tema com muitos conteúdos:** uma chamada ao Drive por pasta, em fila. Aceitável (um tema tem de 5 a 10 conteúdos); se passar de umas 30, devolve "parcial" e pede nova tentativa em vez de estourar o tempo da função.
- **Dois conteúdos com o mesmo título, formato e tema:** o Drive aceita nome repetido; são pastas diferentes. Sem problema, só confusão visual no Drive.
- **Postado, depois movido de volta:** o gatilho desarma o alarme (já é assim). Voltar a Postado conta 7 dias de novo.
- **Mudar o Tema de um card já Postado:** se vai para Tema comum, a Alvenaria rearma 7 dias (consistente com "desligar recomeça"); se vai para permanente, o alarme se desfaz no toque.
- **Cota de Drive e função fora do ar na limpeza:** repete em 1 h (e o sentinela, em 1 dia). Enquanto não limpa, o conteúdo continua na tela (a tela diz a verdade do banco).
- **Pastas de Formato e de Tema vazias** ficam no Drive. Sem impacto na tela; limpeza futura.

## 9. Perguntas só dele (descrevendo a TELA)

1. **O que acontece com o que não é conteúdo de card?** Hoje a tela Pastas tem "+ Nova pasta", peças soltas (subir um arquivo direto numa pasta), "Adrian - Aprovar" e a pasta "Ideias de conteúdo". Pelo seu desenho, a tela passa a mostrar só Empresa → Formato → Tema → conteúdos. Eu proponho: tirar "+ Nova pasta", as peças soltas e "Adrian - Aprovar" (o "+ Nova pasta" vira "+ Novo tema") e deixar **Ideias de conteúdo como um cartão único no alto de cada empresa**, fora do Drive, porque ideia é texto e não arquivo. Pode ser assim?
2. **Anexos que já estão no Supabase.** Cards de empresa que receberam foto ou documento antes do Drive ficam no balde antigo e não aparecem na tela Pastas. Prefere que eles **fiquem fora das Pastas** (aparecem só na ficha, como hoje) ou que a gente **mande para o Drive** uma vez, para entrarem na árvore?
3. **Quem mexe no cadeado, e conteúdo sem tema.** No ⋮ do Tema, "Permanente" deve poder ser ligado pelo **Natham e pelo Matheus** ou **só pelo Natham** (o Matheus vê o cadeado, mas o botão fica desligado)? E a pasta "Sem tema" **não terá cadeado** (conteúdo sem tema sempre some em 7 dias): pode ser assim?
