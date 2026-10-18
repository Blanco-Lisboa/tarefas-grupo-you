import Link from "next/link";
import type { CSSProperties } from "react";

// Ícones: arquivos SVG da Beec (public/beec/icones), pintados via máscara para poder ficar ouro no item ativo.
const ITENS = [
  { href: "/calendario", rotulo: "Calendário", icone: "calendario-claro" },
  { href: "/tarefas", rotulo: "Tarefas", icone: "lista-claro" },
  { href: "/conteudos", rotulo: "Conteúdos", icone: "video-claro" },
  { href: "/pastas", rotulo: "Pastas", icone: "pacote-claro" },
  { href: "/configuracoes", rotulo: "Configurações", icone: "loja-claro" },
];

type Props = { recolhido: boolean; alternar: () => void; caminho: string };

export function Menu({ recolhido, alternar, caminho }: Props) {
  return (
    <div className="menu-pai">
      <div className="menu-sombra" aria-hidden />
      <nav className="menu-vidro corte-22" aria-label="Menu principal">
        <div className="menu-topo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={recolhido ? "menu-logo-icone" : "menu-logo"}
            src={recolhido ? "/beec/logo/beec-icone-bege.svg" : "/beec/logo/beec-logo-bege.svg"}
            alt="Beec"
          />
          <button
            type="button"
            className="menu-alterna"
            onClick={alternar}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!recolhido}
          >
            <span /><span /><span />
          </button>
        </div>
        <ul className="menu-lista">
          {ITENS.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className="menu-item"
                title={i.rotulo}
                aria-current={caminho === i.href ? "page" : undefined}
              >
                <span className="menu-icone" aria-hidden style={{ "--icone": `url(/beec/icones/${i.icone}.svg)` } as CSSProperties} />
                <span className="menu-rotulo">{i.rotulo}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="menu-pe">
          <span className="bolinha bolinha-n" title="Natham">N</span>
          <span className="bolinha bolinha-m" title="Matheus">M</span>
        </div>
      </nav>
    </div>
  );
}
