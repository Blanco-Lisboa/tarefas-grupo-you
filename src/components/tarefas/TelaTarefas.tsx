"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { removerTarefa, salvarTarefa, useEmpresas, useTarefas, type Tarefa } from "@/lib/dados";
import { useFiltroEmpresa } from "@/lib/filtro-empresa";
import { Ficha } from "@/components/ficha/Ficha";
import { Agenda } from "./Agenda";
import { Folha, type LinhaFolha } from "./Folha";
import { copiar, virarFolha } from "./virar";
import { horaDe, horaDoSlot, montarGrade, rotuloSlot, SLOTS, somarMinutos } from "./grade";
import { LETRA_PRINCIPAL } from "./fontes";
import "./caderno.css";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const paraData = (dia: string) => new Date(+dia.slice(0, 4), +dia.slice(5, 7) - 1, +dia.slice(8, 10));
const somarDias = (dia: string, n: number) => { const d = paraData(dia); d.setDate(d.getDate() + n); return iso(d); };
// "" no servidor: o dia de hoje só existe no navegador de quem abre (evita diferença de fuso na hidratação).
const hojeLocal = () => iso(new Date());
const semAssinatura = () => () => {};

const NOMES = { natham: "Natham", matheus: "Matheus" } as const;
const extenso = (dia: string) => paraData(dia).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase());

export function TelaTarefas() {
  const hoje = useSyncExternalStore(semAssinatura, hojeLocal, () => "");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [aba, setAba] = useState<"dia" | "semdata">("dia");
  const [lado, setLado] = useState<"tarefas" | "agenda">("tarefas"); // só no celular: uma página por vez
  const dia = escolhido ?? hoje;
  const [aberta, setAberta] = useState<Tarefa | null>(null);
  const livro = useRef<HTMLDivElement>(null);
  const cancelar = useRef<(() => void) | null>(null); // virada em andamento (a folha ainda está no ar)
  useEffect(() => () => cancelar.current?.(), []);

  const tarefas = useTarefas();
  const empresas = useEmpresas();
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
  const porHora = (a: Tarefa, b: Tarefa) => (a.inicio ?? "").localeCompare(b.inicio ?? "") || a.titulo.localeCompare(b.titulo);
  const visiveis = aplicar(tarefas);
  const doDia = visiveis.filter((t) => t.inicio?.slice(0, 10) === dia).sort(porHora);
  const doDiaSeguinte = visiveis.filter((t) => t.inicio?.slice(0, 10) === somarDias(dia, 1)).sort(porHora);
  const mostradas = aba === "dia" ? doDia : visiveis.filter((t) => !t.inicio);

  const grade = montarGrade(mostradas, aba === "dia");
  const linhas: (LinhaFolha | null)[] = grade.map((t) => t && {
    id: t.id,
    titulo: t.titulo,
    detalhe: [nomeEmpresa(t.empresaId), NOMES[t.responsavel], aba === "dia" && !horaDe(t) ? "dia inteiro" : ""].filter(Boolean).join(" · "),
    feita: !!t.concluida,
  });
  const rotulos = aba === "dia" ? grade.map((_, k) => rotuloSlot(k)) : undefined;

  const feitas = mostradas.filter((t) => t.concluida).length;
  const resumo = mostradas.length ? `${mostradas.length} ${mostradas.length === 1 ? "tarefa" : "tarefas"}, ${feitas} ${feitas === 1 ? "feita" : "feitas"}` : undefined;
  const titulo = aba === "dia" ? extenso(dia) : "Sem data";

  const empresasEscolha = empresas.filter((e) => !selecionadas.length || selecionadas.includes(e.id));
  const trocar = (d: string) => { setEscolhido(d || null); setAba("dia"); };
  // Troca de dia virando a folha, como no CRM. Sem animação: movimento reduzido ou "sem data" aberto.
  const ir = (d: string) => {
    const el = livro.current;
    if (cancelar.current) return; // folha ainda no ar: espera pousar
    if (!d || d === dia || aba !== "dia" || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) return trocar(d);
    const paginas = () => [...el.children].filter((c): c is HTMLElement => c instanceof HTMLElement && c.classList.contains("pag") && c.offsetParent !== null);
    const retrato = (p: HTMLElement) => { const r = p.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
    const antes = paginas();
    const velhas = antes.map(copiar), caixas = antes.map(retrato);
    flushSync(() => trocar(d)); // as páginas vivas já mostram o dia novo, escondidas pela folha e pela cópia da página velha
    const novas = paginas().map(copiar);
    const duas = antes.length === 2, volta = d < dia, i = duas ? 1 : 0;
    cancelar.current = virarFolha({
      pai: el.closest<HTMLElement>(".tarefas-tela")!,
      caixa: caixas[i],
      volta,
      duasPaginas: duas,
      frente: volta ? novas[i] : velhas[i],
      verso: duas ? (volta ? velhas[0] : novas[0]) : null,
      cobertura: volta ? { el: velhas[i], caixa: caixas[i] } : duas ? { el: velhas[0], caixa: caixas[0] } : null,
      aoTerminar: () => { cancelar.current = null; },
    });
  };
  const tag = hoje === dia && aba === "dia" ? "Hoje · " : "";

  return (
    <section className="tarefas-tela" data-lado={lado}>
      <div className="tarefas-barra">
        <h1 className="tarefas-titulo">Tarefas</h1>
        <div className="tarefas-grupo">
          <button type="button" className="tarefas-botao" onClick={() => ir(somarDias(dia, -1))} aria-label="Dia anterior">Anterior</button>
          <button type="button" className="tarefas-botao" onClick={() => ir(hoje)}>Hoje</button>
          <button type="button" className="tarefas-botao" onClick={() => ir(somarDias(dia, 1))} aria-label="Próximo dia">Próximo</button>
          <input type="date" className="tarefas-data" value={dia} onChange={(e) => e.target.value && ir(e.target.value)} aria-label="Ir para o dia" />
        </div>
        <div className="tarefas-grupo tarefas-fim">
          {mostradas.length > 0 && (
            <p className="tarefas-contador" aria-label={`${feitas} de ${mostradas.length} feitas`}>
              <span><strong>{feitas}</strong> de {mostradas.length} feitas</span>
              <span className="tarefas-trilho"><i style={{ width: `${(feitas / mostradas.length) * 100}%` }} /></span>
            </p>
          )}
          <button type="button" className="tarefas-botao" aria-pressed={aba === "dia"} onClick={() => setAba("dia")}>Dia</button>
          <button type="button" className="tarefas-botao" aria-pressed={aba === "semdata"} onClick={() => setAba("semdata")}>Sem data</button>
        </div>
        <div className="tarefas-grupo tarefas-lados">
          <button type="button" className="tarefas-botao" aria-pressed={lado === "tarefas"} onClick={() => setLado("tarefas")}>Tarefas</button>
          <button type="button" className="tarefas-botao" aria-pressed={lado === "agenda"} onClick={() => setLado("agenda")}>Agenda</button>
        </div>
      </div>

      <div className="livro-sombra corte-sombra">
        <div ref={livro} key={aba} className="livro corte-22">
          <Folha
            letra={LETRA_PRINCIPAL}
            titulo="Tarefas"
            subtitulo={[tag + titulo, resumo].filter(Boolean).join(" · ")}
            linhas={linhas}
            rotulos={rotulos}
            vazio={aba === "dia" ? "Nada marcado para este dia. Escreva aqui." : "Nenhuma tarefa sem data. Escreva aqui."}
            empresas={empresasEscolha}
            empresaPadrao={empresasEscolha[0]?.id ?? ""}
            aoAbrir={(id) => setAberta(tarefas.find((t) => t.id === id) ?? null)}
            aoMarcar={(id) => { const t = tarefas.find((x) => x.id === id); if (t) void salvarTarefa({ ...t, concluida: !t.concluida }); }}
            aoApagar={(id) => void removerTarefa(id)}
            aoEscrever={(t, empresaId, responsavel, linha) => {
              const base = { titulo: t, tipo: "outro" as const, empresaId, responsavel, cor: "etiqueta-5" as const, links: [], arquivos: [] };
              if (aba === "semdata") return void salvarTarefa({ ...base, diaInteiro: false });
              // Escrever numa linha de horário marca esse horário (30 min); depois das 22:00, dia inteiro.
              if (linha >= SLOTS) return void salvarTarefa({ ...base, inicio: dia, diaInteiro: true });
              const h = horaDoSlot(linha);
              void salvarTarefa({ ...base, inicio: `${dia}T${h}`, fim: `${dia}T${somarMinutos(h, 30)}`, diaInteiro: false });
            }}
          />
          <Agenda
            letra={LETRA_PRINCIPAL}
            dia={dia}
            hoje={hoje}
            rotuloDia={tag + extenso(dia)}
            tarefas={doDia}
            amanha={doDiaSeguinte}
            nomeEmpresa={nomeEmpresa}
            aoAbrir={(id) => setAberta(tarefas.find((t) => t.id === id) ?? null)}
          />
        </div>
      </div>
      {aberta && <Ficha tarefa={aberta} aoFechar={() => setAberta(null)} />}
    </section>
  );
}
