#!/usr/bin/env bash
# Publica o HEAD em produção a partir de uma cópia limpa (item 264).
# PUBLICAR_SEM_ENVIO=1 roda tudo até o build e NÃO envia.
set -euo pipefail

RAIZ="$(git rev-parse --show-toplevel)"
COPIA="$RAIZ/../.publicar-auto"
cd "$RAIZ"

limpar() {
  cd "$RAIZ"
  git worktree remove --force "$COPIA" 2>/dev/null || true
  rm -rf "$COPIA"
  git worktree prune
}
trap limpar EXIT

# 1. recusa com mudança não commitada em src/ ou supabase/
if [ -n "$(git status --porcelain -- src supabase)" ]; then
  echo "ERRO: há mudança não commitada em src/ ou supabase/. Commite antes de publicar." >&2
  exit 1
fi

# 2. cópia limpa no HEAD, vínculo e .vercelignore
limpar
git worktree add --detach "$COPIA" HEAD
cp .vercel/project.json "$COPIA/.vercel/project.json" 2>/dev/null || { mkdir -p "$COPIA/.vercel" && cp .vercel/project.json "$COPIA/.vercel/project.json"; }
grep -q '"projectName":"tarefas-grupo-you"' "$COPIA/.vercel/project.json" \
  || { echo "ERRO: .vercel/project.json não aponta para tarefas-grupo-you." >&2; exit 1; }
grep -qxF '!/supabase/functions/_shared/pastas.ts' "$COPIA/.vercelignore" \
  || { echo "ERRO: .vercelignore não libera supabase/functions/_shared/pastas.ts." >&2; exit 1; }

# 3. instalar e montar na cópia
cd "$COPIA"
npm ci
npm run build

if [ "${PUBLICAR_SEM_ENVIO:-}" = "1" ]; then
  echo "PUBLICAR_SEM_ENVIO=1: build passou, nada foi enviado."
  exit 0
fi

# 4. envio para produção
SAIDA="$(mktemp)"
npx --yes vercel@64.7.0 --prod --yes --scope=you-contabilidade 2>&1 | tee "$SAIDA"

# 5. conferir o apelido e mostrar o id do deploy
grep -Eq 'Aliased[[:space:]]+https://tarefas-grupo-you\.vercel\.app' "$SAIDA" \
  || { echo "ERRO: a saída não confirma 'Aliased https://tarefas-grupo-you.vercel.app'." >&2; exit 1; }
echo "Deploy: $(grep -oE 'dpl_[A-Za-z0-9]+|https://tarefas-grupo-you-[a-z0-9]+-[a-z0-9-]+\.vercel\.app' "$SAIDA" | head -1)"
