"use client";
// Promo banner carousel (Feature Batch v1.0 §2). Reduced-motion → no auto-rotate, first banner +
// manual dots only. VIDEO is click-to-play with a required poster, NEVER autoplay; a low-tier
// device renders the poster only (no Stream iframe, ever) — both perf guards from the spec.
import * as React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "../../lib/utils";
import { useDeviceTier } from "../system/device-tier-provider";
import type { BannerRow } from "../../lib/admin/banner";

export function PromoBannerCarousel({ banners }: { banners: BannerRow[] }) {
  const [index, setIndex] = React.useState(0);
  const [autoRotate, setAutoRotate] = React.useState(false);

  React.useEffect(() => {
    setAutoRotate(
      typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: no-preference)").matches,
    );
  }, []);

  React.useEffect(() => {
    if (!autoRotate || banners.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(id);
  }, [autoRotate, banners.length]);

  const banner = banners[index];

  return (
    <section aria-label="Announcements and offers" className="dc-enter">
      <BannerMedia banner={banner} />
      {banners.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label="Banner selection">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show banner ${i + 1} of ${banners.length}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-theme" : "w-1.5 bg-charcoal/15",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BannerMedia({ banner }: { banner: BannerRow }) {
  const tier = useDeviceTier();
  const [playing, setPlaying] = React.useState(false);

  const frame = "relative overflow-hidden rounded-gs-lg border border-line bg-surface-sunken";

  if (banner.mediaType === "VIDEO") {
    // Low-tier device: poster only, no Stream iframe, ever (perf guard). Click-to-play elsewhere,
    // never autoplay — the iframe is only mounted after an explicit tap.
    const canPlay = tier !== "low";
    return (
      <div className={cn(frame, "aspect-video w-full")}>
        {playing && canPlay ? (
          <iframe
            src={streamEmbedUrl(banner.streamId ?? "")}
            className="h-full w-full"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
            title={banner.headline ?? "Promo video"}
          />
        ) : (
          <button
            type="button"
            onClick={() => canPlay && setPlaying(true)}
            aria-label={canPlay ? "Play video" : banner.headline ?? "Promo video"}
            className="group relative block h-full w-full"
            disabled={!canPlay}
          >
            {banner.posterUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
              <img
                src={banner.posterUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
            {canPlay && (
              <span className="absolute inset-0 flex items-center justify-center bg-charcoal/20 transition-colors group-hover:bg-charcoal/30">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised/90 shadow-gs-lg">
                  <Play className="h-6 w-6 translate-x-0.5 text-ink" aria-hidden fill="currentColor" />
                </span>
              </span>
            )}
            {banner.headline && (
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/70 to-transparent p-3 text-left text-small font-semibold text-white">
                {banner.headline}
              </span>
            )}
          </button>
        )}
      </div>
    );
  }

  // IMAGE / GIF
  const media = (
    <div className={cn(frame, "aspect-[21/9] w-full sm:aspect-[3/1]")}>
      {banner.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
        <img
          src={banner.mediaUrl}
          alt={banner.headline ?? ""}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
      {banner.headline && (
        <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/70 to-transparent p-3 text-small font-semibold text-white">
          {banner.headline}
        </span>
      )}
    </div>
  );

  if (banner.linkUrl) {
    const isInternal = banner.linkUrl.startsWith("/");
    return isInternal ? (
      <Link href={banner.linkUrl} className="block">
        {media}
      </Link>
    ) : (
      <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
        {media}
      </a>
    );
  }
  return media;
}

/** Cloudflare Stream's customer-code-independent embed domain — works with just the video id. */
function streamEmbedUrl(streamId: string): string {
  if (streamId.startsWith("http")) return streamId; // admin already pasted a full embeddable URL
  return `https://iframe.videodelivery.net/${encodeURIComponent(streamId)}`;
}
