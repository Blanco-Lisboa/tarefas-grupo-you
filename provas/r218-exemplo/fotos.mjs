// Item 218: fotos da cópia de exemplo (127.0.0.1:3101, ligada por `npm run exemplo`). Entra pelo mesmo "login sem senha" que o Natham usa.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--window-position=-3000,0"] });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 }, deviceScaleFactor: 1 });
const pagina = await contexto.newPage();
const erros = [];
pagina.on("pageerror", (e) => erros.push(e.message));
await pagina.goto("http://127.0.0.1:3201/entrar"); // grava a sessão de mentira e volta para o app
await pagina.waitForURL("http://127.0.0.1:3101/**");

const telas = [["esteira", "/conteudos"], ["calendario", "/calendario"], ["mapa", "/mapa"], ["caderno", "/tarefas"]];
for (const [nome, rota] of telas) {
  await pagina.goto(`http://127.0.0.1:3101${rota}`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(1500);
  await pagina.evaluate(() => {
    document.querySelector("nextjs-portal")?.remove();
    const d = document.createElement("div");
    d.textContent = `innerWidth ${innerWidth}`;
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px";
    document.body.append(d);
  });
  await pagina.screenshot({ path: join(pasta, `${nome}-1440.png`) });
  console.log(nome, pagina.url(), "cards:", await pagina.locator(".conteudos-cartao").count());
}
// Mais duas: a tarde do Caderno (reuniões) e a Esteira rolada até o card "fazendo agora" (Matheus) e o de Conserto.
const selo = () => pagina.evaluate(() => { document.querySelector("nextjs-portal")?.remove(); const d = document.createElement("div"); d.textContent = `innerWidth ${innerWidth}`; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
await pagina.goto("http://127.0.0.1:3101/tarefas", { waitUntil: "networkidle" });
await pagina.getByText("Reunião de pauta de novembro").first().scrollIntoViewIfNeeded();
await pagina.waitForTimeout(500); await selo();
await pagina.screenshot({ path: join(pasta, "caderno-tarde-1440.png") });
await pagina.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
await pagina.locator(".conteudos-cartao").filter({ hasText: "bastidores do escritório" }).scrollIntoViewIfNeeded();
await pagina.waitForTimeout(500); await selo();
await pagina.screenshot({ path: join(pasta, "esteira-fazendo-agora-1440.png") });
console.log("erros de página:", JSON.stringify(erros));
await navegador.close();
