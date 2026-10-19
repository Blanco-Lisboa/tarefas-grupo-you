import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const REF = fileURLToPath(new URL("../../docs/referencias/2026-10-19-rodada-4/", import.meta.url));
const nav = await chromium.launch({ channel: "chrome", args: ["--window-position=-3000,0"] });
for (const [w, h, foto] of [[1903, 900, false], [1440, 900, true], [1366, 768, false], [390, 844, true]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  const marca = () => p.evaluate(() => { const d = document.getElementById("iw") ?? document.body.appendChild(Object.assign(document.createElement("div"), { id: "iw" })); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; });
  const medir = (rot) => p.evaluate((r) => { const c = document.querySelector(".ficha-corpo"); return `${r}: scrollHeight ${c.scrollHeight} clientHeight ${c.clientHeight} ${c.scrollHeight === c.clientHeight ? "OK" : "ROLA"}`; }, rot);
  await p.goto("http://localhost:3100/conteudos", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const col = p.locator('[data-etapa="edicao"]');
  const TIT = (await col.locator(".conteudos-titulo").first().innerText()).trim();
  await col.locator(".conteudos-titulo").first().click();
  await p.waitForTimeout(400);
  console.log(w, await medir("ficha aberta"));
  await p.getByRole("button", { name: "Criar nova tag" }).click();
  await p.getByLabel("Nome da nova tag").pressSequentially("Aguardando cliente", { delay: 10 });
  await p.getByRole("button", { name: "Cor 5" }).click();
  console.log(w, await medir("criando tag"));
  if (foto) { await marca(); await p.screenshot({ path: join(REF, `82-criando-tag-${w}.png`) }); }
  await p.getByRole("button", { name: "Criar", exact: true }).click();
  const escolher = async (grupo, nome) => {
    await p.locator(".ficha-tags .selecao-botao").nth(grupo === "Tags" ? 0 : 1).click();
    await p.getByRole("group", { name: grupo }).getByRole("button", { name: nome }).click();
    await p.locator(".ficha-rotulo").click();
  };
  await escolher("Tags", "Esperando aprovação");
  await escolher("Quem aprova", "Adrian");
  await p.waitForTimeout(300);
  console.log(w, await medir("com aprovação"));
  if (foto) { await marca(); await p.screenshot({ path: join(REF, `82-ficha-aprovacao-${w}.png`) }); }
  await p.getByRole("button", { name: "Adicionar nome de quem aprova" }).click();
  await p.getByLabel("Nome de quem aprova").fill("Larissa");
  await p.getByLabel("Nome de quem aprova").press("Enter");
  await p.waitForTimeout(200);
  console.log(w, await medir("com nome novo"), "aprovador:", await p.locator(".ficha-tags .selecao-botao").nth(1).innerText());
  await escolher("Quem aprova", "Adrian");
  await p.getByRole("button", { name: "Salvar" }).click();
  await p.waitForTimeout(500);
  const card = col.locator(".conteudos-cartao", { hasText: TIT });
  console.log(w, "tags no card:", (await card.locator(".tag-chip").allInnerTexts()).join(" | "));
  await card.scrollIntoViewIfNeeded();
  await p.evaluate(() => { const q = document.querySelector(".conteudos-quadro"); const c = document.querySelector('[data-etapa="edicao"]'); q.scrollLeft = c.offsetLeft - 8 - q.offsetLeft; });
  if (foto) { await marca(); await p.screenshot({ path: join(REF, `82-card-com-tags-${w}.png`) }); }
  await p.close();
}
await nav.close();
