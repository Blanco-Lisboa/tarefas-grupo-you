"use client";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEmpresas, useTarefas, type NovaTarefa, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { Ficha, NOMES } from "@/components/ficha/Ficha";
import { diaCurto, nomeMes, nomeSemana } from "@/components/calendario/logica";
import { INICIO, conteudos, diasDoPeriodo, foiPostado, objetivoDe, postadosNoMes, ultimoDia } from "./logica";
import "./mapa.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const rotuloDia = (d: string) => (d === INICIO || d.endsWith("-01") ? diaCurto(d) : `${nomeSemana(d)} ${Number(d.slice(8))}`);

export function TelaMapa() {
  const tarefas = useTarefas();
  const { aplicar } = useFiltroEmpresa();
  const [aberta, setAberta] = useState<NovaTarefa | null>(null);

  const todos = useMemo(() => conteudos(aplicar(tarefas)), [aplicar, tarefas]);
  const marcos = useMemo(() => todos.filter((t) => t.inicio!.slice(0, 10) >= INICIO), [todos]);
  const dias = useMemo(() => diasDoPeriodo(INICIO, ultimoDia(marcos)), [marcos]);
  const aPostar = marcos.filter((t) => !foiPostado(t));
  const proximo = aPostar[0]?.inicio?.slice(0, 10);

  return (
    <section className="mapa">
      <header className="mapa-titulo">
        <h1>Mapa de <span>{nomeMes(INICIO).toLowerCase()}</span></h1>
        <p>
          De {diaCurto(INICIO)} a {diaCurto(dias.at(-1)!)}.{" "}
          {marcos.length ? `${plural(marcos.length, "conteúdo", "conteúdos")} com data de postagem.` : "Nenhum conteúdo com data de postagem neste período."}
        </p>
      </header>

      <dl className="mapa-resumo">
        <div className="bloco-destaque"><dt>A postar</dt><dd>{aPostar.length}</dd></div>
        <div><dt>Já postados no mês</dt><dd>{postadosNoMes(todos)}</dd></div>
        <div><dt>Próxima postagem</dt><dd className="mapa-resumo-data">{proximo ? `${nomeSemana(proximo)}, ${diaCurto(proximo)}` : "Nenhuma"}</dd></div>
      </dl>

      {marcos.length
        ? <Linha dias={dias} marcos={marcos} abrir={setAberta} />
        : <p className="mapa-vazio">Nada para mostrar com os filtros de agora. Crie uma tarefa do tipo Postagem no calendário e ela aparece aqui.</p>}

      {aberta && <Ficha key={(aberta as Tarefa).id} tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}

/**
 * Linha do tempo com o efeito do 21st.dev: a seção é alta, o miolo fica preso na tela (sticky) e a faixa anda para o
 * lado conforme a página rola para baixo (scrub). Cada marco aparece quando chega perto do meio da tela.
 * Largura de um dia = largura do miolo / dias visíveis (CSS, `cqw`), então vale dentro da casca e no celular.
 */
function Linha({ dias, marcos, abrir }: { dias: string[]; marcos: Tarefa[]; abrir: (t: Tarefa) => void }) {
  const palco = useRef<HTMLDivElement>(null);
  const fixo = useRef<HTMLDivElement>(null);
  const faixa = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const [p, f, fx] = [palco.current, fixo.current, faixa.current];
    if (!p || !f || !fx) return;
    const mm = gsap.matchMedia();
    // prefers-reduced-motion: nada daqui roda; tudo já está montado e a faixa rola para o lado pela barra normal.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const montar = () => {
        const ctx = gsap.context(() => {
          const larg = f.clientWidth;
          const dist = fx.scrollWidth - larg;
          if (dist <= 0) return;
          const janela = Math.min(0.9, (larg * 0.18) / dist);
          const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: p, start: "top top", end: "bottom bottom", scrub: true } });
          tl.fromTo(fx, { x: 0 }, { x: -dist, duration: 1 }, 0);
          tl.fromTo(".mapa-progresso", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);

          // um marco = bolinha, haste que cresce a partir da linha e texto que sobe linha a linha
          const revelar = (el: HTMLElement) => {
            const sub = gsap.timeline();
            sub.fromTo(el.querySelector(".mapa-haste"), { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: "power2.out" }, 0);
            sub.fromTo(el.querySelector(".mapa-bolinha"), { scale: 0 }, { scale: 1, duration: 0.3, ease: "power2.out" }, 0.1);
            const linhas = [...el.querySelectorAll("[data-alvo]")].flatMap((a) => SplitText.create(a, { type: "lines", mask: "lines" }).lines);
            sub.fromTo(linhas, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "power2.out", stagger: 0.04 }, 0.25);
            return sub;
          };
          let jaNaTela = 0;
          gsap.utils.toArray<HTMLElement>("[data-marco]", fx).forEach((el) => {
            const sub = revelar(el);
            const t = (el.offsetLeft - larg * 0.62) / dist;
            if (t <= 0) sub.delay(0.15 + jaNaTela++ * 0.12); // já está na tela: entra sozinho, sem esperar a rolagem
            else tl.add(sub.duration(janela), Math.min(t, 1 - janela));
          });
          gsap.fromTo(".mapa-linha", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power2.out" });
        }, f);
        return () => ctx.revert();
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
    return () => mm.revert();
  }, [dias, marcos]);

  return (
    <div className="mapa-palco-pai">
      <div ref={palco} className="mapa-palco" style={{ "--dias": dias.length } as CSSProperties}>
        <div ref={fixo} className="mapa-fixo">
          <div ref={faixa} className="mapa-faixa">
            <span className="mapa-linha" aria-hidden />
            {dias.map((d, i) => (
              <span key={d} className="mapa-dia" data-dia={d} style={{ left: `calc((${i} + 0.5) * var(--dia-w))` }} aria-hidden>{rotuloDia(d)}</span>
            ))}
            {marcos.map((t, i) => <Marco key={t.id} t={t} coluna={dias.indexOf(t.inicio!.slice(0, 10))} lado={i % 2 ? "baixo" : "cima"} abrir={abrir} />)}
          </div>
          <p className="mapa-dica">Role a página para baixo: a linha do tempo anda para o lado.</p>
          <span className="mapa-progresso" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function Marco({ t, coluna, lado, abrir }: { t: Tarefa; coluna: number; lado: "cima" | "baixo"; abrir: (t: Tarefa) => void }) {
  const empresa = useEmpresas().find((e) => e.id === t.empresaId)?.nome ?? "Sem empresa";
  const postado = foiPostado(t);
  const dia = t.inicio!.slice(0, 10);
  return (
    <div className="mapa-marco" data-marco data-dia={dia} data-lado={lado} data-postado={postado} style={{ left: `calc((${coluna} + 0.5) * var(--dia-w))` }}>
      <span className="mapa-haste" aria-hidden />
      <span className="mapa-bolinha" aria-hidden />
      <button type="button" className="mapa-card" onClick={() => abrir(t)}>
        <span className="mapa-objetivo" data-alvo>{objetivoDe(t)}</span>
        <span className="mapa-data" data-alvo>{nomeSemana(dia)}, {diaCurto(dia)}</span>
        <span className="mapa-meta" data-alvo>{empresa}{t.rede ? ` · ${NOMES.rede[t.rede]}` : ""}</span>
        <span className="mapa-estado" data-alvo>{postado ? "Postado" : "A postar"}</span>
      </button>
    </div>
  );
}
