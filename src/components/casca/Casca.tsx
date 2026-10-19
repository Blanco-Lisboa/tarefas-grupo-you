"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FiltroEmpresa } from "./FiltroEmpresa";
import { AvisoErro } from "./AvisoErro";
import { Menu } from "./Menu";
import { assinar, definirRecolhido, lerRecolhido } from "./menu-recolhido";
import "./casca.css";

// Telas sem a barra de cima: o cadastro de empresas (filtro não faz sentido) e as telas que põem o FiltroEmpresa
// na própria linha do título (itens 132 e 141).
const SEM_FILTRO = ["/configuracoes", "/tarefas", "/calendario", "/mapa", "/conteudos", "/pastas"];

export function Casca({ children }: { children: ReactNode }) {
  const recolhido = useSyncExternalStore(assinar, lerRecolhido, () => false);
  const caminho = usePathname();
  if (caminho.startsWith("/entrar")) return <>{children}</>; // entrada: sem menu, sem dados
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
        <AvisoErro />
      </main>
    </div>
  );
}
