// Feature Batch v1.0 §2 — banner upload validation (pure). No Supabase needed (same split as
// tests/kyc-storage.test.ts: pure parts unit-tested, the upload wrapper needs real creds).
import { describe, it, expect } from "vitest";
import {
  validateBannerImage,
  isAllowedBannerContentType,
  bannerMediaPath,
  MAX_BANNER_BYTES,
  MAX_BANNER_GIF_BYTES,
  MIN_BANNER_WIDTH,
} from "@/lib/storage/banner-media";

function pngBytes(width: number, height: number): Uint8Array {
  const b = new Uint8Array(24);
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].forEach((v, i) => (b[i] = v));
  const dv = new DataView(b.buffer);
  dv.setUint32(16, width, false);
  dv.setUint32(20, height, false);
  return b;
}

describe("isAllowedBannerContentType", () => {
  it("permits png/jpeg/webp/gif, rejects other types", () => {
    expect(isAllowedBannerContentType("image/png")).toBe(true);
    expect(isAllowedBannerContentType("image/gif")).toBe(true);
    expect(isAllowedBannerContentType("video/mp4")).toBe(false);
    expect(isAllowedBannerContentType("application/pdf")).toBe(false);
  });
});

describe("bannerMediaPath", () => {
  it("sanitizes the extension and builds a flat path", () => {
    expect(bannerMediaPath("PNG", "abcd1234")).toBe("abcd1234.png");
    expect(bannerMediaPath("../evil", "r")).toBe("r.evil");
  });
});

describe("validateBannerImage", () => {
  it("accepts a well-formed PNG within size + dimension bounds", () => {
    const bytes = pngBytes(1200, 630);
    const res = validateBannerImage({
      contentType: "image/png",
      byteLength: bytes.byteLength,
      bytes,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.width).toBe(1200);
      expect(res.height).toBe(630);
    }
  });

  it("rejects a disallowed content type", () => {
    const res = validateBannerImage({
      contentType: "video/mp4",
      byteLength: 100,
      bytes: new Uint8Array(100),
    });
    expect(res.ok).toBe(false);
  });

  it("rejects an oversized still image (using the GIF cap would wrongly pass)", () => {
    const bytes = pngBytes(1200, 630);
    const res = validateBannerImage({
      contentType: "image/png",
      byteLength: MAX_BANNER_BYTES + 1,
      bytes,
    });
    expect(res.ok).toBe(false);
  });

  it("gives GIFs a larger byte cap than still images", () => {
    const bytes = pngBytes(1200, 630); // header format doesn't matter for the size check itself
    const overStillCapUnderGifCap = MAX_BANNER_BYTES + 1;
    expect(overStillCapUnderGifCap).toBeLessThan(MAX_BANNER_GIF_BYTES);
    const res = validateBannerImage({
      contentType: "image/gif",
      byteLength: overStillCapUnderGifCap,
      bytes,
    });
    expect(res.ok).toBe(true);
  });

  it("rejects an image narrower than the mobile-first floor", () => {
    const bytes = pngBytes(MIN_BANNER_WIDTH - 1, 200);
    const res = validateBannerImage({
      contentType: "image/png",
      byteLength: bytes.byteLength,
      bytes,
    });
    expect(res.ok).toBe(false);
  });

  it("rejects bytes with no recognisable image header", () => {
    const res = validateBannerImage({
      contentType: "image/png",
      byteLength: 10,
      bytes: new Uint8Array(10),
    });
    expect(res.ok).toBe(false);
  });
});
