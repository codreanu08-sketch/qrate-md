import { createBrowserClient } from '@supabase/ssr';
// Importăm interfața Database generată automat
import { Database } from '@/types/supabase'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Inițializăm clientul SSR de browser cu suport complet pentru Cookie-uri și IntelliSense
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);