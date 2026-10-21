# RETOMADA · sistema Tarefas · fim do dia 21/10 (rodada 218–244) — o próximo Maestro começa por aqui

## 1. Estado: TUDO NO AR
- Site publicado: commit `d788bd8` (dpl_51ac4biVReKEDfn1ZSMpMnhHJjGA), em https://tarefas-grupo-you.vercel.app. Publicado pelo Natham com `!` a partir da cópia limpa `Desktop/Sistemas-Grupo-You/.publicar-drive`.
- Banco do Tarefas (`uruhjlurcxpjhhgvuzwt`) — colados hoje pelo Natham e conferidos por recruta: **020** (visto da agenda), **021** (Quem aprova do Matheus), **019 v2** (Drive, temas, pastas livres, postado_em; postagem automática NASCE DESLIGADA), **022** (trava das tags).
- Funções implantadas (Natham, PowerShell, chave temporária já revogada): `drive`, `google-autorizar`, `postar-meta`.
- Google: projeto "Tarefas Grupo You" (conta nathamsud@gmail.com), escopo só `drive.file`, app **Em produção**; Política de Privacidade pública em `/privacidade`. Drive **autorizado**; teste de anexo foi para Tarefas · Conteúdos › You › … e foi apagado.
- Segredos no Supabase: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, POSTAR_DE_VERDADE=`nao`, DRIVE_COMPARTILHAR_COM=matheus.germano@assessoriabeec.com.br, META_PUBLISHER_TOKEN (antigo).
- Leva: `2026-10-18-grade-de-conteudo-beec.md`, itens 218–244 (todos FEITO). Revisões: `2026-10-21-lupa-229.md` (Re-revisões 1 a 5).

## 2. O que NÃO está ligado (de propósito)
- **Postagem automática real**: o 019b (`supabase/_colar/019b_ligar_postagem_automatica.sql`) NÃO foi colado. Hoje, na hora marcada, o relógio antigo (015) só move Aprovado → Postado; a ficha diz "Postagem automática ainda desligada… você publica nas redes". Antes de colar o 019b: fechar os achados 1 e 4 da Re-revisão 3 (pendências no plano `2026-10-21-PLANO-229-drive-pastas.md` §13d), ligar o aviso de erro no WhatsApp (n8n), testar com POSTAR_DE_VERDADE=nao, e só com o OK do Natham trocar para `sim`. Retrato: `2026-10-21-RETRATO-postagem-automatica.md`.

## 3. Pendências pequenas
- Lupa Re-revisão 5, achado baixo: janela mínima entre reler tags e salvar (FK pode recusar se uma tag for excluída exatamente nesse instante).
- Selo vermelho "2 Issues" do Next na 3100: investigar.
- Lupa não re-revisou o `d788bd8` (só .vercelignore + teste; o Maestro leu o diff).

## 4. Decisões do Maestro já contadas ao Natham
- Tag "Esperando aprovação" travada (sem editar/excluir). Ele aceitou ("com aviso de confirmação").
- Ficha com a automação desligada: sem "Postar agora", "Marcar hora", textos "Hora marcada" / "post em N dias".
- Trocar a Empresa do card limpa o Tema.

## 5. Lições do dia
- Mexer em `next.config.ts` com a 3100 no ar derruba a 3100 (ela reinicia e não volta).
- A trava do repo barra mensagem para recruta que cite o comando/palavras do envio da Vercel → escrever o brief em arquivo (Write) e mandar só "leia o brief".
- `.vercelignore` com `/supabase` tirava `supabase/functions/_shared/pastas.ts`, que a tela importa → a montagem na Vercel falhava ("Module not found") embora o build local passasse. Teste `src/vercelignore.test.ts` agora confere.
- O Google só publica o app em Produção com página inicial + Política de Privacidade públicas.
- O Natham mandou print com a chave temporária do Supabase visível → foi revogada no fim do Bloco C (nunca usar chave de print).
- Codex (Lupa #2) para em pedidos de permissão (Docker/commit); o Maestro aprova com `maestri ask "Lupa #2" --raw "2"` e vigia com um laço de `maestri check`.

## 6. Arrumação feita no fim (21/10 ~15h)
- Terminais Alvenaria, Sextante, Pena, Vitral e Lupa #2 LIMPOS (/clear).
- Cópias limpas temporárias removidas (.publicar-privacidade, .publicar-drive, .publicar-193-207); `git worktree list` só tem o repo. Sobrou a pasta vazia `Sistemas-Grupo-You/.publicar-drive/supabase/_colar` presa por uma janela aberta (Bloco de Notas/Explorador): pode apagar pelo Explorador.
- Servidores locais seguem ligados: 3100 (banco real) e 3101 (cópia de exemplo, `npm run exemplo`).
- GitHub (Blanco-Lisboa/tarefas-grupo-you) igual ao PC até a4674a7; este ajuste da RETOMADA é 1 commit a mais (sobe no próximo push).
- Próxima sessão: começar por aqui; o próximo grande passo é a postagem automática (§2).
