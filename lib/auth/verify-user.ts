// Shared auth-verification error classification (2026-07-15 login-bounce fix). getUser() returns
// {data:{user}, error} and the error was previously discarded everywhere it was called — a
// transient Supabase failure (AuthRetryableFetchError, network blip) was indistinguishable from
// "no session" and both bounced a real, logged-in user to /login. This file is the single place
// that decides: genuinely signed out vs. temporarily unable to verify.
import {
  isAuthSessionMissingError,
  type AuthError,
} from "@supabase/supabase-js";

/** Thrown instead of returning null when getUser() failed for a reason OTHER than "no session"
 * (network error, 5xx, AuthRetryableFetchError). Callers must NOT treat this as signed-out. */
export class AuthUnavailableError extends Error {
  constructor(cause: AuthError) {
    super(
      "Supabase Auth is temporarily unreachable — the session could not be verified.",
    );
    this.name = "AuthUnavailableError";
    this.cause = cause;
  }
}

/**
 * Classifies a getUser() result.
 * - user present → returned as-is.
 * - no user + no error, or AuthSessionMissingError → genuinely signed out (null).
 * - no user + any other error → throws AuthUnavailableError (transient; do not sign out).
 */
export function resolveGetUserResult<U>(
  user: U | null,
  error: AuthError | null,
): U | null {
  if (user) return user;
  if (!error || isAuthSessionMissingError(error)) return null;
  throw new AuthUnavailableError(error);
}
