// Função `google-autorizar` (Deno). Deploy: supabase functions deploy google-autorizar --no-verify-jwt
import { bases, env, tokenGoogle } from "../_shared/google.ts";
import { criarDriveApi } from "../drive/drive-api.ts";
import { criarManipulador } from "./acoes.ts";

const api = criarDriveApi({ api: bases().api, token: tokenGoogle });
Deno.serve(criarManipulador({ env, fetch: (...a) => fetch(...a), quemSou: () => api.quemSou() }));
