import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  throw new Error('Mancano VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY (vedi .env.example)');
}

// Chiave anon: il browser può SOLO leggere (RLS). Le scritture passano dal backend.
export const supabase = createClient(url, anon);
