// Prova do fim da Fase 2 (Sextante): ponte-beec.css apagada. Todas as telas em 1440x760 e a comparação, pixel a pixel,
// com a foto 1440 que cada dono tirou (quantos % dos pixels mudaram de cor). Servidor em 3100 ligado. Chrome headless.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");

const PASTA = fileURLToPath(new URL("./", import.meta.url));
const PROVAS = fileURLToPath(new URL("../", import.meta.url));
const TELAS = [
  { nome: "calendario", url: "/calendario", dono: "r3-nevoa-etiquetas/1440-semana.png" },
  { nome: "mapa", url: "/mapa", dono: "r3-nevoa-alvenaria/mapa-1440-topo.png" },
  { nome: "tarefas", url: "/tarefas", dono: "r3-nevoa-pena/1440-tarefas.png" },
  { nome: "conteudos", url: "/conteudos", dono: "r3-nevoa-regua/1440-conteudos.png" },
  { nome: "ficha", url: "/conteudos", dono: "r3-nevoa-regua/1440-ficha.png", antes: (p) => p.locator(".conteudos-titulo").first().click() },
  { nome: "pastas", url: "/pastas", dono: "r3-nevoa-vitral/1440-pastas.png" },
  { nome: "configuracoes", url: "/configuracoes", dono: "r3-nevoa-regua/1440-configuracoes.png" },
];

const b = await chromium.launch();
const erros = [];
const ctx = await b.newContext({ viewport: { width: 1440, height: 760 } });
const p = await ctx.newPage();
p.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && erros.push(`console: ${m.text()}`));
p.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
const comparar = await b.newPage();
for (const t of TELAS) {
  await p.goto(`http://127.0.0.1:3100${t.url}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  if (t.antes) { await t.antes(p); await p.waitForTimeout(500); }
  else await p.waitForTimeout(t.nome === "pastas" ? 3000 : 300); // as pastas entram animadas
  await p.evaluate(() => {
    const s = document.createElement("div");
    s.textContent = `innerWidth ${innerWidth}`;
    s.style.cssText = "position:fixed;right:6px;bottom:6px;z-index:99999;background:#000;color:#fff;font:700 13px monospace;padding:3px 8px;pointer-events:none";
    (document.querySelector("dialog[open]") ?? document.body).append(s);
  });
  const foto = join(PASTA, `1440-${t.nome}.png`);
  await p.screenshot({ path: foto });
  const url = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
  const mudou = await comparar.evaluate(async ([a, c]) => {
    const pixels = async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const cv = new OffscreenCanvas(1440, 760); const g = cv.getContext("2d"); g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, 1440, 760).data;
    };
    const [x, y] = [await pixels(a), await pixels(c)];
    let n = 0;
    for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 30) n++;
    return (n / (x.length / 4)) * 100;
  }, [url(join(PROVAS, t.dono)), url(foto)]);
  console.log(`${t.nome.padEnd(14)} ${mudou.toFixed(2)}% dos pixels diferentes da foto do dono (${t.dono})`);
}
await b.close();
console.log(erros.length ? erros.join("\n") : "sem erros");
