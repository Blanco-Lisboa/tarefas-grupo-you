// Desenho antigo (e9577ba) ao lado do atual (pele da ID). Fotos já tiradas por fotos-mapa.mjs.
import { createRequire } from "node:module";
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ headless: true });
const p = await nav.newPage({ viewport: { width: 1903, height: 900 } });
writeFileSync(join(PASTA, "_lado2.html"), `<body style="margin:0;background:#fff;font:700 18px sans-serif"><div style="display:flex;gap:16px;padding:16px;align-items:flex-start">
<div style="flex:1"><p>Antes · e9577ba (o que o Natham aprovou)</p><img src="mapa-e9577ba.png" style="width:100%"></div>
<div style="flex:1"><p>Agora · mesmo desenho, pele da ID</p><img src="mapa-pele-1903.png" style="width:100%"></div></div></body>`);
await p.goto(pathToFileURL(join(PASTA, "_lado2.html")).href);
await p.waitForTimeout(500);
await p.screenshot({ path: join(PASTA, "lado-e9577ba-agora.png"), fullPage: true });
await nav.close();
