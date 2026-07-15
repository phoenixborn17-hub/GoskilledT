// Feature Batch v1.0 §2 — banner upload dimension sniffing. Hand-crafted minimal, valid headers
// for each accepted format (no real image files needed — only the header bytes matter).
import { describe, it, expect } from "vitest";
import { detectImageDimensions } from "@/lib/storage/image-dimensions";

function pngBytes(width: number, height: number): Uint8Array {
  const b = new Uint8Array(24);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  sig.forEach((v, i) => (b[i] = v));
  // chunk length (unused by our reader) + "IHDR"
  b.set([0, 0, 0, 13], 8);
  b.set([0x49, 0x48, 0x44, 0x52], 12);
  const dv = new DataView(b.buffer);
  dv.setUint32(16, width, false);
  dv.setUint32(20, height, false);
  return b;
}

function gifBytes(width: number, height: number): Uint8Array {
  const b = new Uint8Array(10);
  "GIF89a".split("").forEach((c, i) => (b[i] = c.charCodeAt(0)));
  const dv = new DataView(b.buffer);
  dv.setUint16(6, width, true);
  dv.setUint16(8, height, true);
  return b;
}

function jpegBytes(width: number, height: number): Uint8Array {
  // SOI, APP0 (16-byte segment, content irrelevant), SOF0 with height/width.
  const b = new Uint8Array(2 + 2 + 2 + 14 + 2 + 2 + 15);
  let o = 0;
  b[o++] = 0xff;
  b[o++] = 0xd8; // SOI
  b[o++] = 0xff;
  b[o++] = 0xe0; // APP0
  const dv = new DataView(b.buffer);
  dv.setUint16(o, 16, false); // segment length incl. itself
  o += 2 + 14; // skip the 14-byte APP0 payload (zeros)
  b[o++] = 0xff;
  b[o++] = 0xc0; // SOF0
  dv.setUint16(o, 17, false);
  o += 2;
  b[o++] = 8; // precision
  dv.setUint16(o, height, false);
  o += 2;
  dv.setUint16(o, width, false);
  return b;
}

function webpVp8xBytes(width: number, height: number): Uint8Array {
  const b = new Uint8Array(30);
  "RIFF".split("").forEach((c, i) => (b[i] = c.charCodeAt(0)));
  "WEBP".split("").forEach((c, i) => (b[8 + i] = c.charCodeAt(0)));
  "VP8X".split("").forEach((c, i) => (b[12 + i] = c.charCodeAt(0)));
  const w = width - 1;
  const h = height - 1;
  b[24] = w & 0xff;
  b[25] = (w >> 8) & 0xff;
  b[26] = (w >> 16) & 0xff;
  b[27] = h & 0xff;
  b[28] = (h >> 8) & 0xff;
  b[29] = (h >> 16) & 0xff;
  return b;
}

describe("detectImageDimensions", () => {
  it("reads PNG dimensions from the IHDR chunk", () => {
    expect(detectImageDimensions(pngBytes(1200, 630))).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it("reads GIF dimensions from the logical screen descriptor", () => {
    expect(detectImageDimensions(gifBytes(800, 400))).toEqual({
      width: 800,
      height: 400,
    });
  });

  it("reads JPEG dimensions by walking to the SOF0 marker", () => {
    expect(detectImageDimensions(jpegBytes(1600, 900))).toEqual({
      width: 1600,
      height: 900,
    });
  });

  it("reads WebP (VP8X extended) canvas dimensions", () => {
    expect(detectImageDimensions(webpVp8xBytes(1080, 1080))).toEqual({
      width: 1080,
      height: 1080,
    });
  });

  it("returns null for unrecognised/malformed bytes — never a fabricated size", () => {
    expect(detectImageDimensions(new Uint8Array([1, 2, 3, 4]))).toBeNull();
    expect(detectImageDimensions(new Uint8Array(0))).toBeNull();
  });
});
