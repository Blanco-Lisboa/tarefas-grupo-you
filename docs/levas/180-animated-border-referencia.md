# 180 · referência que o Natham mandou (21/10) — borda com luz girando

Pedido: "Troque esse efeito [card do Mapa, 180-print-card-mapa-atual.png] por esse [180-print-borda-animada.png] e deixe uma leve sombra atrás do card pra dar profundidade. A nossa sombra padrão."

Código que ele colou (shadcn/Tailwind; o `use-in-view` NÃO veio junto):

```tsx
"use client";

import { useMemo, type ComponentProps, type Ref } from "react";

import { useInView } from "@/components/ui/animated-border-utils/use-in-view";
import { cn } from "@/lib/utils";

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

interface AnimatedBorderProps extends ComponentProps<"div"> {
  /** Seconds for the light to go around once. */
  duration?: number;
  /** Colour of the light: any CSS colour, including theme variables. */
  color?: string;
  /** Border width, in px. */
  width?: number;
  /** Classes for the surface inside the border, where the content sits. */
  contentClassName?: string;
}

function AnimatedBorder({
  duration = 6,
  color = "var(--primary)",
  width = 1,
  className,
  contentClassName,
  style,
  children,
  ref,
  ...props
}: AnimatedBorderProps) {
  const [observe, inView] = useInView<HTMLDivElement>({ rootMargin: "100px" });
  const mergedRef = useMemo(() => mergeRefs(ref, observe), [ref, observe]);

  return (
    <div
      ref={mergedRef}
      data-slot="animated-border"
      className={cn(
        "bg-border relative isolate overflow-hidden rounded-xl",
        className,
      )}
      style={{ padding: width, ...style }}
      {...props}
    >
      {/* Centered with margins rather than a transform, which the spin would overwrite. */}
      <span
        aria-hidden="true"
        data-slot="animated-border-light"
        className="pointer-events-none absolute top-1/2 left-1/2 -mt-[100%] -ml-[100%] aspect-square w-[200%] animate-spin motion-reduce:animate-none"
        style={{
          background: `conic-gradient(from 0deg, transparent 0 62%, ${color} 82%, transparent 96%)`,
          animationDuration: `${duration}s`,
          animationPlayState: inView ? "running" : "paused",
        }}
      />
      <div
        data-slot="animated-border-content"
        className={cn(
          "bg-card text-card-foreground relative h-full rounded-[inherit]",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { AnimatedBorder, type AnimatedBorderProps };
export default AnimatedBorder;
```

## 180b · ajuste pedido pelo Natham (21/10)

Print: `180b-print-card-mapa.png`. Pedido: "troque ele, deixe um card com efeito vidro com uma cor mais escura... e tire esse defeito na parte de baixo".

- Mantida a luz girando na borda, o raio 10px e a sombra padrão `--sombra`.
- Miolo do card solto vira vidro escuro (fundo azul-marinho a 78%, desfoque 14px), textos claros e selo de etapa em versão clara (`color-mix` da etapa com branco). Só `mapa.css`.
- Defeito de baixo: medido no navegador (`provas/r17-borda-vidro/medir.mjs`), o miolo cobre tudo: borda 66px x miolo 64px, 1px em cada lado nos 3 tamanhos (1903, 1440, 390). Não era altura. A causa era o trilho da borda, um cinza opaco (`--borda`), que na base se somava ao 1px de deslocamento da sombra e parecia uma barra grossa. O trilho do Mapa agora é um filete branco translúcido, igual nos 4 lados.
- Provas: `provas/r17-borda-vidro/` (`card-*.png` e `zoom-baixo-*.png`).
