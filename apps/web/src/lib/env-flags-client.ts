export function clientEnvFlags() {
  return {
    URL: typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string",
    ANON_KEY: typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string",
  };
}
