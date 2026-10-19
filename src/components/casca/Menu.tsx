import Link from "next/link";
import type { CSSProperties } from "react";

// Ícones: arquivos SVG da Beec (public/beec/icones), pintados via máscara para poder ficar ouro no item ativo.
const ITENS = [
  { href: "/calendario", rotulo: "Calendário", icone: "calendario-claro" },
  { href: "/mapa", rotulo: "Mapa", icone: "alvo-claro" },
  { href: "/tarefas", rotulo: "Tarefas", icone: "lista-claro" },
  { href: "/conteudos", rotulo: "Conteúdos", icone: "video-claro" },
  { href: "/pastas", rotulo: "Pastas", icone: "pacote-claro" },
];
const CONFIGURACOES = { href: "/configuracoes", rotulo: "Configurações", icone: "loja-claro" };

type Props = { recolhido: boolean; alternar: () => void; caminho: string };

function Item({ item, caminho }: { item: (typeof ITENS)[number]; caminho: string }) {
  return (
    <li>
      <Link href={item.href} className="menu-item" title={item.rotulo} aria-current={caminho === item.href ? "page" : undefined}>
        <span className="menu-icone" aria-hidden style={{ "--icone": `url(/beec/icones/${item.icone}.svg)` } as CSSProperties} />
        <span className="menu-rotulo">{item.rotulo}</span>
      </Link>
    </li>
  );
}

export function Menu({ recolhido, alternar, caminho }: Props) {
  const acao = recolhido ? "Expandir menu" : "Recolher menu";
  return (
    <nav className="menu" aria-label="Menu principal">
      {/* Os dois logos ficam no HTML; o CSS mostra um conforme o data-menu do <html> (assim não pisca ao recarregar). */}
      <div className="menu-marca">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="menu-logo" src="/beec/logo/beec-logo-bege.svg" alt="Beec" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="menu-logo-icone" src="/beec/logo/beec-icone-bege.svg" alt="Beec" />
      </div>
      <ul className="menu-lista">
        {ITENS.map((i) => <Item key={i.href} item={i} caminho={caminho} />)}
      </ul>
      <div className="menu-pe">
        <ul className="menu-lista">
          <Item item={CONFIGURACOES} caminho={caminho} />
        </ul>
        <div className="menu-pessoas">
          <span className="bolinha bolinha-n" title="Natham">N</span>
          <span className="bolinha bolinha-m" title="Matheus">M</span>
        </div>
        <button type="button" className="menu-item menu-alterna" onClick={alternar} aria-label={acao} aria-expanded={!recolhido} title={acao}>
          <svg className="menu-icone-svg" viewBox="0 0 20 20" aria-hidden>
            <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7.25 4v12" stroke="currentColor" strokeWidth="1.5" />
            <path className="menu-alterna-seta" d="M13 7.5 10.5 10l2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="menu-rotulo">{acao}</span>
        </button>
      </div>
    </nav>
  );
}
