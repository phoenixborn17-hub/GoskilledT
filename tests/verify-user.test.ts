// 2026-07-15 login-bounce fix: getUser() errors must not be silently treated as signed-out.
import { describe, it, expect } from "vitest";
import {
  AuthSessionMissingError,
  AuthRetryableFetchError,
  AuthApiError,
} from "@supabase/supabase-js";
import {
  resolveGetUserResult,
  AuthUnavailableError,
} from "@/lib/auth/verify-user";

const fakeUser = { id: "u1" } as never;

describe("resolveGetUserResult", () => {
  it("returns the user when present, regardless of error", () => {
    expect(resolveGetUserResult(fakeUser, null)).toBe(fakeUser);
  });

  it("returns null when there is no user and no error", () => {
    expect(resolveGetUserResult(null, null)).toBeNull();
  });

  it("treats AuthSessionMissingError as genuinely signed out", () => {
    expect(resolveGetUserResult(null, new AuthSessionMissingError())).toBeNull();
  });

  it("throws AuthUnavailableError for a transient AuthRetryableFetchError (does NOT sign out)", () => {
    expect(() =>
      resolveGetUserResult(null, new AuthRetryableFetchError("network blip", 0)),
    ).toThrow(AuthUnavailableError);
  });

  it("throws AuthUnavailableError for any other auth error (5xx etc.) rather than signing out", () => {
    expect(() =>
      resolveGetUserResult(null, new AuthApiError("Internal Server Error", 500, undefined)),
    ).toThrow(AuthUnavailableError);
  });
});
