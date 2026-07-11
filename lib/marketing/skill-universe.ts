// Living Skill Universe — pure node-shaping for the homepage hero signature moment.
// No DB, no framework, no client APIs → node-testable. Turns REAL catalog rows (category + status)
// into honest, positioned skill nodes. HONESTY (D-29): nodes are derived from real courses only —
// "Live now" means a PUBLISHED course exists in that category; otherwise "Coming soon". The node set
// GROWS automatically as new course categories are added. No fabricated skills, outcomes, or income.

export type NodeIconKey =
  "ai" | "marketing" | "finance" | "tech" | "skills" | "generic";

export interface SkillUniverseCourseRow {
  slug: string;
  category: string | null;
  status: string; // "PUBLISHED" | "COMING_SOON" | ...
}

export interface SkillNode {
  /** Category key (used for React keys + icon lookup). */
  key: string;
  /** Display label shown on the node + in the reveal panel. */
  label: string;
  iconKey: NodeIconKey;
  /** Honest status: a live category has ≥1 PUBLISHED course. */
  status: "live" | "soon";
  /** Honest subject description — what you LEARN. Never an outcome/earnings claim (D-29). */
  blurb: string;
  /** Real destination: a live node → its course; a soon node → the courses page. */
  href: string;
  /** Position as a percentage of the hero canvas (0–100), pre-computed on a ring. */
  x: number;
  y: number;
}

// Honest, subject-only descriptions (what the area teaches). Product copy, not fabricated data —
// no outcomes, no income, no guarantees. Unknown/future categories fall back to a neutral line.
const CATEGORY_META: Record<
  string,
  { label: string; iconKey: NodeIconKey; blurb: string }
> = {
  AI: {
    label: "AI",
    iconKey: "ai",
    blurb:
      "Practical AI skills — prompting and tools you can use in real work.",
  },
  Marketing: {
    label: "Marketing",
    iconKey: "marketing",
    blurb: "Modern digital marketing — reach the right people and grow.",
  },
  Finance: {
    label: "Finance",
    iconKey: "finance",
    blurb: "Understand money, investing and the market from the ground up.",
  },
  Tech: {
    label: "Tech",
    iconKey: "tech",
    blurb: "Build real things with no-code tools and AI — no coding needed.",
  },
  Skills: {
    label: "Skills",
    iconKey: "skills",
    blurb: "Communication, confidence and the everyday soft skills that help.",
  },
};

const RING_ORDER = ["AI", "Marketing", "Finance", "Tech", "Skills"];

/** Ring geometry: nodes evenly spaced, first at top, laid out on an ellipse around the centre. */
function ringPosition(index: number, count: number): { x: number; y: number } {
  // Horizontal radius wider than vertical → fits the landscape hero canvas without crowding edges.
  const rx = 39;
  const ry = 34;
  const start = -Math.PI / 2; // top
  const angle = start + (index / count) * Math.PI * 2;
  return {
    x: +(50 + rx * Math.cos(angle)).toFixed(2),
    y: +(50 + ry * Math.sin(angle)).toFixed(2),
  };
}

/**
 * Build honest, positioned skill nodes from real catalog rows. A category is "live" if it has any
 * PUBLISHED course. Known categories keep a stable, designed order; any additional real categories
 * are appended so the universe grows truthfully as the catalog does.
 */
export function buildSkillNodes(
  courses: SkillUniverseCourseRow[],
): SkillNode[] {
  // Group real courses by category (skip null/system categories).
  const byCategory = new Map<
    string,
    { hasPublished: boolean; firstPublishedSlug: string | null }
  >();
  for (const c of courses) {
    if (!c.category) continue;
    const entry = byCategory.get(c.category) ?? {
      hasPublished: false,
      firstPublishedSlug: null,
    };
    if (c.status === "PUBLISHED") {
      entry.hasPublished = true;
      entry.firstPublishedSlug ??= c.slug;
    }
    byCategory.set(c.category, entry);
  }

  // Stable order: known ring categories first, then any extras alphabetically (future-proof).
  const known = RING_ORDER.filter((cat) => byCategory.has(cat));
  const extras = [...byCategory.keys()]
    .filter((cat) => !RING_ORDER.includes(cat))
    .sort();
  const ordered = [...known, ...extras];

  return ordered.map((category, i) => {
    const info = byCategory.get(category)!;
    const meta = CATEGORY_META[category] ?? {
      label: category,
      iconKey: "generic" as NodeIconKey,
      blurb: `Learn practical ${category.toLowerCase()} skills, step by step.`,
    };
    const status: SkillNode["status"] = info.hasPublished ? "live" : "soon";
    const href =
      status === "live" && info.firstPublishedSlug
        ? `/courses/${info.firstPublishedSlug}`
        : "/courses";
    const pos = ringPosition(i, ordered.length);
    return {
      key: category,
      label: meta.label,
      iconKey: meta.iconKey,
      status,
      blurb: meta.blurb,
      href,
      x: pos.x,
      y: pos.y,
    };
  });
}
