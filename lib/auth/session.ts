// Current-session helpers for Server Components / Server Actions. Ensures our internal User
// row is synced on the first authenticated access (Task 2).
import { createSupabaseServerClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { syncUser, type SyncResult } from "./user-sync";
import type { User } from "@supabase/supabase-js";

export async function getSupabaseUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The authenticated user's synced internal record, or null if not signed in. */
export async function getCurrentUser(): Promise<SyncResult | null> {
  const user = await getSupabaseUser();
  if (!user) return null;
  return syncUser(user);
}
