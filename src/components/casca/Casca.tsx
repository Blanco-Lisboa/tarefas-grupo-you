"use client";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FiltroEmpresa } from "./FiltroEmpresa";
import { Menu } from "./Menu";
import "./casca.css";

// Telas em que o filtro de empresa não faz sentido (cadastro de empresas).
const SEM_FILTRO = ["/configuracoes"];

export function Casca({ children }: { children: ReactNode }) {
  const [recolhido, setRecolhido] = useState(false);
  const caminho = usePathname();
  return (
    <div className="casca" data-recolhido={recolhido}>
      <Menu recolhido={recolhido} alternar={() => setRecolhido((v) => !v)} caminho={caminho} />
      <main className="casca-conteudo">
        {!SEM_FILTRO.includes(caminho) && <FiltroEmpresa />}
        {children}
      </main>
    </div>
  );
}
