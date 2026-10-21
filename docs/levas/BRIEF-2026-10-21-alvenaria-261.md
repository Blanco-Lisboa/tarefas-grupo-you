# BRIEF Alvenaria · 261 (consertos da Lupa na rodada 245–257)

Leia docs/levas/2026-10-21-lupa-245-257.md e o item 261 da leva. Conserte SÓ os achados 1, 4, 6, 7 e 8:
- 1: a cópia do navegador para o banco não sobe mais os EXEMPLOS (ids de semente / idDoExemplo) — eles já estão no banco; assim um exemplo apagado não volta por outro endereço. Ideias escritas pela pessoa continuam subindo.
- 4: se a cópia falhar, a tela avisa (mesmo padrão de aviso do sistema) e tenta de novo na próxima abertura; nada fica invisível em silêncio.
- 6: na falha, só desfaz se não houve gravação mais nova daquela ideia.
- 7: `pendentes` por empresa (ou outra saída simples) para a gravação de uma empresa não descartar a leitura de outra.
- 8: o leque da pasta mostra também as categorias vazias guardadas.
NÃO mexa em MuralIdeias.tsx nem pastas.css (Vitral está trabalhando neles agora). Se precisar, me diga.
Testes para cada conserto (o menor que falha sem o conserto), npm run check verde, commit "261:", anote no item 261. NÃO publicar.
Responda só na mensagem final: sha e o que cada conserto fez.
