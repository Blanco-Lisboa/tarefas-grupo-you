# BRIEF · Sextante · item 208 (leva 2026-10-18, linha do 208)

## Pedido do Natham (palavras dele)
"Os botões de aprovar e consertar ficam DENTRO do card flutuante, não nesse card, eles ficam aqui ->"
- Print 1 (`docs/referencias/2026-10-20-item-208/1-card-esteira.png`): card "Reels: bastidores do escritório" na coluna Em análise, com Aprovar/Consertar embaixo.
- Print 2 (`.../2-ficha-topo.png`): a ficha aberta desse card; a seta dele aponta para o TOPO, onde estão "Começar" e "Fechar".

## O que fazer
1. Tirar Aprovar e Consertar do card da Esteira (coluna Em análise).
2. Colocar Aprovar e Consertar no cabeçalho da ficha, na mesma linha de "Começar"/"Fechar", só quando o card estiver em Em análise (mesmas regras de quem pode aprovar que valem hoje no card).
3. Mesmo comportamento de hoje ao clicar (o Aprovar abre o que abre hoje, o Consertar idem); só muda o LUGAR. Depois de agir, a ficha reflete o novo estado.
4. Mesma família visual dos botões do cabeçalho (altura, raio e contorno de "Começar"/"Fechar"); Aprovar verde e Consertar vermelho como hoje. Nada pode encostar no título nem espremer "Fechar".

## Prova (obrigatória, foto olhada por você)
- Foto do card em Em análise SEM os botões e foto da ficha com os botões no topo, em 1440 (só PC por enquanto).
- Clicar Aprovar e Consertar na ficha (banco falso da prévia) e mostrar que funciona.
- `npm run check` verde. Commit pelo index, mensagem começando com "208:".

## Território
Só ficha e card (os seus arquivos). Nada de banco, nada de publicar.
Responda SÓ na mensagem final: o que mudou, sha, caminho das fotos.

---
# Acréscimo · itens 209 e 210 (mesma ficha, mesma leva)
Print: `docs/referencias/2026-10-20-item-208/3-publicacao-redes.png` (ficha "Adrian Reels - Calculo do Simples Nacional", bloco Publicação).

## 209 · Instagram/Facebook
Palavras dele: "Preciso ver qual opção eu escolho do instagram e facebook, quando eu clico parece que ele fica com a cor do fundo, fiquei confuso. Deixe ele com outra cor quando eu clico pra postar..."
- Hoje o escolhido fica azul cheio e o não escolhido fica cinza claro, quase da cor do fundo do bloco: ele não sabe qual vale.
- Fazer: escolhido = cor própria forte e inconfundível + sinal de marcado (ex.: ✓ e/ou logo da rede); não escolhido = botão claro com contorno visível, claramente "clicável e desligado". Os dois podem estar escolhidos ao mesmo tempo: tem que dar para ver isso de relance.
- Mesma altura e raio dos outros botões do bloco.

## 210 · "Deixe tudo alinhado e enquadrado!"
Pente fino da ficha inteira, olhando o print:
- Bloco Publicação: o título "Publicação" sobre a borda, a linha "Programado…", os botões das redes (largura diferente da linha de baixo) e a linha data/Reprogramar/Postar agora: tudo na mesma margem esquerda e com larguras que fecham na mesma direita.
- Capa do Reels: miniatura, barrinha e textos alinhados com o resto; "Capa própria" e "Anexos" com a mesma largura/margem dos campos.
- Mesma margem esquerda e direita em todos os campos e blocos da ficha; espaçamento igual entre seções; nada encostando.
- Prova: foto da ficha inteira (rolando) antes/depois em 1440, olhada por você.

---
# Acréscimo · item 211
Print: `docs/referencias/2026-10-20-item-208/4-legenda.png`. Palavras dele: "Não é legenda, é 'Descrição do post'".
- Trocar o rótulo "Legenda" por "Descrição do post" em TODA a tela (ficha, checagem do que falta no Programar, avisos, textos de ajuda). Contador 2200 continua.
- Só texto visível: nome de coluna/variável no banco NÃO muda.
- Prova: `grep -rn "egenda" src/` mostrando que não sobrou nenhum texto visível com "Legenda".

---
# Acréscimo · item 212
Print: `docs/referencias/2026-10-20-item-208/5-rolagem.png`. Palavras dele: "quando eu uso scroll do mouse com o card flutuante aberto, ele scrola pra baixo na aba normal da esteira. Quando o card flutuante estiver aberto, o scroll deve descer apenas do card flutuante".
- Com a ficha aberta: roda do mouse rola SÓ a ficha. A Esteira por trás (página e colunas) não se mexe, nem quando a ficha chega ao fim, nem com o mouse em cima do fundo escurecido.
- Ao fechar a ficha, a Esteira volta a rolar normal, na mesma posição em que estava.
- Prova: no navegador, abrir a ficha, disparar wheel na ficha (até o fim) e no fundo, e mostrar que o scrollTop/scrollLeft da Esteira e das colunas não mudou; depois fechar e mostrar que rola de novo.

---
# Acréscimo · item 205 (tirar o campo Etapa da ficha) — DECIDIDO pelo Natham em 20/10
Print: `docs/referencias/2026-10-20-item-208/6-etapa.png`. Ele cobrou de novo: "Botão de etapa já falei que não precisa... ou tem algum motivo dele ficar aqui no card?"
- Tirar o campo **Etapa** da ficha (o arraste na Esteira continua sendo o jeito de mudar de etapa).
- Decisão dele sobre como o card entra na Esteira sem o campo: **todo card com Empresa que NÃO é tarefa do Caderno entra sozinho na coluna Roteiro** (ao salvar, se não tem etapa). Card criado pelo + de uma coluna continua nascendo naquela coluna. Tarefa do Caderno NUNCA vira card na Esteira (regra antiga, não quebrar).
- Card que já tem etapa não muda. Tirar a empresa de um card não mexe na etapa sozinho.
- Se isso precisar de mudança no BANCO (gatilho/padrão), NÃO faça: descreva o que precisa e me reporte (território da Alvenaria). Se der para fazer só na tela ao salvar, faça.
- Prova: criar um card com empresa no Calendário (banco falso) e mostrar que ele aparece em Roteiro na Esteira; tarefa do Caderno com empresa NÃO aparece.
