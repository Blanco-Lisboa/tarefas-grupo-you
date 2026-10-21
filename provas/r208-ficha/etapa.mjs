// Item 205 (Sextante): a ficha sem o campo Etapa; card novo com empresa (Calendário) entra sozinho em Roteiro na Esteira;
// tarefa do Caderno com empresa NÃO vira card, nem depois de aberta e salva na ficha. Mesma prévia do fotos.mjs (banco 3497, app 3297).
// Uso: node provas/r208-ficha/etapa.mjs
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
const rotulosDaFicha = () => ficha.locator(".ficha-grade .selecao-botao").evaluateAll((bs) => bs.map((b) => b.querySelector(".selecao-rotulo-p, span")?.textContent));
/** Abre a ficha nova no Calendário, escreve o título e (se pedir) escolhe a empresa, e salva. */
async function criarNoCalendario(titulo, empresa) {
  await pg.goto("http://127.0.0.1:3297/calendario", { waitUntil: "networkidle" });
  await pg.getByRole("button", { name: "+ Nova tarefa" }).click();
  await ficha.waitFor();
  await ficha.locator(".ficha-titulo").fill(titulo);
  if (empresa) {
    await ficha.locator(".ficha-escolha").filter({ hasText: "Empresa" }).locator(".selecao-botao").click();
    await pg.locator(".selecao-pop:popover-open .selecao-opcao").filter({ hasText: empresa }).click();
    await pg.waitForTimeout(200);
  }
}

// 1) Calendário, com empresa: ficha sem Etapa; ao salvar, etapa = roteiro; aparece em Roteiro na Esteira
await criarNoCalendario("Card do Calendário com empresa (205)", "You");
const rotulos = await rotulosDaFicha();
confere(!rotulos.includes("Etapa") && !(await ficha.innerText()).includes("Sem etapa"), `ficha sem o campo Etapa (campos: ${rotulos.join(", ")})`);
await foto("205-ficha-sem-etapa-1440");
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
confere(ultimo().titulo === "Card do Calendário com empresa (205)" && ultimo().empresa_id === "you" && ultimo().etapa === "roteiro", `Calendário + empresa: grava etapa = roteiro (${ultimo().empresa_id}, ${ultimo().etapa})`);

// 2) Calendário, empresa "Nenhuma" (a ficha nova já vem com a primeira empresa): continua sem etapa
await criarNoCalendario("Tarefa do Calendário sem empresa (205)", "Nenhuma");
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
confere(ultimo().titulo === "Tarefa do Calendário sem empresa (205)" && !ultimo().empresa_id && !ultimo().etapa, `Calendário sem empresa: sem etapa (${ultimo().empresa_id || "sem empresa"}, ${ultimo().etapa})`);

// 3) Caderno: tarefa nova com empresa (pela folha), depois aberta e salva na ficha: nunca ganha etapa
await pg.goto("http://127.0.0.1:3297/tarefas", { waitUntil: "networkidle" });
const linha = pg.getByRole("textbox", { name: /^Nova tarefa/ }).first();
await linha.fill("Tarefa do Caderno com empresa (205)");
await linha.press("Enter");
await pg.waitForTimeout(800);
confere(ultimo().titulo === "Tarefa do Caderno com empresa (205)" && !!ultimo().empresa_id && !ultimo().etapa, `Caderno: tarefa com empresa (${ultimo().empresa_id}) sem etapa`);
await pg.getByText("Tarefa do Caderno com empresa (205)").first().click();
await ficha.waitFor();
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
confere(ultimo().titulo === "Tarefa do Caderno com empresa (205)" && !ultimo().etapa, `Caderno: aberta e salva na ficha, continua sem etapa (${ultimo().etapa})`);
await foto("205-caderno-1440");

// Esteira: o card do Calendário em Roteiro; as tarefas sem etapa fora
await pg.goto("http://127.0.0.1:3297/conteudos", { waitUntil: "networkidle" });
await pg.locator(".conteudos-cartao").first().waitFor();
const roteiro = pg.locator("[data-etapa=roteiro]");
confere(await roteiro.locator(".conteudos-cartao").filter({ hasText: "Card do Calendário com empresa (205)" }).count() === 1, "Esteira: o card do Calendário está em Roteiro");
const textoEsteira = await pg.locator(".conteudos-quadro").innerText();
confere(!textoEsteira.includes("Tarefa do Caderno com empresa") && !textoEsteira.includes("Tarefa do Calendário sem empresa"), "Esteira: a tarefa do Caderno e a sem empresa não aparecem");
await foto("205-esteira-roteiro-1440");

// Card que já tem etapa não muda: abrir um de Edição e salvar mantém Edição
await pg.locator(".conteudos-cartao").filter({ hasText: "Visita ao cliente 2" }).locator(".conteudos-titulo").click();
await ficha.waitFor();
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
confere(ultimo().titulo === "Visita ao cliente 2" && ultimo().etapa === "edicao", `card que já tem etapa continua nela (${ultimo().etapa})`);

await navegador.close();
banco.kill();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(0);
