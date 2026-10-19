import { FONTES } from "./fontes";
import { Modelo1Nevoa } from "./Modelo1Nevoa";
import { Modelo2Editorial } from "./Modelo2Editorial";
import { Modelo3Noite } from "./Modelo3Noite";
import { Modelo4Aco } from "./Modelo4Aco";
import { Modelo5Contraste } from "./Modelo5Contraste";

// Página de escolha da ID nova (item 57). Fica fora do menu: abre direto em /modelos.
export function TelaModelos() {
  return (
    <div className={`modelos ${FONTES}`}>
      <header className="modelos-topo">
        <h1>Cinco modelos para a ID do Tarefas</h1>
        <p className="modelos-guia">
          Peças soltas, não a ID completa: cores, letras, botões, card, vidro e menu, as mesmas em todos para comparar.
          Passe o mouse e clique, tudo responde. Para escolher, diga o número: &ldquo;quero o 3&rdquo;.
        </p>
        <details className="modelos-fontes" open>
          <summary>De onde veio cada ideia</summary>
          <ol>
            <li>Apple, guia de Materiais: o vidro fica só na camada de controle (menu, lista que abre, painel sobre imagem); o conteúdo usa superfície lisa. Por isso o card é liso e o vidro aparece no menu, no seletor aberto e no painel.</li>
            <li>Apple, guia de Materiais: vidro bem transparente só sobre fundo com imagem, e ele desfoca e ajusta o brilho do que está atrás. Daí cada painel de vidro estar sobre uma arte colorida, para o efeito aparecer de verdade.</li>
            <li>Apple, guia de Tipografia: texto de 13 a 17 pontos, nunca abaixo de 11; letra fina só em tamanho grande. Daí os números grandes em peso leve e o texto corrido em 14.</li>
            <li>21st.dev: Glass Folder Cards (ref-2: borda clara de 1px, botão quadrado com volume) e a linha do tempo da Hyperiux (ref-1: preto com um laranja), base do modelo 3; dos botões de lá, os estados de verdade (mouse em cima, foco, apertado) e a seta dentro do botão.</li>
            <li>Suas referências: ref-4 (cinza de vidro, trilho escuro) no 1, ref-3 (serifa itálica, botão preto) no 2, ref-7 (borda fina, seta em círculo) no 4, ref-5 e ref-6 (branco, blocos pretos, esfera) no 5.</li>
          </ol>
        </details>
      </header>
      <div className="modelos-grade">
        <Modelo1Nevoa />
        <Modelo2Editorial />
        <Modelo3Noite />
        <Modelo4Aco />
        <Modelo5Contraste />
      </div>
    </div>
  );
}
