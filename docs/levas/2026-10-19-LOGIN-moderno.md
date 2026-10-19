# Tela de Entrar mais moderna (item 149) — Sextante

Pedido dele (foto `docs/referencias/2026-10-19-login-basico-134.png`, a tela /entrar de hoje): "quero uma área de login mais moderna e bonita! veja no 21st.dev e pesquise uma que se encaixe pra gente. tá muito básica essa".

## Tarefa (PESQUISA + 3 PROTÓTIPOS, sem mexer no app)
1. Pesquise em https://21st.dev (categoria login / sign-in / auth) as telas de entrar mais modernas e bonitas. Escolha as 3 que melhor combinam com a ID Névoa do Tarefas (neutra, clara, azul #0064CC, sem marca de empresa; ver `src/app/globals.css` e as telas atuais). Anote o link de cada uma.
2. Monte as 3 como PROTÓTIPO em `prototipos/login/opcao-1|2|3/` (página isolada; pode ser HTML estático ou rota em `src/app/modelos/login-N/` — NÃO toque em `src/app/entrar/` nem `src/components/entrar/`, que são da Alvenaria e estão em obra agora).
   - Mesmo conteúdo de hoje: logo do Tarefas (`public/`), E-mail, Senha, botão Entrar, a frase "Só entra quem foi convidado…". Nada de "Criar conta", login com Google ou "lembrar de mim" (cadastro é fechado).
   - Adapte à Névoa (cores, fonte, cantos do sistema). Se a peça do 21st.dev precisar de biblioteca nova (framer-motion, shadcn etc.), diga qual e prefira refazer o efeito com CSS/gsap (gsap já está instalado).
   - Celular (390) tem que ficar bonito também.
3. Fotos com Chrome FORA da tela (nunca mexa no mouse/teclado do Natham), 1903x910 e 390, em `provas/r6-login-opcoes/`. Imprima `window.innerWidth` na foto.
4. Commit só dos seus arquivos (prototipos/, provas/, e src/app/modelos/ se usar). Confira `git diff --cached --stat` antes: a Alvenaria tem muita coisa não commitada no mesmo disco — NÃO inclua nada dela.
5. Relatório: `maestri ask "Claude Code" "<3 opções: nome, link do 21st.dev, o que tem de especial, caminho das fotos, sha>"`.
