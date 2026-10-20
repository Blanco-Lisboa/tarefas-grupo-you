import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
const require = createRequire(process.env.APPDATA + "/npm/node_modules/");
const { chromium } = require("playwright");
const P = fileURLToPath(new URL("./", import.meta.url)), U = (f) => pathToFileURL(P + f).href;
const print = pathToFileURL(P + "../../docs/levas/180e-print-quebra-sombra.png").href;
const nav = await chromium.launch(); const p = await nav.newPage({ viewport: { width: 1500, height: 330 } });
const col = (t, s) => `<div style="margin:6px;font:700 13px sans-serif"><div>${t}</div><img src="${s}" style="display:block;border:1px solid #ccc;background:#fff"></div>`;
import("node:fs").then(async (fs) => { fs.writeFileSync(P + "_l.html", `<body style="margin:0;background:#fff;display:flex;align-items:flex-start">${col("Print do Natham (reprovado)", print)}${col("Antes (1x, mesmo card)", U("antes-1903.png"))}${col("Depois (1x)", U("depois-1903.png"))}</body>`); await p.goto(U("_l.html")); await p.waitForTimeout(500); await p.screenshot({ path: P + "lado-a-lado-print-x-depois.png" }); fs.unlinkSync(P + "_l.html"); await nav.close(); });
