import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function createBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    console.error('[supabase-client] Missing ENV (client bundle):', missing.join(', '));
    return null;
  }

  browserClient = createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  return createBrowserClient();
}

export async function getSupabaseSession(): Promise<Session | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) {
    console.warn('[supabase-client] Failed to retrieve session', error.message);
    return null;
  }
  return data.session ?? null;
}

export function resetSupabaseBrowserClient() {
  browserClient = null;
}
