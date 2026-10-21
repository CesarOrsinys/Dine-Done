import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnvVar(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

const rawUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://uwiraasvvfdwrpxwsgbf.supabase.co';
// Strip trailing /rest/v1 or /rest/v1/ if user pasted the REST endpoint instead of project root
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
export const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_GCaIaUwOlegZSbCHE7iRUA_U_XJ161F';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}
