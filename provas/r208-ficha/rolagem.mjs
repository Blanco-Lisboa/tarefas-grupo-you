// Item 212 (Sextante): com a ficha aberta, a roda do mouse rola SÓ a ficha; a Esteira por trás não se mexe. Ao fechar, volta a rolar.
// Mesma prévia do fotos.mjs (banco falso 3497, app 3297). Uso: node provas/r208-ficha/rolagem.mjs antes|depois
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const fase = process.argv[2] ?? "depois";
const pasta = fileURLToPath(new URL("./", import.meta.url));
const banco = spawn(process.execPath, [fileURLToPath(new URL("../r196-postagem/banco-falso.mjs", import.meta.url))], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497" } });
await new Promise((ok) => banco.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(); }));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp: 1893456000, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: 1893456000, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
// Com barra de rolagem de verdade, como no Chrome do Natham (o Playwright esconde as barras por padrão)
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", ignoreDefaultArgs: ["--hide-scrollbars"] });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 } });
await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
const pg = await contexto.newPage();
await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
await pg.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
await pg.locator(".conteudos-cartao").first().waitFor();
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const marca = () => pg.evaluate(() => {
  document.querySelector("#marca-largura")?.remove();
  const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
/** Posição de rolagem da página e de tudo o que rola na Esteira (fora da ficha). */
const posicoes = () => pg.evaluate(() => {
  const r = { pagina: [scrollX, scrollY] };
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("dialog")) continue;
    if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowX + s.overflowY)) r[el.className || el.tagName] = [el.scrollLeft, el.scrollTop];
    }
  }
  return r;
});
const roda = async (x, y, dx, dy, vezes) => { await pg.mouse.move(x, y); for (let i = 0; i < vezes; i++) { await pg.mouse.wheel(dx, dy); await pg.waitForTimeout(40); } await pg.waitForTimeout(300); };

// A Esteira já rolada um pouco (página e quadro), para ver que a posição fica a mesma
await pg.evaluate(() => { scrollTo(0, 60); const q = document.querySelector(".conteudos-quadro"); if (q) q.scrollLeft = 120; });
await pg.waitForTimeout(200);
const largura = () => pg.locator(".conteudos-quadro").evaluate((q) => Math.round(q.getBoundingClientRect().width));
const larguraFechada = await largura();
const titulo = pg.locator(".conteudos-cartao").filter({ hasText: "Adrian Reels" }).locator(".conteudos-titulo");
await titulo.click();
await pg.locator(".ficha-cartao").waitFor();
await pg.waitForTimeout(400);
confere(await largura() === larguraFechada, `${fase}: abrir a ficha não faz a Esteira pular de lado (${larguraFechada}px fechada, ${await largura()}px aberta)`);
const inicio = await posicoes();
console.log("Esteira com a ficha aberta:", JSON.stringify(inicio));

const corpo = await pg.locator(".ficha-corpo").boundingBox();
await roda(corpo.x + corpo.width / 2, corpo.y + corpo.height / 2, 0, 400, 20); // até o fim da ficha e além
const fimFicha = await pg.locator(".ficha-corpo").evaluate((c) => [c.scrollTop, c.scrollHeight - c.clientHeight]);
confere(fimFicha[0] > 0 && fimFicha[0] >= fimFicha[1] - 1, `${fase}: a roda rola a ficha até o fim (${fimFicha[0]} de ${fimFicha[1]})`);
const aposFicha = await posicoes();
confere(JSON.stringify(aposFicha) === JSON.stringify(inicio), `${fase}: roda na ficha (até o fim) não mexe a Esteira ${JSON.stringify(aposFicha)}`);
await roda(corpo.x + corpo.width / 2, corpo.y + corpo.height / 2, 400, 0, 10); // de lado, em cima da ficha
const aposLado = await posicoes();
confere(JSON.stringify(aposLado) === JSON.stringify(inicio), `${fase}: roda de lado na ficha não mexe a Esteira ${JSON.stringify(aposLado)}`);
await roda(60, 400, 0, 400, 10); // no fundo escurecido, à esquerda
await roda(1400, 400, 0, -400, 5); // no fundo escurecido, à direita, para cima
await roda(60, 400, 400, 0, 10); // de lado no fundo
const aposFundo = await posicoes();
confere(JSON.stringify(aposFundo) === JSON.stringify(inicio), `${fase}: roda no fundo escurecido não mexe a Esteira ${JSON.stringify(aposFundo)}`);
await marca();
await pg.screenshot({ path: join(pasta, `212-ficha-aberta-rolada-${fase}-1440.png`) });

await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);
const fechada = await posicoes();
confere(JSON.stringify(fechada) === JSON.stringify(inicio), `${fase}: ao fechar, a Esteira está na mesma posição ${JSON.stringify(fechada)}`);
await roda(700, 500, 0, 300, 3);
await roda(700, 500, 300, 0, 3);
const depois = await posicoes();
confere(depois.pagina[1] !== fechada.pagina[1] && depois["conteudos-quadro"]?.[0] !== fechada["conteudos-quadro"]?.[0], `${fase}: fechada, a Esteira volta a rolar ${JSON.stringify(depois)}`);
await marca();
await pg.screenshot({ path: join(pasta, `212-esteira-fechada-rola-${fase}-1440.png`) });

await navegador.close();
banco.kill();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(0);
