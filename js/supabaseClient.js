// Supabase Client Initializer (Vanilla JS ES Module)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://vsrnmczaqcrpeedfejab.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_VZ-ARBYhvuYutarzky5FVw_Ee-fqbkD';

let client = null;
try {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  });
} catch (err) {
  console.warn('[Supabase] Inicjalizacja klienta nie powiodła się (możliwy brak sieci):', err);
}

export const supabase = client;
