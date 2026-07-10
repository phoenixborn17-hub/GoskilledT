import * as React from "react";
import { cn } from "../../lib/utils";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-8 w-8 text-caption",
  md: "h-10 w-10 text-small",
  lg: "h-12 w-12 text-body",
};

export interface AvatarProps {
  /** Display name — used for the initials fallback + alt text. */
  name: string;
  src?: string | null;
  size?: Size;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar with a graceful initials fallback on a brand tint — no broken-image icon, no generic
 * placeholder. Uses a plain <img> (avatars are tiny + often remote/signed) with lazy loading.
 */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const showImg = src && !failed;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-theme/10 font-semibold text-theme-strong",
        sizes[size],
        className,
      )}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny, often signed/remote avatar
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
