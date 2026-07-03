// Browser Supabase client (@supabase/ssr). Use in Client Components only.
"use client";
import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseConfig } from "./config";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
