// Support contact channels for the invite-only "no referral code" state (Phase A §4.4) and other
// support surfaces. Layer-2 (DR-029): these are LAUNCH_CONFIG slots — defaults mirror /contact and
// are marked REPLACE until the founder confirms. NEXT_PUBLIC_ so client components can render them.
// Not fabricated data — real reachable channels, config-overridable before go-live.

const WHATSAPP_DIGITS =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, "") ||
  "918572887888"; // REPLACE: temp (LAUNCH_CONFIG)
const EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "goskilled.in@gmail.com"; // REPLACE: temp (LAUNCH_CONFIG)

export interface ContactChannels {
  whatsappUrl: string;
  whatsappDisplay: string;
  email: string;
}

/** Build the contact channels; optional `prefillText` pre-fills the WhatsApp message. */
export function contactChannels(prefillText?: string): ContactChannels {
  const query = prefillText ? `?text=${encodeURIComponent(prefillText)}` : "";
  return {
    whatsappUrl: `https://wa.me/${WHATSAPP_DIGITS}${query}`,
    whatsappDisplay: `+${WHATSAPP_DIGITS}`,
    email: EMAIL,
  };
}
