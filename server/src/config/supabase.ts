import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Public client — for user-scoped operations
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Admin client — for server-side admin operations (logout, etc.)
// NEVER expose this to the frontend
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);