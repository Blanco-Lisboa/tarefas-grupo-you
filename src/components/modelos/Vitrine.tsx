"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import "./modelos.css";

// A mesma vitrine para os 5 modelos (item 57): as peças são iguais, só a pele (o .css de cada modelo) muda.
// Assim o Natham compara peça com peça, de coluna em coluna.

export type Cor = { nome: string; hex: string | null };

const ICONES = {
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  mais: <path d="M12 5v14M5 12h14" />,
  baixo: <path d="M6 9l6 6 6-6" />,
  certo: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  tarefas: <><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 12l3 3 5-6" /></>,
  conteudos: <><path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z" /><path d="M3.5 12.5l8.5 4.5 8.5-4.5" /></>,
  mapa: <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3.5 3.5 0 000-7H9a3.5 3.5 0 010-7h6.5" /></>,
};

export function Icone({ nome }: { nome: keyof typeof ICONES }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[nome]}
    </svg>
  );
}

const EMPRESAS = ["Todas", "Beec", "You"];

function Seletor({ abertoNoInicio }: { abertoNoInicio: boolean }) {
  const [aberto, setAberto] = useState(abertoNoInicio);
  const [escolha, setEscolha] = useState("Todas");
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div className="sel" ref={raiz}>
      <button type="button" className="b sel-botao" aria-expanded={aberto} aria-haspopup="true" onClick={() => setAberto(!aberto)}>
        {escolha === "Todas" ? "Empresa" : escolha}
        <Icone nome="baixo" />
      </button>
      {aberto && (
        <div className="sel-lista" role="group" aria-label="Escolher empresa">
          {EMPRESAS.map((e) => (
            <button
              key={e}
              type="button"
              className="sel-opcao"
              aria-pressed={e === escolha}
              onClick={() => { setEscolha(e); setAberto(false); }}
            >
              {e}
              {e === escolha && <span className="sel-certo"><Icone nome="certo" /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mod-bloco">
      <h3 className="mod-rot">{titulo}</h3>
      {children}
    </section>
  );
}

type Props = { numero: number; id: string; nome: string; ideia: string; cores: Cor[] };

export function Vitrine({ numero, id, nome, ideia, cores }: Props) {
  return (
    <article className={`mod mod-${id}`} id={`modelo-${numero}`} aria-labelledby={`modelo-${numero}-nome`}>
      <header className="mod-topo">
        <span className="mod-num">{numero}</span>
        <h2 className="mod-nome" id={`modelo-${numero}-nome`}>{nome}</h2>
        <p className="mod-ideia">{ideia}</p>
      </header>

      <Bloco titulo="Cores">
        <ul className="mod-cores">
          {cores.map((c) => (
            <li key={c.nome}>
              <span className="mod-amostra" data-vazia={!c.hex} style={c.hex ? { background: c.hex } : undefined} />
              <span>{c.nome}</span>
              <code>{c.hex ?? "nenhum"}</code>
            </li>
          ))}
        </ul>
      </Bloco>

      <Bloco titulo="Tipografia">
        <p className="t-titulo">Agenda <em>da semana.</em></p>
        <p className="t-sub">Tudo que vai ao ar até sexta</p>
        <p className="t-texto">Roteiro aprovado ontem. Falta gravar a abertura e mandar para a edição.</p>
        <p className="t-rotulo">Neste mês</p>
        <p className="t-numero"><b>12</b><span>conteúdos</span></p>
      </Bloco>

      <Bloco titulo="Botões">
        <div className="mod-botoes">
          <button type="button" className="b b-pri">Nova tarefa<span className="b-seta"><Icone nome="seta" /></span></button>
          <button type="button" className="b b-sec">Duplicar</button>
          <button type="button" className="b b-fan">Ver todos<span className="b-seta"><Icone nome="seta" /></span></button>
          <button type="button" className="b b-ico" aria-label="Adicionar"><Icone nome="mais" /></button>
        </div>
        <p className="mod-nota">Seleção fechada e aberta</p>
        <div className="mod-seletores">
          <Seletor abertoNoInicio={false} />
          <Seletor abertoNoInicio />
        </div>
      </Bloco>

      <Bloco titulo="Card de conteúdo">
        <div className="card">
          <div className="card-topo"><span className="card-selo">Beec</span><span>Instagram</span></div>
          <p className="card-titulo">Bastidores da gravação do episódio 4</p>
          <div className="card-pe"><time dateTime="2026-10-23">qui, 23 out</time><span className="etapa">Edição</span></div>
        </div>
      </Bloco>

      <Bloco titulo="Vidro fosco">
        <div className="vidro-fundo">
          <span className="vidro-forma" aria-hidden="true" />
          <div className="vidro">
            <p className="vidro-rot">Próxima postagem</p>
            <p className="vidro-titulo">Reels do episódio 4</p>
            <p className="vidro-pe">sex, 24 out · TikTok</p>
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Menu lateral">
        <nav className="mm-amostra" aria-label={`Menu de exemplo do modelo ${numero}`}>
          <div className="mm-trilho" aria-hidden="true">
            <Icone nome="calendario" /><Icone nome="tarefas" /><Icone nome="conteudos" /><Icone nome="mapa" />
          </div>
          <div className="mm-lista">
            <button type="button" className="mm-item" aria-current="page"><Icone nome="calendario" />Calendário</button>
            <button type="button" className="mm-item is-hover"><Icone nome="tarefas" />Tarefas</button>
            <button type="button" className="mm-item"><Icone nome="conteudos" />Conteúdos</button>
            <button type="button" className="mm-item"><Icone nome="mapa" />Mapa</button>
          </div>
        </nav>
        <p className="mod-nota">Calendário ativo; Tarefas com o mouse em cima</p>
      </Bloco>
    </article>
  );
}
