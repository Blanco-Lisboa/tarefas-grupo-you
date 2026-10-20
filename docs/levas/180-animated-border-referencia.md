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
