# BRIEF Alvenaria · 256 (ideias do navegador para o banco) + fecha 254

Leia os itens 247–256 na leva. Hoje as ideias vivem em localStorage "grade-conteudo:ideias:v1" (src/lib/dados/ideias.ts) e a tabela public.ideias existe mas está vazia. Escolha do Natham: passar para o banco, compartilhadas (Natham e Matheus veem e editam as mesmas, por empresa — mesma regra de privacidade das Pastas, que são compartilhadas).

1. Antes de tudo: confira se as ideias que aparecem para ele (10 na You e 10 na Beec, nos prints) são os EXEMPLOS fixos do código (semente) ou ideias que ele escreveu. Se forem os exemplos do código, PARE e me diga antes de escrever a cópia (ele decide se exemplos vão para o banco).
2. Banco: confira o esquema e a RLS da public.ideias contra o que o mural precisa (categoria, título, detalhe, link, empresa; categorias criadas pelo "+ categoria" também precisam morar no banco). Se faltar algo, SQL numerado em supabase/ + arquivo em supabase/_colar/ e NÃO aplique (o Natham cola). Privacidade = RLS com a sessão do usuário, como o resto do sistema.
3. Front: ideias.ts passa a ler/gravar no banco pelo mesmo caminho dos outros dados (não crie segundo caminho). O mural (MuralIdeias.tsx, Vitral fez) não muda de cara. Escrita otimista com desfazer na falha, como o resto.
4. Cópia única: na primeira abertura, o que estiver no localStorage daquela pessoa sobe para o banco (sem duplicar se rodar duas vezes), e depois o localStorage deixa de ser usado. O npm run exemplo (3101) continua funcionando com dados falsos.
5. 254: depois da cópia, as 2 ideias da You "Você está pagando imposto a mais" e "Ninguém te conta isso sobre [TEMA]" voltam para Ganchos — prepare o UPDATE por id para depois que ele abrir (ou outra saída limpa), e diga como.
6. Prova: teste da cópia (sobe, não duplica), npm run check verde, foto do mural com dados do banco (3101). Commit "256:", anote na leva. NÃO publicar.

Responda só na mensagem final: o achado do passo 1, arquivo SQL a colar (se houver), sha, e o passo a passo do que o Natham faz (em ordem).
