// Recorta um trecho da prancha da ID: node corte.mjs arquivo.html y altura saida.png [largura]
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const [arq, y, h, saida, w = "1440"] = process.argv.slice(2);
const n = await chromium.launch({ headless: true });
const p = await (await n.newContext({ viewport: { width: +w, height: 900 } })).newPage();
await p.goto("file:///C:/Users/Natham%20Monteiro/Desktop/ID-Visual-ALL/Beec/identidade/" + arq);
await p.waitForTimeout(800);
await p.screenshot({ path: saida, fullPage: true, clip: { x: 0, y: +y, width: +w, height: +h } });
await n.close();
