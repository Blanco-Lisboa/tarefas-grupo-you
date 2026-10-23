import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(join(process.env.APPDATA, "npm", "node_modules", "/"));
const { chromium } = require("playwright");
const PASTA = fileURLToPath(new URL("./", import.meta.url));
const nav = await chromium.launch({ args: ["--window-position=-3000,0"] });
const p = await nav.newPage({ viewport: { width: 1440, height: 760 } });
p.on("pageerror", (e) => console.log("pageerror", String(e)));
const abrir = async () => {
  await p.goto("http://127.0.0.1:3131/pastas", { waitUntil: "load" }); await p.waitForTimeout(1500);
  await p.locator("button:has-text('Ideias de conteúdo'), [aria-label*='Ideias']").first().click(); await p.waitForTimeout(1200);
};
const nomes = () => p.locator(".mural-col:not(.mural-col-nova) .cab-coluna h2").allTextContents();
const foto = (n) => p.screenshot({ path: `${PASTA}${n}.png` });
await p.goto("http://127.0.0.1:3231/entrar", { waitUntil: "load" }); await p.waitForTimeout(800);
await abrir();
console.log("inicio:", await nomes());
await foto("298-1-antes-1440");
await p.locator("button[aria-label='Mais opções da coluna Ganchos']").click(); await p.waitForTimeout(400);
await foto("298-2-menu-1440");
await p.locator(":popover-open").getByText("Mover para a esquerda").click(); await p.waitForTimeout(800);
console.log("depois de mover Ganchos p/ esquerda:", await nomes());
await p.reload({ waitUntil: "load" }); await p.waitForTimeout(800); await abrir();
console.log("depois de recarregar:", await nomes());
await foto("298-3-moveu-recarregou-1440");
// renomear
await p.locator("button[aria-label='Mais opções da coluna Ganchos']").click();
await p.locator(":popover-open").getByText("Renomear").click();
await p.locator("input.mural-col-nome").fill("Ganchos fortes"); await foto("298-4-renomeando-1440");
await p.keyboard.press("Enter"); await p.waitForTimeout(800);
await p.reload({ waitUntil: "load" }); await p.waitForTimeout(800); await abrir();
console.log("renomeada, recarregou:", await nomes(), "ideias na coluna:", await p.locator("section[aria-label='Ganchos fortes'] article").count());
// nome repetido
await p.locator("button[aria-label='Mais opções da coluna Ganchos fortes']").click();
await p.locator(":popover-open").getByText("Renomear").click();
await p.locator("input.mural-col-nome").fill("Datas e sazonais"); await p.keyboard.press("Enter"); await p.waitForTimeout(400);
await foto("298-5-nome-repetido-1440");
await p.keyboard.press("Escape").catch(() => {});
// apagar com ideias
await p.reload({ waitUntil: "load" }); await p.waitForTimeout(800); await abrir();
await p.locator("button[aria-label='Mais opções da coluna Ganchos fortes']").click();
await p.locator(":popover-open").getByText("Apagar coluna").click(); await p.waitForTimeout(400);
await foto("298-6-apagar-com-ideias-1440");
await p.getByText("Entendi").click();
// apagar vazia
await p.locator("input[aria-label='Nova categoria']").fill("Coluna de teste"); await p.keyboard.press("Enter"); await p.waitForTimeout(800);
await p.locator("button[aria-label='Mais opções da coluna Coluna de teste']").click();
await p.locator(":popover-open").getByText("Apagar coluna").click(); await p.waitForTimeout(400);
await foto("298-7-apagar-vazia-1440");
await p.getByRole("button", { name: "Apagar", exact: true }).click(); await p.waitForTimeout(800);
await p.reload({ waitUntil: "load" }); await p.waitForTimeout(800); await abrir();
console.log("fim:", await nomes());
await nav.close();
