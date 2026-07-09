// Commission-structure data (Phase B / B5). Renders straight from the DR-007 single source of truth
// (modules/affiliate/commission COMMISSION_TABLE) — never re-typed numbers. Copy is compliance-safe
// (learning-first; NO income guarantees — D-29) and LAUNCH_CONFIG-slotted for founder finalisation.
import {
  commissionForLevel,
  totalCommission,
  type PackageSlug,
} from "../../modules/affiliate/commission";

const PACKAGES: { slug: PackageSlug; name: string }[] = [
  { slug: "skill-builder", name: "Skill Builder" },
  { slug: "career-booster", name: "Career Booster" },
];

export interface StructureLevel {
  level: 1 | 2 | 3;
  amountInPaise: number;
}
export interface StructureRow {
  slug: PackageSlug;
  name: string;
  levels: StructureLevel[];
  totalInPaise: number;
}

/** DR-007 structure for both packages, derived from the engine (₹900/150/75 · ₹1250/250/150). */
export function commissionStructure(): StructureRow[] {
  return PACKAGES.map(({ slug, name }) => ({
    slug,
    name,
    levels: ([1, 2, 3] as const).map((level) => ({
      level,
      amountInPaise: commissionForLevel(slug, level),
    })),
    totalInPaise: totalCommission(slug),
  }));
}

// LAUNCH_CONFIG copy slots — placeholder, D-29-safe (no income promise, learning-first framing).
export const COMMISSION_STRUCTURE_COPY = {
  heading: "How referral rewards work",
  intro:
    "When someone you invited buys a course, you receive a fixed reward — across three levels of your network. Rewards are the same for everyone; there are no targets and no guarantees. GoSkilled is a learning platform first.",
  disclaimer:
    "These are fixed per-purchase reward amounts, not income projections. Your rewards depend entirely on real purchases by people in your network. We never promise earnings.",
} as const;
