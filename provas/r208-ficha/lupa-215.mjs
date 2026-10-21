// Consertos da Lupa 215, achados 1, 2 e 3 (Sextante). Mesma prévia do fotos.mjs (banco falso 3497, app 3297). 1440.
// 1+2: Aprovar/Consertar gravam a FICHA INTEIRA com a etapa nova, numa gravação só; enquanto grava, Aprovar/Consertar/Salvar desligados;
//      um Salvar logo depois (ou no mesmo instante) não desfaz a decisão.
// 3:   salvar tarefa SEM empresa no Calendário com o filtro de empresa ligado mostra o aviso "Salva sem empresa. Ela aparece com o filtro em Todas."
// Uso: node provas/r208-ficha/lupa-215.mjs [antes|depois]
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const fase = process.argv[2] ?? "depois";
const pasta = fileURLToPath(new URL("./", import.meta.url));
const caminhoBanco = fileURLToPath(new URL("../r196-postagem/banco-falso.mjs", import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp: 1893456000, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: 1893456000, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${fase}: ${texto}`); };
const BASTIDORES = "Reels: bastidores do escritório";

/** Banco novo + página nova (o card volta para Em análise). `lento`: cada salvar_tarefa demora 1,5 s para responder. */
async function comecar(caminho, lento = false) {
  const banco = spawn(process.execPath, [caminhoBanco], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497" } });
  await new Promise((ok) => banco.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(); }));
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 } });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pg = await contexto.newPage();
  const pedidos = [];
  pg.on("request", (r) => { if (r.url().includes("/rpc/salvar_tarefa")) pedidos.push(r.postDataJSON()?.p); });
  if (lento) await pg.route("**/rpc/salvar_tarefa", async (rota) => { await new Promise((ok) => setTimeout(ok, 1500)); await rota.continue(); });
  await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pg.goto(`http://127.0.0.1:3297${caminho}`, { waitUntil: "networkidle" });
  const fim = async () => { await contexto.close(); banco.kill(); };
  return { pg, pedidos, fim };
}
const foto = async (pg, nome) => {
  await pg.evaluate(() => {
    document.querySelector("#marca-largura")?.remove();
    const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;top:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  await pg.screenshot({ path: join(pasta, `${nome}.png`) });
};
async function abrirBastidores(pg) {
  await pg.locator(".conteudos-cartao").filter({ hasText: BASTIDORES }).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  return ficha;
}
const etapaNaEsteira = async (pg, titulo) => {
  await pg.keyboard.press("Escape").catch(() => {});
  await pg.waitForTimeout(400);
  return pg.locator("[data-etapa]").filter({ has: pg.locator(".conteudos-cartao").filter({ hasText: titulo }) }).first().getAttribute("data-etapa");
};

// 2: editar o título e Aprovar -> o salvo tem o título novo e Aprovado; Salvar logo depois não volta para Em análise
{
  const { pg, pedidos, fim } = await comecar("/conteudos");
  const ficha = await abrirBastidores(pg);
  await ficha.locator(".ficha-titulo").fill("Bastidores (título editado)");
  await ficha.getByRole("button", { name: "Aprovar" }).click();
  await pg.waitForTimeout(900);
  const aprovado = pedidos.at(-1) ?? {};
  confere(aprovado.titulo === "Bastidores (título editado)" && aprovado.etapa === "aprovado" && pedidos.length === 1, `Aprovar grava título editado + aprovado numa gravação só (${pedidos.length} gravação; ${aprovado.titulo} / ${aprovado.etapa})`);
  const aberta = await ficha.isVisible();
  confere(aberta, "a ficha continua aberta depois de Aprovar");
  if (aberta) {
    await ficha.getByRole("button", { name: "Salvar" }).click();
    await pg.waitForTimeout(900);
    confere(pedidos.at(-1)?.etapa === "aprovado", `Salvar depois do Aprovar continua Aprovado (${pedidos.at(-1)?.etapa})`);
  }
  confere(await etapaNaEsteira(pg, "Bastidores (título editado)") === "aprovado", "na Esteira o card está em Aprovado com o título novo");
  await fim();
}
// 2: editar as notas e Consertar -> notas + Edição + Conserto juntos
{
  const { pg, pedidos, fim } = await comecar("/conteudos");
  const ficha = await abrirBastidores(pg);
  await ficha.locator("#ficha-notas").fill("Trocar a música do começo");
  await ficha.getByRole("button", { name: "Consertar" }).click();
  await pg.waitForTimeout(900);
  const c = pedidos.at(-1) ?? {};
  confere(c.notas === "Trocar a música do começo" && c.etapa === "edicao" && c.conserto === true && pedidos.length === 1, `Consertar grava notas + edição + Conserto numa gravação só (${c.notas} / ${c.etapa} / ${c.conserto})`);
  await fim();
}
// 1: Aprovar e Salvar no mesmo instante: só a decisão vai; o card fica Aprovado
{
  const { pg, pedidos, fim } = await comecar("/conteudos");
  await abrirBastidores(pg);
  await pg.evaluate(() => { document.querySelector(".ficha-decidir [data-acao=aprovar]").click(); document.querySelector(".ficha-pe button[type=submit]").click(); });
  await pg.waitForTimeout(1200);
  confere(pedidos.every((p) => p.etapa === "aprovado"), `Aprovar + Salvar no mesmo instante: nenhuma gravação volta para Em análise (${pedidos.map((p) => p.etapa).join(", ")})`);
  confere(await etapaNaEsteira(pg, BASTIDORES) === "aprovado", "na Esteira o card ficou em Aprovado");
  await fim();
}
// 1: enquanto grava (banco lento), Aprovar, Consertar e Salvar desligados e mostrando que grava
{
  const { pg, fim } = await comecar("/conteudos", true);
  const ficha = await abrirBastidores(pg);
  await ficha.getByRole("button", { name: "Aprovar" }).click();
  await pg.waitForTimeout(300);
  const estado = await ficha.evaluate((f) => [...f.querySelectorAll(".ficha-decidir button, .ficha-pe button[type=submit]")].map((b) => `${b.textContent}:${b.disabled ? "desligado" : "ligado"}`));
  confere(estado.length === 3 && estado.every((e) => e.endsWith("desligado")) && estado.some((e) => /Aprovando/.test(e)), `durante a gravação: ${estado.join(" | ")}`);
  await foto(pg, "215-aprovando-1440");
  await pg.waitForTimeout(2000);
  await fim();
}
// 3: aviso ao salvar sem empresa com o filtro ligado (e sem aviso com o filtro em Todas)
{
  const { pg, pedidos, fim } = await comecar("/calendario");
  const nova = async (titulo) => {
    await pg.getByRole("button", { name: "+ Nova tarefa" }).click();
    const ficha = pg.locator(".ficha-cartao");
    await ficha.waitFor();
    await ficha.locator(".ficha-titulo").fill(titulo);
    await ficha.getByRole("button", { name: "Salvar" }).click();
    await pg.waitForTimeout(800);
  };
  await nova("Sem empresa, filtro em Todas (215)");
  confere(await pg.locator(".aviso-info").count() === 0, "filtro em Todas: sem aviso");
  await pg.evaluate(() => localStorage.setItem("grade:filtro-empresa", JSON.stringify(["you"])));
  await pg.reload({ waitUntil: "networkidle" });
  await nova("Sem empresa, filtro na You (215)");
  const aviso = pg.locator(".aviso-info");
  confere(pedidos.at(-1)?.titulo === "Sem empresa, filtro na You (215)" && !pedidos.at(-1)?.empresa_id, "a tarefa foi salva sem empresa");
  confere(await aviso.isVisible() && (await aviso.innerText()).includes("Salva sem empresa. Ela aparece com o filtro em Todas."), `filtro na You: aviso "${(await aviso.count()) ? await aviso.innerText() : "nenhum"}"`);
  await foto(pg, `215-aviso-sem-empresa-${fase}-1440`);
  await fim();
}

await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(0);
