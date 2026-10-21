"use client";
// Fazendo agora (item 170), no topo da ficha de tarefa já salva: selo de quem está nela desde quando e o botão Começar/Parar.
// encerrada (Régua 215): post Aprovado ou Postado não tem mais o que começar; some o Começar (quem ainda está nela segue com Parar).
import { comecar, parar, useEu, useFazendo, type Responsavel } from "@/lib/dados";
import { Pessoa } from "@/components/ui/Pessoa";

export function Agora({ tarefaId, soLer, encerrada, nomes }: { tarefaId: string; soLer?: boolean; encerrada?: boolean; nomes: Record<Responsavel, string> }) {
  const eu = useEu();
  const agora = useFazendo()[tarefaId];
  const souEu = !!agora && agora.quem === eu;
  return (
    <div className="ficha-agora">
      {agora && (
        <span className="ficha-agora-selo" role="status">
          <Pessoa quem={agora.quem} tamanho={22} />
          {souEu ? "Você está fazendo" : `${nomes[agora.quem]} está fazendo`} desde {desde(agora.desde)}
        </span>
      )}
      {!soLer && eu && (souEu || !encerrada) && (
        <button type="button" className="ficha-agora-botao" aria-pressed={souEu} onClick={() => void (souEu ? parar() : comecar(tarefaId))}>
          {souEu ? "Parar" : "Começar"}
        </button>
      )}
    </div>
  );
}

// "08:40" se foi hoje; senão "19/10, 08:40".
function desde(iso: string) {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString() ? hora : `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${hora}`;
}
