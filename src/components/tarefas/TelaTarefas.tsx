"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PointerEvent as EventoPonteiro } from "react";
import { flushSync } from "react-dom";
import type { CSSProperties } from "react";
import { RESPONSAVEIS, podeAlterar, podeApagar, removerTarefa, salvarTarefa, type Etiqueta, type Responsavel, useEmpresas, useEu, useTarefas, type Tarefa } from "@/lib/dados";
import { Selecao } from "@/components/ui/Selecao";
import { Pessoa } from "@/components/ui/Pessoa";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { FiltroEmpresa } from "@/components/casca/FiltroEmpresa";
import { CampoData } from "@/components/ui/CampoData";
import { Ficha } from "@/components/ficha/Ficha";
import { Agenda } from "./Agenda";
import { Folha, type LinhaFolha } from "./Folha";
import type { Acoes } from "./MenuTarefa";
import { arrastarFolha, copiar, virarFolha, type Pedido } from "./virar";
import { doCaderno, horaDe, horaDoSlot, minutos, montarGrade, msAteMeiaNoite, rotuloSlot, SLOTS, somarMinutos } from "./grade";
import { LETRA_PRINCIPAL } from "./fontes";
import "./caderno.css";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const paraData = (dia: string) => new Date(+dia.slice(0, 4), +dia.slice(5, 7) - 1, +dia.slice(8, 10));
const somarDias = (dia: string, n: number) => { const d = paraData(dia); d.setDate(d.getDate() + n); return iso(d); };
// "" no servidor: o dia de hoje só existe no navegador de quem abre (evita diferença de fuso na hidratação).
const hojeLocal = () => iso(new Date());
// Avisa a tela quando vira a meia-noite (e ao voltar do repouso), para "Hoje" acompanhar o relógio.
const virouODia = (avisar: () => void) => {
  let t: ReturnType<typeof setTimeout>;
  const agendar = () => { t = setTimeout(() => { avisar(); agendar(); }, msAteMeiaNoite(new Date())); };
  const voltou = () => { if (!document.hidden) avisar(); };
  agendar();
  document.addEventListener("visibilitychange", voltou);
  return () => { clearTimeout(t); document.removeEventListener("visibilitychange", voltou); };
};

const NOMES = { natham: "Natham", matheus: "Matheus", adrian: "Adrian", lucas: "Lucas" } as const;
const extenso = (dia: string) => paraData(dia).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase());

export function TelaTarefas() {
  const hoje = useSyncExternalStore(virouODia, hojeLocal, () => "");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [aba, setAba] = useState<"dia" | "semdata">("dia");
  const [lado, setLado] = useState<"tarefas" | "agenda">("tarefas"); // só no celular: uma página por vez
  const dia = escolhido ?? hoje;
  const [aberta, setAberta] = useState<Tarefa | null>(null);
  const livro = useRef<HTMLDivElement>(null);
  const cancelar = useRef<(() => void) | null>(null); // virada em andamento (a folha ainda está no ar)
  const arraste = useRef<{ id: number; x0: number; y0: number; dia: string; antigo: string | null; ctx: ReturnType<typeof arrastarFolha> | null; volta: boolean; larg: number; p: number; t: number; xAnt: number; vel: number } | null>(null);
  useEffect(() => () => cancelar.current?.(), []);

  const tarefas = useTarefas();
  const empresas = useEmpresas();
  const eu = useEu();
  // Caderno de quem (item 155): cada um vê só o que é seu; o Natham pode espiar o de outra pessoa, só olhando.
  const [ver, setVer] = useState<Responsavel | null>(null);
  const de = ver ?? eu;
  const alheio = !!ver && ver !== eu;
  const { aplicar, selecionadas } = useFiltroEmpresa();

  // Migração única: a chave antiga do navegador vira o campo concluida e some.
  useEffect(() => {
    try {
      const velhas: unknown = JSON.parse(localStorage.getItem("grade:tarefas-feitas") ?? "[]");
      if (Array.isArray(velhas)) tarefas.filter((t) => velhas.includes(t.id) && !t.concluida).forEach((t) => void salvarTarefa({ ...t, concluida: true }));
      localStorage.removeItem("grade:tarefas-feitas");
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!dia) return <section className="tarefas-tela" aria-busy="true" />;

  const nomeEmpresa = (id: string) => empresas.find((e) => e.id === id)?.nome ?? id;
  // Só pela data/hora: a ordenação é estável, então quem não tem horário (mesmo início) fica na ordem em que foi criado, igual à Fila do Mapa.
  const porHora = (a: Tarefa, b: Tarefa) => (a.inicio ?? "").localeCompare(b.inicio ?? "");
  // Tarefa sem empresa aparece sempre: o filtro de empresa não a esconde. De quem é = o responsável.
  const visiveis = tarefas.filter((t) => doCaderno(t, de) && (!t.empresaId || aplicar([t]).length));
  const doDia = visiveis.filter((t) => t.inicio?.slice(0, 10) === dia).sort(porHora);
  const doDiaSeguinte = visiveis.filter((t) => t.inicio?.slice(0, 10) === somarDias(dia, 1)).sort(porHora);
  const mostradas = aba === "dia" ? doDia : visiveis.filter((t) => !t.inicio);

  const grade = montarGrade(mostradas, aba === "dia");
  const linhas: (LinhaFolha | null)[] = grade.map((t) => t && {
    id: t.id,
    titulo: t.titulo,
    empresa: t.empresaId ? { id: t.empresaId, nome: nomeEmpresa(t.empresaId) } : undefined,
    detalhe: [NOMES[t.responsavel], aba === "dia" && !horaDe(t) ? "dia inteiro" : ""].filter(Boolean).join(" · "),
    feita: !!t.concluida,
    cor: t.cor,
    responsavel: t.responsavel,
    enviadaPor: t.enviadaPor ? NOMES[t.enviadaPor] : undefined,
    podeAlterar: podeAlterar(t, eu),
    podeApagar: podeApagar(t, eu),
  });
  const rotulos = aba === "dia" ? grade.map((_, k) => rotuloSlot(k)) : undefined;

  const feitas = mostradas.filter((t) => t.concluida).length;
  const resumo = mostradas.length ? `${mostradas.length} ${mostradas.length === 1 ? "tarefa" : "tarefas"}, ${feitas} ${feitas === 1 ? "feita" : "feitas"}` : undefined;
  const titulo = aba === "dia" ? extenso(dia) : "Sem data";

  const empresasEscolha = empresas.filter((e) => !selecionadas.length || selecionadas.includes(e.id));
  const trocar = (d: string) => { setEscolhido(d || null); setAba("dia"); };
  const semMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Troca para o dia d já com as páginas vivas mostrando o dia novo, escondidas pela folha e pelas cópias das páginas velhas.
  // Devolve o pedido da folha (sem o fim); null = não há o que animar.
  const prepararVirada = (d: string): Omit<Pedido, "aoTerminar"> | null => {
    const el = livro.current;
    if (!el) return null;
    const paginas = () => [...el.children].filter((c): c is HTMLElement => c instanceof HTMLElement && c.classList.contains("pag") && c.offsetParent !== null);
    const retrato = (p: HTMLElement) => { const r = p.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
    const antes = paginas();
    const velhas = antes.map(copiar), caixas = antes.map(retrato);
    flushSync(() => trocar(d));
    const novas = paginas().map(copiar);
    const duas = antes.length === 2, volta = d < dia, i = duas ? 1 : 0;
    return {
      pai: el.closest<HTMLElement>(".tarefas-tela")!,
      caixa: caixas[i],
      volta,
      duasPaginas: duas,
      frente: volta ? novas[i] : velhas[i],
      verso: duas ? (volta ? velhas[0] : novas[0]) : null,
      cobertura: volta ? { el: velhas[i], caixa: caixas[i] } : duas ? { el: velhas[0], caixa: caixas[0] } : null,
    };
  };
  // Troca de dia virando a folha, como no CRM. Sem animação: movimento reduzido ou "sem data" aberto.
  const ir = (d: string) => {
    if (cancelar.current) return; // folha ainda no ar: espera pousar
    if (!d || d === dia || aba !== "dia" || semMovimento()) return trocar(d);
    const pedido = prepararVirada(d);
    if (!pedido) return trocar(d);
    cancelar.current = virarFolha({ ...pedido, aoTerminar: () => { cancelar.current = null; } });
  };

  // Arrastar a página para o lado (mouse e toque): a folha acompanha o dedo; soltou depois da metade (ou num puxão), vira.
  // Para a esquerda = dia seguinte; para a direita = dia anterior. Botões e campos com texto não iniciam o arraste.
  const aoPressionar = (e: EventoPonteiro<HTMLDivElement>) => {
    const alvo = e.target as HTMLElement;
    // campo vazio não tem texto para selecionar: a linha de escrever inteira também serve de pegada
    const campoComTexto = alvo instanceof HTMLInputElement && alvo.value !== "";
    if (e.button > 0 || cancelar.current || aba !== "dia" || campoComTexto || alvo.closest("button, textarea, select, a, [popover]")) return;
    arraste.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dia, antigo: escolhido, ctx: null, volta: false, larg: 0, p: 0, t: performance.now(), xAnt: e.clientX, vel: 0 };
  };
  const aoMover = (e: EventoPonteiro<HTMLDivElement>) => {
    const a = arraste.current;
    if (!a || e.pointerId !== a.id) return;
    const dx = e.clientX - a.x0;
    if (!a.ctx) {
      if (Math.abs(dx) < 6 && Math.abs(e.clientY - a.y0) < 6) return;
      if (Math.abs(e.clientY - a.y0) > Math.abs(dx) || semMovimento()) return; // rolagem vertical (ou sem animação): não é arraste
      const pedido = prepararVirada(somarDias(a.dia, dx > 0 ? -1 : 1));
      if (!pedido) return;
      a.ctx = arrastarFolha(pedido);
      cancelar.current = a.ctx.cancelar;
      a.volta = pedido.volta;
      a.larg = pedido.caixa.width * (pedido.duasPaginas ? 2 : 1);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("livro-arrastando");
    }
    const andou = Math.min(1, Math.max(0, (a.volta ? dx : -dx) / a.larg));
    a.p = a.volta ? 1 - andou : andou;
    const agora = performance.now();
    a.vel = ((a.volta ? e.clientX - a.xAnt : a.xAnt - e.clientX)) / Math.max(1, agora - a.t);
    a.t = agora; a.xAnt = e.clientX;
    a.ctx.mover(a.p);
  };
  const aoSoltar = (e: EventoPonteiro<HTMLDivElement>) => {
    const a = arraste.current;
    if (!a || e.pointerId !== a.id) return;
    arraste.current = null;
    e.currentTarget.classList.remove("livro-arrastando");
    if (!a.ctx) return;
    const andou = a.volta ? 1 - a.p : a.p;
    const completa = e.type === "pointerup" && (andou > 0.5 || (performance.now() - a.t < 100 && a.vel > 0.5));
    const destino = completa === a.volta ? 0 : 1; // completar: folha pousa do outro lado; senão volta de onde saiu
    const fim = completa ? () => { cancelar.current = null; } : () => { flushSync(() => setEscolhido(a.antigo)); cancelar.current = null; };
    a.ctx.soltar(a.p, destino, fim);
  };
  // A tarefa vai para o horário da linha (neste dia) e mantém a duração (30 min se era dia inteiro ou sem fim).
  const moverPara = (id: string, linha: number) => {
    const t = tarefas.find((x) => x.id === id);
    if (!t) return;
    const h = horaDoSlot(linha);
    const dur = t.inicio && t.fim && t.inicio.length > 10 && t.fim.length > 10 ? Math.max(15, minutos(t.fim.slice(11, 16)) - minutos(t.inicio.slice(11, 16))) : 30;
    void salvarTarefa({ ...t, inicio: `${dia}T${h}`, fim: `${dia}T${somarMinutos(h, dur)}`, diaInteiro: false });
  };
  // Mesma hora, um dia depois (sem data: vira dia inteiro no dia seguinte ao que está aberto).
  const noDiaSeguinte = (t: Tarefa): Tarefa => t.inicio
    ? { ...t, inicio: somarDias(t.inicio.slice(0, 10), 1) + t.inicio.slice(10), fim: t.fim && somarDias(t.fim.slice(0, 10), 1) + t.fim.slice(10) }
    : { ...t, inicio: somarDias(dia, 1), diaInteiro: true };
  const comTarefa = (f: (t: Tarefa) => void) => (id: string) => { const t = tarefas.find((x) => x.id === id); if (t) f(t); };
  const acoes: Acoes = {
    duplicar: comTarefa((t) => void salvarTarefa({ ...noDiaSeguinte(t), id: undefined, concluida: false })),
    mover: comTarefa((t) => void salvarTarefa(noDiaSeguinte(t))),
    marcarHora: moverPara,
    criarPara: (id: string, quem: Responsavel) => comTarefa((t) => void salvarTarefa({ ...t, id: undefined, responsavel: quem, enviarPara: quem, concluida: false }))(id),
    marcarPessoa: (id: string, quem: Responsavel) => comTarefa((t) => void salvarTarefa({ ...t, responsavel: quem }))(id),
    etiqueta: (id: string, cor: Etiqueta) => comTarefa((t) => void salvarTarefa({ ...t, cor }))(id),
    empresa: (id: string, empresaId: string) => comTarefa((t) => void salvarTarefa({ ...t, empresaId }))(id),
  };
  const tag = hoje === dia && aba === "dia" ? "Hoje · " : "";

  return (
    <section className="tarefas-tela" data-lado={aba === "semdata" ? "tarefas" : lado}>
      <div className="tarefas-barra">
        <div className="tarefas-grupo tarefas-quem">
          <h1 className="tarefas-titulo">Caderno</h1>
          <FiltroEmpresa />
          {eu === "natham" && (
            <Selecao
              rotulo="Caderno de" multipla={false} valor={[de ?? eu]} aoMudar={([v]) => v && setVer(v === eu ? null : (v as Responsavel))}
              opcoes={RESPONSAVEIS.map((r) => ({ valor: r, rotulo: NOMES[r], antes: <Pessoa quem={r} tamanho={20} /> }))}
            />
          )}
        </div>
        <div className="tarefas-grupo tarefas-nav">
          <button type="button" className="btn btn-2 tarefas-botao" onClick={() => ir(somarDias(dia, -1))} aria-label="Dia anterior">Anterior</button>
          <button type="button" className="btn btn-2 tarefas-botao" onClick={() => ir(hoje)}>Hoje</button>
          <button type="button" className="btn btn-2 tarefas-botao" onClick={() => ir(somarDias(dia, 1))} aria-label="Próximo dia">Próximo</button>
          <CampoData rotulo="Ir para o dia" valor={dia} aoMudar={(d) => d && ir(d)} semLimpar />
        </div>
        <div className="tarefas-grupo tarefas-fim">
          {mostradas.length > 0 && (
            <p className="tarefas-contador bloco-destaque" aria-label={`${feitas} de ${mostradas.length} feitas`}>
              <span className="bloco-numero">{feitas}</span>
              <span className="bloco-fraco">de {mostradas.length} feitas</span>
              {/* medidor: 10 barrinhas; a do meio enche em parte */}
              <span className="medidor" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ "--p": `${Math.round(Math.min(1, Math.max(0, (feitas / mostradas.length) * 10 - i)) * 100)}%` } as CSSProperties} />)}
              </span>
            </p>
          )}
          <div className="tarefas-grupo tarefas-abas">
          <button type="button" className="btn btn-2 tarefas-botao" aria-pressed={aba === "dia"} onClick={() => setAba("dia")}>Dia</button>
          <button type="button" className="btn btn-2 tarefas-botao" aria-pressed={aba === "semdata"} onClick={() => setAba("semdata")}>Sem data</button>
          </div>
        </div>
        <div className="tarefas-grupo tarefas-lados" hidden={aba === "semdata"}>
          <button type="button" className="btn btn-2 tarefas-botao" aria-pressed={lado === "tarefas"} onClick={() => setLado("tarefas")}>Caderno</button>
          <button type="button" className="btn btn-2 tarefas-botao" aria-pressed={lado === "agenda"} onClick={() => setLado("agenda")}>Agenda</button>
        </div>
      </div>

      <div className="livro-sombra" onPointerDown={aoPressionar} onPointerMove={aoMover} onPointerUp={aoSoltar} onPointerCancel={aoSoltar}>
        <div ref={livro} key={aba} className="livro">
          <Folha
            letra={LETRA_PRINCIPAL}
            titulo="Caderno"
            subtitulo={[tag + titulo, resumo].filter(Boolean).join(" · ")}
            linhas={linhas}
            rotulos={rotulos}
            vazio={alheio ? (aba === "dia" ? "Nada marcado para este dia." : "Nenhuma tarefa sem data.") : aba === "dia" ? "Nada marcado para este dia. Escreva aqui." : "Nenhuma tarefa sem data. Escreva aqui."}
            empresas={empresasEscolha}
            empresasMenu={empresas}
            empresaPadrao={empresasEscolha[0]?.id ?? ""}
            /* caderno de outra pessoa: não escreve; cada linha só liga marcar/mover/⋮ se podeAlterar (a privada dele fica só leitura, a que o Natham enviou edita) */
            aoAbrir={(id) => setAberta(tarefas.find((t) => t.id === id) ?? null)}
            aoMarcar={(id) => { const t = tarefas.find((x) => x.id === id); if (t) void salvarTarefa({ ...t, concluida: !t.concluida }); }}
            aoApagar={(id) => void removerTarefa(id)}
            continua={aba === "semdata"}
            aoMover={aba === "dia" ? moverPara : undefined}
            acoes={acoes}
            responsavelPadrao={eu ?? undefined}
            aoEscrever={alheio ? undefined : (t, empresaId, responsavel, linha) => {
              const base = { titulo: t, tipo: "outro" as const, empresaId, responsavel, enviarPara: responsavel, cor: "etiqueta-5" as const, links: [], arquivos: [] };
              if (aba === "semdata") return void salvarTarefa({ ...base, diaInteiro: false });
              // Escrever numa linha de horário marca esse horário (30 min); depois das 22:00, dia inteiro.
              if (linha >= SLOTS) return void salvarTarefa({ ...base, inicio: dia, diaInteiro: true });
              const h = horaDoSlot(linha);
              void salvarTarefa({ ...base, inicio: `${dia}T${h}`, fim: `${dia}T${somarMinutos(h, 30)}`, diaInteiro: false });
            }}
          />
          {aba === "dia" && <Agenda
            letra={LETRA_PRINCIPAL}
            dia={dia}
            rotuloDia={tag + extenso(dia)}
            alheio={alheio}
            amanha={doDiaSeguinte}
          />}
        </div>
      </div>
      {aberta && <Ficha tarefa={aberta} aoFechar={() => setAberta(null)} soLer={!podeAlterar(aberta, eu)} />}
    </section>
  );
}
