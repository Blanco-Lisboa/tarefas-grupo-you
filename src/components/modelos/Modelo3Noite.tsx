import { Vitrine } from "./Vitrine";
import "./modelo-3-noite.css";

// Modelo 3 · Noite: escuro de vidro com um laranja (ref-1 e ref-2). Botões com volume, datas em letra de máquina.
export function Modelo3Noite() {
  return (
    <Vitrine
      numero={3}
      id="noite"
      nome="Noite"
      ideia="Escuro de vidro com um laranja só para o que está ativo. Botões com volume, como peças de aparelho."
      cores={[
        { nome: "Fundo", hex: "#0B0B0C" },
        { nome: "Superfície", hex: "#161618" },
        { nome: "Texto", hex: "#F5F5F7" },
        { nome: "Texto fraco", hex: "#8E8E93" },
        { nome: "Borda", hex: "#2C2C30" },
        { nome: "Acento", hex: "#FF5F00" },
      ]}
    />
  );
}
