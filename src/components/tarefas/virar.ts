// A folha que vira (item 51): o mesmo motor do caderno do CRM (js/app-tarefas-folha.js), em TypeScript.
// A folha é cortada em tiras verticais ENCADEADAS; cada tira gira um pouco em relação à anterior (rotateY relativo), então o
// ângulo acumula da lombada até a borda livre e o papel curva. Cada tira mostra o seu pedaço de uma CÓPIA da página (frente e verso).
// Peso: a cada quadro só mudam transform e opacity (a luz do CRM, que trocava o fundo, virou camadas fixas com opacidade).
const FLIP = { giro: 180, lombada: 110, duracao: 620, sombra: 0.3, tiras: 20, curva: 0.24, escalonar: 80 };

const limita = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const suave = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

type Tira = { el: HTMLElement; luzF: HTMLElement; luzV: HTMLElement };
type Folha = { el: HTMLElement; tiras: Tira[]; b: number[]; tom: number[]; tomV: number[]; zEsq: number; zDir: number };
type Caixa = { left: number; top: number; width: number; height: number };
type Inerte = HTMLElement & { inert: boolean };

export type Pedido = {
  /** Onde a camada da animação mora (um ancestral das páginas, para herdar as variáveis do caderno). */
  pai: HTMLElement;
  /** Página sobre a qual a folha pousa (a da direita; no celular, a única à mostra). */
  caixa: Caixa;
  volta: boolean;
  frente: HTMLElement;
  verso: HTMLElement | null;
  /** Página velha que fica parada embaixo até a folha pousar sobre ela. */
  cobertura: { el: HTMLElement; caixa: Caixa } | null;
  duasPaginas: boolean;
  aoTerminar: () => void;
};

/** Cópia de uma página para a folha: sem popovers, sem ids repetidos, com o que foi digitado e a rolagem. */
export function copiar(p: HTMLElement): HTMLElement {
  const c = p.cloneNode(true) as HTMLElement;
  c.querySelectorAll("[popover]").forEach((e) => e.remove());
  c.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
  const de = p.querySelectorAll<HTMLInputElement>("textarea, input");
  c.querySelectorAll<HTMLInputElement>("textarea, input").forEach((e, i) => { e.value = de[i]?.value ?? ""; });
  const m = p.querySelector<HTMLElement>(".pag-miolo");
  const cm = c.querySelector<HTMLElement>(".pag-miolo");
  if (m && cm) cm.dataset.st = String(m.scrollTop);
  return c;
}

const div = (classe: string, estilo = "") => {
  const e = document.createElement("div");
  e.className = classe;
  if (estilo) e.style.cssText = estilo;
  return e;
};
const pagina = (modelo: HTMLElement, largura: number, desloca: number) => {
  const c = modelo.cloneNode(true) as HTMLElement;
  c.style.cssText = `position:absolute;top:0;left:0;height:100%;width:${largura}px;transform:translateX(${-desloca}px)`;
  return c;
};
// Luz de uma face: 4 camadas fixas (escuro e claro, rampa para cada lado). Só a opacidade muda: a soma das duas rampas
// dá o degradê contínuo entre a borda esquerda (esq) e a direita (dir) da tira, sem repintar nada.
const luz = () => {
  const l = div("fv-luz");
  for (let i = 0; i < 4; i++) l.append(document.createElement("b"));
  return l;
};
const poeLuz = (l: HTMLElement, esq: number, dir: number) => {
  const b = l.children;
  [Math.max(0, esq), Math.max(0, dir), Math.max(0, -esq), Math.max(0, -dir)].forEach((v, i) => ((b[i] as HTMLElement).style.opacity = v.toFixed(3)));
};

function criarFolha(camada: HTMLElement, caixa: Caixa, frente: HTMLElement, verso: HTMLElement | null): Folha {
  const N = FLIP.tiras, W = Math.round(caixa.width);
  const b = Array.from({ length: N + 1 }, (_, i) => Math.round((i * W) / N));
  const f = div("fv-folha", `left:${Math.round(caixa.left)}px;top:${Math.round(caixa.top)}px;height:${Math.round(caixa.height)}px;width:${W}px`);
  f.setAttribute("aria-hidden", "true");
  (f as Inerte).inert = true;
  const tiras: Tira[] = [];
  let pai: HTMLElement = f;
  for (let i = 0; i < N; i++) {
    const t = div("fv-tira", `left:${i === 0 ? 0 : b[i] - b[i - 1]}px;width:${b[i + 1] - b[i]}px`);
    const ff = div("fv-face"), fv = div("fv-face fv-verso", `transform-origin:${(b[i + 1] - b[i]) / 2}px 50%`);
    const luzF = luz(), luzV = luz();
    ff.append(pagina(frente, W, b[i]), luzF);
    if (verso) fv.append(pagina(verso, W, W - b[i + 1]));
    fv.append(luzV);
    t.append(ff, fv);
    pai.append(t);
    pai = t; // a próxima tira é filha desta: é o que encadeia o ângulo
    tiras.push({ el: t, luzF, luzV });
  }
  camada.append(f);
  return { el: f, tiras, b, tom: [], tomV: [], zEsq: 0, zDir: 0 };
}

// Põe a folha na posição p (0 = deitada à direita, 1 = à esquerda). Devolve onde está a borda livre (px a partir da lombada).
function posicionar(folha: Folha, p: number, volta: boolean): number {
  const N = folha.tiras.length, c = FLIP.curva, G = FLIP.giro;
  const adiante = suave(limita(p / (1 - c))), atras = suave(limita((p - c) / (1 - c)));
  const aBorda = -G * (volta ? atras : adiante), aLombada = -G * (volta ? adiante : atras);
  const s = Math.sin(Math.PI * p);
  let anterior = 0, x = 0;
  for (let i = 0; i < N; i++) {
    const abs = aLombada + (aBorda - aLombada) * Math.pow(i / (N - 1), 1.6);
    folha.tiras[i].el.style.transform = `rotateY(${(abs - anterior).toFixed(3)}deg)`;
    anterior = abs;
    const rad = (abs * Math.PI) / 180, nx = Math.sin(rad), nz = Math.cos(rad), dF = -0.42 * nx + 0.91 * nz;
    const hF = Math.max(0, -0.215 * nx + 0.977 * nz), hV = Math.max(0, 0.215 * nx - 0.977 * nz);
    // Luz de uma lâmpada no alto à esquerda (mesma conta do CRM): escurece onde o papel vira de costas, clareia onde vira para ela.
    folha.tom[i] = Math.min(0.26, (0.91 - dF) * 0.38) - 0.11 * Math.max(0, Math.pow(hF, 60) - 0.25);
    folha.tomV[i] = Math.min(0.26, (0.91 + dF) * 0.38) - 0.11 * Math.max(0, Math.pow(hV, 60) - 0.25);
    x += (folha.b[i + 1] - folha.b[i]) * Math.cos(rad);
  }
  const { tom, tomV } = folha;
  for (let i = 0; i < N; i++) {
    const esq = i === 0 ? tom[0] : (tom[i - 1] + tom[i]) / 2, dir = i === N - 1 ? tom[N - 1] : (tom[i] + tom[i + 1]) / 2;
    const esqV = i === 0 ? tomV[0] : (tomV[i - 1] + tomV[i]) / 2, dirV = i === N - 1 ? tomV[N - 1] : (tomV[i] + tomV[i + 1]) / 2;
    poeLuz(folha.tiras[i].luzF, esq, dir);
    poeLuz(folha.tiras[i].luzV, dirV, esqV); // o verso é espelhado
  }
  folha.el.style.transform = `translateZ(${(FLIP.lombada * 0.06 * s).toFixed(1)}px)`;
  folha.el.style.zIndex = String(p > 0.5 ? folha.zEsq : folha.zDir);
  return x;
}

/** Roda a virada. Devolve a função que cancela e limpa (usada se a tela sair do ar no meio). */
export function virarFolha(o: Pedido): () => void {
  const { pai, caixa, volta } = o;
  const camada = div("fv-camada");
  camada.setAttribute("aria-hidden", "true");
  camada.style.perspective = `${Math.max(1200, Math.round(caixa.width * 4.5))}px`;
  camada.style.perspectiveOrigin = `${caixa.left}px ${Math.round((Math.max(caixa.top, 0) + Math.min(caixa.top + caixa.height, innerHeight)) / 2)}px`;

  if (o.cobertura) {
    const c = o.cobertura, e = div("fv-cobertura", `left:${c.caixa.left}px;top:${c.caixa.top}px;width:${c.caixa.width}px;height:${c.caixa.height}px`);
    (e as Inerte).inert = true;
    c.el.style.cssText = "position:absolute;inset:0";
    e.append(c.el);
    camada.append(e);
  }
  const folha = criarFolha(camada, caixa, o.frente, o.verso);
  folha.zDir = 50;
  folha.zEsq = volta ? 70 : 60;
  if (o.duasPaginas) {
    // bordas das folhas de baixo do bloco, levantando escalonadas
    for (let k = 0; k < 2; k++) {
      const g = div("fv-folha fv-fantasma", `left:${caixa.left}px;top:${caixa.top}px;height:${caixa.height}px;width:${caixa.width}px;animation-delay:${(k + 1) * FLIP.escalonar}ms`);
      const bd = div("fv-fantasma-borda");
      bd.style.left = `${volta ? -caixa.width : caixa.width - 8}px`;
      bd.style.transformOrigin = volta ? `${caixa.width}px 50%` : `${-(caixa.width - 8)}px 50%`;
      bd.style.setProperty("--fv-fant", `${(volta ? 1 : -1) * (24 - k * 9)}deg`);
      bd.style.animationDuration = `${FLIP.duracao}ms`;
      g.append(bd);
      camada.append(g);
    }
  }
  // Sombra no papel de baixo: uma faixa de 190px que só estica (scaleX) e acende (opacity).
  const sombra = div("fv-sombra", `top:${caixa.top}px;height:${caixa.height}px`);
  camada.append(sombra);
  pai.append(camada);
  camada.querySelectorAll<HTMLElement>("[data-st]").forEach((e) => { e.scrollTop = +(e.dataset.st ?? 0); });
  posicionar(folha, volta ? 0.9995 : 0.0005, volta); // um fio fora do zero: o navegador cria as camadas 3D antes do giro

  let sombraEsq = false, parou = false, raf = 0, t0 = 0, aquecer = 2;
  const quadro = (p: number) => {
    const x = posicionar(folha, p, volta), s = Math.sin(Math.PI * p), dir = x >= 0;
    const larg = Math.max(0, Math.min(30 + 160 * s, dir ? caixa.width - x : caixa.width + x));
    if (dir === sombraEsq) { sombraEsq = !dir; sombra.classList.toggle("fv-sombra-esq", sombraEsq); }
    sombra.style.transform = `translateX(${(dir ? caixa.left + x : caixa.left + x - larg).toFixed(1)}px) scaleX(${(larg / 190).toFixed(3)})`;
    sombra.style.opacity = s.toFixed(3);
  };
  const limpar = () => { parou = true; cancelAnimationFrame(raf); camada.remove(); };
  const passo = (agora: number) => {
    if (parou) return;
    if (aquecer-- > 0) { raf = requestAnimationFrame(passo); return; } // o 1º quadro monta as tiras: fora do relógio, senão vira tranco
    if (!t0) t0 = agora;
    const t = limita((agora - t0) / FLIP.duracao);
    quadro(volta ? 1 - t : t);
    if (t < 1) raf = requestAnimationFrame(passo);
    else { limpar(); o.aoTerminar(); }
  };
  raf = requestAnimationFrame(passo);
  return limpar;
}
