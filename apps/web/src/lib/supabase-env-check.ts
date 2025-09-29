import { clientEnvFlags } from '@/lib/env-flags-client';

const CLIENT_FLAG_TO_ENV_KEY = {
  URL: 'NEXT_PUBLIC_SUPABASE_URL',
  ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
} as const satisfies Record<keyof ReturnType<typeof clientEnvFlags>, string>;

export type SupabaseEnvKey = (typeof CLIENT_FLAG_TO_ENV_KEY)[keyof typeof CLIENT_FLAG_TO_ENV_KEY];

export function collectMissingSupabaseEnvKeys(flags = clientEnvFlags()): SupabaseEnvKey[] {
  return Object.entries(flags)
    .filter(([, value]) => !value)
    .map(([key]) => CLIENT_FLAG_TO_ENV_KEY[key as keyof typeof CLIENT_FLAG_TO_ENV_KEY]);
}

export async function fetchMissingSupabaseEnvKeys(): Promise<SupabaseEnvKey[]> {
  try {
    const res = await fetch('/api/env-check', { cache: 'no-store' });
    const json = await res.json();
    if (Array.isArray(json?.missing)) {
      return json.missing as SupabaseEnvKey[];
    }
    const flags = json?.flags ?? {};
    const missing: SupabaseEnvKey[] = [];
    if (!flags?.URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!flags?.ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return missing;
  } catch {
    return [];
  }
}
