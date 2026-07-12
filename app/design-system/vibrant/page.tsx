// VIBRANT COMMAND-CENTER v4 — direction study (founder v3 review: cards read "white + a stripe";
// make the CARDS THEMSELVES colorful). Every supporting card now carries its accent as a soft
// GRADIENT-TINTED body (.vh-soft — consistent saturation range across the six meaningful accents,
// premium multi-color not rainbow), gradient icon plates, stronger accent-tinted layered shadows,
// tighter density with a mini-viz on every card, and size hierarchy (focal col-span-2 cards +
// smaller supporting). Kept from v3: promo banner SLOT, green hero, glass chips, the saturated
// focal gradient cards, hero chart. EARN block remains ONLY for eligible affiliates (DR-040/
// DR-038; DR-043 recorded-not-payable, payouts OFF D-01). Every number is the viewer's REAL state
// via existing loaders — honest zeros, no fabrication, money static (D-29). Scoped .vh-*.
import Link from "next/link";
import { format } from "date-fns";
import {
  GraduationCap,
  BookOpen,
  Clock,
  Flame,
  Award,
  Package,
  Wallet,
  Coins,
  Hourglass,
  Banknote,
  Users,
  Network,
  CalendarDays,
  Trophy,
  Gift,
  ShieldCheck,
  ReceiptText,
  Target,
  TrendingUp,
  PlayCircle,
  Sparkles,
  ArrowRight,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "../../../lib/auth/session";
import { type HomeSummary } from "../../../lib/home/summary";
import { relativeDayLabel } from "../../../lib/home/feed";
import {
  safeMoney,
  formatCount,
  formatINRFromPaise,
} from "../../../lib/format";
import { Badge } from "../../../components/ui/badge";
import { DataValue } from "../../../components/data/data-value";
import { HeatStrip } from "../../../components/data/heat-strip";
import { NetworkNodes } from "../../../components/data/network-nodes";
import { AreaChart } from "../../../components/data/area-chart";
import { Spark } from "../../../components/data/spark";
import { DeviceTierProvider } from "../../../components/system/device-tier-provider";
import { CountUp, AnimatedRing } from "./vibrant-bits";
import { MiniBars } from "./vibrant-viz";
import { getVibrantData, type EarnBlock } from "./vibrant-data";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Vibrant Command Center v4 — direction study",
};

const KYC_LABEL: Record<string, { value: string; caption: string }> = {
  APPROVED: { value: "Approved", caption: "You're payout-ready." },
  SUBMITTED: { value: "In review", caption: "We're checking your documents." },
  REJECTED: { value: "Needs attention", caption: "Re-submit your documents." },
  DRAFT: {
    value: "In progress",
    caption: "Finish your KYC to get payout-ready.",
  },
};

export default async function VibrantHomePage() {
  const user = await getCurrentUser();
  const { summary, momentum, activity, kpis, earn } = await getVibrantData(
    user!.id,
  );
  const m = summary.metrics;
  const learnedToday = m.last7[m.last7.length - 1] > 0;

  return (
    <div className="vibrant-home min-h-dvh">
      <DeviceTierProvider />
      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-8">
        {/* Preview banner — this is a direction study, never the live surface. */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="gold">Direction study · v3 command center</Badge>
          <p className="text-caption text-ink-muted">
            Real data, honest zeros · earn block eligibility-gated · the live
            Home is unchanged.
          </p>
        </div>

        {/* ① PROMO BANNER SLOT — static placeholder; admin-managed media is a separate build. */}
        <section aria-label="Announcement banner" className="dc-enter">
          <Link
            href="/dashboard/learn/browse"
            className="vh-banner block p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2 md:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="vh-hero-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-bold uppercase tracking-wide">
                  <Megaphone className="h-3.5 w-3.5" aria-hidden />
                  Promo slot · admin-managed soon
                </span>
                <h2 className="mt-3 font-heading text-h2 font-extrabold leading-tight">
                  New skills are landing on GoSkilled
                </h2>
                <p className="mt-1 max-w-prose text-small text-white/80">
                  Browse the catalog — every course is mobile-first, in simple
                  Hinglish, with a verifiable certificate.
                </p>
              </div>
              <span className="vh-hero-chip inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-small font-bold">
                Browse courses
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </Link>
        </section>

        {/* ② Command hero — greeting + spark line + glance chips. */}
        <header className="vh-hero dc-enter p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="vh-hero-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-bold uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Founding Batch
              </span>
              <h1 className="mt-3 font-heading text-display font-extrabold leading-tight">
                {summary.greetingTitle}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-body text-white/85">
                <span style={{ color: "#EDC825" }}>
                  <Spark size={6} />
                </span>
                {summary.sparkLine}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <HeroChip
                icon={Flame}
                label={`${kpis.streak.current}d`}
                sub="streak"
              />
              <HeroChip
                icon={GraduationCap}
                label={`${kpis.overallPercent}%`}
                sub="progress"
              />
              <HeroChip
                icon={Award}
                label={formatCount(kpis.certificates)}
                sub="certs"
              />
            </div>
          </div>
        </header>

        {/* ③ Hero chart — the live-command-center panel. */}
        <section aria-label="Learning activity" className="dc-enter">
          <div className="vh-card vh-soft vh-accent-learn vh-chart-glow p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="vh-plate flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  aria-hidden
                >
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-heading text-h4 font-bold text-ink">
                    Learning activity
                  </h2>
                  <p className="text-caption text-ink-muted">Last 14 days</p>
                </div>
              </div>
              {momentum.learningTotal > 0 && (
                <div className="text-right">
                  <p className="dc-number text-h1 font-bold leading-none text-ink">
                    <CountUp value={momentum.learningTotal} />
                    <span className="dc-unit">
                      {momentum.learningTotal === 1 ? "lesson" : "lessons"}
                    </span>
                  </p>
                  {m.weekLessons > 0 && (
                    <p className="vh-delta mt-1 inline-flex rounded-full px-2.5 py-0.5 text-caption font-semibold">
                      ▲ {m.weekLessons} this week
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4">
              {momentum.learningTotal > 0 ? (
                <>
                  <AreaChart
                    points={momentum.learning}
                    height={140}
                    color="#137E49"
                    label="Lessons completed per day, last 14 days"
                  />
                  <p className="sr-only">
                    {momentum.learningTotal} lessons completed over the last 14
                    days
                  </p>
                </>
              ) : (
                <UnlockShell
                  line="Your momentum graph starts with your first lesson."
                  cta={{ label: "Start learning", href: "/dashboard/learn" }}
                />
              )}
            </div>
          </div>
        </section>

        {/* ④ LEARNING KPI grid — six real KPIs, one card system, meaningful accents. */}
        <section aria-label="Your learning">
          <SectionHead title="Your learning" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <VibrantMetric
              bold
              index={0}
              className="col-span-2"
              accent="vh-accent-learn"
              icon={GraduationCap}
              label="Progress"
              live={learnedToday}
              href="/dashboard/learn"
              value={
                <>
                  <CountUp value={kpis.overallPercent} />
                  <span className="dc-unit">%</span>
                </>
              }
              viz={
                <AnimatedRing
                  value={kpis.overallPercent}
                  size={48}
                  strokeWidth={5}
                  label={`Overall progress ${kpis.overallPercent}%`}
                >
                  <span aria-hidden />
                </AnimatedRing>
              }
              delta={
                m.weekLessons > 0
                  ? `▲ ${m.weekLessons} ${m.weekLessons === 1 ? "lesson" : "lessons"} this week`
                  : null
              }
              caption={
                m.weekLessons > 0
                  ? null
                  : summary.lifecycleNew
                    ? "Lesson 1 unlocks your analytics."
                    : "Pick up where you left off."
              }
            />
            <VibrantMetric
              index={1}
              accent="vh-accent-learn"
              icon={BookOpen}
              label="Courses"
              href="/dashboard/courses"
              value={
                <>
                  <CountUp value={kpis.coursesCompleted} />
                  <span className="dc-unit">/{kpis.coursesEnrolled} done</span>
                </>
              }
              viz={
                kpis.coursePercents.length > 0 ? (
                  <MiniBars
                    values={kpis.coursePercents}
                    max={100}
                    label={`Progress per enrolled course: ${kpis.coursePercents.join("%, ")}%`}
                  />
                ) : (
                  <BookOpen className="h-7 w-7" aria-hidden />
                )
              }
              caption={
                kpis.coursesEnrolled === 0
                  ? "Pick your first course to begin."
                  : "completed / enrolled"
              }
            />
            <VibrantMetric
              index={2}
              accent="vh-accent-cyan"
              icon={Clock}
              label="Learning time"
              href="/dashboard/progress"
              value={
                <span className="text-h3 font-bold leading-snug md:text-h2">
                  {kpis.learningTimeLabel}
                </span>
              }
              viz={
                <HeatStrip
                  values={m.last7}
                  label={`Active ${m.last7.filter((v) => v > 0).length} of the last 7 days`}
                />
              }
              caption={
                kpis.learningTimeLabel === "0 min"
                  ? "Your watched-lessons time appears here."
                  : "across completed lessons"
              }
            />
            <VibrantMetric
              index={3}
              className="col-span-2"
              accent="vh-accent-streak"
              icon={Flame}
              label="Streak"
              live={learnedToday && kpis.streak.current > 0}
              href="/dashboard/learn"
              value={
                <>
                  <CountUp value={kpis.streak.current} />
                  <span className="dc-unit">
                    {kpis.streak.current === 1 ? "day" : "days"}
                  </span>
                </>
              }
              viz={
                <HeatStrip
                  values={m.last7}
                  label={`Active ${m.last7.filter((v) => v > 0).length} of the last 7 days`}
                />
              }
              caption={
                kpis.streak.current === 0
                  ? "A lesson today starts your streak."
                  : kpis.streak.atRisk
                    ? "A lesson today keeps it going."
                    : kpis.streak.longest > kpis.streak.current
                      ? `Best: ${kpis.streak.longest} days`
                      : "Your best streak yet."
              }
            />
            <VibrantMetric
              index={4}
              accent="vh-accent-achieve"
              icon={Award}
              label="Certificates"
              href="/dashboard/progress"
              value={<CountUp value={kpis.certificates} />}
              viz={<Award className="h-8 w-8" aria-hidden />}
              caption={
                kpis.certificates === 0
                  ? "Your first seal awaits."
                  : "Verified & shareable."
              }
            />
            <VibrantMetric
              index={5}
              accent="vh-accent-earn"
              icon={Package}
              label="Package"
              href="/dashboard/learn/browse#packages"
              value={
                <span className="text-h3 font-bold leading-snug md:text-h2">
                  {kpis.packageName ?? "None yet"}
                </span>
              }
              caption={
                kpis.packageName
                  ? "your current package"
                  : "Pick a package to unlock everything."
              }
            />
          </div>
        </section>

        {/* ⑤ EARN block — ELIGIBLE AFFILIATES ONLY (DR-040/DR-038). Absent = recomposed away. */}
        {earn ? (
          <EarnSection earn={earn} earnSeries={momentum.earn?.series ?? null} />
        ) : (
          <NonEligibleSlot summary={summary} />
        )}

        {/* ⑥ For-you feed — real events only. */}
        <section aria-label="For you today" className="dc-enter">
          <SectionHead title="For you today" />
          <div className="vh-card vh-soft vh-accent-cyan p-2">
            <div className="space-y-1 pt-1.5">
              {summary.webinarToday && (
                <FeedRow
                  accent="vh-accent-cyan"
                  icon={CalendarDays}
                  title="Live webinar today"
                  description={`Starts at ${format(summary.webinarToday.startsAt, "h:mm a")}`}
                  time="Today"
                  href="/dashboard/learn/webinars"
                />
              )}
              {summary.streak.atRisk && (
                <FeedRow
                  accent="vh-accent-streak"
                  icon={Flame}
                  title="Keep your streak alive"
                  description="A 2-minute lesson today keeps it going."
                  time="Today"
                  href={summary.nextLesson?.href ?? "/dashboard/learn"}
                />
              )}
              {activity.map((e, i) => (
                <FeedRow
                  key={i}
                  accent={
                    e.kind === "certificate"
                      ? "vh-accent-achieve"
                      : e.kind === "referral"
                        ? "vh-accent-network"
                        : "vh-accent-learn"
                  }
                  icon={
                    e.kind === "certificate"
                      ? Award
                      : e.kind === "referral"
                        ? Users
                        : PlayCircle
                  }
                  title={e.title}
                  description={e.description}
                  time={relativeDayLabel(e.at)}
                />
              ))}
              {!summary.webinarToday &&
                !summary.streak.atRisk &&
                activity.length === 0 && (
                  <p className="px-3 py-6 text-center text-small text-ink-muted">
                    You&apos;re all caught up — new nudges appear here as you
                    learn and share.
                  </p>
                )}
            </div>
          </div>
        </section>

        <p className="text-caption text-ink-muted">
          Direction study only — colors/gradients/shadows/motion are the
          proposal; data, honesty rules, and eligibility gates are the
          product&apos;s own. Money never animates. Compare with the live{" "}
          <Link
            href="/dashboard/home"
            className="font-semibold text-theme-strong"
          >
            Home
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

// ── EARN block (eligible only) ───────────────────────────────────────────────────
function EarnSection({
  earn,
  earnSeries,
}: {
  earn: EarnBlock;
  earnSeries: number[] | null;
}) {
  const d = earn.dash;
  // Real recorded-commission series (last 7 of the 14-day window) for the lifetime card's bars.
  const last7Earn = earnSeries ? earnSeries.slice(-7) : null;
  const w = d.wallet;
  const totalNetwork = d.tree.l1Count + d.tree.l2Count + d.tree.l3Count;
  const kyc = d.kycStatus
    ? (KYC_LABEL[d.kycStatus] ?? {
        value: d.kycStatus,
        caption: "KYC status",
      })
    : { value: "Not started", caption: "Complete KYC to get payout-ready." };
  const activeReward =
    earn.rewards.find((r) => !r.achieved) ?? earn.rewards[0] ?? null;

  return (
    <section aria-label="Your earn numbers">
      <SectionHead
        title="Earn"
        sub={
          d.payoutsOpen
            ? "Recorded to your wallet."
            : "Recorded to your wallet — payouts open at launch."
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        <VibrantMetric
          bold
          index={0}
          className="col-span-2"
          accent="vh-accent-earn"
          icon={Wallet}
          label="Available"
          href="/dashboard/earn/wallet"
          badge={
            d.payoutsOpen && w.availableInPaise > 0 ? "Available" : undefined
          }
          value={<DataValue value={safeMoney(w.availableInPaise)} raiseUnit />}
          caption={
            d.payoutsOpen
              ? "cleared and in your wallet"
              : "cleared · payouts open at launch"
          }
        />
        <VibrantMetric
          index={1}
          accent="vh-accent-earn"
          icon={Coins}
          label="Lifetime recorded"
          href="/dashboard/earn/wallet"
          value={<DataValue value={safeMoney(w.totalInPaise)} raiseUnit />}
          viz={
            last7Earn ? (
              <MiniBars
                values={last7Earn}
                label="Commission recorded per day, last 7 days"
              />
            ) : undefined
          }
          caption="all commissions ever recorded"
        />
        <VibrantMetric
          index={2}
          accent="vh-accent-earn"
          icon={Hourglass}
          label="Pending"
          href="/dashboard/earn/wallet"
          value={<DataValue value={safeMoney(w.heldInPaise)} raiseUnit />}
          caption="held — clears after the 48h refund window"
        />
        <VibrantMetric
          index={3}
          accent="vh-accent-earn"
          icon={Banknote}
          label={d.payoutsOpen ? "Withdrawable" : "Withdrawable at launch"}
          href="/dashboard/earn/wallet"
          value={<DataValue value={safeMoney(w.availableInPaise)} raiseUnit />}
          caption={
            d.payoutsOpen
              ? "ready to withdraw from your wallet"
              : "recorded, not payable yet — opens at launch"
          }
        />
        <VibrantMetric
          index={4}
          accent="vh-accent-network"
          icon={Users}
          label="Total referrals"
          href="/dashboard/earn/network"
          value={<CountUp value={totalNetwork} />}
          viz={<NetworkNodes count={d.tree.l1Count} height={40} />}
          caption={
            totalNetwork === 0
              ? "Invite your first friend to build your network."
              : "across all three levels"
          }
        />
        <VibrantMetric
          index={5}
          accent="vh-accent-network"
          icon={Network}
          label="Network levels"
          href="/dashboard/earn/network"
          value={
            <span className="tabular-nums">
              {formatCount(d.tree.l1Count)}·{formatCount(d.tree.l2Count)}·
              {formatCount(d.tree.l3Count)}
            </span>
          }
          viz={
            <MiniBars
              values={[d.tree.l1Count, d.tree.l2Count, d.tree.l3Count]}
              label={`Network levels: L1 ${d.tree.l1Count}, L2 ${d.tree.l2Count}, L3 ${d.tree.l3Count}`}
            />
          }
          caption="L1 · L2 · L3"
        />
        <VibrantMetric
          index={6}
          accent="vh-accent-network"
          icon={CalendarDays}
          label="This month"
          href="/dashboard/earn/network"
          value={<CountUp value={d.tree.thisMonth} />}
          viz={<NetworkNodes count={d.tree.thisMonth} height={36} />}
          caption={
            d.tree.thisMonth === 0
              ? "No new referrals yet this month."
              : "friends joined this month"
          }
        />
        <VibrantMetric
          index={7}
          accent="vh-accent-achieve"
          icon={Trophy}
          label="Leaderboard"
          href="/dashboard/earn/leaderboard"
          value={
            earn.rank ? (
              <>
                #<CountUp value={earn.rank.rank} />
              </>
            ) : (
              <span className="text-h3 font-bold leading-snug md:text-h2">
                Not ranked
              </span>
            )
          }
          caption={
            earn.rank
              ? `${earn.rank.completedReferrals} completed ${earn.rank.completedReferrals === 1 ? "referral" : "referrals"}`
              : "Rank comes from friends who complete their course."
          }
        />
        <VibrantMetric
          index={8}
          accent="vh-accent-achieve"
          icon={Gift}
          label="Reward progress"
          href="/dashboard/earn/rewards"
          value={
            activeReward ? (
              <>
                <CountUp value={activeReward.current} />
                <span className="dc-unit">/{activeReward.target}</span>
              </>
            ) : (
              <span className="text-h3 font-bold leading-snug md:text-h2">
                None active
              </span>
            )
          }
          viz={
            activeReward ? (
              <AnimatedRing
                value={activeReward.percent}
                size={44}
                strokeWidth={5}
                label={`${activeReward.percent}% toward ${activeReward.title}`}
              >
                <span aria-hidden />
              </AnimatedRing>
            ) : undefined
          }
          caption={
            activeReward
              ? activeReward.achieved
                ? `${activeReward.title} — achieved!`
                : activeReward.title
              : "Rewards appear here when admin launches one."
          }
        />
        <VibrantMetric
          index={9}
          accent="vh-accent-cyan"
          icon={ShieldCheck}
          label="KYC"
          href="/dashboard/earn/kyc"
          value={
            <span className="text-h3 font-bold leading-snug md:text-h2">
              {kyc.value}
            </span>
          }
          viz={<ShieldCheck className="h-7 w-7" aria-hidden />}
          caption={kyc.caption}
        />
        <VibrantMetric
          index={10}
          accent="vh-accent-cyan"
          icon={ReceiptText}
          label="Withdrawal"
          href="/dashboard/earn/wallet"
          value={
            earn.latestWithdrawal ? (
              <span className="text-h3 font-bold capitalize leading-snug md:text-h2">
                {earn.latestWithdrawal.status.toLowerCase().replace(/_/g, " ")}
              </span>
            ) : (
              <span className="text-h3 font-bold leading-snug md:text-h2">
                None yet
              </span>
            )
          }
          caption={
            earn.latestWithdrawal
              ? `${formatINRFromPaise(earn.latestWithdrawal.amountInPaise)} · ${relativeDayLabel(earn.latestWithdrawal.requestedAt)}`
              : "Your withdrawal requests will appear here."
          }
        />
      </div>
    </section>
  );
}

/** Non-eligible / hidden-layer slot — people-not-money (DR-038) or learning-first (DR-040). */
function NonEligibleSlot({ summary }: { summary: HomeSummary }) {
  const { earn } = summary;
  if (earn.kind === "network") {
    return (
      <section aria-label="Your network">
        <SectionHead title="Your network" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <VibrantMetric
            bold
            index={0}
            accent="vh-accent-network"
            icon={Users}
            label="Friends joined"
            href="/dashboard/earn"
            value={<CountUp value={earn.l1Count} />}
            viz={<NetworkNodes count={earn.l1Count} height={40} />}
            caption={
              earn.l1Count === 0
                ? "See how earning works."
                : "joined with your link"
            }
          />
        </div>
      </section>
    );
  }
  if (earn.kind === "hidden" && summary.webinarNext) {
    return (
      <section aria-label="Next webinar">
        <SectionHead title="Coming up" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <VibrantMetric
            index={0}
            accent="vh-accent-cyan"
            icon={CalendarDays}
            label="Next webinar"
            href="/dashboard/learn/webinars"
            badge={summary.webinarToday ? "Today" : undefined}
            value={
              <span className="text-h3 font-bold leading-snug md:text-h2">
                {format(summary.webinarNext.startsAt, "EEE, d MMM")}
              </span>
            }
            caption={summary.webinarNext.title}
          />
          <VibrantMetric
            index={1}
            accent="vh-accent-achieve"
            icon={Target}
            label="Next milestone"
            href="/dashboard/progress"
            value={
              <span className="text-h4 font-bold leading-snug">
                {summary.nextMilestone ?? "All earned"}
              </span>
            }
            caption="Your next learning achievement."
          />
        </div>
      </section>
    );
  }
  return null;
}

// ── shared mockup pieces ─────────────────────────────────────────────────────────
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="font-heading text-h4 font-bold text-ink">{title}</h2>
      {sub && <p className="text-caption text-ink-muted">{sub}</p>}
    </div>
  );
}

function HeroChip({
  icon: Icon,
  label,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
}) {
  return (
    <span className="vh-hero-chip inline-flex items-center gap-2 rounded-2xl px-3.5 py-2">
      <Icon className="h-4 w-4" aria-hidden />
      <span className="dc-number text-h4 font-bold leading-none">{label}</span>
      <span className="text-caption text-white/75">{sub}</span>
    </span>
  );
}

function VibrantMetric({
  accent,
  bold = false,
  index = 0,
  icon: Icon,
  label,
  value,
  viz,
  delta,
  caption,
  live = false,
  href,
  badge,
  className = "",
}: {
  accent: string;
  bold?: boolean;
  index?: number;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  viz?: React.ReactNode;
  delta?: string | null;
  caption?: string | null;
  live?: boolean;
  href: string;
  badge?: string;
  /** Grid span / sizing hooks (hierarchy — a few larger focal cards + smaller supporting). */
  className?: string;
}) {
  const ink = bold ? "text-white" : "text-ink";
  const muted = bold ? "text-white/80" : "text-ink-muted";
  return (
    <Link
      href={href}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className={`vh-card dc-enter ${accent} ${bold ? "vh-bold" : "vh-soft"} flex h-full flex-col p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2 md:p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`${bold ? "vh-plate" : "vh-plate-grad"} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        {badge && (
          <span className="vh-delta rounded-full px-2 py-0.5 text-caption font-bold uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {live ? (
          <span className={bold ? "text-white" : "vh-text"}>
            <Spark size={6} />
          </span>
        ) : null}
        <p className={`font-heading text-small font-semibold ${ink}`}>
          {label}
        </p>
      </div>
      <div className="mt-1.5 flex flex-1 items-end justify-between gap-3">
        <p
          className={`dc-number text-h2 font-bold leading-none md:text-h1 ${ink}`}
        >
          {value}
        </p>
        {viz && (
          <div className={`shrink-0 pb-0.5 ${bold ? "text-white" : "vh-text"}`}>
            {viz}
          </div>
        )}
      </div>
      {delta ? (
        <p className="vh-delta mt-2 inline-flex w-fit rounded-full px-2.5 py-1 text-caption font-semibold">
          {delta}
        </p>
      ) : caption ? (
        <p className={`mt-2 text-caption leading-snug ${muted}`}>{caption}</p>
      ) : null}
    </Link>
  );
}

function UnlockShell({
  line,
  cta,
}: {
  line: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-[6.5rem] flex-col items-start justify-center gap-2">
      <p className="max-w-prose text-body text-ink-muted">{line}</p>
      <Link
        href={cta.href}
        className="inline-flex items-center gap-1 rounded text-small font-semibold text-theme-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
      >
        {cta.label}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function FeedRow({
  accent,
  icon: Icon,
  title,
  description,
  time,
  href,
}: {
  accent: string;
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  href?: string;
}) {
  const inner = (
    <>
      <span
        className={`vh-plate ${accent} flex h-10 w-10 shrink-0 items-center justify-center rounded-full`}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-small font-semibold text-ink">{title}</p>
          <span className="shrink-0 text-caption text-ink-muted">{time}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-caption text-ink-muted">
          {description}
        </p>
      </div>
    </>
  );
  const cls =
    "flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-charcoal/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
