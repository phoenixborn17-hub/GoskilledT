// Earn hub (GPS-M3 §2.0 · Redesign U5 · Dashboard §4) — re-skinned onto the Decision Card system.
// DISPLAY-ONLY over the ledger: no money recompute, no re-gate; payouts OFF (D-01). Money honesty
// locks: eligibility-forked zero-state (Amendments §D), Available anchors only when >0, held = 48h
// buyer-protection framing, an always-visible honest payout-status line, honest commission RANGE,
// NO count-up on money, safeMoney (never ₹0). Gold "earn" theme; Register-2 calm lives on Wallet/KYC.
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
import { getCurrentUser } from "../../../lib/auth/session";
import { formatINR } from "../../../lib/money";
import { safeMoney, safeCount } from "../../../lib/format";
import {
  getEarnDashboard,
  COMMISSION_RANGE,
  type EarnDashboard,
} from "../../../lib/earn/dashboard";
import { Tabs } from "../../../components/ui/tabs";
import { StatCard } from "../../../components/cards/stat-card";
import { ChartCard } from "../../../components/cards/chart-card";
import { ShareWidget } from "../../../components/cards/share-widget";
import { QRCode } from "../../../components/cards/qr-code";
import { DecisionCard } from "../../../components/cards/decision/decision-card";
import { GettingStartedCard } from "../../../components/cards/getting-started-card";
import { MiniChart } from "../../../components/affiliate/mini-chart";
import { PayoutStatusLine } from "../../../components/affiliate/payout-status-line";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earn" };

export default async function EarnPage() {
  const user = await getCurrentUser();
  const d = await getEarnDashboard(user!.id, user!.referralCode);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-h1 font-extrabold text-ink">Earn</h1>
        <p className="mt-1 text-body text-ink-muted">
          Share GoSkilled with friends who want to learn.
        </p>
      </header>

      {!d.eligible ? (
        <NotEligible />
      ) : d.tree.l1Count === 0 ? (
        <EligibleNoReferrals d={d} />
      ) : (
        <FullDashboard d={d} />
      )}
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
        href="/packages"
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

// ── Variant B (Amendments §D): eligible, no referrals yet → the share flow (getting-started).
function EligibleNoReferrals({ d }: { d: EarnDashboard }) {
  return (
    <div className="space-y-6">
      <PayoutStatusLine open={d.payoutsOpen} />
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
      <ReferralObject d={d} />
      <NeedsAttention d={d} />
    </div>
  );
}

// ── Full dashboard (eligible + has referrals) ──
function FullDashboard({ d }: { d: EarnDashboard }) {
  const showAvailable = d.wallet.availableInPaise > 0; // anchor only when > 0 (§D)
  return (
    <div className="space-y-6">
      <PayoutStatusLine open={d.payoutsOpen} />
      <NeedsAttention d={d} />
      <ReferralObject d={d} />

      {/* Stat cards — Financial family (gold accent, charcoal tabular numbers, no count-up). */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {showAvailable && (
          <StatCard
            label="Available"
            value={safeMoney(d.wallet.availableInPaise)}
            icon={WalletIcon}
            family="financial"
          />
        )}
        <StatCard
          label="Held"
          value={safeMoney(d.wallet.heldInPaise)}
          icon={CalendarClock}
          family="financial"
          hint="Buyer-protected for 48h"
        />
        <StatCard
          label="Total earned"
          value={safeMoney(d.wallet.totalInPaise)}
          icon={WalletIcon}
          family="financial"
        />
        <StatCard
          label="Active friends"
          value={safeCount(d.tree.l1Count)}
          icon={Users}
          family="financial"
          hint={`+${d.tree.thisMonth} this month`}
        />
      </div>

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
