// Fotografa as pranchas da ID (só leitura) para comparar com a tela de Pastas.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const ID = "C:/Users/Natham Monteiro/Desktop/ID-Visual-ALL/Beec/identidade/";
const nav = await chromium.launch({ headless: true });
const p = await (await nav.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const f of ["cards-r1", "prancha"]) {
  await p.goto(pathToFileURL(ID + f + ".html").href, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: join(PASTA, `prancha-${f}.png`) });
}
await nav.close();
