import { useState } from "react";

// Item 281: clicar fora, Esc, Fechar ou Cancelar com coisa não salva pergunta "Descartar alterações?" em vez de sumir com tudo.
// `valores` = tudo que a pessoa pode ter mexido (comparado como texto com o que havia ao abrir). Depois de salvar, chame `salvou()`: o que está na tela passa a ser o novo "limpo".
export function useSaidaFicha(valores: unknown, soLer: boolean, fechar: () => void) {
  const atual = JSON.stringify(valores);
  const [limpo, setLimpo] = useState(atual);
  const [versao, setVersao] = useState(0);
  const [vista, setVista] = useState(0);
  const [perguntando, setPerguntando] = useState(false);
  if (versao !== vista) { setVista(versao); setLimpo(atual); } // salvou: o que está na tela passa a ser o novo "limpo"
  const sujo = !soLer && atual !== limpo;
  return {
    pedir: () => (sujo ? setPerguntando(true) : fechar()),
    perguntando,
    continuar: () => setPerguntando(false),
    descartar: () => { setPerguntando(false); fechar(); },
    salvou: () => setVersao((v) => v + 1),
  };
}
