# Pente fino da ID, Régua, item 53

Fontes lidas, apenas para consulta: `Desktop/ID-Visual-ALL/Beec/BRIEFING.md` inteiro, `identidade/tokens.css` (bloco FINAL), `prancha.html`, `elementos-r7.html`, `cards-r1.html`, `graficos-r3.html`, `icones-r1.html` e `menu-id.md`. As páginas HTML foram abertas no Chrome pelo roteiro de prova. As decisões finais do §14 do briefing prevalecem sobre as rodadas antigas.

Fotos da tela e da prancha lado a lado: `provas/r2-id-regua/lado-a-lado-conteudos.png`, `lado-a-lado-configuracoes.png` e `lado-a-lado-ficha.png`. Há fotos isoladas em 1903, 1440 e 390, além das pranchas abertas no navegador, na mesma pasta.

| Elemento da tela | Par na ID | Antes | Correção e estado final |
| --- | --- | --- | --- |
| Fundo e colunas do quadro de Conteúdos | Paleta A e grade da prancha, seções 03 e 05 | NÃO BATE: kraft claro ocupava seis painéis inteiros, mas kraft é só apoio | Colunas em bege, com linha discreta; cartões em superfície clara. BATE. O quadro Kanban não tem par literal na ID: segue a grade e os cards de informação. |
| Cartões repetidos dos conteúdos | `cards-r1.html`, variação C07 a C09, orelha só em cima à esquerda | NÃO BATE: retângulos sem o corte da casa e sem profundidade | Corte de 22° pela classe da ID e sombra fraca no pai. BATE. |
| Selo da empresa no cartão | Placa/selo inclinado da prancha, seções 05 e 10 | NÃO BATE: retângulo roxo reto | Fundo inclinado 22°, texto reto, roxo profundo e bege. BATE. Nome de empresa é informação do sistema; o selo é a peça mais próxima da ID. |
| Número total e números das colunas | Tipografia e cor da prancha, seções 03, 04 e 10 | NÃO BATE: número total pequeno, sem hierarquia | Total em card roxo pequeno, número em Bricolage 800; numeração das colunas em Bricolage. BATE. |
| Ícones das redes | `icones-r1.html`, regra de marcas de terceiros | BATE: arquivos de ícone existentes, sem desenho novo | Mantidos. |
| Escolha da etapa | Botão de seleção da base `src/components/ui/Selecao.tsx`; botão da prancha é a peça próxima | BATE no padrão do sistema, mas não há seletor idêntico na prancha | Componente único mantido, sem cópia local. A base é território do Sextante. |
| Lista de empresas em Configurações | `cards-r1.html`, C07 a C09 para cards repetidos | NÃO BATE: uma caixa grande reta continha todas as linhas | Cada empresa agora é um card claro com orelha superior esquerda e sombra no pai. BATE. |
| Monograma das empresas | Card de ícone da prancha, seção 10 | Sem par literal: é avatar de texto do sistema, não ícone da marca | Roxo profundo, Bricolage 800, raio de 2px. Usa a peça mais próxima da ID. |
| Formulário de incluir empresa | Card claro padrão de `cards-r1.html` e campo da prancha, seção 10 | NÃO BATE: caixa reta, campo com borda fraca e botão reto | Card com duas orelhas e sombra no pai; campo claro reto com borda 1,5px; botão de placa a 22° com texto reto. BATE. |
| Links Renomear e Tirar | Link da prancha, seção 10 | BATE em cor e peso; sublinhado padrão diverge da ponta de barra | Ajustado ao traço com ponta de barra. BATE. |
| Ficha: superfície, faixa e contorno | Card com orelhas e placa roxa da prancha, seções 05 e 10 | BATE na forma e cor; campos internos NÃO BATE | Mantidos corte de 22°, faixa roxa e sombra no pai. Campos corrigidos. BATE. |
| Ficha: campos e rótulos | Formulário da prancha, seção 10 | NÃO BATE: campos bege, borda leve, letra de 14px e rótulo miúdo em caixa alta | Superfície clara, borda 1,5px em tinta 2, letra de 16px, rótulo de 14px e respiro na escala de 4. BATE. |
| Ficha: botões de ação | Botão principal e secundário da prancha, seção 10 | NÃO BATE: altura e letras fora da régua | Altura do controle da base, caixa alta e espaçamento da ID; inclinação de 22° só no fundo. BATE. |
| Ficha: cores das tarefas | Exceção de etiquetas no briefing do sistema | Sem par na ID: paleta funcional aprovada pelo Natham | Mantida apenas para identificar tarefas; não altera a paleta da interface. |

Não houve cópia de peça ou arquivo da ID para o projeto. As classes de corte e os tokens já estavam na base. `ORIGEM-DA-IDENTIDADE.md` é comum e não foi editado.

Diagnóstico `refactoring-ui` após o ajuste: 8 de 8 pontos. Hierarquia, leitura sem cor, respiro, rótulos, escala de espaço, largura de texto, contraste e profundidade foram conferidos nas fotos. O quadro de seis colunas segue com rolagem própria no celular, como exige a função de mover conteúdos entre etapas.
