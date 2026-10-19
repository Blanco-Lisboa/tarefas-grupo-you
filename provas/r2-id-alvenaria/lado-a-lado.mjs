// Foto da semana do Mapa ao lado da conexão 06 da prancha da ID. Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const p = await nav.newPage({ viewport: { width: 1903, height: 900 } });
await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" });
await p.waitForTimeout(400);
await p.locator("figure.fr").first().screenshot({ path: join(PASTA, "mapa-semana-1903.png") });
const q = await nav.newPage({ viewport: { width: 1903, height: 900 } });
const b = (f) => f;
writeFileSync(join(PASTA, "_lado.html"), `<body style="margin:0;background:#fff;font:700 18px sans-serif"><div style="display:flex;gap:16px;padding:16px;align-items:flex-start">
<div style="flex:1"><p>ID da Beec · prancha, conexão 06, variação 5</p><img src="${b("prancha-conexao-v5.png")}" style="width:100%"></div>
<div style="flex:1"><p>Mapa do sistema · semana 1</p><img src="${b("mapa-semana-1903.png")}" style="width:100%"></div></div></body>`);
await q.goto(pathToFileURL(join(PASTA, "_lado.html")).href);
await q.waitForTimeout(500);
await q.screenshot({ path: join(PASTA, "lado-a-lado.png") });
await nav.close();
