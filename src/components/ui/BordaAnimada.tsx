"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./borda-animada.css";

/** Borda com uma luz girando em volta (item 180). A luz pausa quando o card sai da tela. */
export function BordaAnimada({ children, duracao = 6, cor = "var(--azul)", largura = 1, className = "", style }: {
  children: ReactNode;
  /** Segundos para a luz dar uma volta. */
  duracao?: number;
  /** Cor da luz: qualquer cor CSS, inclusive variável do tema. */
  cor?: string;
  /** Espessura da borda, em px. */
  largura?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const [naTela, setNaTela] = useState(true);
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={raiz} className={`borda-animada ${className}`.trim()} style={{ ...style, padding: largura, "--borda-cor": cor, "--borda-volta": `${duracao}s`, "--borda-rodando": naTela ? "running" : "paused" } as CSSProperties}>
      <span className="borda-animada-anel" aria-hidden><span className="borda-animada-luz" /></span>
      {children}
    </div>
  );
}
