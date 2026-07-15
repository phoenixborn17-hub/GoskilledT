// Admin promo banner CRUD (Feature Batch v1.0 §2, Tier-A — blast radius is every learner's Home).
// Every mutation is audited (recordAdminAction). IMAGE/GIF banners upload real media
// (lib/storage/banner-media.ts); VIDEO banners reference a hosted Cloudflare Stream id/url (never
// a raw video upload) plus a required poster IMAGE, uploaded through the same image pipeline.
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";
import { safeBannerLink } from "../auth/post-auth";
import {
  validateBannerImage,
  uploadBannerMedia,
  bannerMediaPublicUrl,
} from "../storage/banner-media";
import type { BannerMediaType } from "../generated/prisma";

export interface BannerRow {
  id: string;
  mediaType: BannerMediaType;
  mediaUrl: string | null; // public URL, resolved from mediaKey — never the raw storage key
  posterUrl: string | null;
  streamId: string | null;
  headline: string | null;
  linkUrl: string | null;
  startAt: Date | null;
  endAt: Date | null;
  active: boolean;
  order: number;
  createdAt: Date;
}

function toRow(b: {
  id: string;
  mediaType: BannerMediaType;
  mediaKey: string | null;
  posterKey: string | null;
  streamId: string | null;
  headline: string | null;
  linkUrl: string | null;
  startAt: Date | null;
  endAt: Date | null;
  active: boolean;
  order: number;
  createdAt: Date;
}): BannerRow {
  return {
    id: b.id,
    mediaType: b.mediaType,
    mediaUrl: b.mediaKey ? bannerMediaPublicUrl(b.mediaKey) : null,
    posterUrl: b.posterKey ? bannerMediaPublicUrl(b.posterKey) : null,
    streamId: b.streamId,
    headline: b.headline,
    linkUrl: b.linkUrl,
    startAt: b.startAt,
    endAt: b.endAt,
    active: b.active,
    order: b.order,
    createdAt: b.createdAt,
  };
}

export async function listBanners(): Promise<BannerRow[]> {
  const rows = await prisma.promoBanner.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toRow);
}

/** Learner-facing: active banners whose window includes `now`, rotation-ordered. No admin fields leak. */
export async function listLiveBanners(now: Date = new Date()) {
  const rows = await prisma.promoBanner.findMany({
    where: {
      active: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: { order: "asc" },
  });
  return rows.map(toRow);
}

export type BannerResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

interface CommonFields {
  headline?: string;
  linkUrl?: string;
  startAt?: Date | null;
  endAt?: Date | null;
  order: number;
}

function validateCommon(input: CommonFields): string | null {
  const link = input.linkUrl ? safeBannerLink(input.linkUrl) : null;
  if (input.linkUrl && !link) return "Link must be an internal path (or an approved external URL).";
  if (input.startAt && input.endAt && input.startAt > input.endAt)
    return "Start date must be before end date.";
  return null;
}

export async function createImageBanner(
  actor: AdminIdentity,
  input: CommonFields & {
    bytes: Uint8Array;
    contentType: string;
    ext: string;
  },
): Promise<BannerResult> {
  const err = validateCommon(input);
  if (err) return { ok: false, error: err };

  const check = validateBannerImage({
    contentType: input.contentType,
    byteLength: input.bytes.byteLength,
    bytes: input.bytes,
  });
  if (!check.ok) return { ok: false, error: check.error };

  let mediaKey: string;
  try {
    mediaKey = await uploadBannerMedia({
      bytes: input.bytes,
      contentType: input.contentType,
      ext: input.ext,
      rand: cryptoRandom(),
    });
  } catch {
    return { ok: false, error: "Upload failed. Please try again." };
  }

  const mediaType: BannerMediaType =
    input.contentType === "image/gif" ? "GIF" : "IMAGE";
  const link = input.linkUrl ? safeBannerLink(input.linkUrl) : null;

  try {
    const id = await prisma.$transaction(async (tx) => {
      const b = await tx.promoBanner.create({
        data: {
          mediaType,
          mediaKey,
          headline: input.headline?.trim() || null,
          linkUrl: link,
          startAt: input.startAt ?? null,
          endAt: input.endAt ?? null,
          order: input.order,
          createdBy: actor.supabaseId,
        },
        select: { id: true },
      });
      await recordAdminAction(tx, {
        actor,
        action: "BANNER_CREATED",
        entity: "PromoBanner",
        entityId: b.id,
        meta: { mediaType },
      });
      return b.id;
    });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not create banner." };
  }
}

export async function createVideoBanner(
  actor: AdminIdentity,
  input: CommonFields & {
    streamId: string;
    posterBytes: Uint8Array;
    posterContentType: string;
    posterExt: string;
  },
): Promise<BannerResult> {
  const err = validateCommon(input);
  if (err) return { ok: false, error: err };
  if (!input.streamId.trim())
    return { ok: false, error: "A Cloudflare Stream id/url is required." };

  const check = validateBannerImage({
    contentType: input.posterContentType,
    byteLength: input.posterBytes.byteLength,
    bytes: input.posterBytes,
  });
  if (!check.ok) return { ok: false, error: `Poster: ${check.error}` };

  let posterKey: string;
  try {
    posterKey = await uploadBannerMedia({
      bytes: input.posterBytes,
      contentType: input.posterContentType,
      ext: input.posterExt,
      rand: cryptoRandom(),
    });
  } catch {
    return { ok: false, error: "Poster upload failed. Please try again." };
  }

  const link = input.linkUrl ? safeBannerLink(input.linkUrl) : null;

  try {
    const id = await prisma.$transaction(async (tx) => {
      const b = await tx.promoBanner.create({
        data: {
          mediaType: "VIDEO",
          streamId: input.streamId.trim(),
          posterKey,
          headline: input.headline?.trim() || null,
          linkUrl: link,
          startAt: input.startAt ?? null,
          endAt: input.endAt ?? null,
          order: input.order,
          createdBy: actor.supabaseId,
        },
        select: { id: true },
      });
      await recordAdminAction(tx, {
        actor,
        action: "BANNER_CREATED",
        entity: "PromoBanner",
        entityId: b.id,
        meta: { mediaType: "VIDEO" },
      });
      return b.id;
    });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not create banner." };
  }
}

export async function setBannerActive(
  actor: AdminIdentity,
  id: string,
  active: boolean,
): Promise<BannerResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.promoBanner.update({ where: { id }, data: { active } });
      await recordAdminAction(tx, {
        actor,
        action: "BANNER_UPDATED",
        entity: "PromoBanner",
        entityId: id,
        meta: { active },
      });
    });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not update banner." };
  }
}

export async function setBannerOrder(
  actor: AdminIdentity,
  id: string,
  order: number,
): Promise<BannerResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.promoBanner.update({ where: { id }, data: { order } });
      await recordAdminAction(tx, {
        actor,
        action: "BANNER_UPDATED",
        entity: "PromoBanner",
        entityId: id,
        meta: { order },
      });
    });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not update banner." };
  }
}

export async function deleteBanner(
  actor: AdminIdentity,
  id: string,
): Promise<BannerResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.promoBanner.delete({ where: { id } });
      await recordAdminAction(tx, {
        actor,
        action: "BANNER_DELETED",
        entity: "PromoBanner",
        entityId: id,
      });
    });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not delete banner." };
  }
}

function cryptoRandom(): string {
  // Node's global crypto (Web Crypto) — available in the Node runtime this module always runs in.
  return crypto.randomUUID().replace(/-/g, "");
}
