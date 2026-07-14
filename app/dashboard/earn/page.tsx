// Earn hub (GPS-M3 §2.0 · Redesign U5 · Dashboard §4; Vibrant rollout Slice C — see
// docs/specs/Vibrant_CardSystem_Amendment_v1.0.md §5 + Command_Center_Dashboard_Spec §4.2/Slice 4).
// Header + key-metric row promoted onto the Vibrant Card System (gold-vault Available · cyan Held
// (a status, not a family) · gold Total-earned · indigo Active-friends network, de-clustered).
// Referral object, entry cards, tabs stay on the calm dc-recipe (same restraint as Home/Learn).
// DISPLAY-ONLY over the ledger: no money recompute, no re-gate; payouts OFF (D-01). Money honesty
// locks: eligibility-forked zero-state (Amendments §D), Available anchors only when >0, held = 48h
// buyer-protection framing, an always-visible honest payout-status line, honest commission RANGE,
// money NEVER animates — safeMoney/DataValue, STATIC (never CountUp on ₹).
import Link from "next/link";
import {
  Wallet as WalletIcon,
  Users,
  CalendarClock,
  Gift,
  Trophy,
  Store,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { getCurrentUserRecord } from "../../../lib/auth/session";
import { formatINR } from "../../../lib/money";
import { safeMoney } from "../../../lib/format";
import { greetingTitle } from "../../../lib/greeting";
import {
  getEarnDashboard,
  COMMISSION_RANGE,
  type EarnDashboard,
} from "../../../lib/earn/dashboard";
import { Tabs } from "../../../components/ui/tabs";
import { ChartCard } from "../../../components/cards/chart-card";
import { ShareWidget } from "../../../components/cards/share-widget";
import { QRCode } from "../../../components/cards/qr-code";
import { DecisionCard } from "../../../components/cards/decision/decision-card";
import { VibrantMetricCard } from "../../../components/cards/decision/vibrant-metric-card";
import { GettingStartedCard } from "../../../components/cards/getting-started-card";
import { DataValue } from "../../../components/data/data-value";
import { CountUp } from "../../../components/data/animated";
import { NetworkNodes } from "../../../components/data/network-nodes";
import { MiniChart } from "../../../components/affiliate/mini-chart";
import { PayoutStatusLine } from "../../../components/affiliate/payout-status-line";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earn" };

export default async function EarnPage() {
  const user = await getCurrentUserRecord();
  const d = await getEarnDashboard(user!.id, user!.referralCode);

  return (
    <div className="gs-vibrant space-y-8">
      <header className="vh-hero dc-enter p-6 md:p-8">
        <h1 className="font-heading text-display font-extrabold leading-tight">
          Earn
        </h1>
        <p className="mt-2 text-body text-white/85">
          {greetingTitle(user?.name)} — share GoSkilled with friends who want to
          learn.
        </p>
      </header>

      {/* NotEligible is an ELIGIBILITY fork (§D/DR-038 — a non-purchaser must never see share-to-earn),
          NOT a zero-data state. Every ELIGIBLE user gets the FULL rich dashboard at honest zero
          (₹0 held, 0 friends) with motivating unlock micro-states + one getting-started strip
          (ThreeState law — no more suppressing the dashboard at zero referrals). */}
      {!d.eligible ? <NotEligible /> : <FullDashboard d={d} />}
    </div>
  );
}

// The referral object — link · copy · QR · WhatsApp + the honest commission range.
function ReferralObject({ d }: { d: EarnDashboard }) {
  return (
    <ShareWidget
      link={d.shareUrl}
      whatsappMessage={`Main GoSkilled par seekh raha hoon — tu bhi join kar aur naye skills seekh: ${d.shareUrl}`}
      commissionValue={COMMISSION_RANGE}
      qrSlot={<QRCode value={d.shareUrl} size={148} />}
    />
  );
}

// ── Variant A (Amendments §D): NOT eligible (no own purchase) → get your package. NEVER share-to-earn.
function NotEligible() {
  return (
    <div className="space-y-6">
      <DecisionCard
        icon={Store}
        label="Step 1 — get your package"
        accent="gold"
        size="hero"
        cta="Browse packages"
        href="/dashboard/learn/browse#packages"
      >
        <div>
          <h2 className="font-heading text-h2 font-bold text-ink">
            Earning unlocks with your purchase
          </h2>
          <p className="mt-2 max-w-prose text-body text-ink-muted">
            Once you own a package, you can refer friends and earn a real
            commission ({COMMISSION_RANGE}) when they join and buy. Learning
            first, earning next.
          </p>
        </div>
      </DecisionCard>
      <p className="text-small text-ink-muted">
        Want the details first?{" "}
        <Link
          href="/dashboard/earn/commission-structure"
          className="font-semibold text-theme-strong"
        >
          See the commission structure →
        </Link>
      </p>
    </div>
  );
}

// ── Full dashboard (any ELIGIBLE user) — renders at honest zero with unlock micro-states. ──
function FullDashboard({ d }: { d: EarnDashboard }) {
  const showAvailable = d.wallet.availableInPaise > 0; // anchor only when > 0 (§D)
  const noReferralsYet = d.tree.l1Count === 0;
  return (
    <div className="space-y-6">
      <PayoutStatusLine open={d.payoutsOpen} />
      <NeedsAttention d={d} />
      {/* ONE getting-started strip for a brand-new affiliate (ThreeState law) — the rich dashboard
          below still renders in full at honest zero. */}
      {noReferralsYet && (
        <GettingStartedCard
          icon={Users}
          title="Earn your first commission"
          subtitle={`Share your link → a friend joins & buys → you earn ${COMMISSION_RANGE}`}
          steps={[
            {
              title: "Copy your referral link",
              description: "It's ready below.",
            },
            { title: "Share it with a friend on WhatsApp" },
            { title: "They join and buy — your commission is credited" },
          ]}
        />
      )}
      <ReferralObject d={d} />

      {/* Key-metric row — Vibrant Card System v1.0 (Slice C), de-clustered accents: gold-vault
          Available (focal, when >0) · cyan Held (a clearing STATUS, not the earn family — keeps
          no-two-same-accent-adjacent even with 3 money cards) · gold Total-earned · indigo Active
          friends. Money is STATIC (<DataValue>/safeMoney, never <CountUp>) — DR-043 throughout. */}
      <section aria-label="Your earnings">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {showAvailable && (
            <VibrantMetricCard
              bold
              icon={WalletIcon}
              label="Available"
              accent="vh-accent-earn"
              index={0}
              href="/dashboard/earn/wallet"
              badge="Available"
              numClassName="vh-gold-num"
              value={
                <DataValue
                  value={safeMoney(d.wallet.availableInPaise)}
                  raiseUnit
                />
              }
              caption={
                d.payoutsOpen
                  ? "Ready to withdraw."
                  : "Recorded to your wallet — payouts open at launch."
              }
            />
          )}
          <VibrantMetricCard
            icon={CalendarClock}
            label="Held"
            accent="vh-accent-cyan"
            index={1}
            href="/dashboard/earn/wallet"
            value={
              <DataValue value={safeMoney(d.wallet.heldInPaise)} raiseUnit />
            }
            caption={
              d.wallet.heldInPaise > 0
                ? "Buyer-protected for 48h."
                : "Ready to receive commissions."
            }
          />
          <VibrantMetricCard
            icon={WalletIcon}
            label="Total earned"
            accent="vh-accent-earn"
            index={2}
            href="/dashboard/earn/commissions"
            value={
              <DataValue value={safeMoney(d.wallet.totalInPaise)} raiseUnit />
            }
            caption={
              d.wallet.totalInPaise === 0
                ? "Earn when a friend joins & buys."
                : d.payoutsOpen
                  ? d.wallet.heldInPaise > 0
                    ? "Includes held commissions clearing their 48h window."
                    : "Recorded to your wallet."
                  : "Recorded to your wallet — payouts open at launch."
            }
          />
          <VibrantMetricCard
            icon={Users}
            label="Active friends"
            accent="vh-accent-network"
            index={3}
            href="/dashboard/earn/network"
            value={<CountUp value={d.tree.l1Count} />}
            viz={<NetworkNodes count={d.tree.l1Count} height={40} />}
            caption={
              d.tree.l1Count === 0
                ? "Invite your first friend."
                : `+${d.tree.thisMonth} this month`
            }
          />
        </div>
      </section>

      {/* Rewards + Leaderboard entry cards (built; reachable here, not in the sidebar). */}
      <div className="grid gap-4 md:grid-cols-2">
        <EntryCard
          icon={Gift}
          label="Rewards"
          title="Milestone rewards"
          desc="See running rewards and how close you are."
          href="/dashboard/earn/rewards"
        />
        <EntryCard
          icon={Trophy}
          label="Leaderboard"
          title="Community leaderboard"
          desc="Recognition by friends who started learning."
          href="/dashboard/earn/leaderboard"
        />
      </div>

      {/* Activity — earnings + payments over time (from the ledger; honest empty states). */}
      <Tabs
        items={[
          {
            value: "earnings",
            label: "Earnings",
            content: (
              <ChartCard title="Commissions over time">
                <MiniChart
                  points={d.earningSeries}
                  kind="bar"
                  format={(n) => formatINR(n)}
                  empty="No commissions credited yet — they'll show here as your friends buy."
                />
              </ChartCard>
            ),
          },
          {
            value: "payments",
            label: "Payments",
            content: (
              <ChartCard title="Payments received">
                <MiniChart
                  points={d.paymentsSeries}
                  kind="bar"
                  format={(n) => formatINR(n)}
                  empty="No payments received yet."
                />
              </ChartCard>
            ),
          },
        ]}
      />
    </div>
  );
}

// Needs-attention chips — real state only (KYC + payout gate).
function NeedsAttention({ d }: { d: EarnDashboard }) {
  const kycDone = d.kycStatus === "APPROVED";
  return (
    <div className="flex flex-wrap gap-2">
      {!kycDone && (
        <Link
          href="/dashboard/earn/kyc"
          className="press inline-flex items-center gap-1.5 rounded-full border border-warning-strong/30 bg-warning-strong/5 px-3 py-1.5 text-small font-semibold text-warning-strong"
        >
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
          Get payout-ready — complete KYC
        </Link>
      )}
      {!d.payoutsOpen && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info/5 px-3 py-1.5 text-small font-medium text-info">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Payouts open soon
        </span>
      )}
    </div>
  );
}

function EntryCard({
  icon: Icon,
  label,
  title,
  desc,
  href,
}: {
  icon: typeof Gift;
  label: string;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="lift flex items-center gap-4 rounded-gs border border-line bg-surface-raised p-5"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/20 text-warning-strong"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </p>
        <p className="font-heading text-h4 font-bold text-ink">{title}</p>
        <p className="text-caption text-ink-muted">{desc}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
    </Link>
  );
}
