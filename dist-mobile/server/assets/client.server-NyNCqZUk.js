import { createClient } from "@supabase/supabase-js";
const FALLBACK_SUPABASE_URL = "https://ilblddiyjeytpdecpric.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImlsYmxkZGl5amV5dHBkZWNwcmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3ODYxOTMsImV4cCI6MjA5NTM2MjE5M30.hntHJ_VEJgX9xLTZg8kQKDlRFD79Uh9gaxaGezx81QQ";
function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: void 0,
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
let _supabaseAdmin;
const supabaseAdmin = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  }
});
export {
  supabaseAdmin
};
