// `npm run exemplo`: liga a CÓPIA DE EXEMPLO em http://127.0.0.1:3101 (cards inventados, banco falso na memória, sem senha).
// O servidor da 3100 (banco real) não é tocado. Ctrl+C desliga os dois. Sem navegador automático: EXEMPLO_SEM_NAVEGADOR=1.
import { spawn } from "node:child_process";
import { createConnection } from "node:net";

const APP = 3101, BANCO = 3201;
const ocupada = (porta) => new Promise((ok) => { const c = createConnection(porta, "127.0.0.1"); c.on("connect", () => { c.destroy(); ok(true); }).on("error", () => ok(false)); });
const abrir = () => { if (!process.env.EXEMPLO_SEM_NAVEGADOR) spawn("cmd", ["/c", "start", "", `http://127.0.0.1:${BANCO}/entrar`], { stdio: "ignore" }); };

if (await ocupada(APP)) {
  console.log(`A cópia de exemplo já está no ar. Abrindo http://127.0.0.1:${APP}`);
  abrir();
  process.exit(0);
}
if (await ocupada(BANCO)) { console.error(`A porta ${BANCO} está ocupada por outro programa. Feche-o e tente de novo.`); process.exit(1); }

const filhos = [
  spawn(process.execPath, ["scripts/exemplo-banco.mjs"], { stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", String(APP), "--hostname", "127.0.0.1"], {
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${BANCO}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "falsa", NEXT_DIST_DIR: ".next-exemplo" },
  }),
];
const desligar = () => filhos.forEach((f) => f.kill());
filhos.forEach((f) => f.on("exit", desligar));
process.on("SIGINT", desligar);
for (let i = 0; i < 120 && !(await ocupada(APP)); i++) await new Promise((r) => setTimeout(r, 1000));
console.log(`\nCópia de exemplo no ar: http://127.0.0.1:${APP}  (entra sozinho, sem senha)\n`);
abrir();
