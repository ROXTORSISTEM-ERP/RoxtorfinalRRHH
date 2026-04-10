import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están configuradas.");
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error("❌ Error al inicializar Supabase:", error);
    return null;
  }
};

// Exportamos una instancia por defecto para compatibilidad, pero se recomienda usar getSupabase()
export const supabase = getSupabase();
