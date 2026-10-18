# BRIEF COMUM · Sistema de grade de conteúdo (ID Beec) · 18/10/2026

Todo recruta lê este arquivo INTEIRO antes de começar. Ele resume o que o Natham decidiu.
Os pedidos dele, numerados e com estado, estão em `2026-10-18-grade-de-conteudo-beec.md`, nesta mesma pasta.

## 1. O que é
Sistema para o Natham e o Matheus (vídeos, edição, gravação, roteiros) organizarem os conteúdos de TODAS
as empresas do Grupo You: agenda, data de cada postagem, o que cada um faz em cada dia. Começa com 2 empresas,
**Beec** e **You**. Depois vira um "Tarefas gigante" para outros usos, então o modelo de dados não pode ser
amarrado só a conteúdo.

## 2. Onde mora
- Projeto: `C:\Users\Natham Monteiro\Desktop\Sistemas-Grupo-You\grade-conteudo\` (nome provisório).
- É SEPARADO do CRM. Nunca mexa em `Desktop\CRM-You` nem leia o CRM como modelo de código.
- Leia também `Desktop\Sistemas-Grupo-You\CLAUDE.md` (regras da pasta).

## 3. Tecnologia (decidido)
- Método do kit do Matheus Gomes: receita `Sistemas-Grupo-You\_kit\docs\prompts\11-next-project-bootstrap.md`,
  lida do DISCO. Next.js (App Router, TypeScript, Tailwind, ESLint, `src/`, alias `@/*`).
- EXCEÇÕES à receita (decisão do Natham, 16/10): **Caveman NUNCA**. **Graphify NÃO** por enquanto. Nada no escopo
  da máquina (receita 10 proibida). Context7 só no projeto. Navegador de testes: Playwright/Chrome nosso, não o do kit.
- Banco: Supabase NOVO, só deste sistema, mas **só na Fase 2**. Agora (Fase 1) é tudo com DADOS DE EXEMPLO.
- Camadas: as telas NUNCA importam os dados de exemplo direto. Tudo passa por uma camada de dados única
  (ex.: `src/lib/dados/`), para trocar exemplo por Supabase depois sem mexer nas telas.
- Vídeos ficam no Google Drive (o sistema guarda o link). Imagens e carrosséis ficam no sistema (Fase 2).

## 4. Identidade visual: SÓ Beec
- Fonte da verdade: `Desktop\ID-Visual-ALL\Beec\BRIEFING.md` (a seção 14 vence as de cima) e
  `Beec\identidade\tokens.css` (bloco FINAL; nunca o LEGADO). Manual: `identidade\prancha.html`.
- **`ID-Visual-ALL` é SÓ LEITURA.** Não edite, não apague, não crie nada lá. Copie para o projeto e anote a origem
  em `ORIGEM-DA-IDENTIDADE.md`.
- Cores: bege `#F6F2EA` (fundo), superfície `#FFFDF8`, grafite `#18131F` (bloco escuro grande), roxo profundo
  `#2A075A` (botão, título, card escuro pequeno), kraft `#E6DCC8` (só apoio), ouro `#FFBF2F` (SÓ detalhe e SÓ no
  escuro), elétrico `#7319F1` (SÓ detalhe e SÓ no claro), tinta `#1A1024` (texto).
- Fontes (Google Fonts): Bricolage Grotesque (título e número, peso 800) + Host Grotesk (texto). Números no desenho
  padrão da fonte (sem tabular-nums).
- Pontos únicos: ângulo de 22° (destaque, selo e botão inclinam; texto e campo NUNCA); "orelhas" (canto de cima à
  esquerda + de baixo à direita cortados a 22°, use as classes `.corte-22` / `.corte-22-esq` do tokens.css, sombra
  no PAI); "ponta de barra" nos sublinhados; palavra em destaque elétrico no claro e ouro no escuro; sombra forte
  só num elemento herói por tela.
- Logo e ícones: SEMPRE pelo arquivo SVG copiado de `identidade\logo\svg\` e `identidade\icones\svg\`. Nunca redesenhe.
- PROIBIDO: pílula (raio é 2px, quase reto); roxo/elétrico como letra no escuro; ouro no claro; azul com roxo; neon;
  rosa/magenta/lilás; degradê no logo; listras, degraus, objeto 3D; orelha dobrada e selo em aba (são da Realizze);
  emoji na interface; travessão (— e –) em qualquer texto; quique/elástico no movimento (exceto a versão "exata" da
  pasta de vidro, ver §6); qualquer coisa da You no visual (laranja, Clash Display, Geist). Empresas aparecem por
  NOME num selo com as cores da Beec, nunca com as cores/logo de cada marca.
- Texto da interface em português do Brasil com acentuação correta.

## 5. Exceções visuais aprovadas pelo Natham (só onde está escrito)
- **Paleta de etiquetas**: cada tarefa tem a sua cor, como no Google Agenda. ~10 cores harmonizadas com a Beec, usadas
  SÓ nas etiquetas/eventos. Sem azul junto de roxo, sem neon. Contraste do texto sobre cada cor ≥ 4,5. Mora num token
  próprio do projeto (`--etiqueta-1..10`), com o porquê anotado.
- **Letra de mão**: SÓ na tela de Tarefas (caderno). Tudo escrito nas folhas parece feito à caneta ou a lápis.
- **Pasta de vidro**: versão "exata" do componente original (cantos redondos, quique) mostrada ao lado da adaptada.

## 6. Telas (Fase 1: com dados de exemplo)
Menu **lateral flutuante** (descolado da borda, vidro roxo `--vidro-roxo`, orelhas a 22°, item ativo em ouro), que
recolhe para só ícones. No pé: bolinhas N (Natham) e M (Matheus).
1. **Calendário** (tela PRINCIPAL, "beeeem detalhado"): visões dia, semana, mês e ano. Filtros: empresa (uma, várias
   ou todas), pessoa, rede (Instagram, TikTok, YouTube, Kwai), etapa, tipo. Cada tarefa com a sua cor. Arrastar de
   um dia/horário para outro. Coluna de "sem data" para arrastar para o calendário.
2. **Tarefas**: caderno de papel com letra de mão (ver §5). Tarefa com data aparece sozinha no calendário (mesmo dado).
   Mesmo filtro de empresa.
3. **Conteúdos**: quadro com colunas por etapa: ideia, roteiro, gravação, edição, aprovado, postado.
4. **Pastas**: pastas de vidro (componente "Glass Folder Cards", tom ESCURO, cores Beec) por empresa: Posts,
   Carrosséis, Vídeos, Stories. Abrir, ver as peças, baixar. Duas versões lado a lado: exata x adaptada à Beec
   (aba cortada a 22°, cantos quase retos, sem quique).
5. **Configurações**: cadastro de empresas (incluir/tirar). NÃO existe "trocar de empresa": a visão é sempre geral, e o
   FILTRO de empresa (global, lembrado entre telas) resolve "ver só uma".

## 7. Modelo de dados (uma peça só: a tarefa)
Conteúdo é um TIPO de tarefa, não uma tabela à parte. Campos sugeridos: `id, titulo, tipo (ideia/roteiro/gravacao/
edicao/postagem/reuniao/outro), empresaId, rede?, etapa?, responsavel (natham|matheus), inicio?, fim?, diaInteiro,
cor (etiqueta-N), notas?, links[] (Drive), arquivos[]`. Sem data = cai em "sem data". Empresas: `id, nome, sigla`.
Dados de exemplo: Beec e You, ~40 tarefas espalhadas entre out e nov/2026, dos dois responsáveis, todas as redes.

## 8. Como trabalhar
- Cada recruta escreve SÓ os arquivos do seu território (está no seu pedido). Precisou mexer fora? Pare e avise.
- NINGUÉM troca de branch. Commit pelo INDEX (`git add <seus arquivos>` + `git commit` SEM caminho), mensagem por
  arquivo (`git commit -F`). Confira `git diff --cached --stat` antes.
- Nada de: publicar, criar projeto Supabase, push para GitHub, instalar no escopo da máquina, Caveman, receita 10.
- Prova antes de dizer pronto: `npm run build` e lint passando + captura de tela em 1903x900, 1440x760 e 390
  (Playwright, viewport; imprima `innerWidth` na imagem). Chrome FORA da tela (`--window-position=-32000,-32000`
  ou headless). NUNCA mexa no mouse/teclado do Natham. Console limpo só vale depois de provar que o log captura.
- Capturas e notas de prova em `grade-conteudo/provas/<seu-nome>/`.
- Ao terminar, responda no próprio turno com: o que fez, arquivos, comandos de prova e resultado, pendências.
  NÃO use `maestri ask` para reportar (a resposta do turno já volta ao Maestro).
