// Admin promo banner media storage (Feature Batch v1.0 §2). IMAGE/GIF only — VIDEO is a hosted
// Cloudflare Stream id/url, never a raw upload (see lib/admin/banner.ts). PUBLIC bucket (unlike
// kyc-docs.ts's private one): banner media is meant to be visible to every learner on Home, there
// is no PII here. Mirrors lib/storage/kyc-docs.ts's shape (pure parts testable; the impure upload
// wrapper needs real Supabase Storage credentials, untestable in this environment — same split as
// kyc-storage.test.ts).
import { createSupabaseAdminClient } from "../supabase/admin";
import { supabaseUrl } from "../supabase/config";
import { detectImageDimensions } from "./image-dimensions";

export const BANNER_BUCKET = "promo-banners"; // PUBLIC — created with public:true

const ALLOWED_CONTENT = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
export function isAllowedBannerContentType(ct: string): boolean {
  return ALLOWED_CONTENT.has(ct);
}

// Perf defaults (DESIGN_DIRECTION budget-Android <2s) — deliberately conservative engineering
// defaults, not a founder/business decision; adjust freely if the real usage pattern needs it.
export const MAX_BANNER_BYTES = 3 * 1024 * 1024; // 3 MB (still-image cap)
export const MAX_BANNER_GIF_BYTES = 5 * 1024 * 1024; // 5 MB (GIFs run larger for the same visual)
export const MIN_BANNER_WIDTH = 320; // DESIGN_DIRECTION mobile-first floor
export const MAX_BANNER_DIMENSION = 4000; // guards against a decompression-bomb-shaped upload

export interface BannerValidationError {
  ok: false;
  error: string;
}
export interface BannerValidationOk {
  ok: true;
  width: number;
  height: number;
}

/** PURE: content-type, byte-size, and pixel-dimension checks. Never trusts the client's claimed type. */
export function validateBannerImage(input: {
  contentType: string;
  byteLength: number;
  bytes: Uint8Array;
}): BannerValidationOk | BannerValidationError {
  if (!isAllowedBannerContentType(input.contentType)) {
    return { ok: false, error: "Image must be PNG, JPEG, WebP, or GIF." };
  }
  const cap =
    input.contentType === "image/gif" ? MAX_BANNER_GIF_BYTES : MAX_BANNER_BYTES;
  if (input.byteLength > cap) {
    return {
      ok: false,
      error: `File is too large (max ${Math.round(cap / 1024 / 1024)} MB).`,
    };
  }
  const dims = detectImageDimensions(input.bytes);
  if (!dims) return { ok: false, error: "Could not read image dimensions." };
  if (dims.width < MIN_BANNER_WIDTH) {
    return { ok: false, error: `Image must be at least ${MIN_BANNER_WIDTH}px wide.` };
  }
  if (dims.width > MAX_BANNER_DIMENSION || dims.height > MAX_BANNER_DIMENSION) {
    return { ok: false, error: "Image dimensions are too large." };
  }
  return { ok: true, width: dims.width, height: dims.height };
}

/** Object path inside the bucket. `rand` is injected so the pure shape is testable. */
export function bannerMediaPath(ext: string, rand: string): string {
  const safeExt =
    ext
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase()
      .slice(0, 5) || "bin";
  return `${rand}.${safeExt}`;
}

/** Create the public bucket if missing. Idempotent; safe to call before each upload. */
export async function ensureBannerBucket(): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.storage.getBucket(BANNER_BUCKET);
  if (data) return;
  const { error } = await admin.storage.createBucket(BANNER_BUCKET, {
    public: true,
  });
  if (error && !/exist/i.test(error.message))
    throw new Error(`Banner bucket: ${error.message}`);
}

/** Upload validated banner media to the public bucket. Returns the object path (stored as mediaKey). */
export async function uploadBannerMedia(input: {
  bytes: ArrayBuffer | Uint8Array;
  contentType: string;
  ext: string;
  rand: string;
}): Promise<string> {
  await ensureBannerBucket();
  const admin = createSupabaseAdminClient();
  const path = bannerMediaPath(input.ext, input.rand);
  const { error } = await admin.storage
    .from(BANNER_BUCKET)
    .upload(path, input.bytes, {
      contentType: input.contentType,
      upsert: true,
    });
  if (error) throw new Error(`Banner upload failed: ${error.message}`);
  return path;
}

/**
 * Public URL for a banner media object. Built as a plain string (Supabase Storage's public-object
 * URL shape is deterministic) rather than via the admin client — public-bucket URLs need no
 * authorization to construct or resolve, so this has no SUPABASE_SERVICE_ROLE_KEY dependency,
 * unlike the actual upload/bucket-management calls above.
 */
export function bannerMediaPublicUrl(path: string): string {
  return `${supabaseUrl()}/storage/v1/object/public/${BANNER_BUCKET}/${path}`;
}
