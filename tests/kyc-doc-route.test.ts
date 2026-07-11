// Phase C §3 — KYC document routes enforce access server-side (the "unauthorized fetch → 403/401"
// acceptance). Auth is mocked; a rejected requester is refused BEFORE any storage/DB access.
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  getAdminUser: vi.fn(),
  getCurrentUser: vi.fn(),
  resolveKycDocPath: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ getAdminUser: h.getAdminUser }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: h.getCurrentUser }));
vi.mock("@/lib/kyc/doc-access", () => ({
  resolveKycDocPath: h.resolveKycDocPath,
}));
// The routes now throttle (Unit 3) via clientIp()→headers(), which has no request context in a unit
// test. Mock the throttle to allow — the auth/404 logic under test runs after it.
vi.mock("@/lib/auth/action-rate-limit", () => ({
  checkActionRate: vi.fn(async () => ({ ok: true })),
}));
// FV-1: the owner doc route re-asserts earn visibility (now fail-closed by default). Mock the launch
// GLOBAL SHOW state so the self-only/404 access logic under test runs, not the feature gate.
vi.mock("@/lib/feature-visibility/context", () => ({
  isFeatureVisible: vi.fn().mockResolvedValue(true),
}));

import { GET as adminDoc } from "@/app/admin/kyc/[userId]/doc/[kind]/route";
import { GET as ownerDoc } from "@/app/dashboard/earn/kyc/doc/[kind]/route";

const req = new Request("http://localhost/x");

beforeEach(() => {
  vi.clearAllMocks();
  h.resolveKycDocPath.mockResolvedValue(null);
});

describe("admin KYC doc route", () => {
  it("non-admin → 403, no data read", async () => {
    h.getAdminUser.mockResolvedValue(null);
    const res = await adminDoc(req, {
      params: Promise.resolve({ userId: "u1", kind: "pan" }),
    });
    expect(res.status).toBe(403);
    expect(h.resolveKycDocPath).not.toHaveBeenCalled();
  });

  it("admin + invalid kind → 404", async () => {
    h.getAdminUser.mockResolvedValue({ supabaseId: "a", email: "a@x.com" });
    const res = await adminDoc(req, {
      params: Promise.resolve({ userId: "u1", kind: "selfie" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("owner KYC doc route (self only)", () => {
  it("unauthenticated → 401, no data read", async () => {
    h.getCurrentUser.mockResolvedValue(null);
    const res = await ownerDoc(req, {
      params: Promise.resolve({ kind: "pan" }),
    });
    expect(res.status).toBe(401);
    expect(h.resolveKycDocPath).not.toHaveBeenCalled();
  });

  it("authenticated + missing doc → 404 (only ever serves the caller's own file)", async () => {
    h.getCurrentUser.mockResolvedValue({ id: "u1" });
    const res = await ownerDoc(req, {
      params: Promise.resolve({ kind: "pan" }),
    });
    expect(res.status).toBe(404);
    expect(h.resolveKycDocPath).toHaveBeenCalledWith("u1", "pan");
  });
});
