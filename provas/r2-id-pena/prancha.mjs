// Fotografa as pranchas da ID (só leitura). node provas/r2-id-pena/prancha.mjs <arquivo.html> <saida.png> [altura]
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const [arq, saida] = process.argv.slice(2);
const n = await chromium.launch({ headless: true });
const p = await (await n.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("file:///C:/Users/Natham%20Monteiro/Desktop/ID-Visual-ALL/Beec/identidade/" + arq);
await p.waitForTimeout(800);
const h = await p.evaluate(() => document.documentElement.scrollHeight);
console.log(arq, "altura", h);
await p.screenshot({ path: saida, fullPage: true });
await n.close();
