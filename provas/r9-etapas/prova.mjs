import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const REF = fileURLToPath(new URL("../../docs/referencias/2026-10-19-rodada-4/", import.meta.url));
const nav = await chromium.launch({ channel: "chrome", args: ["--window-position=-3000,0"] });
const base = "http://localhost:3100";
for (const [w, h, foto] of [[1903, 900, false], [1440, 900, true], [1366, 768, false], [390, 844, true]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  const marca = () => p.evaluate(() => { document.getElementById("iw")?.remove(); const d = document.body.appendChild(Object.assign(document.createElement("div"), { id: "iw" })); d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647;background:#fff;font:700 12px monospace;padding:4px 8px"; });
  const medir = (r) => p.evaluate((r) => { const c = document.querySelector(".ficha-corpo"); return `${r}: scrollHeight ${c.scrollHeight} clientHeight ${c.clientHeight} ${c.scrollHeight <= c.clientHeight ? "OK" : "ROLA"}`; }, r);
  const foto_ = async (n) => { if (foto) { await marca(); await p.screenshot({ path: join(REF, `89-${n}-${w}.png`) }); } };
  await p.goto(base + "/conteudos", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  console.log(w, "colunas", await p.evaluate(() => [...document.querySelectorAll("[data-etapa]")].map((c) => c.querySelector("h2").textContent + ":" + c.querySelector(".conteudos-numero").textContent + ":" + c.querySelectorAll(".conteudos-cartao").length).join(" ")));
  await foto_("kanban");
  if (foto) { await p.evaluate(() => { const q = document.querySelector(".conteudos-quadro"); const c = document.querySelector('[data-etapa="analise"]'); q.scrollLeft = c.offsetLeft - 8 - q.offsetLeft; }); await foto_("kanban-em-analise"); }
  await p.locator('[data-etapa="analise"] .conteudos-titulo').first().click(); await p.waitForTimeout(400);
  console.log(w, await medir("ficha"));
  await foto_("ficha");
  await p.locator(".ficha-tags .selecao-botao").first().click();
  await p.getByRole("group", { name: "Tags" }).getByRole("button", { name: "Esperando aprovação" }).click();
  await p.getByRole("group", { name: "Tags" }).getByRole("button", { name: "Nova tag" }).click();
  await p.getByLabel("Nome da nova tag").pressSequentially("Aguardando cliente", { delay: 5 });
  await p.getByRole("button", { name: "Cor 15" }).click();
  console.log(w, await medir("criando tag"), "alinhamento Criar/bolinha/x:", await p.evaluate(() => { const c = (e) => { const r = e.getBoundingClientRect(); return Math.round(r.top + r.height / 2); }; const f = document.querySelector(".ficha-tag-nova"); return [c(f.querySelector(".ficha-cores")), c([...f.querySelectorAll("button")].find((b) => b.textContent === "Criar")), c(f.querySelector(".ficha-mais")), c(f.querySelector("input"))].join(" / "); }));
  await foto_("criando-tag");
  await p.getByRole("button", { name: "Criar", exact: true }).click(); await p.waitForTimeout(300);
  console.log(w, "chip forte legível:", await p.evaluate(() => { return [...document.querySelectorAll(".ficha-tags .tag-chip")].map((c) => { const s = getComputedStyle(c); return `${c.textContent} fundo ${s.backgroundColor} texto ${s.color}`; }).join(" | "); }));
  console.log(w, await medir("com 2 tags"), "tags:", await p.locator(".ficha-tags .selecao-botao").first().innerText());
  await p.locator(".ficha-tags .selecao-botao").nth(1).click();
  await p.getByRole("group", { name: "Quem aprova" }).getByRole("button", { name: "Adrian" }).click(); await p.locator(".ficha-rotulo").click(); await p.waitForTimeout(300);
  console.log(w, await medir("com aprovador"));
  await foto_("ficha-tags");
  console.log(w, "checkbox dia inteiro:", await p.getByText("Dia inteiro").count(), "| Abrir/Tirar topo:", await p.evaluate(() => { const a = document.querySelector(".ficha-link a")?.getBoundingClientRect(), b = [...document.querySelectorAll(".ficha-link button")].find((x) => x.textContent === "Tirar")?.getBoundingClientRect(); return a && b ? `${Math.round(a.top + a.height / 2)} x ${Math.round(b.top + b.height / 2)}` : "sem"; }));
  await p.getByRole("button", { name: "Cancelar" }).first().click();
  // Fila
  await p.goto(base + "/mapa", { waitUntil: "networkidle" }); await p.evaluate(() => localStorage.setItem("grade:mapa-formato", "fila")); await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(1200);
  for (const t of await p.locator(".eo-dia-topo").all()) if (await t.getAttribute("aria-expanded") === "false") await t.click();
  await p.waitForTimeout(800);
  console.log(w, "passos fila:", [...new Set(await p.locator(".eo-passo").allInnerTexts())].join(" | "));
  await foto_("fila");
  if (w === 1440) { await p.evaluate(() => localStorage.setItem("grade:mapa-formato", "linha")); await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(1200); await p.screenshot({ path: join(REF, "89-mapa-linha-1440.png") }); }
  await p.goto(base + "/calendario", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  console.log(w, "pílulas calendário:", [...new Set(await p.locator(".etapa").allInnerTexts())].join(" | "));
  await foto_("calendario");
  await p.close();
}
await nav.close();
