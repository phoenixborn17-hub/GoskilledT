// Service-role Supabase client (server-only). Uses SUPABASE_SERVICE_ROLE_KEY, so it BYPASSES RLS —
// never import this into client code and never expose the key. No session persistence (it acts as
// the service, not a user). Currently used only by the staging OTP bypass (lib/auth/otp.ts) to
// get-or-create a phone user + mint a session on test.goskilled.in.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "./config";

export function createSupabaseAdminClient(): SupabaseClient {
  const { url } = requireSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for the admin client (service-role operations).",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
