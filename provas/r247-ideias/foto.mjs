// 247: Mural de folhas das Ideias de conteúdo. 1903x900, app de exemplo em 3101. Fotos: cheio, editando, criando, depois de arrastar.
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = 1893456000, uid = "u-natham";
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: uid, exp, role: "authenticated", aud: "authenticated" }), b64("a")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: exp, token_type: "bearer", user: { id: uid, aud: "authenticated", role: "authenticated", email: "f@e.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const ctx = await nav.newContext({ viewport: { width: Number(process.env.LARG ?? 1903), height: 900 } });
await ctx.addCookies([{ name: "sb-127-auth-token", value: "base64-" + b64(sessao), domain: "127.0.0.1", path: "/" }]);
const p = await ctx.newPage();
const marca = () => p.evaluate(() => { document.getElementById("marca-iw")?.remove(); const d = document.createElement("div"); d.id = "marca-iw"; d.textContent = "innerWidth " + innerWidth; d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 10px monospace;padding:2px 6px"; document.body.append(d); });
const foto = async (nome) => { await marca(); await p.screenshot({ path: join(PASTA, `${nome}${process.env.LARG ? "-" + process.env.LARG : ""}.png`) }); };
await p.goto("http://127.0.0.1:3101/pastas", { waitUntil: "networkidle" });
await p.waitForTimeout(3000);
await p.getByRole("button", { name: /^Abrir Ideias de conteúdo/ }).first().click();
const mural = p.locator("dialog.mural");
await mural.waitFor();
await p.waitForTimeout(600);
// cheio: coloca uma ideia longa para ver o detalhe crescer
await foto("1-mural-cheio");
// editando: troca o título da primeira folha e escreve um detalhe, sai do campo e confere que salvou
const col = mural.locator(".mural-col").first();
const folha = col.locator(".mural-folha:not(.mural-nova)").first();
await folha.locator(".mural-titulo").fill("Editado direto na folha");
await folha.locator(".mural-detalhe").fill("Detalhe novo escrito na hora, sem abrir janela nenhuma.\nSegunda linha para ver a folha crescer.");
await folha.locator(".mural-detalhe").blur();
await folha.locator(".mural-titulo").focus();
await foto("2-editando");
const guardado = await p.evaluate(() => localStorage.getItem("grade-conteudo:ideias:v1"));
console.log("salvou título:", guardado.includes("Editado direto na folha"), "| detalhe:", guardado.includes("Detalhe novo escrito"));
// criando: digita na folha em branco, Enter, e a próxima já está em branco com o cursor
const nova = col.locator(".mural-nova input");
await nova.click();
await nova.fill("Ideia criada pelo Enter");
await nova.press("Enter");
const foco = await p.evaluate(() => document.activeElement?.getAttribute("aria-label"));
console.log("depois do Enter, foco em:", foco, "| valor:", await col.locator(".mural-nova input").inputValue());
await col.locator(".mural-nova input").fill("Segunda criada em seguida");
await foto("3-criando");
await col.locator(".mural-nova input").press("Enter");
console.log("folhas na 1a coluna:", await col.locator(".mural-folha:not(.mural-nova)").count());
// arrastar: pega a folha criada pelo cabo e solta na coluna de Ganchos
const ganchos = mural.locator(".mural-col", { has: p.locator("h3", { hasText: "Ganchos" }) });
const antes = await ganchos.locator(".mural-folha:not(.mural-nova)").count();
await col.locator(".mural-folha", { has: p.locator("input[value='Ideia criada pelo Enter']") }).locator(".mural-cabo").dragTo(ganchos.locator(".mural-folhas"));
await p.waitForTimeout(300);
console.log("Ganchos antes/depois:", antes, await ganchos.locator(".mural-folha:not(.mural-nova)").count());
await foto("4-depois-de-arrastar");
// apagar com confirmação + busca (conferência, sem foto)
const alvo = ganchos.locator(".mural-folha", { has: p.locator("input[value='Ideia criada pelo Enter']") });
await alvo.hover();
await alvo.getByRole("button", { name: /^Apagar ideia/ }).click();
await alvo.getByRole("button", { name: "Apagar", exact: true }).click();
console.log("depois de apagar, Ganchos:", await ganchos.locator(".mural-folha:not(.mural-nova)").count());
await mural.getByRole("searchbox").fill("lousa");
console.log("busca 'lousa' -> colunas:", await mural.locator(".mural-col:not(.mural-col-nova)").count(), "folhas:", await mural.locator(".mural-folha:not(.mural-nova)").count());
await nav.close();
