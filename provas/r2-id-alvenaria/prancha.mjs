// Foto da conexão 06 na prancha da ID (só leitura). node provas/r2-id-alvenaria/prancha.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const p = await nav.newPage({ viewport: { width: 1903, height: 1000 } });
await p.goto(pathToFileURL("C:/Users/Natham Monteiro/Desktop/ID-Visual-ALL/Beec/identidade/prancha.html").href, { waitUntil: "networkidle" });
for (const v of ["v5", "v3"]) {
  const el = p.locator(`#conexao figure.fr.${v}`);
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await el.screenshot({ path: join(PASTA, `prancha-conexao-${v}.png`) });
}
await nav.close();
