import { createBrowserClient } from '@supabase/ssr';
// Importăm interfața Database generată automat
import { Database } from '@/types/supabase'; 

// Cod securizat: dacă procesul Vercel nu vede variabilele, folosim direct valorile sigure ca fallback
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://xtsecrskyoswwulkhgll.supabase.co';

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0c2VjcnNreW9zd3d1bGtoZ2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE0MzUsImV4cCI6MjA5MzYyNzQzNX0.FdNFWdUPfrjTd1xTX_FdHuzcNtekh3SWXvGhjWvkn8E';

// Inițializăm clientul SSR de browser cu suport complet pentru Cookie-uri și IntelliSense
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);