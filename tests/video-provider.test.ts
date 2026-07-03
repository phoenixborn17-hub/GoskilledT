// Ticket 4, Task 5 — video provider selection + production startup guard. Pure, no DB.
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  videoProviderName,
  assertProductionProviderSafety,
} from "@/lib/config/providers";
import { getVideoProvider } from "@/lib/video/provider";

afterEach(() => vi.unstubAllEnvs());

describe("video provider selection", () => {
  it("defaults to mock", () => {
    vi.stubEnv("VIDEO_PROVIDER", "");
    expect(videoProviderName()).toBe("mock");
  });
  it("selects stream when configured", () => {
    vi.stubEnv("VIDEO_PROVIDER", "stream");
    expect(videoProviderName()).toBe("stream");
  });
  it("rejects invalid values", () => {
    vi.stubEnv("VIDEO_PROVIDER", "youtube");
    expect(() => videoProviderName()).toThrow(/Invalid VIDEO_PROVIDER/);
  });
  it("mock returns a playable sample MP4, deterministic per asset id", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VIDEO_PROVIDER", "mock");
    const p = getVideoProvider();
    expect(p.name).toBe("mock");
    const a = p.getPlayback("mock-aipm-101");
    expect(a.type).toBe("mp4");
    expect(a.url).toMatch(/^https:\/\/.*\.mp4$/);
    expect(getVideoProvider().getPlayback("mock-aipm-101").url).toBe(a.url); // stable
  });
});

describe("production startup guard (video)", () => {
  it("THROWS in production when VIDEO_PROVIDER=mock", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "razorpay");
    vi.stubEnv("OTP_PROVIDER", "live");
    vi.stubEnv("VIDEO_PROVIDER", "mock");
    expect(() => assertProductionProviderSafety()).toThrow(
      /VIDEO_PROVIDER=mock/,
    );
    expect(() => getVideoProvider()).toThrow(
      /development providers enabled in production/,
    );
  });
  it("passes in production with all real providers", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "razorpay");
    vi.stubEnv("OTP_PROVIDER", "live");
    vi.stubEnv("VIDEO_PROVIDER", "stream");
    expect(() => assertProductionProviderSafety()).not.toThrow();
  });
});
