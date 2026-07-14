// Lint-guard (overnight-6): fails if legacy raw Tailwind color classes creep back into app/ or
// components/ instead of the semantic design tokens (text-ink, border-line, bg-surface-raised,
// text/bg/border-danger, rounded-gs-lg). Run: `npx tsx scripts/check-color-tokens.ts`.
//
// This is a grep-guard, not a type system — it can't understand intent, so a small ALLOWLIST
// below documents the handful of places where the raw class is correct on purpose (fixed-dark
// surfaces, translucent overlay effects, physical controls). Every allowlist entry exists because
// a prior review (overnight-3..6) looked at it and decided it wasn't debt — see the inline reason.
// Do NOT add to the allowlist to make a failing check pass without the same scrutiny.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname, "..");
const SCAN_DIRS = ["app", "components"];
const EXT = new Set([".tsx"]);

// [relative file path, exact substring] — both must match for the exception to apply.
const ALLOWLIST: Array<[string, string]> = [
  // Golden Rule 14: gold is never paired with adaptive text — charcoal is required, not legacy debt.
  ["app/admin/payments/page.tsx", "text-charcoal"],
  ["app/dashboard/learn/browse/[slug]/page.tsx", "text-charcoal"],
  // Admin sidebar/mobile-tabs: deliberately fixed-dark, non-theme-adaptive shell (its own comment
  // says so); --gs-charcoal never flips between light/dark, so this pairing is already safe.
  ["components/admin/admin-nav.tsx", "border-charcoal/10"],
  ["components/admin/admin-nav.tsx", "bg-charcoal"],
  ["components/admin/admin-nav.tsx", "bg-white text-charcoal"],
  ["components/admin/admin-nav.tsx", "text-white/70"],
  // Translucent overlay/chip effects on hero gradients or dark panels — not a solid surface fill.
  ["app/courses/[slug]/page.tsx", "bg-white/70"],
  ["app/page.tsx", "bg-white/70"],
  ["app/page.tsx", "bg-white/15"],
  ["components/marketing/coming-soon.tsx", "bg-white/15"],
  ["components/marketing/course-card.tsx", "bg-white/80"],
  ["components/marketing/auth-shell.tsx", "bg-white/20"],
  ["components/marketing/auth-shell.tsx", "bg-white/10"],
  ["components/dashboard/lesson-player.tsx", "border-white/40"],
  ["components/dashboard/lesson-player.tsx", "text-white"],
  ["components/dashboard/lesson-player.tsx", "hover:bg-white/10"],
  // Physical toggle-knob affordance, not a card/surface — see components/ui/switch.tsx comment.
  ["components/ui/switch.tsx", "bg-white"],
];

function isAllowed(relPath: string, line: string): boolean {
  return ALLOWLIST.some(
    ([f, substr]) => f === relPath && line.includes(substr),
  );
}

const RAW_PATTERNS: Array<[string, RegExp]> = [
  ["text-charcoal", /text-charcoal(\/\d+)?\b/],
  ["border-charcoal/N (hairline)", /border-charcoal\/(5|10|15|20)\b/],
  ["bg-white", /\bbg-white\b/],
  ["text-red-*", /text-red-\d+/],
  ["bg-red-*", /bg-red-\d+/],
  ["border-red-*", /border-red-\d+/],
  ["rounded-2xl", /rounded-2xl\b/],
];

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (EXT.has(entry.slice(entry.lastIndexOf(".")))) out.push(full);
  }
}

const files: string[] = [];
for (const dir of SCAN_DIRS) walk(join(ROOT, dir), files);

const violations: string[] = [];
for (const file of files) {
  const relPath = relative(ROOT, file).split("\\").join("/");
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const [label, re] of RAW_PATTERNS) {
      if (re.test(line) && !isAllowed(relPath, line)) {
        violations.push(`${relPath}:${i + 1}  [${label}]  ${line.trim()}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error(
    `\n✗ ${violations.length} legacy raw color class(es) found — use the semantic tokens instead:\n` +
      "  text-charcoal -> text-ink/text-ink-muted · border-charcoal/N -> border-line/N ·\n" +
      "  bg-white -> bg-surface-raised · text/bg/border-red-* -> the danger token · rounded-2xl -> rounded-gs-lg\n\n" +
      violations.join("\n") +
      "\n\nIf this instance is genuinely intentional (fixed-dark surface, translucent overlay,\n" +
      "physical control), add it to the ALLOWLIST in scripts/check-color-tokens.ts with a reason.\n",
  );
  process.exit(1);
} else {
  console.log("✓ No legacy raw color classes found outside the documented allowlist.");
}
