import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { Arquivo } from "@/lib/dados";

// 268: vídeo que terminou de subir em segundo plano chega ao card com a ficha aberta; entra na lista da ficha também, senão o próximo Salvar o apagaria.
// Lupa 6: arquivo que a ficha já tem recebe o papel do banco (o vídeo sem legenda vira "original" quando o legendado chega).
export function useArquivosQueChegam(vivos: Arquivo[] | undefined, iniciais: Arquivo[], definir: Dispatch<SetStateAction<Arquivo[]>>) {
  const conhecidos = useRef(new Set(iniciais.flatMap((a) => (a.id ? [a.id] : []))));
  useEffect(() => {
    const novos = (vivos ?? []).filter((a) => a.id && !conhecidos.current.has(a.id));
    novos.forEach((a) => conhecidos.current.add(a.id!));
    const papel = new Map((vivos ?? []).flatMap((a) => (a.id ? [[a.id, a.papel] as const] : [])));
    definir((x) => [...x.map((a) => (a.id && papel.has(a.id) && papel.get(a.id) !== a.papel ? { ...a, papel: papel.get(a.id) } : a)), ...novos]);
  }, [vivos, definir]);
}
