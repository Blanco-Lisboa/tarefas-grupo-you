// Função `drive` de mentira da cópia de exemplo (item 229/234): o bastante para a tela Pastas e a ficha funcionarem; guarda só na memória.
// Quem chama (exemplo-banco.mjs) entrega o corpo já lido, a resposta e as listas em memória.
export function funcaoDrive(c, { res, ocasioes, pastasLivres, arquivos, tarefas, P, porta, novoId }) {
  const erro = (status, msg) => res.writeHead(status).end(JSON.stringify({ erro: msg }));
  const linhaTema = (o) => ({ id: o.id, empresa_id: o.empresa_id, nome: o.nome, permanente: o.permanente, desligado_em: o.desligado_em });
  const duplicado = (empresa, nome, ignorar) => ocasioes.some((o) => o.empresa_id === empresa && o.id !== ignorar && o.nome.trim().toLowerCase() === String(nome).trim().toLowerCase());
  switch (c.acao) {
    case "criar_ocasiao": {
      if (duplicado(c.empresa_id, c.nome)) return erro(409, "Já existe um tema com esse nome.");
      const o = { id: `tema-${novoId()}`, empresa_id: c.empresa_id, nome: String(c.nome).trim(), permanente: c.permanente === true, desligado_em: null, criado_por: P.natham };
      ocasioes.push(o);
      return res.writeHead(200).end(JSON.stringify({ ocasiao: linhaTema(o) }));
    }
    case "renomear_ocasiao": {
      const o = ocasioes.find((x) => x.id === c.ocasiao_id);
      if (!o) return erro(404, "Tema não encontrado.");
      if (duplicado(o.empresa_id, c.nome, o.id)) return erro(409, "Já existe um tema com esse nome.");
      o.nome = String(c.nome).trim();
      return res.writeHead(200).end(JSON.stringify({ ok: true, restantes: 0 }));
    }
    case "permanente_ocasiao": { // quem entra aqui é sempre o Natham (o banco de verdade também deixa o Matheus ligar mas não desligar)
      const o = ocasioes.find((x) => x.id === c.ocasiao_id);
      if (!o) return erro(404, "Tema não encontrado.");
      o.desligado_em = c.ligado ? null : o.permanente ? new Date().toISOString() : o.desligado_em;
      o.permanente = c.ligado === true;
      return res.writeHead(200).end(JSON.stringify({ ok: true, rearmados: 0 }));
    }
    case "criar_pasta_livre": {
      const nome = String(c.nome ?? "").trim();
      if (!nome) return erro(400, "Escreva o nome da pasta.");
      if (["reels", "carrossel", "post", "stories", "sem formato"].includes(nome.toLowerCase())) return erro(409, "Esse nome já é de uma pasta de formato.");
      if (pastasLivres.some((x) => x.empresa_id === c.empresa_id && x.nome.toLowerCase() === nome.toLowerCase())) return erro(409, "Já existe uma pasta com esse nome.");
      const p = { id: `livre-${novoId()}`, empresa_id: c.empresa_id, nome, permanente: c.permanente === true, criado_por: P.natham };
      pastasLivres.push(p);
      return res.writeHead(200).end(JSON.stringify({ pasta: p }));
    }
    case "renomear_pasta_livre": {
      const p = pastasLivres.find((x) => x.id === c.pasta_id);
      if (!p) return erro(404, "Pasta não encontrada.");
      const nome = String(c.nome ?? "").trim();
      if (pastasLivres.some((x) => x.id !== p.id && x.empresa_id === p.empresa_id && x.nome.toLowerCase() === nome.toLowerCase())) return erro(409, "Já existe uma pasta com esse nome.");
      p.nome = nome;
      return res.writeHead(200).end(JSON.stringify({ ok: true }));
    }
    case "permanente_pasta_livre": { // quem entra aqui é sempre o Natham (o banco de verdade deixa o Matheus ligar, não desligar)
      const p = pastasLivres.find((x) => x.id === c.pasta_id);
      if (!p) return erro(404, "Pasta não encontrada.");
      p.permanente = c.ligado === true;
      return res.writeHead(200).end(JSON.stringify({ ok: true }));
    }
    case "apagar_pasta_livre": {
      const i = pastasLivres.findIndex((x) => x.id === c.pasta_id);
      if (i < 0) return erro(404, "Pasta não encontrada.");
      if (pastasLivres[i].permanente) return erro(409, "Esta pasta tem cadeado. Desligue o Permanente para apagar.");
      pastasLivres.splice(i, 1);
      for (let j = arquivos.length; j--;) if (arquivos[j].pasta_livre_id === c.pasta_id) arquivos.splice(j, 1);
      return res.writeHead(200).end(JSON.stringify({ ok: true }));
    }
    case "sessao_envio_livre":
      return res.writeHead(200).end(JSON.stringify({ sessao_url: `http://127.0.0.1:${porta}/upload/sessao/${novoId()}` }));
    case "confirmar_envio_livre": {
      const p = pastasLivres.find((x) => x.id === c.pasta_id);
      if (!p) return erro(404, "Pasta não encontrada.");
      const base = { id: `a${novoId()}`, tarefa_id: null, caminho: null, drive_id: c.drive_id, ordem: 0, papel: "anexo", nome: c.nome, tipo: c.tipo, tamanho: c.tamanho, empresa_id: p.empresa_id, formato: null, ocasiao_id: null, pasta_livre_id: p.id, criado_por: P.natham, created_at: new Date().toISOString() };
      arquivos.push(base);
      return res.writeHead(200).end(JSON.stringify({ arquivo_id: base.id }));
    }
    case "organizar_card": return res.writeHead(200).end(JSON.stringify({ ok: true, movida: false }));
    case "link_video": {
      const a = arquivos.find((x) => x.id === c.arquivo_id);
      if (!a?.caminho?.endsWith(".mp4")) return erro(404, "Vídeo de exemplo não disponível (só os dois Reels com vídeo tocam).");
      return res.writeHead(200).end(JSON.stringify({ url: `http://127.0.0.1:${porta}/storage/v1/object/sign/arquivos/${a.caminho}?token=exemplo` }));
    }
    case "apagar_anexo": {
      const i = arquivos.findIndex((x) => x.id === c.arquivo_id);
      if (i >= 0) arquivos.splice(i, 1);
      return res.writeHead(200).end(JSON.stringify({ ok: true }));
    }
    case "apagar_tarefa": {
      const i = tarefas.findIndex((x) => x.id === c.tarefa_id);
      if (i >= 0) tarefas.splice(i, 1);
      for (let j = arquivos.length; j--;) if (arquivos[j].tarefa_id === c.tarefa_id) arquivos.splice(j, 1);
      return res.writeHead(200).end(JSON.stringify({ ok: true }));
    }
    case "sessao_envio": case "sessao_envio_pasta":
      return res.writeHead(200).end(JSON.stringify({ sessao_url: `http://127.0.0.1:${porta}/upload/sessao/${novoId()}` }));
    case "confirmar_envio": case "confirmar_envio_pasta": {
      const base = { id: `a${novoId()}`, caminho: null, drive_id: c.drive_id, ordem: Number(c.ordem ?? 0), papel: c.papel ?? "anexo", nome: c.nome, tipo: c.tipo, tamanho: c.tamanho, criado_por: P.natham, created_at: new Date().toISOString() };
      arquivos.push(c.acao === "confirmar_envio" ? { ...base, tarefa_id: c.tarefa_id } : { ...base, tarefa_id: null, empresa_id: c.empresa_id, formato: c.formato ?? null, ocasiao_id: c.ocasiao_id ?? null });
      return res.writeHead(200).end(JSON.stringify({ arquivo_id: base.id }));
    }
    default: return erro(400, "Esta ação não existe na cópia de exemplo.");
  }
}
