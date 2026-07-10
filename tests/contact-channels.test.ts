// Launch hardening Unit 4 — contact channels for the invite-only no-code state (LAUNCH_CONFIG slots).
import { describe, it, expect } from "vitest";
import { contactChannels } from "@/lib/config/contact";

// Note: the WhatsApp/email values are module-load-time constants (NEXT_PUBLIC_* set at build), so
// these tests exercise the DEFAULTS + the per-call formatting, not runtime env overrides.
describe("contactChannels", () => {
  it("builds a digits-only wa.me url + mailto-ready email from defaults", () => {
    const c = contactChannels();
    expect(c.whatsappUrl).toMatch(/^https:\/\/wa\.me\/\d+$/); // digits only, no '+' or spaces
    expect(c.whatsappDisplay.startsWith("+")).toBe(true);
    expect(c.email).toContain("@");
  });

  it("URL-encodes the optional prefill text", () => {
    const c = contactChannels("hi there & co");
    expect(c.whatsappUrl).toContain("?text=");
    expect(c.whatsappUrl).toContain("hi%20there%20%26%20co");
  });

  it("omits the text query when no prefill is given", () => {
    expect(contactChannels().whatsappUrl).not.toContain("?text=");
  });
});
