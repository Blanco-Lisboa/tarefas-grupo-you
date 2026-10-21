# Plano do item 229 · Drive e tela Pastas no formato do Natham

**Estado (236): os 8 achados da Lupa em `docs/levas/2026-10-21-lupa-229.md` estão consertados (seção 13); a ordem segura de colar, implantar e publicar está na seção 13 e vale no lugar da ordem antiga da RETOMADA de 24/10.**
**Estado (atualizado na Etapa 1): respostas do Natham incorporadas; Etapa 1 da Alvenaria FEITA (banco 019 v2, função drive, camada de dados, banco falso da 3101). Nada aplicado em produção, função drive não implantada. Faltam Vitral (tela Pastas) e Sextante (ficha): ver seção 10.**
Autora: Alvenaria (24/10, via /arquitetar, nível Construção). Supabase do Tarefas = `uruhjlurcxpjhhgvuzwt` (nunca o do CRM).
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

**Cola-se só o 019, revisado (v2), no mesmo nome `supabase/_colar/019_postagem_drive.sql`.** O arquivo antigo é substituído e não se cola. Como o 019 nunca foi aplicado, um segundo arquivo teria de criar a tabela e logo alterar, e a Lupa já liberou o resto. A diferença da v2 para a que ela liberou é pequena e listada, para ela revisar só isso (todas as linhas novas têm "229" no comentário):
1. `ocasioes`: `+ permanente boolean not null default false`, `+ desligado_em timestamptz`, `- drive_pasta_id`.
2. `arquivos`: `+ empresa_id`, `+ formato`, `+ ocasiao_id`; remove o check do 001 (um entre tarefa e peça); constraint `arquivos_solto_ok`; política `arquivos_le` refeita com o ramo do documento solto.
3. Funções novas: `definir_permanente(uuid, boolean)` (Natham e Matheus ligam; só o Natham desliga; erro 42501; anota `desligado_em`) e `pode_mexer_pastas()`.
Nenhuma outra linha muda (gatilho, alarme, sentinela, alarmes de serviço, travas e permissões ficam). O `supabase/019_postagem_drive.sql` e o de `_colar/` são idênticos.


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

## 9. Respostas do Natham (item 229 da leva) e o que mudou no plano

1. **Tela Pastas = só o Drive + Ideias.** Saem "+ Nova pasta", peças soltas e "Adrian - Aprovar". Entra "+ Novo tema" (com o interruptor Permanente). "Ideias de conteúdo" fica como cartão único no alto de cada empresa, fora do Drive.
2. **Anexos antigos (Supabase) ficam só na ficha.** A árvore só conta arquivo com `drive_id`.
3. **Permanente:** o Natham liga e desliga; o Matheus pode LIGAR e NÃO desliga, e quem recusa é o **banco** (função `definir_permanente`, erro 42501), não só a tela. "Sem tema" nunca tem cadeado.
4. **NOVO: Natham e Matheus põem documentos nas pastas direto pela tela Pastas**, além da ficha (seção 11).

## 10. Divisão por território e contrato

**Etapa 1 (Alvenaria, FEITA):** `supabase/_colar/019_postagem_drive.sql` (v2), `supabase/functions/drive/acoes.ts`, `supabase/functions/_shared/pastas.ts`, `src/lib/dados/{drive,arvore}.ts`, testes e `scripts/exemplo-banco.mjs` (3101). Vitral e Sextante só começam sobre isto.

**Contrato (tudo em `@/lib/dados`):**
- `useOcasioes(): Ocasiao[]` com `Ocasiao = { id, empresaId, nome, permanente, desligadoEm? }`. `useDocumentosSoltos(): DocumentoSolto[]`.
- `arvoreDePastas({ empresaId, tarefas, ocasioes, documentos }): PastaFormato[]` (a tela só desenha). `PastaFormato { formato?, nome, temas }`; `PastaTema { ocasiao?, nome, permanente, vazio, conteudos, documentos }`; `PastaConteudo { tarefa, nome, arquivos, venceEm? }`. Os 4 formatos vêm sempre (Reels, Carrossel, Post, Stories); "Sem formato" só com conteúdo; "Sem tema" por último; tema `vazio` (sem nada em lugar nenhum) aparece em todos os formatos para dar onde subir o 1º documento.
- `criarOcasiao(empresaId, nome, permanente = false)`, `renomearOcasiao(id, nome): Promise<number>` (quantas pastas de conteúdo ficaram para nova chamada; 0 = tudo), `ligarPermanente(id, ligado)` (Error "Só o Natham desliga o Permanente." quando o banco recusa; a tela pode esconder o botão para o Matheus, mas não é ela que decide).
- `organizarCard(tarefaId): Promise<boolean>`: a ficha chama DEPOIS de salvar quando título, formato, tema ou empresa mudaram e o card já tem arquivo no Drive.
- `enviarDocumentoNaPasta({ empresaId, formato?, ocasiaoId? }, file, aoProgredir?)`, `apagarDocumentoSolto(id)`.
- `venceEm(tarefa, tema)` e `arquivosDoDrive(tarefa)` (para "some em N dias").
- Todos os erros são `Error` com mensagem pronta para a tela (padrão do `drive.ts`).

**Vitral (tela Pastas, `components/pastas/`):** Empresa → Formato → Tema → conteúdos, com cadeado no Tema permanente, ⋮ do Tema (Renomear, Permanente), "+ Novo tema" (nome + Permanente), subir e apagar documento solto dentro da pasta do Tema, "Ideias de conteúdo" como cartão único. Aviso ao desligar o Permanente: "Os conteúdos já postados deste tema serão apagados do Drive 7 dias depois de agora." Remove o que sobrou: `pastas.ts`, `pecas.ts` e a UI de peça solta e de pasta avulsa (a Alvenaria não apagou para não quebrar a tela atual antes de a nova existir).
**Sextante (ficha, `components/ficha/`):** campo Tema com "Criar tema" e interruptor Permanente (o Natham e o Matheus ligam); chamar `organizarCard` depois de salvar; texto de ajuda do Tema.

### 10b. Mudança do 234: PASTA LIVRE (só acrescenta ao contrato acima)

**O que é:** a "+ Nova pasta" da tela Pastas. Uma pasta por empresa, com nome + Permanente (padrão desligado), no Drive em `Tarefas · Conteúdos → Empresa → <nome>`, ao lado das pastas de formato. NÃO é Tema (Tema continua só de post, com a regra dos 7 dias e o Permanente dele como está). Qualquer arquivo; nada sai sozinho, com ou sem cadeado.
**Regras (do banco, não da tela):** cadeado = a pasta não se apaga (gatilho do banco barra até a chave de serviço); renomear pode com cadeado; só o Natham desliga (Matheus liga, o banco recusa o resto). Nome repetido na empresa ou nome de formato ("Reels", "Carrossel", "Post", "Stories", "Sem formato") é recusado. Apagar sem cadeado manda a pasta e o que tem nela para a lixeira do Drive.
**Tipos/funções novos em `@/lib/dados`:**
- `PastaLivre = { id, empresaId, nome, permanente }`, `usePastasLivres()`.
- `criarPastaLivre(empresaId, nome, permanente = false)`, `renomearPastaLivre(id, nome)`, `ligarPermanentePastaLivre(id, ligado)`, `apagarPastaLivre(id)` (a tela confirma antes; com cadeado: Error "Esta pasta tem cadeado. Desligue o Permanente para apagar.").
- `pastasLivresDaEmpresa({ empresaId, pastas, documentos }): { pasta, documentos }[]` (por nome; pasta vazia aparece).
- `DocumentoSolto` ganha `pastaLivreId?`; `DestinoPasta` ganha `pastaLivreId?`. `enviarDocumentoNaPasta({ empresaId, pastaLivreId }, file)` sobe para a pasta livre; `apagarDocumentoSolto(id)` apaga arquivo dela.
**Decisão sobre documentos soltos (a mais simples):** a tela usa SÓ a pasta livre. O destino Formato/Tema do 229 continua funcionando na função e em `enviarDocumentoNaPasta`, mas a tela Pastas não precisa mais oferecer subir arquivo dentro de pasta de Tema (some do contrato de uso; pode ser removido depois sem migração, pois não há dado em produção).
**Árvore dos posts:** `arvoreDePastas` ignora os documentos da pasta livre (eles não caem em "Sem formato / Sem tema").
**SQL (no mesmo `_colar/019_postagem_drive.sql` v2, marcas "234"):** tabela `pastas_livres`, gatilho do cadeado, `definir_permanente_livre`, `pode_apagar_pasta_livre`, e `arquivos.pasta_livre_id` (a constraint `arquivos_solto_ok` ganha o ramo da pasta livre). Chave no Drive: `livre:<id>` em `drive_pastas`.
**Banco falso da 3101:** 2 pastas livres na You ("Logos e marca", com cadeado, e "Referências") com arquivos de vários tipos.

### 10c. 238: o interruptor da postagem automática na tela (para o Sextante, achado 1 da Re-revisão)

```ts
// @/lib/dados
export type PostagemAutomatica = { ligada: boolean; deVerdade: boolean };
export const usePostagemAutomatica: () => PostagemAutomatica;   // reativo
export const lerPostagemAutomatica: () => PostagemAutomatica;   // o mesmo valor, fora de componente
export const recarregarPostagemAutomatica: () => Promise<void>; // ler de novo agora
export function acompanharPostagemAutomatica(doc, cadaMs = 300000): () => void; // a camada já chama: relê ao voltar para a aba e a cada 5 min
```
- `ligada` = interruptor do banco (`public.postagem_automatica_ligada()`, só leitura; o 019b liga). `{ ligada: false, deVerdade: false }` enquanto carrega, antes do 019 e entre o 019 e o 019b.
- **239 · `deVerdade`** = a função `postar-meta` CONFIRMOU `POSTAR_DE_VERDADE=sim`. Ela responde à ação `modo` (só com login; devolve só `{ deVerdade: true|false }`, nenhum segredo; CORS ligado). **False também quando a função está fora do ar ou não respondeu** (conservador). Regra para os textos do Sextante: `ligada && deVerdade` = pode prometer "vai ao ar"; `ligada && !deVerdade` = "modo de teste: nada sai nas redes"; `!ligada` = "hora marcada" (como hoje). Só é perguntado à função quando `ligada`.
- **Releitura (239/4):** a camada relê quando a aba volta a ficar visível e a cada 5 minutos com a aba visível; as telas não precisam chamar nada.

Vem do banco (`public.postagem_automatica_ligada()`, só leitura do interruptor do 019; o 019b liga). **Ligada** = o banco chama a função de postagem: só então a ficha pode prometer "vai ao ar". **Desligada** = Programar e Postar agora não podem prometer post: o card só vira Postado na hora marcada (relógio do 015). Atenção: mesmo ligada, `POSTAR_DE_VERDADE=nao` é modo de teste (a função não publica); o banco não sabe disso, então a frase da ficha deve dizer "modo de teste" até o Natham trocar para `sim` (decisão de texto do Sextante, que o Natham confere).
Na cópia de exemplo (3101) está desligada; ligada em teste: `EXEMPLO_POSTAGEM_AUTOMATICA=1 npm run exemplo`; ligada de verdade: junto com `EXEMPLO_POSTAR_DE_VERDADE=1`.

## 11. Documento solto numa pasta de Tema (sem card)

- **Onde entra:** direto na pasta do Tema DENTRO do Formato em que a pessoa está: `Tarefas · Conteúdos → Empresa → Formato → Tema` (ou "Sem tema"; "Sem formato" se a pasta é essa). Não cria pasta de conteúdo.
- **No banco:** linha em `arquivos` com `tarefa_id` nulo, `drive_id`, `empresa_id`, `formato` e `ocasiao_id` (constraint `arquivos_solto_ok` do 019 v2: solto precisa de empresa e Drive, e não é de card nem de peça). O check antigo do 001 (exatamente um entre tarefa e peça) é removido no 019 v2. Leitura: qualquer pessoa com login (política `arquivos_le`). Escrita só pela função `drive` (a política de inserir exige `drive_id` nulo).
- **Função:** `sessao_envio_pasta` e `confirmar_envio_pasta` (mesmo desenho do envio de card: o navegador sobe direto ao Drive; a etiqueta `destino` vai no arquivo na abertura da sessão e a confirmação só aceita arquivo daquele destino). Quem pode: `pode_mexer_pastas()` (qualquer pessoa com login, hoje Natham e Matheus). Apagar: `apagar_anexo` (vai para a lixeira do Google) com a mesma checagem.
- **Vida do documento solto:** NÃO vence em 7 dias (não existe "Postado" que arme o relógio); sai só quando alguém apaga. O Permanente do Tema não muda isso. **Esta regra é minha escolha; o Natham não foi perguntado** (ver "Decisão que só ele toma" no fim da Etapa 1).
- **Tema permanente e conteúdo:** só afeta conteúdos de card Postado.

## 12. O que foi provado na Etapa 1

- **Função `drive` (Google e banco falsos):** cadeia de 4 níveis e nome da pasta; mover e renomear ao mudar título, formato, tema ou empresa (o arquivo continua o mesmo, pelo id); renomear tema renomeia pastas do tema e dos conteúdos; `limpar` em tema comum apaga arquivos e a pasta do conteúdo; `limpar` em tema permanente não apaga e DESARMA o alarme; apagar o card de propósito leva tudo, mesmo em tema permanente; apagar o último anexo tira a pasta vazia; Matheus liga e é recusado ao desligar (a recusa do banco falso repete a regra do SQL); desligar rearma 10080 min só dos Postados com arquivo; mudar o tema de um Postado rearma ou desarma; documento solto (envio, confirmação, repetição, destino trocado, tema de outra empresa, tamanho que não bate, apagar).
- **Camada de dados:** `arvoreDePastas` e `venceEm` com testes (7 dias, permanente, desligar recomeça, sem tema, vazio, documento solto).
- **NÃO provado (só depois de aplicado, com Drive e banco reais):** o SQL do 019 v2 (gatilho, cron, `definir_permanente`, `arquivos_solto_ok`) nunca rodou em banco; cotas e tempo do Drive real; compartilhamento com o Matheus. A Lupa precisa revisar a diferença do 019 (seção 6) antes de o Natham colar.

## 13. 236 · Consertos da Lupa e a ORDEM SEGURA

**Achado → conserto** (todos provados; SQL no Postgres local de `supabase/prova_local/prova_236.sh`, 43 conferências, "FALHAS: 0"; função e dados em Vitest):
1. **Crítico, o 019 desligava o relógio do 015 antes da `postar-meta` existir:** o 019 v2 NÃO tira mais o relógio de todo minuto. Nasce o interruptor `private.interruptores` (`postagem_automatica`, DESLIGADO): desligado, o relógio do 015 segue movendo Aprovado → Postado e os alarmes por card se apagam sem chamar função; ligado, `postar_vencidos()` não faz nada. A troca é do bloco separado **019b**, colado só com a função no ar. Seguro em qualquer ordem.
2. **Alto, card vencido ou a ≤ 1 min ficava sem relógio:** com a troca adiada, o relógio antigo cuida deles até o 019b. O 019b então toca já os vencidos e os do minuto atual, e arma os futuros; `armar_alarme` agora manda hora "dentro do minuto que passa" para o próximo minuto cheio (antes só tocaria no ano que vem).
3. **Alto, a limpeza alcançava anexo antigo do Supabase:** o gatilho, a migração e o alarme só consideram arquivo com `drive_id`; a função `drive` na limpeza (`soDrive`) só apaga o que é do Drive. Apagar o card de propósito segue levando tudo.
4. **Alto, o 019 recusava o que a versão publicada permite:** removida a trava "só Postagem vai para Aprovado/Postado". Só card de Postagem arma alarme de postar.
5. **Médio, renomear Tema com mais de 40 pastas não terminava:** `renomear_ocasiao` recebe e devolve `cursor` (e `restantes` só conta pastas que existem); `renomearOcasiao` repete até acabar.
6. **Médio, Tema/pasta livre já Permanente na criação contornava quem liga:** a criação confere `pode_ligar_permanente()` no banco (só Natham e Matheus); mexer nas pastas também ficou só deles.
7. **Médio, arquivo podia ter dois donos:** `arquivos_solto_ok` exige EXATAMENTE um entre card, peça e documento solto (pasta livre incluída).
8. **Médio, a tela estimava o vencimento:** `tarefas.postado_em` (o gatilho grava a entrada em Postado; o 019 grava `now()` nos que já estavam); `venceEm` usa essa data.
Junto: a camada de dados exporta `NOME_FORMATO`, `SEM_FORMATO`, `SEM_TEMA`, `nomeFormato` e `nomePastaConteudo` (os nomes como o Drive escreve). Contrato novo: `Tarefa.postadoEm?`.

**ORDEM SEGURA (substitui a da RETOMADA de 24/10; a das funções antes do SQL vale):**
1. **Antes, só leitura:** Lupa revisa o 019 v2 e o 019b; rodar `sh supabase/prova_local/prova_236.sh` (FALHAS: 0); consulta de vídeos antigos no Supabase (a trava do começo do 019 já para se houver).
2. **Natham, com recrutas:** cadastrar `POSTAR_DE_VERDADE=nao`, o e-mail do Matheus, os segredos Google e conferir a chave da Meta; **implantar as funções** `drive`, `postar-meta` e `google-autorizar`. Ninguém as chama ainda: nada muda para quem usa o site.
3. **Colar o 019 v2** (seguro agora: interruptor desligado, relógio do 015 segue, anexo antigo protegido, arrastar qualquer card até Postado continua valendo). Conferir: `tarefas_postar_vencidos` ainda existe; `select ligado from private.interruptores` = false.
4. **Publicar a interface nova** (compatível com o banco novo) e autorizar o Drive em Configurações.
5. **Colar o 019b** (liga a postagem automática, toca os vencidos, tira o relógio de todo minuto), com `POSTAR_DE_VERDADE=nao`: testar rascunho na Meta e um Drive real. Aviso de erro no WhatsApp (n8n) ligado antes do passo 6.
6. **Natham aprova o primeiro post** e muda para `POSTAR_DE_VERDADE=sim`; acompanhar as duas redes e os links. Para voltar atrás a qualquer hora: `update private.interruptores set ligado = false where nome = 'postagem_automatica';` e reagendar `tarefas_postar_vencidos` (comando no topo do 019b).

### 13b. 238 · Consertos da Re-revisão 1 (achados 2, 3, 4, 6 e 7; o 5 NÃO se faz: documento solto só em pasta livre, decisão do Natham)
- **2 (Adrian apagava pasta livre):** `iniciar_apagar_pasta_livre` (banco) só deixa Natham e Matheus; a função também exige `pode_mexer_pastas`.
- **3 (arquivo anexado depois de Postado):** gatilho em `arquivos`: arquivo do Drive novo em card já Postado arma a limpeza de 7 dias (uma vez só; anexo antigo sem `drive_id` não).
- **4 (ficha não tirava o Tema):** `salvarTarefa` manda `ocasiao_id: null` quando o card tinha Tema e agora não tem (`campoOcasiao`).
- **6 (cadeado contra exclusão/limpeza):** trava de linha no banco: `iniciar_apagar_pasta_livre` e `iniciar_limpeza_tema` marcam "apagando/limpando" e ligar o Permanente espera 10 min (erro 55006, mensagem pronta); se o cadeado entrou antes, apagar e limpar não começam.
- **7 (prazo errado até recarregar):** `postadoEmDe` grava a data real na memória ao salvar (o banco grava a mesma).
- **Interruptor para a tela:** seção 10c. O 019 v2 continua seguro para colar ANTES das funções e da interface: `prova_236.sh` agora tem 61 conferências, 0 falhas.

### 13c. 239 · Hoje: HEAD publicado com o 019 v2 colado, SEM função drive e SEM Google (resposta; nada codado)
- **Anexo em card com Empresa:** falha (`/functions/v1/drive` não existe, ou o Google não está ligado). O card salva e a ficha avisa "a tarefa foi salva, mas o anexo não foi guardado". Card sem Empresa e anexo antigo seguem pelo Supabase. **Vídeo não entra em lugar nenhum** (o 019 só aceita vídeo no Drive). Capa por quadro e player de vídeo também dependem da função.
- **Tela Pastas:** abre; a árvore dos posts fica vazia (nenhum arquivo com `drive_id`), temas e pastas livres vêm vazios; "+ Nova pasta", "Subir arquivo" e "Criar tema" (todos passam pela função) mostram erro. Ideias de conteúdo funciona (não é Drive).
- **Mapa e Esteira:** normais (só leem cards). Ficha: Tema vazio, Publicação em "hora marcada" (interruptor desligado). Nada quebra a página.
- **Custo de um "Drive desligado"** (como o interruptor da postagem): pequeno. Banco: 1 função `public.drive_ligado()` = existe o segredo do Google no Vault (liga sozinho quando o Natham autoriza; sem tabela nova). Dados: `useDriveLigado()` (mesmo molde do `usePostagemAutomatica`, com releitura) + teste. Anexos: com o Drive desligado, imagem e documento de card com Empresa vão para o Supabase como hoje (ficam só na ficha, viram "anexo antigo" quando o Drive ligar); vídeo fica bloqueado com a frase "Vídeo precisa do Google Drive ligado". Pastas: faixa "O Drive ainda não foi ligado: as pastas aparecem depois que o Google for autorizado", com "+ Nova pasta", "Subir arquivo" e "Criar tema" desabilitados e explicados. Meio dia entre Alvenaria (banco, dados, anexos), Vitral (faixa) e Sextante (Criar tema, vídeo). Recomendo fazer: tira a restrição de ordem do passo 4 da seção 13.
