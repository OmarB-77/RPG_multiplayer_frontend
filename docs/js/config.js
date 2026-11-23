import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Progetto Supabase dedicato al gioco (cronache-del-master).
// La chiave anon e' pubblica per progetto: la sicurezza e' garantita dalle regole RLS.
export const SUPABASE_URL = "https://vqedtxdlyxqtwpweytqt.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZWR0eGRseXhxdHdwd2V5dHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNTk4OTIsImV4cCI6MjExMDgzNTg5Mn0.uH5kJWJlZWMjKO849IRICmjO4CbxeXEbT4SW0x9coBo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
