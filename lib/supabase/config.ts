// Shared Supabase config guards. Supabase Auth is the ONE auth authority (DR-024) —
// never hand-roll JWTs or store secret fallbacks (Golden Rule 5).

export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}
export function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

/** True once the project URL + anon key are set. Lets dev proceed before auth is wired. */
export function isSupabaseConfigured(): boolean {
  return supabaseUrl().length > 0 && supabaseAnonKey().length > 0;
}

export function requireSupabaseConfig(): { url: string; anonKey: string } {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see SETUP.md / Task 1 dashboard steps).",
    );
  }
  return { url: supabaseUrl(), anonKey: supabaseAnonKey() };
}
