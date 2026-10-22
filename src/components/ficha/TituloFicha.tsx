"use client";
import "./ficha-saida.css";

// Título da ficha (textarea de uma linha). Enter salva. Vazio: o Salvar fica apagado e o campo diz por quê (item 281).
export function TituloFicha({ valor, aoMudar, soLer }: { valor: string; aoMudar: (v: string) => void; soLer: boolean }) {
  const vazio = !soLer && !valor.trim();
  return (
    <>
      <textarea
        className="ficha-titulo"
        rows={1}
        value={valor}
        onChange={(e) => aoMudar(e.target.value.replace(/[\r\n]+/g, " "))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Título da tarefa"
        aria-label="Título"
        aria-describedby={vazio ? "ficha-titulo-aviso" : undefined}
        required
        readOnly={soLer}
        autoFocus={!soLer}
      />
      {vazio && <small id="ficha-titulo-aviso" className="ficha-titulo-aviso">Dê um título para salvar</small>}
    </>
  );
}
