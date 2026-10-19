# Revisão Régua, rodada 4

Escopo: `git diff a7bff33..5463cb9`, excluindo `docs/` e `provas/`. Revisão de código, sem alteração da implementação.

| Achado | Arquivo:linha | Gravidade | Dono |
| --- | --- | --- | --- |
| Ao avançar ou voltar o mês pelas setas do CampoData, só `mes` muda. `foco` continua no mês antigo. Se a pessoa tabular até o primeiro dia exibido e usar uma seta do teclado, o cálculo parte do dia antigo e volta ao mês anterior. O foco visual e a data navegada deixam de coincidir. | `src/components/ui/CampoData.tsx:69`, `src/components/ui/CampoData.tsx:117` | Média | Sextante |
| Se `localStorage.setItem` falhar por cota cheia, a exceção é capturada e a ideia nova fica em `memoria`, mas `bruto()` continua lendo primeiro o valor antigo de `localStorage`. O salvamento aparentemente conclui e a ideia desaparece da tela; a próxima edição também parte do dado antigo. | `src/lib/dados/ideias.ts:36`, `src/lib/dados/ideias.ts:60` | Alta | Vitral |
| Os dias com três postagens no Mapa podem ocultar cartões e seus botões. O bloco tem altura máxima de meia altura do card menos 50 px e `overflow: hidden`; três títulos de até duas linhas, metadados, data e espaços excedem essa altura, sobretudo em 390 px. Os cartões cortados deixam de ser acessíveis por clique. | `src/components/mapa/mapa.css:69`, `src/components/mapa/mapa.css:81` | Alta | Alvenaria |
| O anel de foco das folhas usa `--foco` azul com 55% de opacidade sobre as cores pastel. A razão calculada entre o anel e a base das seis cores fica entre 1,88:1 e 2,25:1, abaixo dos 3:1 exigidos para indicador visual de foco. O teclado perde a indicação clara de qual folha está selecionada. | `src/components/pastas/pastas.css:94`, `src/components/pastas/cores.ts:8` | Média | Vitral |
| As pautas de exemplo trocam o posicionamento das empresas: a Beec recebe temas de gestão financeira e painel financeiro; a You recebe pauta genérica de MEI, sem foco em vendedores de marketplace. Isso aparece como conteúdo real no Mapa e no Calendário e pode induzir planejamento errado. | `src/lib/dados/exemplo.ts:64`, `src/lib/dados/exemplo.ts:122` | Média | Alvenaria |

## Verificações sem achado

- O `toISOString` novo em `exemplo.ts:189` opera sobre uma data criada em UTC e só gera a lista fixa de dias. Não converte a data local escolhida pela pessoa. O CampoData usa `paraDia` com relógio local.
- O arraste da folha usa `touch-action: pan-y` e só inicia a virada quando o movimento horizontal supera o vertical. Não encontrei conflito direto com a rolagem vertical no delta.
- As chamadas novas de `localStorage` estão envoltas em `try/catch`; o problema registrado é a prioridade de leitura após uma falha de gravação.
- Os ouvintes, observadores e animações adicionados no delta têm limpeza ao desmontar. O `SplitText` é registrado no contexto do GSAP, que é revertido pelo efeito.
