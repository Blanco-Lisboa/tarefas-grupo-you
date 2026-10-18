// Full Next app profile with server logging and Drizzle boundaries.
import { defineConfig } from "eslint/config";
import drizzle from "eslint-plugin-drizzle";
import base from "./eslint-rules/next-base.mjs";

export default defineConfig([
  ...base,
  {
    // Camada de dados única: telas só importam "@/lib/dados" (nunca o exemplo nem o repositório).
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/dados/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/lib/dados/*", "**/dados/exemplo", "**/dados/repositorio"], message: "Importe de \"@/lib/dados\"." }] }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { drizzle },
    rules: {
      "quality/no-direct-console": ["error", { logger: "the server logger (remove client debug output)" }],
      "quality/no-direct-data-access": ["error", {
        modules: ["@/db", "@/db/index"], bindings: ["db", "getDb"],
        layers: ["/src/app/", "/src/components/"], extensions: [".tsx"],
      }],
      "drizzle/enforce-delete-with-where": ["error", { drizzleObjectName: ["db"] }],
      "drizzle/enforce-update-with-where": ["error", { drizzleObjectName: ["db"] }],
    },
  },
]);
