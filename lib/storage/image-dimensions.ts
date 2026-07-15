// Minimal, dependency-free image-dimension sniffer (Feature Batch v1.0 §2 — banner upload
// validation). Reads only the format header, never decodes pixel data. Deliberately hand-rolled
// instead of adding a new npm dependency for a narrow, well-defined need (PNG/GIF/JPEG/WebP only —
// the exact set the banner upload accepts). Returns null for anything unrecognised/malformed —
// callers must treat null as "reject the upload", never a fabricated size.
export interface ImageDimensions {
  width: number;
  height: number;
}

function readU16BE(b: Uint8Array, o: number): number {
  return (b[o] << 8) | b[o + 1];
}
function readU32BE(b: Uint8Array, o: number): number {
  return (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3];
}
function readU16LE(b: Uint8Array, o: number): number {
  return b[o] | (b[o + 1] << 8);
}

function detectPng(b: Uint8Array): ImageDimensions | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length < 24 || !sig.every((v, i) => b[i] === v)) return null;
  // IHDR is always the first chunk, immediately after the 8-byte signature.
  return { width: readU32BE(b, 16), height: readU32BE(b, 20) };
}

function detectGif(b: Uint8Array): ImageDimensions | null {
  if (b.length < 10) return null;
  const header = String.fromCharCode(...b.slice(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  return { width: readU16LE(b, 6), height: readU16LE(b, 8) };
}

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function detectJpeg(b: Uint8Array): ImageDimensions | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= b.length) {
    if (b[offset] !== 0xff) return null; // not a valid marker — malformed/truncated
    const marker = b[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2; // SOI/EOI — no length field
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      offset += 2; // RSTn — no length field
      continue;
    }
    const segmentLength = readU16BE(b, offset + 2);
    if (SOF_MARKERS.has(marker)) {
      if (offset + 9 > b.length) return null;
      return {
        height: readU16BE(b, offset + 5),
        width: readU16BE(b, offset + 7),
      };
    }
    offset += 2 + segmentLength;
  }
  return null;
}

function detectWebp(b: Uint8Array): ImageDimensions | null {
  if (b.length < 30) return null;
  const riff = String.fromCharCode(...b.slice(0, 4));
  const webp = String.fromCharCode(...b.slice(8, 12));
  if (riff !== "RIFF" || webp !== "WEBP") return null;
  const fourCC = String.fromCharCode(...b.slice(12, 16));

  if (fourCC === "VP8X") {
    // 24-bit little-endian canvas width-1 / height-1 at fixed offsets.
    const w = (b[24] | (b[25] << 8) | (b[26] << 16)) + 1;
    const h = (b[27] | (b[28] << 8) | (b[29] << 16)) + 1;
    return { width: w, height: h };
  }
  if (fourCC === "VP8 " && b.length >= 30) {
    // Lossy: 3-byte frame tag + 3-byte sync code (0x9d 0x01 0x2a) precede width/height.
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    const width = readU16LE(b, 26) & 0x3fff;
    const height = readU16LE(b, 28) & 0x3fff;
    return { width, height };
  }
  if (fourCC === "VP8L" && b.length >= 25) {
    if (b[20] !== 0x2f) return null; // lossless signature byte
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }
  return null;
}

/** Sniff pixel dimensions from PNG/GIF/JPEG/WebP bytes. Never decodes pixels; format-header only. */
export function detectImageDimensions(bytes: Uint8Array): ImageDimensions | null {
  return (
    detectPng(bytes) ?? detectGif(bytes) ?? detectJpeg(bytes) ?? detectWebp(bytes)
  );
}
