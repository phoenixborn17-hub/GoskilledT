// Phase C §3 — KYC document storage pure helpers (no Supabase). The access rule is the security
// invariant behind the private bucket + the 403 routes.
import { describe, it, expect } from "vitest";
import {
  isKycDocKind,
  kycDocPath,
  canAccessKycDoc,
  isAllowedDocContentType,
  KYC_DOC_COLUMN,
  KYC_DOC_KINDS,
} from "@/lib/storage/kyc-docs";

describe("doc kinds + path", () => {
  it("recognises the three kinds only", () => {
    expect(KYC_DOC_KINDS).toEqual(["address", "pan", "bank"]);
    expect(isKycDocKind("pan")).toBe(true);
    expect(isKycDocKind("selfie")).toBe(false);
  });
  it("path is namespaced by user + kind and sanitizes the extension", () => {
    expect(kycDocPath("user1", "pan", "PDF", "abcd")).toBe(
      "user1/pan/abcd.pdf",
    );
    expect(kycDocPath("user1", "address", "../evil", "r")).toBe(
      "user1/address/r.evil",
    );
  });
  it("maps each kind to its encrypted column", () => {
    expect(KYC_DOC_COLUMN).toEqual({
      address: "addressDocEnc",
      pan: "panDocEnc",
      bank: "bankDocEnc",
    });
  });
});

describe("canAccessKycDoc (the 403 rule)", () => {
  it("owner may access their own doc", () => {
    expect(
      canAccessKycDoc({ requesterId: "u1", ownerId: "u1", isAdmin: false }),
    ).toBe(true);
  });
  it("a different user may NOT access it", () => {
    expect(
      canAccessKycDoc({ requesterId: "u2", ownerId: "u1", isAdmin: false }),
    ).toBe(false);
  });
  it("an unauthenticated requester may NOT access it", () => {
    expect(
      canAccessKycDoc({ requesterId: null, ownerId: "u1", isAdmin: false }),
    ).toBe(false);
  });
  it("an admin may access any doc", () => {
    expect(
      canAccessKycDoc({ requesterId: "admin", ownerId: "u1", isAdmin: true }),
    ).toBe(true);
  });
});

describe("content-type allow-list", () => {
  it("permits images + PDF, rejects others", () => {
    expect(isAllowedDocContentType("image/png")).toBe(true);
    expect(isAllowedDocContentType("application/pdf")).toBe(true);
    expect(isAllowedDocContentType("text/html")).toBe(false);
    expect(isAllowedDocContentType("application/octet-stream")).toBe(false);
  });
});
