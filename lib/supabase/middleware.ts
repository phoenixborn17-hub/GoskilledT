// Session refresh for middleware (@supabase/ssr). Returns the refreshed response and the
// current user. No-ops safely when Supabase isn't configured yet (dev never blocks).
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./config";
import { AuthUnavailableError, resolveGetUserResult } from "../auth/verify-user";
import type { User } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export interface SessionResult {
  response: NextResponse;
  user: User | null;
  /** Supabase couldn't be reached to verify the token (transient) — the caller must NOT treat
   * this the same as "no session" (see verify-user.ts). Route guards should let the request
   * through rather than bounce to /login; the downstream Server Component re-verifies and
   * surfaces a retry UI if it's still down. */
  authUnavailable: boolean;
}

export async function updateSession(
  request: NextRequest,
): Promise<SessionResult> {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured())
    return { response, user: null, authUnavailable: false };

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        for (const { name, value } of cookiesToSet)
          request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() revalidates the token with Supabase (do not trust getSession() in middleware).
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  try {
    return { response, user: resolveGetUserResult(user, error), authUnavailable: false };
  } catch (e) {
    if (e instanceof AuthUnavailableError) {
      return { response, user: null, authUnavailable: true };
    }
    throw e;
  }
}
