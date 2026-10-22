import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const erros = [];
for (const [w, h] of [[1440, 760], [390, 800]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") erros.push(`${w}: ${m.type()}: ${m.text().slice(0, 300)}`); });
  p.on("pageerror", (e) => erros.push(`${w}: pageerror: ${e.message.slice(0, 300)}`));
  const marca = () => p.evaluate(() => { document.getElementById("m")?.remove(); const d = document.createElement("div"); d.id = "m"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
  const semBadge = () => p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await p.goto("http://127.0.0.1:3201/entrar", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
  await p.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" }); await p.waitForTimeout(2000);
  await semBadge();
  await p.route("http://127.0.0.1:3201/**", async (r) => { if (r.request().method() === "PUT") await new Promise((ok) => setTimeout(ok, 9000)); r.continue(); });
  // dois cards novos, cada um com um vídeo
  for (const nome of ["Reels do teste A", "Reels do teste B"]) {
    await p.locator("button[aria-label^='Novo conteúdo em']").first().click();
    await p.locator("dialog.ficha[open]").waitFor();
    if (nome.endsWith("A")) { await marca(); await p.screenshot({ path: `${PASTA}281-titulo-vazio-${w}.png` }); }
    await p.locator("dialog.ficha textarea.ficha-titulo").fill(nome);
    await p.locator("dialog.ficha input[type=file]").last().setInputFiles({ name: nome.replace(/ /g, "-") + ".mp4", mimeType: "video/mp4", buffer: Buffer.alloc(5 * 1024 * 1024) });
    if (nome.endsWith("A")) {
      // clicar fora com coisa não salva: pergunta
      await p.mouse.click(5, h - 5);
      await p.locator("dialog.confirmar").waitFor({ timeout: 3000 });
      await marca(); await p.screenshot({ path: `${PASTA}281-descartar-${w}.png` });
      await p.getByText("Continuar editando").click();
    }
    await p.locator("dialog.ficha button[type=submit]").click();
    await p.locator("dialog.ficha[open]").waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(800);
  }
  await semBadge(); await marca();
  console.log(w, "ficha fechou, itens no painel:", await p.locator(".envios li").count());
  await p.screenshot({ path: `${PASTA}281-painel-${w}.png` });
  await p.waitForTimeout(24000);
  await p.screenshot({ path: `${PASTA}281-painel-fim-${w}.png` });
  console.log(w, "painel depois:", (await p.locator(".envios").innerText().catch(() => "(sumiu)")).replace(/\n/g, " | "));
  await p.close();
}
console.log("console:", [...new Set(erros)].join("\n"));
await nav.close();
