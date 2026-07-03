// Admin identity helper (Ticket 6). RBAC = Supabase app_metadata.role === "admin" (DR-024).
// Middleware already gates /admin/*; this is defence-in-depth + the actor for audit rows.
import { getSupabaseUser } from "./session";

export interface AdminIdentity {
  supabaseId: string;
  email: string | null;
}

export async function getAdminUser(): Promise<AdminIdentity | null> {
  const user = await getSupabaseUser();
  if (!user) return null;
  const role = (user.app_metadata as { role?: string } | undefined)?.role;
  if (role !== "admin") return null;
  return { supabaseId: user.id, email: user.email ?? null };
}
