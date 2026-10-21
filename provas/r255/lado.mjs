// Monta a foto da Esteira antes e depois, uma sobre a outra (só a faixa dos cabeçalhos), a partir de esteira-antes-*.png e esteira-depois-*.png.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeFileSync, rmSync } from "node:fs";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const D = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
for (const w of [1903, 1440]) {
  const pag = join(D, "_lado.html");
  const faixa = (t, f) => `<div style="padding:6px 8px;background:#fff;font:700 16px sans-serif">${t}</div><div style="height:260px;overflow:hidden;border-bottom:3px solid #000"><img src="${f}" style="display:block;width:${w}px"></div>`;
  writeFileSync(pag, `<body style="margin:0">${faixa("ANTES (commit 8ebb202, anterior ao 958547b)", `esteira-antes-${w}.png`)}${faixa("DEPOIS (agora)", `esteira-depois-${w}.png`)}</body>`);
  const p = await nav.newPage({ viewport: { width: w, height: 600 } });
  await p.goto(pathToFileURL(pag).href);
  await p.waitForTimeout(500);
  await p.screenshot({ path: join(D, `esteira-lado-a-lado-${w}.png`), fullPage: true });
}
await nav.close();
rmSync(join(D, "_lado.html"));
