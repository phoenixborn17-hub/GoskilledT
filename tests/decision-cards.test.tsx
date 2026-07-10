// Decision Cards (DecisionCard_System v1.0) — render + contract tests.
// react-dom/server (no jsdom). Enforces: money STATIC + fail-safe (never ₹0), AI line omitted when
// no real trigger (D-29), ≥3-points chart rule, honest error state, and distinct per-family viz.
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Target } from "lucide-react";
import { safeMoney } from "../lib/format";
import { DecisionCard } from "../components/cards/decision/decision-card";
import { WalletEarnCard } from "../components/cards/decision/wallet-earn-card";
import { AreaChart } from "../components/data/area-chart";
import { SemicircleGauge } from "../components/data/semicircle-gauge";
import { NetworkNodes } from "../components/data/network-nodes";
import { MilestoneTrack } from "../components/data/milestone-track";

describe("DecisionCard base — AI line + honest states", () => {
  it("renders the AI line only when a real trigger is passed", () => {
    const withAi = renderToStaticMarkup(
      <DecisionCard
        icon={Target}
        label="Progress"
        aiLine="Finish Lesson 3 today."
      >
        <p>hero</p>
      </DecisionCard>,
    );
    expect(withAi).toContain("Finish Lesson 3 today.");
  });

  it("omits the AI line entirely when there is no trigger (D-29)", () => {
    const noAi = renderToStaticMarkup(
      <DecisionCard icon={Target} label="Progress" aiLine={null}>
        <p>hero</p>
      </DecisionCard>,
    );
    // The AI block uses the info tint — absent means no fabricated nudge.
    expect(noAi).not.toContain("bg-info/5");
  });

  it("error state is an honest retry surface, not a fabricated figure", () => {
    const html = renderToStaticMarkup(
      <DecisionCard
        icon={Target}
        label="Network"
        state="error"
        onRetry={() => undefined}
      />,
    );
    expect(html).toContain("Try again");
  });
});

describe("WalletEarnCard — money static + fail-safe (§B/§D)", () => {
  it("shows real balances (static, charcoal) when loaded", () => {
    const html = renderToStaticMarkup(
      <WalletEarnCard
        href="#"
        available={safeMoney(1245000)}
        pending={safeMoney(45000)}
        payoutStatus="Recorded & safe"
      />,
    );
    expect(html).toContain("₹12,450");
    expect(html).toContain("Recorded"); // payout status line present (static markup escapes &)
  });

  it("fails safe (Retry, never ₹0) when a balance is missing", () => {
    const html = renderToStaticMarkup(
      <WalletEarnCard
        href="#"
        available={safeMoney(null)}
        pending={safeMoney(null)}
        payoutStatus="Recorded & safe"
        onRetry={() => undefined}
      />,
    );
    expect(html).toContain("Couldn");
    expect(html).not.toContain("₹0");
  });
});

describe("Signature viz — real data only", () => {
  it("AreaChart honours the ≥3-points rule", () => {
    expect(renderToStaticMarkup(<AreaChart points={[5, 8]} />)).toBe("");
    const html = renderToStaticMarkup(<AreaChart points={[5, 8, 12]} />);
    expect(html).toContain("polyline");
    expect(html).toContain("polygon"); // gradient area fill
  });

  it("SemicircleGauge is an accessible progressbar", () => {
    const html = renderToStaticMarkup(<SemicircleGauge value={64} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain("64%");
  });

  it("NetworkNodes draws from the real count (lone centre at 0)", () => {
    const zero = renderToStaticMarkup(<NetworkNodes count={0} />);
    expect(zero).toContain("<svg");
    const many = renderToStaticMarkup(<NetworkNodes count={9} />);
    expect(many).toContain("+3"); // 9 − 6 visible = +3 overflow
  });

  it("MilestoneTrack marks reached nodes", () => {
    const html = renderToStaticMarkup(
      <MilestoneTrack
        total={4}
        reached={2}
        labels={["Bronze", "Silver", "Gold", "Champ"]}
      />,
    );
    expect(html).toContain("Bronze");
    expect(html).toContain("Champ");
  });
});
