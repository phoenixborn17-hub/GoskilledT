"use client";
// Admin promo banner manager (Feature Batch v1.0 §2, Tier-A). IMAGE/GIF = real file upload;
// VIDEO = a Cloudflare Stream id/url (pasted, never uploaded here) + a required poster image.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createImageBannerAction,
  createVideoBannerAction,
  setBannerActiveAction,
  setBannerOrderAction,
  deleteBannerAction,
} from "../../app/admin/banner/actions";
import type { BannerRow } from "../../lib/admin/banner";

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(d),
  );
}

export function CreateBannerForm() {
  const router = useRouter();
  const [kind, setKind] = useState<"image" | "video">("image");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res =
      kind === "image"
        ? await createImageBannerAction(fd)
        : await createVideoBannerAction(fd);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="flex gap-2 sm:col-span-2">
        {(["image", "video"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={
              "rounded-lg border px-3 py-1.5 text-sm font-semibold " +
              (kind === k
                ? "border-charcoal bg-charcoal text-white"
                : "border-line text-ink hover:bg-charcoal/5")
            }
          >
            {k === "image" ? "Image / GIF" : "Video (Cloudflare Stream)"}
          </button>
        ))}
      </div>

      {kind === "image" ? (
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-ink">
            Image or GIF file
          </span>
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            required
            className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal/5 file:px-3 file:py-2 file:text-sm file:font-semibold"
          />
        </label>
      ) : (
        <>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-ink">
              Cloudflare Stream id or URL
            </span>
            <input
              name="streamId"
              required
              placeholder="e.g. a1b2c3d4e5f6..."
              className="h-10 w-full rounded-lg border border-line px-3"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-ink">
              Poster image (required — shown until tapped to play; never autoplays)
            </span>
            <input
              type="file"
              name="poster"
              accept="image/png,image/jpeg,image/webp"
              required
              className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal/5 file:px-3 file:py-2 file:text-sm file:font-semibold"
            />
          </label>
        </>
      )}

      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">
          Headline (optional)
        </span>
        <input
          name="headline"
          maxLength={120}
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">
          Link (optional — internal path e.g. /packages)
        </span>
        <input
          name="linkUrl"
          maxLength={2048}
          placeholder="/packages"
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">
          Start date (optional)
        </span>
        <input
          type="date"
          name="startAt"
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">
          End date (optional)
        </span>
        <input
          type="date"
          name="endAt"
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">
          Rotation order
        </span>
        <input
          type="number"
          name="order"
          defaultValue={0}
          min={0}
          max={9999}
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-charcoal px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Uploading…" : "Create banner"}
        </button>
      </div>
    </form>
  );
}

export function BannerRowActions({ banner }: { banner: BannerRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(String(banner.order));

  async function toggleActive() {
    setBusy(true);
    await setBannerActiveAction(banner.id, !banner.active);
    setBusy(false);
    router.refresh();
  }

  async function saveOrder() {
    const n = Number(order);
    if (!Number.isInteger(n) || n < 0) return;
    setBusy(true);
    await setBannerOrderAction(banner.id, n);
    setBusy(false);
    router.refresh();
  }

  async function onDelete() {
    if (!window.confirm("Delete this banner? This cannot be undone.")) return;
    setBusy(true);
    await deleteBannerAction(banner.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        onBlur={saveOrder}
        min={0}
        max={9999}
        className="h-8 w-16 rounded-lg border border-line px-2 text-xs"
        aria-label="Rotation order"
      />
      <button
        onClick={toggleActive}
        disabled={busy}
        className="rounded-lg border border-line px-3 py-1 text-xs font-semibold text-ink hover:bg-charcoal/5 disabled:opacity-40"
      >
        {banner.active ? "Deactivate" : "Activate"}
      </button>
      <button
        onClick={onDelete}
        disabled={busy}
        className="rounded-lg border border-danger/30 px-3 py-1 text-xs font-semibold text-danger hover:bg-danger/10 disabled:opacity-40"
      >
        Delete
      </button>
    </div>
  );
}

export function BannerList({ banners }: { banners: BannerRow[] }) {
  if (banners.length === 0) {
    return <p className="text-sm text-muted">No banners yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="py-2 pr-3 font-medium">Preview</th>
            <th className="py-2 pr-3 font-medium">Type</th>
            <th className="py-2 pr-3 font-medium">Headline</th>
            <th className="py-2 pr-3 font-medium">Window</th>
            <th className="py-2 pr-3 font-medium">Active</th>
            <th className="py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {banners.map((b) => (
            <tr key={b.id}>
              <td className="py-2 pr-3">
                {/* Admin thumbnail only — a tiny fixed-size preview, not the learner-facing render. */}
                <img
                  src={b.mediaType === "VIDEO" ? (b.posterUrl ?? "") : (b.mediaUrl ?? "")}
                  alt=""
                  className="h-10 w-16 rounded object-cover"
                  loading="lazy"
                />
              </td>
              <td className="py-2 pr-3 text-muted">{b.mediaType}</td>
              <td className="py-2 pr-3 text-ink">{b.headline || "—"}</td>
              <td className="py-2 pr-3 text-muted">
                {fmtDate(b.startAt)} – {fmtDate(b.endAt)}
              </td>
              <td className="py-2 pr-3 text-muted">
                {b.active ? "Yes" : "No"}
              </td>
              <td className="py-2">
                <BannerRowActions banner={b} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
