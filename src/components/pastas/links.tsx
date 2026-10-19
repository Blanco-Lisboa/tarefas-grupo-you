import { Fragment } from "react";

// Todo endereço http/https escrito num texto vira "Ver referência" (azul, aba nova), como no Yougram do CRM.
// O texto é quebrado em pedaços (sem HTML solto): endereço vira <a>, o resto fica texto. Pontuação no fim do endereço não entra no link.
const ACHA = /(https?:\/\/[^\s<>"']+)/g;
const FIM = /[.,;:!?)\]]+$/;

export function TextoComLinks({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(ACHA).map((parte, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{parte}</Fragment>;
        const sobra = FIM.exec(parte)?.[0] ?? "";
        const url = parte.slice(0, parte.length - sobra.length);
        return (
          <Fragment key={i}>
            <a className="lnk ver-ref" href={url} target="_blank" rel="noopener noreferrer">Ver referência</a>
            {sobra}
          </Fragment>
        );
      })}
    </>
  );
}

/** Para onde link não cabe (título, botão): o endereço vira só o texto "Ver referência". */
export const semLinks = (texto: string) => texto.replace(ACHA, "Ver referência");
