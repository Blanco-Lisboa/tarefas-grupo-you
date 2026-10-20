// Item 180c: base do card do Mapa em escala 1x, 1.25x e 1.5x (escala do Windows). Fora da tela, sem mexer no mouse.
// Uso: node provas/r21-borda-baixo/fotos.mjs antes|depois   (banco-falso.mjs + app em 3199)
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const rotulo = process.argv[2] ?? "antes";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "foto@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const lupa = await nav.newPage();
for (const dpr of [1, 1.25, 1.5]) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 760 }, deviceScaleFactor: dpr });
  await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:3199/mapa", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const card = p.locator(".borda-animada").first();
  await card.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  const r = await card.evaluate((el) => { const q = (e) => { const b = e.getBoundingClientRect(); return { y: +b.y.toFixed(3), h: +b.height.toFixed(3), bottom: +b.bottom.toFixed(3) }; }; return { dpr: devicePixelRatio, borda: q(el), miolo: q(el.querySelector(".mapa-card")) }; });
  const c = await card.boundingBox();
  const clip = { x: c.x + c.width / 2 - 30, y: c.y + c.height - 12, width: 60, height: 24 };
  const buf = await p.screenshot({ clip });
  const arq = join(PASTA, `base-${rotulo}-${dpr}x.png`);
  await p.screenshot({ path: arq, clip });
  // pixels (cor RGB) de cada linha física em volta da base, coluna do meio, e ampliação 12x
  await lupa.setContent(`<img id=i src="data:image/png;base64,${buf.toString("base64")}" style="image-rendering:pixelated">`);
  const linhas = await lupa.evaluate(async () => { const i = document.getElementById("i"); await i.decode(); const cv = document.createElement("canvas"); cv.width = i.naturalWidth; cv.height = i.naturalHeight; const g = cv.getContext("2d"); g.drawImage(i, 0, 0); const x = i.naturalWidth >> 1; const o = []; for (let y = 0; y < i.naturalHeight; y++) { const d = g.getImageData(x, y, 1, 1).data; o.push(`${y}:${d[0]},${d[1]},${d[2]}`); } return o.join(" "); });
  const ampl = await nav.newContext({ viewport: { width: 60 * 12, height: Math.ceil(24 * dpr) * 12 } });
  const pa = await ampl.newPage();
  await pa.setContent(`<body style="margin:0"><img src="data:image/png;base64,${buf.toString("base64")}" style="image-rendering:pixelated;width:100%;display:block">`);
  await pa.screenshot({ path: join(PASTA, `zoom-${rotulo}-${dpr}x.png`) });
  await ampl.close();
  console.log(dpr + "x", JSON.stringify(r), "\n  linhas:", linhas);
  await ctx.close();
}
await nav.close();
