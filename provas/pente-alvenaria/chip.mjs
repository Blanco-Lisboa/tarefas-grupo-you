// Chip de tag numa caixa estreita (como o botão Tags da ficha no celular): tem de terminar em reticências.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(process.env.APPDATA + "/npm/node_modules/");
const { chromium } = require("playwright");
const css = readFileSync(new URL("../../src/components/ui/tag.css", import.meta.url), "utf8") + readFileSync(new URL("../../src/components/ui/selecao.css", import.meta.url), "utf8");
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage();
await p.setContent(`<style>:root{--s-4:4px;--s-8:8px;--t-12:12px;--sup:#fff;--tag:#c60;--tag-texto:#420}${css}</style><div style="width:70px;display:flex"><span class="selecao-chips"><span class="selecao-chip"><span class="tag-chip">Esperando aprovação · <span class="pessoa" style="width:16px;height:16px">N</span>Natham</span></span></span></div>`);
console.log(await p.evaluate(() => { const c = document.querySelector(".tag-chip"); return { cortado: c.scrollWidth > c.clientWidth, largura: c.getBoundingClientRect().width, reticencias: getComputedStyle(c).textOverflow }; }));
await p.screenshot({ path: "provas/pente-alvenaria/chip.png", clip: { x: 0, y: 0, width: 120, height: 30 } });
await nav.close();
