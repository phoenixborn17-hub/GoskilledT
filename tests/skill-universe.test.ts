// Public Experience — Living Skill Universe node builder (pure). Guards the HONESTY law (D-29):
// a node is "live" ONLY when a real PUBLISHED course exists in that category; everything else is
// "coming soon". No fabricated skills. The node set is derived purely from real catalog rows.
import { describe, it, expect } from "vitest";
import {
  buildSkillNodes,
  type SkillUniverseCourseRow,
} from "../lib/marketing/skill-universe";

const rows: SkillUniverseCourseRow[] = [
  { slug: "ai-prompt-mastery", category: "AI", status: "PUBLISHED" },
  { slug: "digital-marketing", category: "Marketing", status: "PUBLISHED" },
  { slug: "ai-content-creation", category: "AI", status: "COMING_SOON" },
  { slug: "stock-market", category: "Finance", status: "COMING_SOON" },
  { slug: "no-code-ai-website", category: "Tech", status: "COMING_SOON" },
  {
    slug: "personality-development",
    category: "Skills",
    status: "COMING_SOON",
  },
];

describe("buildSkillNodes", () => {
  it("marks a category live only when it has a PUBLISHED course", () => {
    const nodes = buildSkillNodes(rows);
    const byKey = Object.fromEntries(nodes.map((n) => [n.key, n]));
    expect(byKey.AI.status).toBe("live");
    expect(byKey.Marketing.status).toBe("live");
    expect(byKey.Finance.status).toBe("soon");
    expect(byKey.Tech.status).toBe("soon");
    expect(byKey.Skills.status).toBe("soon");
  });

  it("links a live node to its first PUBLISHED course, a soon node to /courses", () => {
    const nodes = buildSkillNodes(rows);
    const ai = nodes.find((n) => n.key === "AI")!;
    const finance = nodes.find((n) => n.key === "Finance")!;
    expect(ai.href).toBe("/courses/ai-prompt-mastery");
    expect(finance.href).toBe("/courses");
  });

  it("keeps the designed ring order and appends unknown real categories (grows honestly)", () => {
    const withExtra = [
      ...rows,
      { slug: "design-basics", category: "Design", status: "COMING_SOON" },
    ];
    const keys = buildSkillNodes(withExtra).map((n) => n.key);
    expect(keys.slice(0, 5)).toEqual([
      "AI",
      "Marketing",
      "Finance",
      "Tech",
      "Skills",
    ]);
    expect(keys).toContain("Design"); // unknown category still surfaces, appended
  });

  it("ignores null categories and never fabricates a node", () => {
    const nodes = buildSkillNodes([
      { slug: "x", category: null, status: "PUBLISHED" },
    ]);
    expect(nodes).toHaveLength(0);
  });

  it("positions every node inside the canvas (0–100%)", () => {
    for (const n of buildSkillNodes(rows)) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(100);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(100);
    }
  });
});
