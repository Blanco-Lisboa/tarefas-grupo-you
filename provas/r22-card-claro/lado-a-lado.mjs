// Junta o print do Natham (vidro escuro, 180d) e o card novo numa imagem só.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const P = fileURLToPath(new URL("./", import.meta.url));
const u = (f) => "data:image/png;base64," + readFileSync(f).toString("base64");
const nav = await chromium.launch(); const pg = await nav.newPage({ viewport: { width: 1560, height: 420 } });
const fig = (t, src, w) => `<figure style="margin:0"><figcaption>${t}</figcaption><img src="${src}" style="width:${w}px;border:1px solid #ccc;display:block"></figure>`;
await pg.setContent(`<body style="margin:0;padding:16px;font:600 14px sans-serif;background:#fff"><div style="display:flex;gap:24px;align-items:flex-start">${fig("ANTES (print do Natham: escuro)", u(P + "../../docs/levas/180d-print-card-escuro.png"), 468)}${fig("DEPOIS (vidro claro, 1440)", u(P + "card-1440-a.png"), 486)}${fig("DEPOIS (celular, 390)", u(P + "card-390-a.png"), 380)}</div></body>`);
await pg.screenshot({ path: P + "lado-a-lado.png" }); await nav.close();
