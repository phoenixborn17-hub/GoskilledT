// Video provider adapter (Ticket 4). Mock and Cloudflare Stream expose the SAME interface,
// so switching = flip VIDEO_PROVIDER + add credentials. No business logic changes. Mock is
// prod-forbidden via the shared production guard.
import { assertProductionProviderSafety, videoProviderName, type VideoProviderName } from "../config/providers";
import { requireEnv } from "../env";

export interface PlaybackSource {
  url: string;
  type: "mp4" | "hls";
  poster?: string;
}

export interface VideoProvider {
  readonly name: VideoProviderName;
  /** Resolve a Lesson.videoAssetId to a playable source (Stream URLs are signed & short-lived). */
  getPlayback(videoAssetId: string): PlaybackSource;
}

// A couple of stable, publicly-playable MP4 samples so the whole LMS flow is testable in mock
// mode. Chosen deterministically by asset id so different lessons show different clips.
const MOCK_SAMPLES: PlaybackSource[] = [
  { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", type: "mp4" },
  { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", type: "mp4" },
  { url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", type: "mp4" },
];

function hashIndex(assetId: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < assetId.length; i++) h = (h * 31 + assetId.charCodeAt(i)) >>> 0;
  return h % mod;
}

export const mockVideoProvider: VideoProvider = {
  name: "mock",
  getPlayback(videoAssetId: string): PlaybackSource {
    return MOCK_SAMPLES[hashIndex(videoAssetId || "0", MOCK_SAMPLES.length)];
  },
};

// Cloudflare Stream (DR-022): signed HLS. Real signing needs credentials + JWT; until the
// account exists we build the customer HLS URL and require the env to be present. Interface
// stays identical so the player never changes.
export const streamVideoProvider: VideoProvider = {
  name: "stream",
  getPlayback(videoAssetId: string): PlaybackSource {
    const customerCode = requireEnv("CLOUDFLARE_STREAM_CUSTOMER_CODE");
    return { url: `https://customer-${customerCode}.cloudflarestream.com/${videoAssetId}/manifest/video.m3u8`, type: "hls" };
  },
};

export function getVideoProvider(): VideoProvider {
  assertProductionProviderSafety();
  return videoProviderName() === "stream" ? streamVideoProvider : mockVideoProvider;
}
