# Brief Alvenaria — item 301 (aviso de hydration na 3100)

Leia o item 301 no fim de `docs/levas/2026-10-18-grade-de-conteudo-beec.md` e os itens 282 e 288 (você mesmo consertou o 288).

Print do Natham (Next.js 16.4.2 Turbopack, overlay "Recoverable Error"):
"Hydration failed because the server rendered HTML didn't match the client."
Diff (+ cliente / - servidor), dentro de `<MetadataWrapper>` → `<__next_metadata_boundary__>` → `<div`:
`+ hidden={true}` · `- hidden={null}` · `- className="translate-tooltip-mtz translator-hidden"` · `+ <Suspense name="Next.Metadata">` · `- {"\n   "}`

Hipótese do Maestro: extensão de tradução do Chrome dele (classe translate-tooltip-mtz / translator-hidden) injeta uma div no HTML antes do React. Confirme ou derrube; não assuma.

## O que fazer
1. Reproduza no dev (porta própria, não derrube a 3100): simule a extensão injetando essa div como no teste do 288 e veja o mesmo aviso.
2. Conserte para o aviso NÃO aparecer para ele na 3100, sem esconder erro de hydration de verdade do nosso código (nada de desligar o overlay inteiro). Se a única saída for desligar algo amplo, pare e explique as opções na mensagem final.
3. Prova: console/overlay limpo com a extensão simulada, 3 recargas; `npm run check` verde; foto em `provas/alvenaria-301/`. Validar que o instrumento captura: antes do conserto o aviso TEM que aparecer no mesmo teste.
4. Commit `301: ...`. Não publique.

Resposta final só na mensagem final: causa em linguagem simples, o que mudou, sha, e se vale no site publicado também.
