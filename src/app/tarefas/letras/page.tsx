import { Folha, type LinhaFolha } from "@/components/tarefas/Folha";
import { LETRA_PRINCIPAL, OPCOES } from "@/components/tarefas/fontes";

// Exemplo fixo (não mexe nos dados reais): mesma folha, três letras, para o Natham escolher.
const EMPRESAS = [{ id: "beec", nome: "Beec" }];
const LINHAS: LinhaFolha[] = [
  { id: "a1", titulo: "Gravar vídeo da ação de Dia das Crianças", detalhe: "Beec · Matheus · 14h30", feita: false },
  { id: "a2", titulo: "Revisão do roteiro: coração, não, é ótimo", detalhe: "Beec · Natham · 9h", feita: true },
  { id: "a3", titulo: "Edição às 17h, ânimo e atenção", detalhe: "Beec · Matheus", feita: false },
  { id: "a4", titulo: "Aprovação do carrossel de promoção", detalhe: "Beec · Natham", feita: false },
];

export default function Page() {
  return (
    <section className="tarefas-tela">
      <div className="tarefas-barra">
        <h1 className="tarefas-titulo">Escolha a letra do caderno</h1>
      </div>
      <p className="tarefas-barra">
        A mesma folha em 3 letras de mão. Todas mostram ç, ã, é, ô, ê, í, ó e ú. A recomendada é {LETRA_PRINCIPAL.nome}.
      </p>
      <div className="letras-grade">
        {OPCOES.map((o) => (
          <div key={o.id}>
            <p className="letras-nome">
              {o.nome}{o.id === LETRA_PRINCIPAL.id ? " (recomendada)" : ""}: {o.jeito}
            </p>
            <Folha
              letra={o} titulo="Tarefas" subtitulo="Quinta, 22 de outubro · 4 tarefas, 1 feita" linhas={[...LINHAS, ...Array<null>(5).fill(null)]}
              vazio="" empresas={EMPRESAS} empresaPadrao="beec"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
