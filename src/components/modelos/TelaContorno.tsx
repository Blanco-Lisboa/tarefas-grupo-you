"use client";
import { useState } from "react";
import { Selecao } from "@/components/ui/Selecao";
import { CampoData } from "@/components/ui/CampoData";
import "@/components/ficha/ficha.css";
import "./contorno.css";

// Item 158: 3 opções de contorno para os botões de seleção, lado a lado com o "Hoje". Só comparação: o botão de verdade não mudou.
const tipo = ["Ideia", "Roteiro", "Gravação", "Edição", "Postagem"].map((r) => ({ valor: r, rotulo: r }));
const empresa = ["You Contabilidade", "Beec", "Grupo You"].map((r) => ({ valor: r, rotulo: r }));
const rede = ["Instagram", "TikTok", "YouTube"].map((r) => ({ valor: r, rotulo: r }));
const etapa = ["Planejar", "Produzir", "Revisar"].map((r) => ({ valor: r, rotulo: r }));
const tags = ["Campanha", "Urgente", "Evergreen"].map((r) => ({ valor: r, rotulo: r }));
const aprova = ["Natham", "Matheus"].map((r) => ({ valor: r, rotulo: r }));

function Grade() {
  const [v, setV] = useState<Record<string, string[]>>({ tipo: ["Gravação"], empresa: ["Beec"], tags: ["Campanha", "Urgente"] });
  const [ini, setIni] = useState("2026-10-22");
  const [fim, setFim] = useState("");
  const um = (k: string, o: typeof tipo, rotulo: string, multipla = false) => (
    <div className="ficha-campo ficha-escolha">
      <Selecao rotulo={rotulo} opcoes={o} valor={v[k] ?? []} multipla={multipla} rotuloTodos={multipla ? undefined : "Nenhum"} aoMudar={(n) => setV({ ...v, [k]: n })} />
    </div>
  );
  return (
    <div className="ficha-grade">
      {um("tipo", tipo, "Tipo")}
      {um("empresa", empresa, "Empresa")}
      {um("rede", rede, "Rede")}
      {um("etapa", etapa, "Etapa")}
      <div className="ficha-mini"><CampoData rotulo="Começa" valor={ini} aoMudar={setIni} /></div>
      <div className="ficha-mini"><CampoData rotulo="Termina" valor={fim} min={ini} vazio="Sem fim" aoMudar={setFim} /></div>
      {um("tags", tags, "Tags", true)}
      {um("aprova", aprova, "Quem aprova")}
    </div>
  );
}

const OPCOES = [
  { cls: "", nome: "Hoje", frase: "Como está: borda branca de vidro, some no fundo branco." },
  { cls: "contorno-a", nome: "Opção 1", frase: "Borda de 1px cinza (a cor das bordas do sistema) pela metade da força." },
  { cls: "contorno-b", nome: "Opção 2", frase: "Borda de 1px da divisória fina (a mais leve) e sombra mais curta." },
  { cls: "contorno-c", nome: "Opção 3", frase: "Anel interno de 1px em azul bem fraquinho, combina com o foco azul." },
];

export function TelaContorno() {
  return (
    <div className="contorno">
      <header className="contorno-topo">
        <h1>Contorno dos botões de seleção</h1>
        <p>Os campos da ficha, os mesmos em todas as colunas, com a mesma tinta. Clique e abra para testar. Para escolher, diga o número: &ldquo;quero a 2&rdquo;.</p>
      </header>
      <div className="contorno-colunas">
        {OPCOES.map((o) => (
          <section key={o.nome} className={`contorno-cartao ${o.cls}`}>
            <h2>{o.nome}</h2>
            <p>{o.frase}</p>
            <Grade />
          </section>
        ))}
      </div>
    </div>
  );
}
