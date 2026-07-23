import { createClient } from "@supabase/supabase-js";
function createSupabaseClient() {
  const SUPABASE_URL = "https://ilblddiyjeytpdecpric.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYmxkZGl5amV5dHBkZWNwcmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3ODYxOTMsImV4cCI6MjA5NTM2MjE5M30.hntHJ_VEJgX9xLTZg8kQKDlRFD79Uh9gaxaGezx81QQ";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
export {
  supabase as s
};
