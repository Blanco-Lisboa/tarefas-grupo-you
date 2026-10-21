// Item 217 (Sextante): a ficha NOVA do Calendário vem sem empresa (nem com o filtro de empresa ligado); vira card da Esteira só
// se a pessoa escolher a empresa. O + de uma coluna da Esteira continua vindo com a 1ª empresa. Mesma prévia do fotos.mjs (banco 3497, app 3297).
// Uso: node provas/r208-ficha/sem-empresa-217.mjs
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const banco = spawn(process.execPath, [fileURLToPath(new URL("../r196-postagem/banco-falso.mjs", import.meta.url))], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497" } });
await new Promise((ok) => banco.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(); }));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: "u-natham", exp: 1893456000, role: "authenticated", aud: "authenticated" }), b64("assinatura")].join(".");
const sessao = { access_token: jwt, refresh_token: "x", expires_in: 3600, expires_at: 1893456000, token_type: "bearer", user: { id: "u-natham", aud: "authenticated", role: "authenticated", email: "natham@exemplo.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-10-19T00:00:00Z" } };
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 } });
await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
const pg = await contexto.newPage();
const pedidos = [];
pg.on("request", (r) => { if (r.url().includes("/rpc/salvar_tarefa")) pedidos.push(r.postDataJSON()?.p); });
await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const foto = async (nome) => {
  await pg.evaluate(() => {
    document.querySelector("#marca-largura")?.remove();
    const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
    d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
    document.body.append(d);
  });
  await pg.screenshot({ path: join(pasta, `${nome}.png`) });
};
const ultimo = () => pedidos.at(-1) ?? {};
const ficha = pg.locator(".ficha-cartao");
const empresaDaFicha = () => ficha.locator(".ficha-escolha").filter({ hasText: "Empresa" }).locator(".selecao-botao").evaluate((b) => b.getAttribute("aria-label") ?? b.innerText);
async function novaNoCalendario(titulo) {
  await pg.goto("http://127.0.0.1:3297/calendario", { waitUntil: "networkidle" });
  await pg.getByRole("button", { name: "+ Nova tarefa" }).click();
  await ficha.waitFor();
  await ficha.locator(".ficha-titulo").fill(titulo);
}

// 1) Ficha nova do Calendário: sem empresa; salva sem mexer -> sem empresa e sem etapa
await novaNoCalendario("Tarefa nova sem empresa (217)");
const vazia = await empresaDaFicha();
confere(/Nenhuma/.test(vazia), `ficha nova do Calendário vem sem empresa (${vazia})`);
await foto("217-ficha-nova-sem-empresa-1440");
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
confere(ultimo().titulo === "Tarefa nova sem empresa (217)" && !ultimo().empresa_id && !ultimo().etapa, `salva sem empresa e sem etapa (${ultimo().empresa_id || "sem empresa"}, ${ultimo().etapa})`);

// 2) Mesmo com o filtro de empresa ligado (You), a ficha nova vem sem empresa
await pg.evaluate(() => localStorage.setItem("grade:filtro-empresa", JSON.stringify(["you"])));
await novaNoCalendario("Com filtro ligado (217)");
const comFiltro = await empresaDaFicha();
confere(/Nenhuma/.test(comFiltro), `com o filtro de empresa ligado, também vem sem empresa (${comFiltro})`);
await pg.keyboard.press("Escape");
await pg.evaluate(() => localStorage.removeItem("grade:filtro-empresa"));

// 3) Escolhendo a empresa: vira card em Roteiro
await novaNoCalendario("Tarefa nova com empresa (217)");
await ficha.locator(".ficha-escolha").filter({ hasText: "Empresa" }).locator(".selecao-botao").click();
await pg.locator(".selecao-pop:popover-open .selecao-opcao").filter({ hasText: "You" }).click();
await pg.waitForTimeout(200);
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
confere(ultimo().titulo === "Tarefa nova com empresa (217)" && ultimo().empresa_id === "you" && ultimo().etapa === "roteiro", `escolhendo a You: grava empresa e etapa = roteiro (${ultimo().empresa_id}, ${ultimo().etapa})`);

// Esteira: a com empresa em Roteiro; a sem empresa fora
await pg.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
await pg.locator(".conteudos-cartao").first().waitFor();
confere(await pg.locator("[data-etapa=roteiro] .conteudos-cartao").filter({ hasText: "Tarefa nova com empresa (217)" }).count() === 1, "Esteira: a com empresa aparece em Roteiro");
confere(!(await pg.locator(".conteudos-quadro").innerText()).includes("Tarefa nova sem empresa"), "Esteira: a sem empresa NÃO aparece");
await foto("217-esteira-1440");

// O + de uma coluna da Esteira continua vindo com a 1ª empresa (senão o card não apareceria na Esteira)
await pg.getByRole("button", { name: "Novo conteúdo em Roteiro" }).click();
await ficha.waitFor();
const doMais = await empresaDaFicha();
confere(!/Nenhuma/.test(doMais), `+ da coluna Roteiro continua com empresa (${doMais})`);

await navegador.close();
banco.kill();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(0);
