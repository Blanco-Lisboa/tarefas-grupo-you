import Link from "next/link";

// Ícones de traço fino, no desenho da amostra do modelo 1 Névoa (item 60). currentColor: o item ativo pinta de azul.
const ICONES = {
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  mapa: <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3.5 3.5 0 000-7H9a3.5 3.5 0 010-7h6.5" /></>,
  tarefas: <><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 12l3 3 5-6" /></>,
  conteudos: <><path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z" /><path d="M3.5 12.5l8.5 4.5 8.5-4.5" /></>,
  pastas: <path d="M3.5 7.5a2 2 0 012-2h4l2 2.5h7a2 2 0 012 2v8a2 2 0 01-2 2h-13a2 2 0 01-2-2z" />,
  configuracoes: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  recolher: <><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><path d="M9.5 4.5v15" /></>,
};
type NomeIcone = keyof typeof ICONES;

function Icone({ nome }: { nome: NomeIcone }) {
  return (
    <svg className="menu-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONES[nome]}
    </svg>
  );
}

type ItemMenu = { href: string; rotulo: string; icone: NomeIcone };
const ITENS: ItemMenu[] = [
  { href: "/calendario", rotulo: "Calendário", icone: "calendario" },
  { href: "/mapa", rotulo: "Mapa", icone: "mapa" },
  { href: "/tarefas", rotulo: "Caderno", icone: "tarefas" },
  { href: "/conteudos", rotulo: "Conteúdos", icone: "conteudos" },
  { href: "/pastas", rotulo: "Pastas", icone: "pastas" },
];
const CONFIGURACOES: ItemMenu = { href: "/configuracoes", rotulo: "Configurações", icone: "configuracoes" };

type Props = { recolhido: boolean; alternar: () => void; caminho: string };

function Item({ item, caminho }: { item: ItemMenu; caminho: string }) {
  return (
    <li>
      <Link href={item.href} className="menu-item" target="_self" title={item.rotulo} aria-current={caminho === item.href ? "page" : undefined}>
        <Icone nome={item.icone} />
        <span className="menu-rotulo">{item.rotulo}</span>
      </Link>
    </li>
  );
}

export function Menu({ recolhido, alternar, caminho }: Props) {
  const acao = recolhido ? "Expandir menu" : "Recolher menu";
  return (
    <nav className="menu" aria-label="Menu principal">
      {/* Nome do sistema em texto, sem marca (provisório). Recolhido, fica só a inicial; o CSS troca pelo data-menu do <html>. */}
      <div className="menu-marca">
        <span className="menu-inicial" aria-hidden>T</span>
        <span className="menu-nome">Tarefas</span>
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
          <Icone nome="recolher" />
          <span className="menu-rotulo">{acao}</span>
        </button>
      </div>
    </nav>
  );
}
