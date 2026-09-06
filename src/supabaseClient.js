import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zzybvywbbthnadlnzane.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_EZDpdQfQINu6v0jHrFLT6A_aLcbVWdb';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('your-'));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

/**
 * Health check helper to test database connectivity
 */
export async function checkSupabaseConnection() {
  if (!supabase) {
    return { connected: false, message: 'Supabase credentials missing or invalid.' };
  }
  try {
    const { data, error } = await supabase.from('rooms').select('id').limit(1);
    if (error) {
      return { connected: false, message: error.message, code: error.code };
    }
    return { connected: true, message: 'Connected successfully to Supabase.' };
  } catch (err) {
    return { connected: false, message: err.message || 'Connection error' };
  }
}
