// Item 192 / Lupa R5-5: os 3 estados do selo do Google na ficha. Banco falso desta pasta (3299), app em 3199, login do Natham.
// confirmada = "Na agenda do Google"; indo = marcada e não confirmada, "Indo para o Google"; nenhum = Matheus criou para o Natham (R5-3).
// E a "+ Nova tarefa" sem data não mostra selo nem manda vai_pro_google. Uso: node provas/r192-selo-3-estados/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const exp = 1893456000;
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--window-position=-3000,0"] });
let falhas = 0;
const CASOS = [["confirmada", "Gravar com o cliente", "Na agenda do Google"], ["indo", "Gravar depoimento", "Indo para o Google"], ["nenhum", "Matheus pediu ao Natham", ""]];

for (const [largura, altura] of [[1903, 900], [1440, 760], [390, 844]]) {
  const uid = "u-natham";
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
  const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
  const contexto = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pagina = await contexto.newPage();
  const erros = [];
  const corpos = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  pagina.on("request", (r) => { if (r.method() === "POST" && /\/rest\/v1\/(tarefas|rpc\/salvar_tarefa)/.test(r.url())) corpos.push(r.postDataJSON()); });
  await pagina.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pagina.goto("http://127.0.0.1:3199/calendario", { waitUntil: "networkidle" });
  const ficha = pagina.locator("dialog.ficha[open]");
  const selo = ficha.locator(".ficha-google");
  const visto = [];

  for (const [nome, titulo, esperado] of CASOS) {
    const cartao = pagina.locator(".evento").filter({ hasText: titulo }).first();
    await cartao.scrollIntoViewIfNeeded();
    await cartao.click();
    await ficha.waitFor();
    const texto = (await selo.count()) ? (await selo.innerText()).trim() : "";
    visto.push(`${nome}="${texto}"`);
    if (texto !== esperado) falhas++;
    await pagina.evaluate(() => {
      const d = document.createElement("div");
      d.textContent = `innerWidth ${innerWidth}`;
      d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px";
      document.querySelector("dialog")?.append(d);
    });
    await pagina.screenshot({ path: join(pasta, `${nome}-${largura}.png`) });
    await pagina.keyboard.press("Escape");
    await ficha.waitFor({ state: "detached" });
  }

  // Nova tarefa sem data (botão do topo): sem selo e o POST não leva vai_pro_google
  await pagina.getByRole("button", { name: "+ Nova tarefa" }).first().click();
  await ficha.waitFor();
  await ficha.getByLabel("Título").fill("Sem data, pelo Calendário");
  const seloSemData = await selo.count();
  await ficha.getByRole("button", { name: "Salvar", exact: true }).click();
  await ficha.waitFor({ state: "detached" });
  const mandou = corpos.some((c) => "vai_pro_google" in (c.p ?? c));
  if (seloSemData || mandou || !corpos.length || erros.length) falhas++;
  console.log(`${largura}: ${visto.join(", ")}, semData: selo=${seloSemData} mandouVaiProGoogle=${mandou}, erros=${JSON.stringify(erros)}`);
  await contexto.close();
}

await navegador.close();
console.log(falhas ? `FALHAS: ${falhas}` : "TUDO OK");
process.exit(falhas ? 1 : 0);
