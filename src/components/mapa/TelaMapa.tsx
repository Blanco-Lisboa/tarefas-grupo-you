"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEmpresas, useTarefas, type NovaTarefa, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { FiltroEmpresa } from "@/components/casca/FiltroEmpresa";
import { SeloEmpresa, IconeRede } from "@/components/ui/Marca";
import { BordaAnimada } from "@/components/ui/BordaAnimada";
import { Ficha, NOMES } from "@/components/ficha/Ficha";
import { diaCurto, nomeMes, nomeSemana } from "@/components/calendario/logica";
import { conteudos, hoje, diasDoPeriodo, filaPorDia, foiPostado, semData, tituloDe, postadosNoMes, ultimoDia } from "./logica";
import { EmOrdem, type Formato } from "./EmOrdem";
import "./mapa.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
// Dia da semana + número; no primeiro dia do período e no dia 1 de cada mês entra o mês, para dar para saber onde está no meio da rolagem.
const rotuloDia = (d: string, inicio: string) => (
  <>
    {nomeSemana(d)} {Number(d.slice(8))}
    {(d === inicio || d.endsWith("-01")) && <b className="mapa-mes">{nomeMes(d).slice(0, 3)}</b>}
  </>
)

// Posição (% da largura de 7 dias, % da altura) e tamanho de cada brilho do fundo.
const BRILHOS: [number, number, number][] = [[12, 28, 50], [48, 72, 56], [82, 34, 48]];

const FORMATOS: [Formato, string][] = [["linha", "Linha do tempo"], ["fila", "Fila"]];
const CHAVE_FORMATO = "grade:mapa-formato";
// O formato escolhido fica lembrado ao recarregar. Esta tela só monta no navegador (ver TelaMapa), então ler o armazenamento aqui é seguro.
const formatoSalvo = (): Formato => { try { return localStorage.getItem(CHAVE_FORMATO) === "fila" ? "fila" : "linha"; } catch { return "linha"; } };
const lembrar = (f: Formato) => { try { localStorage.setItem(CHAVE_FORMATO, f); } catch {} };

const semAviso = () => () => {};
// O dia de hoje só existe no navegador (o servidor pode estar em outro fuso): espera montar para não dar diferença na hidratação.
export function TelaMapa() {
  const inicio = useSyncExternalStore(semAviso, () => hoje(), () => ""); // servidor: "" até hidratar
  return inicio ? <Mapa inicio={inicio} /> : null;
}

function Mapa({ inicio: INICIO }: { inicio: string }) {
  const tarefas = useTarefas();
  const { aplicar } = useFiltroEmpresa();
  const [aberta, setAberta] = useState<NovaTarefa | null>(null);
  const [formato, setFormato] = useState<Formato>(formatoSalvo);

  const todos = useMemo(() => conteudos(aplicar(tarefas)), [aplicar, tarefas]);
  const marcos = useMemo(() => todos.filter((t) => t.inicio!.slice(0, 10) >= INICIO), [todos, INICIO]);
  const dias = useMemo(() => diasDoPeriodo(INICIO, ultimoDia(marcos)), [marcos, INICIO]);
  const aPostar = marcos.filter((t) => !foiPostado(t));
  const [m1, m2] = [nomeMes(INICIO), nomeMes(dias.at(-1)!)].map((m) => m.toLowerCase());
  const meses = m1 === m2 ? m1 : `${m1} e ${m2}`;
  const semDia = useMemo(() => semData(aplicar(tarefas)), [aplicar, tarefas]);
  const fila = useMemo(() => filaPorDia(aplicar(tarefas), INICIO), [aplicar, tarefas, INICIO]);
  const proximo = aPostar[0]?.inicio?.slice(0, 10);

  const topo = (
    <div className="mapa-topo">
      <div className="mapa-formato" role="group" aria-label="Formato do mapa">
        {FORMATOS.map(([f, nome]) => <button key={f} type="button" aria-pressed={formato === f} onClick={() => { setFormato(f); lembrar(f); }}>{nome}</button>)}
      </div>
      <header className="mapa-titulo">
        <div className="mapa-quem">
          <h1>Mapa de <span>{meses}</span></h1>
          <FiltroEmpresa />
        </div>
        <p>
          De {diaCurto(INICIO)} a {diaCurto(dias.at(-1)!)}.{" "}
          {marcos.length ? `${plural(marcos.length, "conteúdo", "conteúdos")} com data de postagem.` : "Nenhum conteúdo com data de postagem neste período."}
        </p>
      </header>
      <dl className="mapa-resumo">
        <div className="bloco-destaque"><dt>A postar</dt><dd className="bloco-numero">{aPostar.length}</dd></div>
        <div><dt>Já postados no mês</dt><dd>{postadosNoMes(todos, INICIO)}</dd></div>
        <div><dt>Próxima postagem</dt><dd className="mapa-resumo-data">{proximo ? `${nomeSemana(proximo)}, ${diaCurto(proximo)}` : "Nenhuma"}</dd></div>
      </dl>
    </div>
  );

  return (
    <section className="mapa">
      {semDia.length > 0 && (
        <div className="mapa-sem-data">
          <span>Sem data</span>
          {semDia.map((t) => <button key={t.id} type="button" onClick={() => setAberta(t)}>{tituloDe(t)}</button>)}
        </div>
      )}
      {formato !== "linha"
        ? <>{topo}<EmOrdem grupos={fila} abrir={setAberta} /></>
        : marcos.length
        ? <Linha dias={dias} inicio={INICIO} marcos={marcos} abrir={setAberta} topo={topo} />
        : <>{topo}<p className="mapa-vazio">Nada para mostrar com os filtros de agora. Crie uma tarefa do tipo Postagem no calendário e ela aparece aqui.</p></>}

      {aberta && <Ficha key={(aberta as Tarefa).id} tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}

/**
 * Linha do tempo com o efeito do 21st.dev: a seção é alta, o miolo fica preso na tela (sticky) e a faixa anda para o
 * lado conforme a página rola para baixo (scrub). Cada marco aparece quando chega perto do meio da tela.
 * Largura de um dia = largura do miolo / dias visíveis (CSS, `cqw`), então vale dentro da casca e no celular.
 */
function Linha({ dias, inicio, marcos, abrir, topo }: { dias: string[]; inicio: string; marcos: Tarefa[]; abrir: (t: Tarefa) => void; topo: ReactNode }) {
  const pai = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const fixo = useRef<HTMLDivElement>(null);
  const faixa = useRef<HTMLDivElement>(null);
  // um marco por dia: os conteúdos do mesmo dia ficam empilhados na mesma haste, então nunca se sobrepõem
  const porDia = useMemo(() => {
    const m = new Map<string, Tarefa[]>();
    for (const t of marcos) m.set(t.inicio!.slice(0, 10), [...(m.get(t.inicio!.slice(0, 10)) ?? []), t]);
    return [...m];
  }, [marcos]);

  useLayoutEffect(() => {
    const [pa, p, f, fx] = [pai.current, palco.current, fixo.current, faixa.current];
    if (!pa || !p || !f || !fx) return;
    // No celular, a faixa se move atrás da janela. Mantém o bloco do dia visível
    // quando sua haste chega perto da borda, inclusive durante a rolagem horizontal.
    const ajustarBlocos = () => {
      const celular = matchMedia("(max-width: 767px)").matches;
      const janela = f.getBoundingClientRect();
      f.querySelectorAll<HTMLElement>(".mapa-marco").forEach((marco) => {
        const bloco = marco.querySelector<HTMLElement>(".mapa-bloco");
        if (!bloco) return;
        const x = marco.getBoundingClientRect().left;
        if (!celular || x < janela.left || x > janela.right) {
          bloco.style.removeProperty("translate");
          return;
        }
        const inicio = x + (parseFloat(getComputedStyle(bloco).left) || 0);
        const minimo = janela.left + 8;
        const maximo = Math.max(minimo, janela.right - bloco.offsetWidth - 8);
        bloco.style.translate = `${Math.round(Math.max(minimo, Math.min(inicio, maximo)) - inicio)}px 0`;
      });
    };
    let quadro = 0;
    const agendarAjuste = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(ajustarBlocos);
    };
    addEventListener("scroll", agendarAjuste, { passive: true });
    f.addEventListener("scroll", agendarAjuste, { passive: true });
    addEventListener("resize", agendarAjuste);
    agendarAjuste();
    // O palco (cabeçalho + card) gruda onde começa, logo abaixo do filtro, e tem a altura que sobra da tela: tudo cabe na primeira tela.
    const medir = () => { pa.style.setProperty("--mapa-topo", `${Math.round(pa.getBoundingClientRect().top + scrollY)}px`); };
    medir();
    addEventListener("resize", medir);
    const mm = gsap.matchMedia();
    // prefers-reduced-motion: nada daqui roda; tudo já está montado e a faixa rola para o lado pela barra normal.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const montar = () => {
        const ctx = gsap.context(() => {
          const larg = f.clientWidth;
          const dist = fx.scrollWidth - larg;
          if (dist <= 0) return;
          const janela = Math.min(0.9, (larg * 0.14) / dist);
          // Na primeira rolagem o palco sobe até o topo e o card cresce junto (a base não se mexe): sem faixa vazia em cima.
          const colado = parseFloat(getComputedStyle(f.parentElement!).top);
          const ganho = parseFloat(pa.style.getPropertyValue("--mapa-topo")) - colado;
          if (ganho > 0) ScrollTrigger.create({ start: 0, end: ganho, scrub: true, onUpdate: (st) => pa.style.setProperty("--cresce", String(st.progress)) });
          const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: ajustarBlocos, scrollTrigger: { trigger: p, start: `top top+=${colado}`, end: "+=" + dist, scrub: true } });
          tl.fromTo(fx, { x: 0 }, { x: -dist, duration: 1 }, 0);
          tl.fromTo(".mapa-progresso", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);

          // um marco = ponto da linha, bolinha, haste que cresce a partir da linha e texto que sobe linha a linha
          const revelar = (el: HTMLElement) => {
            const sub = gsap.timeline();
            sub.fromTo(el, { "--ponto": 0 }, { "--ponto": 1, duration: 0.3, ease: "power2.out" }, 0); // ponto da linha cresce junto
            sub.fromTo(el.querySelector(".mapa-haste"), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: "power2.out" }, 0);
            sub.fromTo(el.querySelector(".mapa-bolinha"), { scale: 0 }, { scale: 1, duration: 0.3, ease: "power2.out" }, 0.1);
            const linhas = [...el.querySelectorAll("[data-alvo]")].flatMap((a) => SplitText.create(a, { type: "lines", mask: "lines" }).lines);
            sub.fromTo(linhas, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "power2.out", stagger: 0.04 }, 0.25);
            return sub;
          };
          gsap.utils.toArray<HTMLElement>("[data-marco]", fx).forEach((el) => {
            const t = (el.offsetLeft - larg * 0.98) / dist; // anima ao ENTRAR pela direita: no meio da tela já está inteiro
            if (t <= 0) return; // já está na tela no início: nasce inteiro, a animação fica para os que entram depois
            tl.add(revelar(el).duration(janela), Math.min(t, 1 - janela));
          });
          gsap.fromTo(".mapa-linha", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power2.out" });
        }, f);
        return () => { ctx.revert(); pa.style.removeProperty("--cresce"); };
      };
      let limpar = montar();
      let largura = f.clientWidth;
      const ro = new ResizeObserver(() => {
        if (f.clientWidth === largura) return;
        largura = f.clientWidth;
        limpar();
        limpar = montar();
      });
      ro.observe(f);
      return () => { ro.disconnect(); limpar(); };
    });
    return () => {
      mm.revert();
      removeEventListener("resize", medir);
      removeEventListener("resize", agendarAjuste);
      removeEventListener("scroll", agendarAjuste);
      f.removeEventListener("scroll", agendarAjuste);
      cancelAnimationFrame(quadro);
      f.querySelectorAll<HTMLElement>(".mapa-bloco").forEach((bloco) => bloco.style.removeProperty("translate"));
    };
  }, [dias, marcos]);

  return (
    <div ref={pai} className="mapa-palco-pai">
      <div ref={palco} className="mapa-palco" style={{ "--dias": dias.length } as CSSProperties}>
        <div className="mapa-fixo">
          {topo}
          <div ref={fixo} className="mapa-cartao">
            <div ref={faixa} className="mapa-faixa">
              {/* Brilho azul discreto, repetido a cada 7 dias e andando com a faixa. */}
              {Array.from({ length: Math.ceil((dias.length + 1) / 7) }, (_, b) => BRILHOS.map(([x, y, d], k) => (
                <span key={`${b}-${k}`} className="mapa-mancha" aria-hidden style={{ "--d": d, left: `calc(${b * 7 + x / 100 * 7} * var(--dia-w))`, top: `${y}%` } as CSSProperties} />
              )))}
              <span className="mapa-linha" aria-hidden />
              {dias.map((d, i) => (
                <span key={d} className="mapa-dia" data-dia={d} style={{ left: `calc((${i} + 0.5) * var(--dia-w))` }} aria-hidden>{rotuloDia(d, inicio)}</span>
              ))}
              {porDia.map(([dia, ts], i) => <Marco key={dia} dia={dia} ts={ts} coluna={dias.indexOf(dia)} lado={i % 2 ? "baixo" : "cima"} abrir={abrir} />)}
            </div>
            <p className="mapa-dica">Role para baixo, a linha anda para o lado.</p>
            <span className="mapa-progresso" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

const REDE_NOME = { instagram: "Instagram", facebook: "Facebook" } as const;
/** Card Postado (204): formato, redes, data e os links do post, sem arquivo. Aparece ao passar o mouse ou focar; os links ficam FORA do botão do card. */
function PostadoNasRedes({ t }: { t: Tarefa }) {
  const postadas = (t.postagens ?? []).filter((p) => p.status === "postado");
  if (!postadas.length) return null;
  const quando = postadas.map((p) => p.postadoEm).filter(Boolean).sort()[0];
  const data = quando ? new Date(quando).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }) : "";
  return (
    <span className="mapa-postado">
      <span>{[t.formato && NOMES.formato[t.formato], postadas.map((p) => REDE_NOME[p.rede]).join(" + "), data].filter(Boolean).join(" · ")}</span>
      {postadas.filter((p) => p.link).map((p) => <a key={p.rede} href={p.link} target="_blank" rel="noopener noreferrer">Ver no {REDE_NOME[p.rede]}</a>)}
    </span>
  );
}

function Marco({ dia, ts, coluna, lado, abrir }: { dia: string; ts: Tarefa[]; coluna: number; lado: "cima" | "baixo"; abrir: (t: Tarefa) => void }) {
  const empresas = useEmpresas();
  const tudoPostado = ts.every(foiPostado);
  const raiz = useRef<HTMLDivElement>(null);
  // Celular: o 1º toque abre o leque da pilha, o 2º abre a ficha. Com mouse o leque abre ao passar (CSS) e o clique já abre a ficha.
  const [leque, setLeque] = useState(false);
  useEffect(() => {
    if (!leque) return;
    const fora = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setLeque(false); };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [leque]);
  const clicar = (t: Tarefa) => {
    if (ts.length > 1 && !leque && matchMedia("(hover: none)").matches) return setLeque(true);
    setLeque(false);
    abrir(t);
  };
  return (
    <div ref={raiz} className="mapa-marco" data-marco data-dia={dia} data-lado={lado} data-postado={tudoPostado} style={{ left: `calc((${coluna} + 0.5) * var(--dia-w))` }}>
      <span className="mapa-haste" aria-hidden />
      <span className="mapa-bolinha" aria-hidden />
      <div className="mapa-bloco">
        <span className="mapa-data" data-alvo>{nomeSemana(dia)}, {diaCurto(dia)}</span>
        <div className="mapa-pilha" data-n={ts.length} data-aberta={leque} style={{ "--n": ts.length } as CSSProperties}>
          {ts.map((t, i) => {
            const postado = foiPostado(t);
            const empresa = empresas.find((e) => e.id === t.empresaId)?.nome ?? "Sem empresa";
            const botao = (
              <button key={t.id} type="button" className="mapa-card" aria-label={`${tituloDe(t)}, ${empresa}, ${postado ? "postado" : t.etapa ? NOMES.etapa[t.etapa] : "a postar"}`} data-postado={postado} onClick={() => clicar(t)}>
                <span className="mapa-faixa-titulo" aria-hidden>{tituloDe(t)}</span>
                {ts.length > 1 && <span className="mapa-folha-contagem" aria-hidden>{i + 1}/{ts.length}</span>}
                <span className="mapa-objetivo" data-alvo>{tituloDe(t)}</span>
                <span className="mapa-info">
                  <span className="mapa-tag"><SeloEmpresa empresaId={t.empresaId} nome={empresa} tamanho={16} comNome /></span>
                  {t.rede && <span className="mapa-meta"><IconeRede rede={t.rede} tamanho={16} /></span>}
                  <span className="mapa-estado" data-alvo>{postado ? "Postado" : t.etapa ? NOMES.etapa[t.etapa] : "A postar"}</span>
                </span>
              </button>
            );
            return <BordaAnimada key={t.id} style={{ "--i": i } as CSSProperties}>{botao}{postado && <PostadoNasRedes t={t} />}</BordaAnimada>;
          })}
        </div>
      </div>
    </div>
  );
}
