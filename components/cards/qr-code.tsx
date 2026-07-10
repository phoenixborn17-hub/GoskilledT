import * as React from "react";
import { QrCode as QrIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface QRCodeProps {
  /** The real referral/verify URL the QR will encode. */
  value: string;
  size?: number;
  className?: string;
  /**
   * A pre-computed module matrix (true = dark module). When provided, a real, scannable QR is
   * drawn as inline SVG. Matrix GENERATION (URL → matrix) is wired in Phase 2 with the Share
   * surface — a dependency-free encoder is a tracked Phase-2 item, NOT faked here (D-29): with no
   * matrix this renders an honest "QR ready" affordance, never a decorative fake code.
   */
  matrix?: boolean[][];
}

/**
 * QR renderer. Draws a genuine QR from a `matrix` (SVG modules, crisp at any size, offline-safe,
 * no third-party image service → no referral-code leak). Until the encoder lands (Phase 2), shows
 * an honest placeholder that never pretends to be scannable.
 */
export function QRCode({ value, size = 160, matrix, className }: QRCodeProps) {
  if (matrix && matrix.length > 0) {
    const n = matrix.length;
    const cell = size / n;
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`QR code for ${value}`}
        className={cn("rounded bg-white", className)}
        shapeRendering="crispEdges"
      >
        {matrix.flatMap((row, r) =>
          row.map((on, c) =>
            on ? (
              <rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell}
                height={cell}
                className="fill-charcoal"
              />
            ) : null,
          ),
        )}
      </svg>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-gs border border-dashed border-line bg-surface-sunken text-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <QrIcon className="h-8 w-8 text-ink-muted" aria-hidden />
      <span className="px-3 text-caption text-ink-muted">
        Scan-to-join QR — enabled with the Share surface
      </span>
    </div>
  );
}
