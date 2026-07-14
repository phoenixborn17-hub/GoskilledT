// Current-session helpers for Server Components / Server Actions. Ensures our internal User
// row is synced on the first authenticated access (Task 2). Wrapped in React cache() so a
// single request hits Supabase + the DB at most once.
import { cache } from "react";
import { createSupabaseServerClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { prisma } from "../prisma";
import { syncUser, type SyncResult } from "./user-sync";
import { resolveGetUserResult } from "./verify-user";
import type { User } from "@supabase/supabase-js";

export { AuthUnavailableError } from "./verify-user";

/** Throws AuthUnavailableError (not a plain null) when Supabase couldn't verify the token for a
 * reason other than "no session" — callers must not treat that as signed-out (2026-07-15). */
export const getSupabaseUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return resolveGetUserResult(user, error);
});

/** The authenticated user's synced internal record, or null if not signed in. */
export const getCurrentUser = cache(async (): Promise<SyncResult | null> => {
  const user = await getSupabaseUser();
  if (!user) return null;
  return syncUser(user);
});

export interface CurrentUserRecord {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  goal: "SKILL" | "INCOME" | "BOTH" | null;
  referralCode: string;
  onboardedAt: Date | null;
  emailOptOut: boolean | null;
}

/** Full profile fields for the current user (Profile tab). */
export const getCurrentUserRecord = cache(
  async (): Promise<CurrentUserRecord | null> => {
    const synced = await getCurrentUser();
    if (!synced) return null;
    return prisma.user.findUnique({
      where: { id: synced.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        goal: true,
        referralCode: true,
        onboardedAt: true,
        emailOptOut: true,
      },
    });
  },
);
