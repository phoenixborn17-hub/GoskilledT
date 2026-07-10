// Feature Visibility resolver (DR-040) — pure precedence + fail-safe + extensibility. No DB.
import { describe, it, expect } from "vitest";
import {
  resolveFeature,
  resolveAllFeatures,
  type FeatureOverrideRow,
  type UserContext,
} from "../lib/feature-visibility/resolver";

const USER: UserContext = { userId: "u1", role: "USER" };
const REVIEWER: UserContext = { userId: "u2", role: "REVIEWER" };
const ANON: UserContext = { userId: null, role: null };

function row(
  scope: FeatureOverrideRow["scope"],
  scopeValue: string,
  visible: boolean,
  featureKey = "earn",
): FeatureOverrideRow {
  return { featureKey, scope, scopeValue, visible };
}

describe("Feature Visibility resolver (DR-040)", () => {
  it("no overrides → registry default (earn visible, marketplace hidden)", () => {
    expect(resolveFeature("earn", [], USER)).toBe(true);
    expect(resolveFeature("marketplace", [], USER)).toBe(false);
  });

  it("GLOBAL hide hides for everyone; GLOBAL show shows", () => {
    expect(resolveFeature("earn", [row("GLOBAL", "", false)], USER)).toBe(
      false,
    );
    expect(resolveFeature("earn", [row("GLOBAL", "", false)], ANON)).toBe(
      false,
    );
    expect(
      resolveFeature(
        "marketplace",
        [row("GLOBAL", "", true, "marketplace")],
        USER,
      ),
    ).toBe(true); // extensibility: a 2nd feature toggles through the same system
  });

  it("ROLE scope hides only the matching role", () => {
    const ov = [row("ROLE", "REVIEWER", false)];
    expect(resolveFeature("earn", ov, REVIEWER)).toBe(false);
    expect(resolveFeature("earn", ov, USER)).toBe(true); // a normal USER is unaffected
    expect(resolveFeature("earn", ov, ANON)).toBe(true); // anon has no role → default
  });

  it("USER scope hides only the matching user", () => {
    const ov = [row("USER", "u1", false)];
    expect(resolveFeature("earn", ov, USER)).toBe(false); // u1
    expect(resolveFeature("earn", ov, REVIEWER)).toBe(true); // u2
  });

  it("HIDE WINS across scopes (fail-safe): any applicable hide → hidden", () => {
    // global SHOW but a per-user HIDE → hidden for that user (can't be re-revealed).
    expect(
      resolveFeature(
        "earn",
        [row("GLOBAL", "", true), row("USER", "u1", false)],
        USER,
      ),
    ).toBe(false);
    // global HIDE but a per-user SHOW → still hidden (hide wins).
    expect(
      resolveFeature(
        "earn",
        [row("GLOBAL", "", false), row("USER", "u1", true)],
        USER,
      ),
    ).toBe(false);
  });

  it("an applicable SHOW with no HIDE reveals over the default", () => {
    // marketplace default hidden; a role SHOW for REVIEWER reveals it for that role only.
    const ov = [row("ROLE", "REVIEWER", true, "marketplace")];
    expect(resolveFeature("marketplace", ov, REVIEWER)).toBe(true);
    expect(resolveFeature("marketplace", ov, USER)).toBe(false); // default hidden
  });

  it("resolveAllFeatures: `share` follows the `earn` flag; structural stay visible", () => {
    const hidden = resolveAllFeatures([row("GLOBAL", "", false)], USER);
    expect(hidden.earn).toBe(false);
    expect(hidden.share).toBe(false); // derived from earn
    expect(hidden.home).toBe(true);
    expect(hidden.learn).toBe(true);
    expect(hidden.account).toBe(true);

    const visible = resolveAllFeatures([], USER);
    expect(visible.earn).toBe(true);
    expect(visible.share).toBe(true);
  });

  it("overrides for other features do not bleed across keys", () => {
    // hiding marketplace must not affect earn.
    const ov = [row("GLOBAL", "", false, "marketplace")];
    expect(resolveFeature("earn", ov, USER)).toBe(true);
    expect(resolveFeature("marketplace", ov, USER)).toBe(false);
  });
});
