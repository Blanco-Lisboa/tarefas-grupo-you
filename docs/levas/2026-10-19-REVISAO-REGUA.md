# Revisão final da rodada 3 · Régua

Escopo: commits `5e2f4a4^..6b5b73c`, decisões dos itens 56 a 60, código das telas e capturas em `provas/r3-nevoa-*/` e `provas/r3-nevoa-final/`. Somente leitura das telas.

## Achados

| # | Gravidade | Território | Arquivo:linha | O que está errado |
| --- | --- | --- | --- | --- |
| 1 | **Alta** | Pena, tarefas | `src/components/tarefas/Agenda.tsx:27` | `useNota` lê o `localStorage` apenas ao montar. Quando o usuário muda de dia, `Agenda` continua montada com outra `chave`, mas exibe as anotações do dia anterior. Se editar, grava esse texto no dia novo. Há risco de misturar ou sobrescrever notas entre dias. |
| 2 | **Alta** | Alvenaria, mapa | `src/components/mapa/logica.ts:6` | O início da linha do tempo está fixo em `2026-10-19`. O pedido do item 58 era começar amanhã. Depois dessa data, o Mapa continuará exibindo outubro de 2026, inclusive em meses futuros, e a contagem de “já postados no mês” usará o mês antigo. |
| 3 | **Média** | Pena, tarefas | `src/components/tarefas/TelaTarefas.tsx:21` | O relógio de “hoje” usa `useSyncExternalStore` com assinatura vazia. A tela não recebe aviso quando vira a meia-noite; se ficar aberta, o dia e o marcador “Hoje” só se atualizam após outro motivo de renderização ou recarga. |
| 4 | **Média** | Pena, tarefas | `src/components/tarefas/caderno.css:156` | O card de compromisso passado recebe `opacity: .6` inteiro, inclusive o texto secundário `--fraco`. Com a etiqueta amarela sobre branco, a informação de horário/responsável cai para cerca de **2,55:1**, abaixo do contraste mínimo de 4,5:1 para texto comum. A foto `provas/r3-nevoa-final/1440-tarefas.png` mostra essa perda de leitura. |
| 5 | **Média** | Sextante, calendário | `src/components/calendario/Grade.tsx:49` | Criar tarefa clicando no espaço vazio de um dia ou horário depende de `onClick` em `div` (também na linha 75). Essas áreas não recebem foco nem respondem a Enter/Espaço, então a ação direta da grade não funciona pelo teclado. |
| 6 | **Média** | Sextante, calendário | `src/components/calendario/TelaCalendario.tsx:148` | Ao iniciar arraste da lista “Sem data”, o código adiciona `drop` e `dragend` na janela. Só os remove quando um desses eventos chega; falta limpeza se o componente desmontar durante o arraste. Nesse caso os listeners ficam presos à janela e podem atuar sobre a lista antiga. |
| 7 | **Média** | Régua, configurações | `src/components/configuracoes/TelaConfiguracoes.tsx:86` | A confirmação de exclusão recebe `role="alertdialog"`, mas o foco não vai para ela ao abrir nem retorna ao botão “Tirar” ao cancelar. Usuários de teclado/leitor de tela podem continuar navegando fora da confirmação sem perceber qual decisão está pendente. |
| 8 | **Média** | Régua, ficha | `src/components/ficha/Ficha.tsx:191` | A paleta declara `radiogroup` e `radio`, mas cada cor é um botão comum no Tab e não há navegação por setas nem um único ponto de Tab, como esse padrão ARIA espera. A seleção funciona por clique, porém a experiência de teclado anunciada pelo papel está incompleta. |
| 9 | **Baixa** | Régua, ficha | `src/components/ficha/Ficha.tsx:124` | As escolhas de Tipo, Empresa, Rede e Etapa usam `select` nativo, enquanto os demais seletores do sistema usam `Selecao` em vidro. A foto `provas/r3-nevoa-final/1440-ficha.png` mostra a diferença de tratamento para o mesmo tipo de escolha. |
| 10 | **Baixa** | Pena, tarefas; Alvenaria, mapa; Régua, conteúdos/configurações | `src/components/tarefas/caderno.css:29`; `src/components/mapa/mapa.css:19`; `src/components/conteudos/conteudos.css:6` | O número do mesmo `.bloco-destaque` aparece em três escalas: 31px em Tarefas, 49px no Mapa e 39px em Conteúdos/Configurações. As fotos finais de 1440 mostram que a peça comum não tem uma hierarquia numérica consistente. |

## Conferências sem achado

- A animação do Mapa registra `ScrollTrigger` e `SplitText` dentro de `gsap.context`, reverte o contexto e desconecta o `ResizeObserver` em `src/components/mapa/TelaMapa.tsx:66-112`. Não encontrei vazamento comprovado ali.
- Não encontrei token, fonte, logo, SVG, corte diagonal ou cor ativa da ID Beec nas telas migradas. As ocorrências de “Beec” no código ativo são nomes de empresa nos dados; `src/styles/beec-tokens.css` permanece sem importação, conforme a decisão da rodada.
