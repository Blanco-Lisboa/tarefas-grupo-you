import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { Arquivo } from "@/lib/dados";

// 268: vídeo que terminou de subir em segundo plano chega ao card com a ficha aberta; entra na lista da ficha também, senão o próximo Salvar o apagaria.
export function useArquivosQueChegam(vivos: Arquivo[] | undefined, iniciais: Arquivo[], definir: Dispatch<SetStateAction<Arquivo[]>>) {
  const conhecidos = useRef(new Set(iniciais.flatMap((a) => (a.id ? [a.id] : []))));
  useEffect(() => {
    const novos = (vivos ?? []).filter((a) => a.id && !conhecidos.current.has(a.id));
    if (!novos.length) return;
    novos.forEach((a) => conhecidos.current.add(a.id!));
    definir((x) => [...x, ...novos]);
  }, [vivos, definir]);
}
