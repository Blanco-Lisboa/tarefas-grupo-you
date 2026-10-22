import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
const marca = () => p.evaluate(() => { document.getElementById("m")?.remove(); const d = document.createElement("div"); d.id = "m"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;right:8px;top:8px;z-index:99999;background:#fff;font:700 12px monospace;padding:4px 8px"; document.body.append(d); });
// atrasa cada parte do envio para dar tempo de fotografar o progresso
await p.route("http://127.0.0.1:3201/**", async (r) => { if (r.request().method() === "PUT") await new Promise((ok) => setTimeout(ok, 7000)); r.continue(); });
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
await p.goto("http://127.0.0.1:3201/entrar", { waitUntil: "networkidle" }); await p.waitForTimeout(2000); console.log(p.url());
await p.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
await p.getByText("Reels: contabilidade sem mistério").first().click();
await p.locator("dialog.ficha[open]").waitFor();
await p.locator("dialog.ficha input[type=file]").last().setInputFiles({ name: "reels-bruto.mp4", mimeType: "video/mp4", buffer: Buffer.alloc(40 * 1024 * 1024) });
await p.waitForTimeout(1200);
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await marca();
await p.screenshot({ path: PASTA + "1-ficha-aberta-1440.png" });
await p.keyboard.press("Escape"); // fecha a ficha
await p.locator("a[href='/calendario']").first().click(); // troca de tela por dentro do sistema, sem recarregar
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await p.waitForTimeout(500);
await marca();
console.log("aviso:", await p.locator(".aviso-envio").innerText().catch(() => "(sem aviso)"));
await p.screenshot({ path: PASTA + "2-outra-tela-enviando-1440.png" });
await p.waitForTimeout(9000);
await p.screenshot({ path: PASTA + "2b-ainda.png" });
console.log("aviso depois:", await p.locator(".aviso-envio").innerText().catch(() => "(sumiu)"));
await p.screenshot({ path: PASTA + "3-depois-1440.png" });
await nav.close();
