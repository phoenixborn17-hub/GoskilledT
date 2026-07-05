// GPS-M5 §2.4 — welcome + certificate-ready email builders. PURE (no I/O). Warm, D-29-safe copy
// (learning + belonging + pride — never earnings). Copy is an LC voice slot, finalized pre-launch.
import { buildBrandEmail } from "./template";
import type { EmailMessage } from "./receipt";

export interface WelcomeInput {
  to: string;
  name: string | null;
  appUrl: string;
  unsubscribeUrl: string;
}

export function buildWelcomeEmail(i: WelcomeInput): EmailMessage {
  const hi = i.name ? `${i.name}, ` : "";
  return buildBrandEmail({
    to: i.to,
    subject: "Welcome to GoSkilled 🎉",
    preheader: "Aapka learning safar yahin se shuru hota hai.",
    heading: `Welcome to GoSkilled, ${hi}`.replace(/, $/, "!"),
    paragraphs: [
      "Bahut khushi hui aapko yahan dekh kar! GoSkilled par aap apni pace se seekh sakte ho — chhote lessons, real practice, aur ek Hinglish tutor (Guru) jo aapke doubts solve karega.",
      "Shuruaat karne ke liye ek 2-minute ka intro lesson taiyaar hai. Bas ek lesson se aaj hi apni learning streak shuru karo.",
    ],
    cta: { label: "Start learning", href: `${i.appUrl}/dashboard` },
    unsubscribeUrl: i.unsubscribeUrl,
    idempotencyKey: `welcome:${i.to}`,
  });
}

export interface CertificateReadyInput {
  to: string;
  name: string | null;
  courseTitle: string;
  serial: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function buildCertificateReadyEmail(
  i: CertificateReadyInput,
): EmailMessage {
  const hi = i.name ? `${i.name}, ` : "";
  return buildBrandEmail({
    to: i.to,
    subject: `Your certificate is ready 🎓 — ${i.courseTitle}`,
    preheader: "Aapne course complete kiya — shabaash!",
    heading: `Shabaash ${hi}certificate ready hai!`.replace(
      / certificate/,
      " — certificate",
    ),
    paragraphs: [
      `Aapne "${i.courseTitle}" complete kar liya — ye ek badi baat hai. Poori mehnat rang laayi!`,
      `Aapka certificate serial: ${i.serial}. Ise koi bhi verify kar sakta hai — ye ek genuine GoSkilled proof hai.`,
    ],
    cta: {
      label: "View your certificate",
      href: `${i.appUrl}/verify/${i.serial}`,
    },
    unsubscribeUrl: i.unsubscribeUrl,
    idempotencyKey: `cert-ready:${i.serial}`,
  });
}
