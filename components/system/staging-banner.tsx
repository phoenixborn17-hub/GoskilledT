// App-wide STAGING banner (money safety rail, gps-staging-mode). Server component: the flag lives in
// server-only env (APP_ENV) and is read at render, so it ships in the FIRST server-rendered HTML —
// present from first paint → zero CLS. Renders null in dev (no flag) and can NEVER render on the
// canonical prod domain (showStagingBanner requires a non-prod host; the boot guard also hard-throws
// a staging-flagged prod deploy). Charcoal fill + off-white text (unmistakable, AA; no gold-on-light).
import { showStagingBanner } from "../../lib/config/providers";

export function StagingBanner() {
  if (!showStagingBanner()) return null;
  return (
    <div
      role="status"
      className="w-full border-b border-gold/40 bg-charcoal px-3 py-1.5 text-center text-xs font-semibold text-offwhite"
    >
      <span aria-hidden>⚠ </span>
      STAGING — simulated: payments, OTP, emails are NOT real
    </div>
  );
}
