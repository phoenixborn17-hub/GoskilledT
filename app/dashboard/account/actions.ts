// Account server actions (Redesign U6). Auth stays with Supabase (DR-024) — password changes are
// USER-PERFORMED via the existing session-based helper (no hand-rolled auth, Golden Rule 5); nothing
// is automated. Passwords are never logged (§6): errors are generic.
"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { getCurrentUser } from "../../../lib/auth/session";
import {
  setPasswordForCurrentUser,
  passwordIssue,
} from "../../../lib/auth/password";

export interface ChangePasswordResult {
  ok: boolean;
  error?: string;
}

/** Change the current user's password (user-performed). Reuses the existing Supabase helper. */
export async function changePasswordAction(
  _prev: ChangePasswordResult | null,
  formData: FormData,
): Promise<ChangePasswordResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const issue = passwordIssue(password);
  if (issue) return { ok: false, error: issue };
  if (password !== confirm)
    return { ok: false, error: "Passwords don't match." };

  await setPasswordForCurrentUser(password);
  return { ok: true };
}

/** Sign out of ALL devices (global scope) — for the Security page "active sessions" control. */
export async function signOutEverywhereAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}
