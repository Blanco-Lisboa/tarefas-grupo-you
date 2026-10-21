import { createRequire } from 'node:module';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(join(process.env.APPDATA, 'npm', 'node_modules', '/'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
const exp = 1893456000;
const jwt = [b64({ alg: 'HS256', typ: 'JWT' }), b64({ sub: 'u-natham', exp, role: 'authenticated', aud: 'authenticated' }), b64('assinatura')].join('.');
const sessao = { access_token: jwt, refresh_token: 'x', expires_in: 3600, expires_at: exp, token_type: 'bearer', user: { id: 'u-natham', aud: 'authenticated', role: 'authenticated', email: 'natham@exemplo.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-10-19T00:00:00Z' } };
const pasta = fileURLToPath(new URL('./', import.meta.url));
const out = [];
for (const [width, height] of [[1903, 900], [1440, 760]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${b64(sessao)}`, domain: '127.0.0.1', path: '/' }]);
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  await page.goto('http://127.0.0.1:3197/conteudos', { waitUntil: 'networkidle' });
  await page.locator('.conteudos-cartao').first().waitFor();
  for (const title of ['Reels: bastidores do escritório', 'Dica rápida de IR', 'Depoimento de cliente']) {
    await page.locator('.conteudos-cartao').filter({ hasText: title }).locator('.conteudos-titulo').click();
    await page.locator('.ficha-cartao').waitFor();
    const data = await page.locator('.ficha-cartao').evaluate(() => {
      const selectors = ['.ficha', '.ficha-faixa', '.ficha-corpo', '.ficha-capa', '.ficha-capa-quadro', '.ficha-capa-quadro video', '.ficha-capa-controles', '.ficha-capa-controles input', '.ficha-anexo-solta', '.publicacao', '.ficha-legenda-texto', '.ficha-pe'];
      const rect = (e) => { const r=e.getBoundingClientRect(); return { x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height), scrollWidth:e.scrollWidth, clientWidth:e.clientWidth, scrollHeight:e.scrollHeight, clientHeight:e.clientHeight }; };
      return Object.fromEntries(selectors.map((s) => { const e = document.querySelector(s); return [s,e ? { ...rect(e), text:e.innerText?.slice(0,160) } : null]; }));
    });
    out.push({ width, title, data });
    await page.locator(title.startsWith('Reels') ? '.ficha-capa' : '.publicacao').scrollIntoViewIfNeeded();
    await page.evaluate(() => { document.querySelector('#marca-largura')?.remove(); const x=document.createElement('div'); x.id='marca-largura'; x.textContent=`innerWidth ${innerWidth}`; x.style.cssText='position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px'; document.body.append(x); });
    await page.screenshot({ path: join(pasta, `ficha-${title.startsWith('Reels')?'reels':title.startsWith('Dica')?'aprovado':'postado'}-${width}.png`) });
    await page.keyboard.press('Escape');
  }
  await context.close();
}
writeFileSync(join(pasta, 'medidas-ficha.json'), JSON.stringify(out, null, 2));
await browser.close();
