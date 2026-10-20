// Só para o `tsc` da raiz entender as funções do servidor (Deno). Não existe em tempo de execução no navegador nem no Vitest.
declare const Deno: { env: { get(nome: string): string | undefined }; serve(tratar: (req: Request) => Response | Promise<Response>): void };
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };
