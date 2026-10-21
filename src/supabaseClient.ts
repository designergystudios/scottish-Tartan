import { createClient } from "@supabase/supabase-js";

// Clean env helper to handle extra spaces, trailing slashes, or quotes in user inputs.
const cleanEnvValue = (val: string | undefined): string => {
  if (!val) return "";
  return val.trim().replace(/^['"]|['"]$/g, '');
};

// @ts-ignore
const rawUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "";
// @ts-ignore
const rawKey = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "";

const supabaseUrl = cleanEnvValue(rawUrl).replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = cleanEnvValue(rawKey);

export const clientSupabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

console.log("[Supabase Client] Excluded-Vite Initialized:", !!clientSupabase, supabaseUrl);
