// /admin/banner server actions (Feature Batch v1.0 §2, Tier-A). RBAC re-checked; every mutation
// audited in the adapter (lib/admin/banner.ts). File uploads arrive as FormData (mirrors the KYC
// doc-upload pattern in app/dashboard/earn/actions.ts) — the client never sends raw bytes as JSON.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "../../../lib/auth/admin";
import {
  createImageBanner,
  createVideoBanner,
  setBannerActive,
  setBannerOrder,
  deleteBanner,
  type BannerResult,
} from "../../../lib/admin/banner";

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1) : "";
}

const commonSchema = z.object({
  headline: z.string().trim().max(120).optional(),
  linkUrl: z.string().trim().max(2048).optional(),
  startAt: z.string().trim().optional(),
  endAt: z.string().trim().optional(),
  order: z.coerce.number().int().min(0).max(9999),
});

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function createImageBannerAction(
  formData: FormData,
): Promise<BannerResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const parsed = commonSchema.safeParse({
    headline: formData.get("headline") ?? undefined,
    linkUrl: formData.get("linkUrl") ?? undefined,
    startAt: formData.get("startAt") ?? undefined,
    endAt: formData.get("endAt") ?? undefined,
    order: formData.get("order") ?? 0,
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "An image or GIF file is required." };

  const res = await createImageBanner(admin, {
    headline: parsed.data.headline,
    linkUrl: parsed.data.linkUrl,
    startAt: parseDate(parsed.data.startAt),
    endAt: parseDate(parsed.data.endAt),
    order: parsed.data.order,
    bytes: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
    ext: fileExt(file.name),
  });
  if (res.ok) {
    revalidatePath("/admin/banner");
    revalidatePath("/dashboard/home");
  }
  return res;
}

export async function createVideoBannerAction(
  formData: FormData,
): Promise<BannerResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const parsed = commonSchema
    .extend({ streamId: z.string().trim().min(1, "Stream id/url is required").max(500) })
    .safeParse({
      headline: formData.get("headline") ?? undefined,
      linkUrl: formData.get("linkUrl") ?? undefined,
      startAt: formData.get("startAt") ?? undefined,
      endAt: formData.get("endAt") ?? undefined,
      order: formData.get("order") ?? 0,
      streamId: formData.get("streamId") ?? "",
    });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const poster = formData.get("poster");
  if (!(poster instanceof File) || poster.size === 0)
    return { ok: false, error: "A poster image is required for video banners." };

  const res = await createVideoBanner(admin, {
    headline: parsed.data.headline,
    linkUrl: parsed.data.linkUrl,
    startAt: parseDate(parsed.data.startAt),
    endAt: parseDate(parsed.data.endAt),
    order: parsed.data.order,
    streamId: parsed.data.streamId,
    posterBytes: new Uint8Array(await poster.arrayBuffer()),
    posterContentType: poster.type,
    posterExt: fileExt(poster.name),
  });
  if (res.ok) {
    revalidatePath("/admin/banner");
    revalidatePath("/dashboard/home");
  }
  return res;
}

const idSchema = z.string().trim().min(1).max(64);

export async function setBannerActiveAction(
  id: string,
  active: boolean,
): Promise<BannerResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid input" };
  const res = await setBannerActive(admin, parsedId.data, active);
  if (res.ok) {
    revalidatePath("/admin/banner");
    revalidatePath("/dashboard/home");
  }
  return res;
}

export async function setBannerOrderAction(
  id: string,
  order: number,
): Promise<BannerResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsed = z
    .object({ id: idSchema, order: z.coerce.number().int().min(0).max(9999) })
    .safeParse({ id, order });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const res = await setBannerOrder(admin, parsed.data.id, parsed.data.order);
  if (res.ok) {
    revalidatePath("/admin/banner");
    revalidatePath("/dashboard/home");
  }
  return res;
}

export async function deleteBannerAction(id: string): Promise<BannerResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid input" };
  const res = await deleteBanner(admin, parsedId.data);
  if (res.ok) {
    revalidatePath("/admin/banner");
    revalidatePath("/dashboard/home");
  }
  return res;
}
