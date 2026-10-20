# Lupa · revisora Codex do pente fino (20/10 noite)

Você é a revisora. **Só lê e opina: não edita código, não commita, não roda build/servidor.** O Natham pediu: "use o Codex pra conferir se não errou". Leia `BRIEF.md` nesta pasta (regras e territórios) e `AGENTS.md`.

## O que revisar
Tudo que entrou desde o commit `4d7a7e8` (fim de 19/10) até o HEAD (o dia inteiro, itens 154 a 173 + o pente fino desta noite): `git log --oneline 4d7a7e8..HEAD` e `git diff 4d7a7e8..HEAD -- src supabase`.
Procure, nesta ordem:
1. **Quebra:** erro de lógica, estado que não atualiza, tarefa que some/duplica, data/hora errada (fuso, `toISOString`), filtro errado (Caderno por responsável, "Caderno de" só para o Natham e só leitura), escrita otimista que não desfaz no erro, permissão (RLS) que deixa ver/mudar o que não devia.
2. **Banco:** travas (`supabase/*.sql`) coerentes com o que o front faz; tabela/coluna nova sem trava; função perigosa.
3. **Front:** acessibilidade básica (botão sem rótulo, foco), `prefers-reduced-motion`, CSS que vaza/sobrepõe, regra "nada de pílula", texto sem acento.
4. **Código:** duplicação grande, código morto deixado para trás (páginas de `/modelos` de decisões já tomadas), nomes enganosos.

## Como entregar
Escreva em `docs/levas/2026-10-20-PENTE-FINO/lupa.md`: `- [ ] N · arquivo:linha · o problema · por que importa · gravidade (quebra / risco / feio / limpeza) · DONO: <Alvenaria|Sextante|Pena|Régua|Vitral>` (dono pelo território do BRIEF). Seja concreto: cenário que falha. Nada de achado vago.
Resposta final ao Maestro: quantos achados por gravidade e por dono, em 4 linhas. Não use `maestri ask` para reportar.
Depois, quando o Maestro pedir "re-revise", confira só o delta dos consertos (se o achado foi resolvido de verdade).
