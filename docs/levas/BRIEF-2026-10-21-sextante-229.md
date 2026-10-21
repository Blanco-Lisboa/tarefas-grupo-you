# Sextante · item 229 etapa 2 · ficha no formato novo do Drive

Projeto `Desktop/Sistemas-Grupo-You/grade-conteudo`. Leia o item 229 da leva e o plano `docs/levas/2026-10-21-PLANO-229-drive-pastas.md` (seção 10 = contrato da Alvenaria, base ca31c2d). Território: `src/components/ficha/`. Não mexa na tela Pastas (Vitral, em curso) nem na camada de dados/função drive (Alvenaria — se faltar algo no contrato, diga, não escreva). NÃO mexer em next.config.ts/tsconfig.json/package.json.

- Campo "Tema (pasta no Drive)": a lista mostra os Temas da empresa com cadeado nos permanentes; "+ Novo tema" cria (nome + interruptor Permanente, desligado por padrão) via criarOcasiao.
- Frase de ajuda nova, coerente com a árvore: o arquivo vai para Empresa → Formato → Tema; sem tema, cai em "Sem tema" daquele formato. Mostre o caminho de verdade quando o card tiver empresa+formato (ex.: "You › Reels › Dia das Mães").
- Depois de salvar, se título/formato/tema/empresa mudaram e o card já tem arquivo no Drive: organizarCard(tarefaId) (a pasta se move e se renomeia). Erro vira aviso, sem desfazer o salvar.
- Card postado e não permanente: "Some do Drive em N dias" (venceEm) perto dos anexos; permanente: "Fica para sempre (tema com cadeado)".
- Campo continua de ponta a ponta (233).
Prova na 3101: fotos 1440 do campo aberto com cadeado, do criar tema, do caminho, do "some em N dias", em `provas/r229-ficha/`. Check verde. Commit `229-ficha: ...`. Responda SÓ na mensagem final: sha + fotos + o que faltou do contrato.
