// Procura os "Issues" do overlay do Next no /mapa: texto do overlay + console (todos os tipos). Servidor em 3100 ligado.
import { createRequire } from "node:module";
import { join } from "node:path";
const { chromium } = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"))("playwright");
const n = await chromium.launch();
for (const [w, h, toque] of [[1440, 760, false], [390, 844, true]]) {
  const c = await n.newContext({ viewport: { width: w, height: h }, hasTouch: toque });
  const p = await c.newPage(); const msgs = [];
  p.on("console", (m) => msgs.push(`${m.type()}: ${m.text().slice(0, 400)}`));
  p.on("pageerror", (e) => msgs.push("pageerror: " + String(e).slice(0, 400)));
  await p.goto("http://localhost:3100/mapa", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(1500);
  const overlay = await p.evaluate(() => { const portal = document.querySelector("nextjs-portal"); const sr = portal?.shadowRoot; return sr ? sr.textContent.replace(/\s+/g, " ").slice(0, 600) : "sem overlay"; });
  console.log(w, "overlay:", overlay); console.log(w, "console:", msgs.length ? msgs : "vazio");
  await c.close();
}
await n.close();
