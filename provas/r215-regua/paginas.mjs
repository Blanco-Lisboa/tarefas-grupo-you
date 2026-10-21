import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
const require = createRequire(join(process.env.APPDATA, 'npm', 'node_modules', '/'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const pasta = fileURLToPath(new URL('./', import.meta.url));
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
const exp = 1893456000;
const jwt = [b64({ alg: 'HS256', typ: 'JWT' }), b64({ sub: 'u-natham', exp, role: 'authenticated', aud: 'authenticated' }), b64('assinatura')].join('.');
const sessao = { access_token: jwt, refresh_token: 'x', expires_in: 3600, expires_at: exp, token_type: 'bearer', user: { id: 'u-natham', aud: 'authenticated', role: 'authenticated', email: 'natham@exemplo.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-10-19T00:00:00Z' } };
const data = [];
for (const [width, height] of [[1903, 900], [1440, 760]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${b64(sessao)}`, domain: '127.0.0.1', path: '/' }]);
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(2026, 9, 20, 15, 0));
  for (const [name, route] of [['esteira','conteudos'],['calendario','calendario'],['caderno','tarefas'],['configuracoes','configuracoes']]) {
    await page.goto(`http://127.0.0.1:3197/${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const measure = await page.evaluate(() => {
      const rect=(e)=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}};
      return {viewport:innerWidth,body:rect(document.body),main:document.querySelector('main')?rect(document.querySelector('main')):null,overflow:[...document.querySelectorAll('body *')].filter(e=>{let r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+2&&getComputedStyle(e).position!=='absolute'}).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,txt:e.textContent?.trim().slice(0,70),r:rect(e)}))};
    });
    data.push({width,name,measure});
    await page.evaluate(() => {document.querySelector('#marca-largura')?.remove();const d=document.createElement('div');d.id='marca-largura';d.textContent=`innerWidth ${innerWidth}`;d.style.cssText='position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px';document.body.append(d)});
    await page.screenshot({path:join(pasta,`pagina-${name}-${width}.png`)});
  }
  await context.close();
}
const anon=await browser.newContext({viewport:{width:1440,height:760}});
const login=await anon.newPage();
await login.goto('http://127.0.0.1:3197/entrar',{waitUntil:'networkidle'});
await login.evaluate(() => {const d=document.createElement('div');d.textContent=`innerWidth ${innerWidth}`;d.style.cssText='position:fixed;left:4px;bottom:4px;z-index:2147483647;background:#000;color:#fff;font:700 12px monospace;padding:2px 6px';document.body.append(d)});
await login.screenshot({path:join(pasta,'pagina-entrar-1440.png')});
await anon.close();
writeFileSync(join(pasta,'medidas-paginas.json'),JSON.stringify(data,null,2));
await browser.close();
