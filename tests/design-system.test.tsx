// Design System (Redesign U1) — unit + render tests.
// Renders via react-dom/server (no jsdom needed) and asserts the money-never-fail-to-zero contract
// (Frozen_Spec_Amendments §B): on failed data a currency value shows "Couldn't load", NEVER ₹0.
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  safeMoney,
  safeCount,
  formatINRFromPaise,
  formatCount,
} from "../lib/format";
import { detectDeviceTier } from "../lib/device-tier";
import { DataValue } from "../components/data/data-value";
import { StatCard } from "../components/cards/stat-card";
import { WalletCard } from "../components/cards/wallet-card";
import { Sparkline } from "../components/data/sparkline";
import { ComingSoon } from "../components/ui/coming-soon";
import { Button } from "../components/ui/button";

describe("lib/format — Indian formatting", () => {
  it("formats paise as ₹ with Indian digit grouping (whole rupee)", () => {
    expect(formatINRFromPaise(1575000)).toBe("₹15,750");
    expect(formatINRFromPaise(15000000)).toBe("₹1,50,000"); // lakh grouping
  });

  it("formats paise with 2-decimal precision when asked", () => {
    expect(formatINRFromPaise(157550, { paise: true })).toBe("₹1,575.50");
  });

  it("groups plain counts in the Indian system", () => {
    expect(formatCount(150000)).toBe("1,50,000");
  });
});

describe("safeMoney / safeCount — money-never-fail-to-zero (§B)", () => {
  it("returns ok for real, finite values (including a genuine ₹0)", () => {
    expect(safeMoney(45000)).toEqual({ ok: true, text: "₹450" });
    expect(safeMoney(0)).toEqual({ ok: true, text: "₹0" }); // a real loaded zero is valid
    expect(safeCount(42)).toEqual({ ok: true, text: "42" });
  });

  it("fails safe (ok:false) for missing / non-finite data — never fabricates 0", () => {
    expect(safeMoney(null).ok).toBe(false);
    expect(safeMoney(undefined).ok).toBe(false);
    expect(safeMoney(NaN).ok).toBe(false);
    expect(safeMoney(Infinity).ok).toBe(false);
    expect(safeCount(null).ok).toBe(false);
    expect(safeCount(undefined).ok).toBe(false);
  });
});

describe("DataValue — the fail-safe atom", () => {
  it("renders the real value when ok", () => {
    const html = renderToStaticMarkup(<DataValue value={safeMoney(45000)} />);
    expect(html).toContain("₹450");
    expect(html).not.toContain("Couldn't load");
  });

  it("renders 'Couldn't load' and NEVER ₹0 / 0 when the value failed", () => {
    const html = renderToStaticMarkup(<DataValue value={safeMoney(null)} />);
    expect(html).toContain("Couldn");
    expect(html).not.toContain("₹0");
    expect(html).not.toMatch(/>0</);
  });

  it("shows a Retry affordance when onRetry is provided", () => {
    const html = renderToStaticMarkup(
      <DataValue value={{ ok: false }} onRetry={() => undefined} />,
    );
    expect(html).toContain("Retry");
  });
});

describe("StatCard / WalletCard — money surfaces fail safe", () => {
  it("StatCard shows Retry, not ₹0, when the value failed", () => {
    const html = renderToStaticMarkup(
      <StatCard
        label="Available"
        value={safeMoney(null)}
        family="financial"
        onRetry={() => undefined}
      />,
    );
    expect(html).toContain("Couldn");
    expect(html).not.toContain("₹0");
  });

  it("StatCard in error state never renders a fabricated figure", () => {
    const html = renderToStaticMarkup(
      <StatCard label="Held" value={safeMoney(10000)} state="error" />,
    );
    expect(html).toContain("Couldn");
    expect(html).not.toContain("₹100");
  });

  it("WalletCard renders real balances and the honest payout status line", () => {
    const html = renderToStaticMarkup(
      <WalletCard
        available={safeMoney(0)}
        held={safeMoney(45000)}
        total={safeMoney(45000)}
        statusLine="Payouts open soon."
      />,
    );
    expect(html).toContain("₹0"); // a real, loaded ₹0 available balance is allowed
    expect(html).toContain("₹450");
    expect(html).toContain("Payouts open soon.");
  });

  it("WalletCard fails safe when a balance is missing", () => {
    const html = renderToStaticMarkup(
      <WalletCard
        available={safeMoney(null)}
        held={safeMoney(null)}
        total={safeMoney(null)}
        statusLine="Payouts open soon."
        onRetry={() => undefined}
      />,
    );
    expect(html).toContain("Couldn");
    expect(html).not.toContain("₹0");
  });
});

describe("Sparkline — the ≥3-data-points rule (§9)", () => {
  it("renders nothing below 3 points (no fabricated 1–2 point line)", () => {
    expect(renderToStaticMarkup(<Sparkline points={[]} />)).toBe("");
    expect(renderToStaticMarkup(<Sparkline points={[5]} />)).toBe("");
    expect(renderToStaticMarkup(<Sparkline points={[5, 8]} />)).toBe("");
  });

  it("renders an svg polyline at ≥3 points", () => {
    const html = renderToStaticMarkup(<Sparkline points={[3, 5, 8]} />);
    expect(html).toContain("<svg");
    expect(html).toContain("polyline");
  });
});

describe("Honest states + primitives render", () => {
  it("ComingSoon is clearly labelled (never a fake widget)", () => {
    const html = renderToStaticMarkup(<ComingSoon title="Daily Missions" />);
    expect(html).toContain("Daily Missions");
    expect(html).toContain("Coming soon");
  });

  it("Button applies variant + is a real button element", () => {
    const html = renderToStaticMarkup(<Button variant="gold">Pay</Button>);
    expect(html).toContain("bg-gold");
    expect(html).toContain("<button");
  });
});

describe("device-tier — single heuristic, SSR-safe", () => {
  it("returns 'full' with no window (server / node)", () => {
    expect(detectDeviceTier()).toBe("full");
  });
});
