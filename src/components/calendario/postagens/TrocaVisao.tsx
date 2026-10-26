"use client";
import "./postagens.css";

// O botão "Tarefas | Postagens" do Calendário (315), no padrão do formato do Mapa. A escolha fica lembrada neste navegador.
export type ModoCalendario = "tarefas" | "postagens";
const CHAVE = "grade:calendario-modo";
const MODOS: [ModoCalendario, string][] = [["tarefas", "Tarefas"], ["postagens", "Postagens"]];

// Esta tela só desenha no navegador (o "hoje" é o do computador), então ler o armazenamento no estado inicial é seguro, como no Mapa.
export const modoSalvo = (): ModoCalendario => { try { return localStorage.getItem(CHAVE) === "postagens" ? "postagens" : "tarefas"; } catch { return "tarefas"; } };
export const lembrarModo = (m: ModoCalendario) => { try { localStorage.setItem(CHAVE, m); } catch {} };

export function TrocaVisao({ modo, aoMudar }: { modo: ModoCalendario; aoMudar: (m: ModoCalendario) => void }) {
  return (
    <div className="ptroca" role="group" aria-label="O que o calendário mostra">
      {MODOS.map(([m, nome]) => <button key={m} type="button" aria-pressed={modo === m} onClick={() => { aoMudar(m); lembrarModo(m); }}>{nome}</button>)}
    </div>
  );
}
