// Shared font loader for next/og canvases (Phase 6 · lib/og/**). The OG images render server-side
// with Satori; loading the brand display font (Sora) keeps every share card on-brand. Every fetch
// is best-effort: on ANY failure this returns null so the ImageResponse still renders with the
// default sans-serif — an OG image must NEVER break the build or the request.
//
// Google Fonts serves a woff2 whose URL is embedded in the css2 stylesheet; we resolve it once per
// weight. Callers pass the weights they need and filter out the nulls.

export interface OgFont {
  name: "Sora";
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
  style: "normal";
}

/** Fetch a single Sora weight as a font buffer, or null on any failure (never throws). */
export async function loadSora(weight: 400 | 700 | 800): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Sora:wght@${weight}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+)\) format/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Load the requested Sora weights and return only the ones that succeeded, in `ImageResponse`'s
 * `fonts` shape. An empty array is a valid result (canvas falls back to sans-serif). Use the
 * returned array's `.length` to pick `fontFamily` ("Sora" vs "sans-serif").
 */
export async function loadSoraFonts(
  weights: (400 | 700 | 800)[],
): Promise<OgFont[]> {
  const buffers = await Promise.all(weights.map((w) => loadSora(w)));
  return weights
    .map((weight, i) =>
      buffers[i]
        ? ({ name: "Sora", data: buffers[i]!, weight, style: "normal" } as const)
        : null,
    )
    .filter((f): f is OgFont => f !== null);
}
