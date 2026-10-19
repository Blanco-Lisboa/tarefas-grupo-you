"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FiltroEmpresa } from "./FiltroEmpresa";
import { Menu } from "./Menu";
import { assinar, definirRecolhido, lerRecolhido } from "./menu-recolhido";
import "./casca.css";

// Telas em que o filtro de empresa não faz sentido (cadastro de empresas).
const SEM_FILTRO = ["/configuracoes"];

export function Casca({ children }: { children: ReactNode }) {
  const recolhido = useSyncExternalStore(assinar, lerRecolhido, () => false);
  const caminho = usePathname();
  return (
    <div className="casca">
      <Menu recolhido={recolhido} alternar={() => definirRecolhido(!recolhido)} caminho={caminho} />
      <main className="casca-conteudo">
        {!SEM_FILTRO.includes(caminho) && (
          <div className="casca-barra">
            <FiltroEmpresa />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
