// Lupa 215, volta 2, "Sextante · novo 1": card salvo, anexo falhou. A ficha trata como SALVO com aviso do anexo:
// o rascunho fica com a etapa nova (Salvar seguinte não desfaz), o card não é criado duas vezes, e no Calendário o aviso
// de "sem empresa" aparece também nesse caso. O anexo falha porque a prova derruba o envio (função drive e Storage).
// Mesma prévia do fotos.mjs (banco falso 3497, app 3297). Uso: node provas/r208-ficha/lupa-215-v2.mjs [antes|depois]
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
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${fase}: ${texto}`); };

async function comecar(caminho) {
  const banco = spawn(process.execPath, [caminhoBanco], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PREVIA: "1", PORTA: "3497" } });
  await new Promise((ok) => banco.stdout.on("data", (d) => { if (String(d).includes("banco falso em")) ok(); }));
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 760 } });
  await contexto.addCookies([{ name: "sb-127-auth-token", value: `base64-${b64(sessao)}`, domain: "127.0.0.1", path: "/" }]);
  const pg = await contexto.newPage();
  const pedidos = [];
  pg.on("request", (r) => { if (r.url().includes("/rpc/salvar_tarefa")) pedidos.push(r.postDataJSON()?.p); });
  // O anexo não sobe: Drive (card com empresa) e Storage (card sem empresa) respondem erro
  await pg.route(/\/functions\/v1\/drive|\/storage\/v1\//, (rota) => rota.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ erro: "falha de teste" }) }));
  await pg.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await pg.goto(`http://127.0.0.1:3297${caminho}`, { waitUntil: "networkidle" });
  return { pg, pedidos, fim: async () => { await contexto.close(); banco.kill(); } };
}
const anexar = (ficha) => ficha.locator(".ficha-corpo > div > .ficha-anexos input[type=file]").setInputFiles({ name: "referencia.png", mimeType: "image/png", buffer: PNG });
const aviso = (pg) => pg.locator(".ficha-erro").first().innerText().catch(() => "");

// 1) Aprovar com anexo que falha: card salvo em Aprovado; a ficha fica no Aprovado; Salvar seguinte não volta para Em análise
{
  const { pg, pedidos, fim } = await comecar("/conteudos");
  await pg.locator(".conteudos-cartao").filter({ hasText: "Reels: bastidores do escritório" }).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  await anexar(ficha);
  await ficha.getByRole("button", { name: "Aprovar" }).click();
  await pg.waitForTimeout(1500);
  confere(pedidos.at(-1)?.etapa === "aprovado", `Aprovar salvou o card em Aprovado (${pedidos.at(-1)?.etapa})`);
  const texto = await aviso(pg);
  confere(texto.startsWith("A tarefa foi salva, mas"), `a ficha mostra o aviso do anexo ("${texto}")`);
  confere(await ficha.getByRole("button", { name: "Aprovar" }).count() === 0 && await ficha.locator(".publicacao").count() === 1, "a ficha está no Aprovado (sem Aprovar/Consertar, com o bloco Publicação)");
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(1500);
  confere(pedidos.at(-1)?.etapa === "aprovado", `Salvar seguinte continua Aprovado (${pedidos.map((p) => p.etapa).join(" -> ")})`);
  await fim();
}
// 2) Consertar com anexo que falha: Salvar seguinte não desfaz o Conserto
{
  const { pg, pedidos, fim } = await comecar("/conteudos");
  await pg.locator(".conteudos-cartao").filter({ hasText: "Reels: bastidores do escritório" }).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  await anexar(ficha);
  await ficha.getByRole("button", { name: "Consertar" }).click();
  await pg.waitForTimeout(1500);
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(1500);
  const p = pedidos.at(-1) ?? {};
  confere(p.etapa === "edicao" && p.conserto === true, `Consertar + anexo falho + Salvar: continua Edição com Conserto (${pedidos.map((x) => `${x.etapa}/${x.conserto}`).join(" -> ")})`);
  await fim();
}
// 3) Calendário, filtro na You: tarefa nova sem empresa, anexo falha -> aviso de "sem empresa"; salvar de novo não cria outra
{
  const { pg, pedidos, fim } = await comecar("/calendario");
  await pg.evaluate(() => localStorage.setItem("grade:filtro-empresa", JSON.stringify(["you"])));
  await pg.reload({ waitUntil: "networkidle" });
  await pg.getByRole("button", { name: "+ Nova tarefa" }).click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  await ficha.locator(".ficha-titulo").fill("Sem empresa com anexo (215 v2)");
  await anexar(ficha);
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(1500);
  confere(pedidos.length === 1 && !pedidos[0].empresa_id, "a tarefa foi salva sem empresa");
  const texto = await aviso(pg);
  confere(texto.startsWith("A tarefa foi salva, mas"), `a ficha fica aberta com o aviso do anexo ("${texto}")`);
  confere(await pg.locator(".aviso-info").isVisible().catch(() => false), "o aviso \"Salva sem empresa. Ela aparece com o filtro em Todas.\" aparece");
  await pg.screenshot({ path: join(pasta, `215-v2-anexo-falhou-sem-empresa-${fase}-1440.png`) });
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(1500);
  confere(pedidos.length === 2 && pedidos[1].id === pedidos[0].id, `Salvar de novo atualiza a mesma tarefa, não cria outra (${pedidos.map((p) => p.id.slice(0, 8)).join(", ")})`);
  await pg.waitForTimeout(9000); // a ficha ainda aberta: o aviso não some por tempo
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(400);
  const [info, falha] = await Promise.all([pg.locator(".aviso-info").boundingBox(), pg.locator(".aviso-erro:not(.aviso-info)").boundingBox()]);
  confere(!!info && (!falha || info.y + info.height <= falha.y), `fechada a ficha (depois de 9 s aberta), o aviso de "sem empresa" está na tela, sem ficar embaixo do aviso do anexo (${JSON.stringify([info?.y, falha?.y])})`);
  await pg.screenshot({ path: join(pasta, `215-v2-aviso-depois-de-fechar-${fase}-1440.png`) });
  await fim();
}
// 4) Calendário: tarefa nova COM empresa, anexo falha -> entra em Roteiro (205); Salvar de novo continua em Roteiro, mesma tarefa
{
  const { pg, pedidos, fim } = await comecar("/calendario");
  await pg.getByRole("button", { name: "+ Nova tarefa" }).click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  await ficha.locator(".ficha-titulo").fill("Com empresa e anexo (215 v2)");
  await ficha.locator(".ficha-escolha").filter({ hasText: "Empresa" }).locator(".selecao-botao").click();
  await pg.locator(".selecao-pop:popover-open .selecao-opcao").filter({ hasText: "You" }).click();
  await pg.waitForTimeout(200);
  await anexar(ficha);
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(1500);
  await ficha.getByRole("button", { name: "Salvar" }).click();
  await pg.waitForTimeout(1500);
  confere(pedidos.length === 2 && pedidos.every((p) => p.etapa === "roteiro" && p.id === pedidos[0].id), `com empresa: as duas gravações em Roteiro, mesma tarefa (${pedidos.map((p) => `${p.id.slice(0, 8)}/${p.etapa}`).join(", ")})`);
  await fim();
}

await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(0);
