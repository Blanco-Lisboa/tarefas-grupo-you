// Função `drive` (Deno). Deploy: supabase functions deploy drive --no-verify-jwt (a checagem é própria, em acoes.ts).
import { baixarDoDrive, bases, env, tokenGoogle } from "../_shared/google.ts";
import { criarManipulador } from "./acoes.ts";
import { criarDriveApi } from "./drive-api.ts";

Deno.serve(criarManipulador({
  env,
  fetch: (...a) => fetch(...a),
  api: criarDriveApi({ api: bases().api, token: tokenGoogle }),
  baixar: baixarDoDrive,
}));
