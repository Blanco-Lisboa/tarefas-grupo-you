// Banco falso: guarda em memória as imagens enviadas ao balde "arquivos" (item 300) e as devolve no endereço assinado.
const guardados = new Map(); // caminho -> { tipo, bytes }

/** Devolve true se tratou o pedido (envio ou leitura de um print guardado). */
export async function storageDePrints(req, res, url) {
  const envio = url.pathname.match(/^\/storage\/v1\/object\/arquivos\/(ideias\/.+)$/);
  if (envio && req.method === "POST") {
    const partes = [];
    for await (const p of req) partes.push(p);
    const corpo = Buffer.concat(partes), tipo = req.headers["content-type"] ?? "image/png";
    // o supabase-js manda multipart/form-data: o arquivo é a parte depois da linha em branco
    const limite = /boundary=(.+)$/.exec(tipo)?.[1];
    let bytes = corpo, tipoArq = "image/png";
    if (limite) {
      const arq = corpo.indexOf("filename="), ini = corpo.indexOf("\r\n\r\n", arq) + 4, fim = corpo.lastIndexOf(`\r\n--${limite}`); // pula o campo cacheControl
      tipoArq = /Content-Type: (\S+)/i.exec(corpo.subarray(arq, ini).toString("latin1"))?.[1] ?? tipoArq;
      bytes = corpo.subarray(ini, fim);
    }
    guardados.set(decodeURIComponent(envio[1]), { tipo: tipoArq, bytes });
    return res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ Key: `arquivos/${envio[1]}` })), true;
  }
  const leitura = url.pathname.match(/^\/storage\/v1\/object\/sign\/arquivos\/(ideias\/.+)$/);
  const g = leitura && guardados.get(decodeURIComponent(leitura[1]));
  if (g) return res.writeHead(200, { "content-type": g.tipo }).end(g.bytes), true;
  if (leitura && req.method === "DELETE") return res.writeHead(200).end("{}"), true;
  return false;
}
