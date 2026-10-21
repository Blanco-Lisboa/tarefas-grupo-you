// Item 229, etapa 2 (Sextante): a ficha no formato novo do Drive. Cópia de exemplo (3101, banco falso 3201 com /entrar), 1440.
// Nada é gravado no banco de exemplo: criar tema e salvar respondem pela rede do navegador (page.route), e a ficha fecha com Esc.
// Uso: node provas/r229-ficha/fotos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const pasta = fileURLToPath(new URL("./", import.meta.url));
const navegador = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let falhas = 0;
const confere = (ok, texto) => { if (!ok) falhas++; console.log(`${ok ? "OK" : "FALHA"} ${texto}`); };
const CORS = { "access-control-allow-origin": "http://127.0.0.1:3101", "access-control-allow-credentials": "true" };

async function abrir(titulo, ajustes = {}) {
  const pg = await (await navegador.newContext({ viewport: { width: 1440, height: 760 } })).newPage();
  const drive = [];
  await pg.route("**/functions/v1/drive", async (r) => {
    if (r.request().method() !== "POST") return r.fallback();
    const c = r.request().postDataJSON();
    drive.push(c);
    if (c.acao === "criar_ocasiao") return r.fulfill({ json: { ocasiao: { id: "tema-prova", empresa_id: c.empresa_id, nome: c.nome, permanente: c.permanente === true } }, headers: CORS });
    if (c.acao === "organizar_card") return r.fulfill({ json: { movida: true }, headers: CORS });
    return r.fallback();
  });
  await pg.route("**/rest/v1/rpc/salvar_tarefa*", (r) => r.fulfill({ status: 204, headers: CORS }));
  await pg.route("**/rest/v1/tarefas*", async (r) => {
    if (r.request().method() !== "GET") return r.fallback();
    const res = await r.fetch();
    await r.fulfill({ response: res, json: (await res.json()).map((t) => (ajustes[t.titulo] ? { ...t, ...ajustes[t.titulo] } : t)) });
  });
  await pg.goto("http://127.0.0.1:3201/entrar");
  await pg.goto("http://127.0.0.1:3101/conteudos", { waitUntil: "networkidle" });
  await pg.locator(".conteudos-cartao").filter({ hasText: titulo }).locator(".conteudos-titulo").click();
  const ficha = pg.locator(".ficha-cartao");
  await ficha.waitFor();
  await pg.waitForTimeout(500);
  await pg.mouse.move(5, 5);
  return { pg, ficha, drive };
}
const marca = (pg) => pg.evaluate(() => {
  document.querySelector("#marca-largura")?.remove();
  const d = Object.assign(document.createElement("div"), { id: "marca-largura", textContent: `innerWidth ${innerWidth}` });
  d.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px";
  document.body.append(d);
});
const foto = async (pg, nome) => { await marca(pg); await pg.screenshot({ path: join(pasta, `${nome}.png`) }); };

// 1. Campo aberto com cadeado (o tema permanente "Reunião de outubro" da You) e o caminho na ajuda
let { pg, ficha, drive } = await abrir("Carrossel: calendário fiscal de novembro");
const campo = ficha.locator(".ficha-tema");
const ajuda = (await campo.locator(".ficha-dica").innerText()).trim();
confere(ajuda === "Vai para You › Carrossel › Sem tema no Drive.", `229: caminho de verdade na ajuda ("${ajuda}")`);
await campo.locator(".selecao-botao").click();
await pg.waitForTimeout(400);
const lista = pg.locator(".ficha-tema .selecao-pop:popover-open");
const comCadeado = await lista.locator(".selecao-opcao").evaluateAll((os) => os.filter((o) => o.querySelector(".ficha-cadeado")).map((o) => o.innerText.trim()));
confere(JSON.stringify(comCadeado) === '["Reunião de outubro"]', `229: cadeado só no tema permanente (${JSON.stringify(comCadeado)})`);
await foto(pg, "229-tema-aberto-com-cadeado-1440");
await lista.locator(".selecao-opcao").filter({ hasText: "Dia do MEI" }).click();
await pg.waitForTimeout(300);
const ajuda2 = (await campo.locator(".ficha-dica").innerText()).trim();
confere(ajuda2 === "Vai para You › Carrossel › Dia do MEI no Drive.", `229: escolheu o tema, o caminho acompanha ("${ajuda2}")`);
await campo.scrollIntoViewIfNeeded();
await foto(pg, "229-caminho-1440");

// 2. Criar tema com o interruptor Permanente (desligado por padrão)
await campo.locator(".selecao-botao").click();
await pg.waitForTimeout(300);
await pg.locator(".ficha-tema .selecao-pop:popover-open .selecao-acao").click();
const interruptor = campo.getByRole("switch", { name: /Permanente/ });
confere(!(await interruptor.isChecked()), "229: Permanente desligado por padrão");
await campo.getByRole("textbox", { name: "Nome do novo tema" }).fill("Dia das Mães");
await interruptor.check();
await foto(pg, "229-criar-tema-1440");
await campo.getByRole("button", { name: "Criar" }).click();
await pg.waitForTimeout(500);
const criado = drive.find((c) => c.acao === "criar_ocasiao");
confere(criado?.nome === "Dia das Mães" && criado?.permanente === true && criado?.empresa_id === "you", `229: criarOcasiao com nome e Permanente (${JSON.stringify(criado)})`);
const ajuda3 = (await campo.locator(".ficha-dica").innerText()).trim();
confere(ajuda3 === "Vai para You › Carrossel › Dia das Mães no Drive." && (await campo.locator(".selecao-botao .ficha-cadeado").count()) === 1, `229: tema novo escolhido, com cadeado no campo ("${ajuda3}")`);
await foto(pg, "229-tema-criado-1440");
await pg.context().close();

// 3. Salvar com tema trocado num card que já tem arquivo no Drive chama organizarCard; sem mudança, não chama
({ pg, ficha, drive } = await abrir("Reels: contabilidade sem mistério"));
await ficha.locator(".ficha-tema .selecao-botao").click();
await pg.waitForTimeout(300);
await pg.locator(".ficha-tema .selecao-pop:popover-open .selecao-opcao").filter({ hasText: "Natal" }).click();
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
confere(drive.some((c) => c.acao === "organizar_card"), "229: tema trocado + arquivo no Drive: organizarCard depois de salvar");
await pg.context().close();
({ pg, ficha, drive } = await abrir("Reels: contabilidade sem mistério"));
await ficha.getByRole("button", { name: "Salvar" }).click();
await pg.waitForTimeout(800);
confere(!drive.some((c) => c.acao === "organizar_card"), "229: salvar sem mudar título/formato/tema/empresa não chama organizarCard");
await pg.context().close();

// 4. Postado: "Some do Drive em N dias" perto dos anexos; tema com cadeado: "Fica para sempre"
({ pg, ficha } = await abrir("Reels: depoimento da Maria")); // postado em 18/10, tema "Dia do MEI" (sem cadeado)
let prazo = ficha.locator(".ficha-prazo");
await prazo.scrollIntoViewIfNeeded();
const txt = (await prazo.innerText()).trim();
confere(/^Some do Drive (hoje|em \d+ dias?)\.$/.test(txt), `229: postado sem cadeado diz quando some ("${txt}")`);
await pg.evaluate(() => { const c = document.querySelector(".ficha-corpo"); c.scrollTop += 120; });
await foto(pg, "229-some-em-n-dias-1440");
await pg.context().close();
({ pg, ficha } = await abrir("Reels: cliente da You conta como foi")); // tema "Reunião de outubro" (com cadeado)
prazo = ficha.locator(".ficha-prazo");
await prazo.scrollIntoViewIfNeeded();
const txt2 = (await prazo.innerText()).trim();
confere(txt2 === "Fica para sempre (tema com cadeado).", `229: postado em tema com cadeado fica ("${txt2}")`);
await pg.evaluate(() => { const c = document.querySelector(".ficha-corpo"); c.scrollTop += 120; });
await foto(pg, "229-fica-para-sempre-1440");
await pg.context().close();

await navegador.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);
