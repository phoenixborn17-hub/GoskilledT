"use client";
/**
 * GoSkilled Design System — living showcase (Redesign U1 · founder visual pass).
 * Renders the token ramps + the component library from real props so the built system can be
 * reviewed (style tile → real components). NOT a product route — internal reference only, noindex.
 * Every money/stat here is passed via safeMoney/safeCount so the fail-safe Error state is visible.
 */
import * as React from "react";
import {
  BookOpen,
  Wallet,
  Award,
  Users,
  Flame,
  Share2,
  PlayCircle,
  Bell,
  Sparkles,
  Rocket,
  GraduationCap,
  Briefcase,
  Home as HomeIcon,
  CheckCircle2,
} from "lucide-react";

import { DeviceTierProvider } from "../../components/system/device-tier-provider";
import { ToastProvider, useToast } from "../../components/ui/toast";
import { safeMoney, safeCount } from "../../lib/format";

// Decision Cards (DecisionCard_System v1.0) — the sprint focus.
import { BentoGrid, BentoItem } from "../../components/cards/decision/bento";
import { ContinueLearningCard } from "../../components/cards/decision/continue-learning-card";
import { WalletEarnCard } from "../../components/cards/decision/wallet-earn-card";
import { NetworkCard } from "../../components/cards/decision/network-card";
import { RewardsCard } from "../../components/cards/decision/rewards-card";
import { StreakCard } from "../../components/cards/decision/streak-card";
import { ProgressCard } from "../../components/cards/decision/progress-card";
import { AnalyticsCard } from "../../components/cards/decision/analytics-card";

import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import { Badge } from "../../components/ui/badge";
import { Chip } from "../../components/ui/chip";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Radio } from "../../components/ui/radio";
import { Switch } from "../../components/ui/switch";
import { Avatar } from "../../components/ui/avatar";
import { Tooltip } from "../../components/ui/tooltip";
import { Tabs } from "../../components/ui/tabs";
import { Stepper } from "../../components/ui/stepper";
import { Breadcrumb } from "../../components/ui/breadcrumb";
import { Alert } from "../../components/ui/alert";
import { EmptyState } from "../../components/ui/empty-state";
import { ErrorState } from "../../components/ui/error-state";
import { ComingSoon } from "../../components/ui/coming-soon";
import { Modal } from "../../components/ui/modal";
import { Drawer } from "../../components/ui/drawer";
import { Popover } from "../../components/ui/popover";

import { StatCard } from "../../components/cards/stat-card";
import { WalletCard } from "../../components/cards/wallet-card";
import { ChartCard } from "../../components/cards/chart-card";
import { ShareWidget } from "../../components/cards/share-widget";
import { GettingStartedCard } from "../../components/cards/getting-started-card";
import { HeroBanner } from "../../components/cards/hero-banner";
import { AnnouncementBanner } from "../../components/cards/announcement-banner";
import { QuickActionCard } from "../../components/cards/quick-action-card";
import { NotificationCard } from "../../components/cards/notification-card";
import { CourseCard } from "../../components/cards/course-card";
import { CertificateCard } from "../../components/cards/certificate-card";
import { RewardCard } from "../../components/cards/reward-card";
import { LeaderboardCard } from "../../components/cards/leaderboard-card";
import { AISuggestionCard } from "../../components/cards/ai-suggestion-card";
import { ProfileCard } from "../../components/cards/profile-card";

import { ProgressRing } from "../../components/data/progress-ring";
import { ProgressBar } from "../../components/data/progress-bar";
import { Sparkline } from "../../components/data/sparkline";
import { KpiTile } from "../../components/data/kpi-tile";
import { StatValue } from "../../components/data/stat-value";
import { Timeline } from "../../components/data/timeline";
import { DataTable } from "../../components/data/data-table";
import { DataValue } from "../../components/data/data-value";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-h3 font-bold text-ink">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-small text-ink-muted">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

const RAMPS: { name: string; steps: string[] }[] = [
  {
    name: "Green (Learn)",
    steps: [
      "bg-green-50",
      "bg-green-100",
      "bg-green-200",
      "bg-green-300",
      "bg-green-400",
      "bg-green-500",
      "bg-green-600",
      "bg-green-700",
      "bg-green-800",
      "bg-green-900",
    ],
  },
  {
    name: "Gold (Earn) — fills only",
    steps: [
      "bg-goldr-50",
      "bg-goldr-100",
      "bg-goldr-200",
      "bg-goldr-300",
      "bg-goldr-400",
      "bg-goldr-500",
      "bg-goldr-600",
      "bg-goldr-700",
      "bg-goldr-800",
      "bg-goldr-900",
    ],
  },
  {
    name: "Neutral (green-tinted)",
    steps: [
      "bg-n-050",
      "bg-n-100",
      "bg-n-150",
      "bg-n-200",
      "bg-n-300",
      "bg-n-400",
      "bg-n-500",
      "bg-n-600",
      "bg-n-700",
      "bg-n-800",
      "bg-n-900",
    ],
  },
];

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        className="w-auto"
        onClick={() =>
          toast({ title: "Copied to clipboard", variant: "success" })
        }
      >
        Success toast
      </Button>
      <Button
        variant="outline"
        className="w-auto"
        onClick={() =>
          toast({
            title: "Couldn't load wallet",
            description: "Check your connection and retry.",
            variant: "error",
          })
        }
      >
        Error toast
      </Button>
    </div>
  );
}

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const trend = [3, 5, 4, 8, 7, 11, 13];

  return (
    <ToastProvider>
      <DeviceTierProvider />
      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 md:px-8">
        <header className="space-y-2">
          <Badge variant="brand">Redesign U1 · Design System</Badge>
          <h1 className="font-heading text-display font-extrabold text-ink">
            GoSkilled Experience System
          </h1>
          <p className="max-w-prose text-body text-ink-muted">
            The single token + component source of truth. Green (Learn) · Gold
            (Earn) · neutral, on Sora + Inter. Every money value renders from
            real data or an honest Error state — never ₹0.
          </p>
        </header>

        <Section
          title="Decision Cards — sample bento dashboard"
          subtitle="7 families, distinct layouts + signature viz, real Lucide icons (zero emoji), in-card AI (real trigger only), one CTA, whole-card clickable. Bento hierarchy: hero > primary > secondary > wide."
        >
          <BentoGrid>
            <BentoItem size="hero">
              <ContinueLearningCard
                index={0}
                href="#"
                courseTitle="Instagram Growth Mastery"
                lessonLabel="Module 3 · Lesson 5 — Reels that convert"
                percent={72}
                aiLine="Finish Lesson 3 today to unlock your first certificate."
              />
            </BentoItem>
            <BentoItem size="primary">
              <WalletEarnCard
                index={1}
                href="#"
                available={safeMoney(1245000)}
                pending={safeMoney(45000)}
                payoutStatus="Recorded & safe · payouts open soon"
                trend={[4, 6, 5, 9, 8, 12, 15]}
              />
            </BentoItem>
            <BentoItem size="primary">
              <NetworkCard
                index={2}
                href="#"
                activeL1={8}
                thisMonth={3}
                aiLine="Invite 2 more to reach Bronze this week."
              />
            </BentoItem>
            <BentoItem size="secondary">
              <ProgressCard
                index={3}
                href="#"
                percent={64}
                nextMilestone="3 lessons to your certificate"
              />
            </BentoItem>
            <BentoItem size="secondary">
              <StreakCard
                index={4}
                href="#"
                days={5}
                aiLine="Do 1 lesson today to keep your streak alive."
              />
            </BentoItem>
            <BentoItem size="secondary">
              <RewardsCard
                index={5}
                href="#"
                tier="Contributor"
                awayText="1 referral away · Silver"
                total={4}
                reached={2}
                labels={["Bronze", "Silver", "Gold", "Champ"]}
              />
            </BentoItem>
            <BentoItem size="secondary">
              <StreakCard
                index={6}
                href="#"
                days={12}
                atRisk
                aiLine="Your streak ends tonight — a 2-min lesson keeps it going."
              />
            </BentoItem>
            <BentoItem size="wide">
              <AnalyticsCard
                index={7}
                href="#"
                label="Learning activity"
                headline={1240}
                headlineSuffix="min"
                points={[20, 35, 28, 44, 52, 48, 63]}
                deltaPct={18.4}
              />
            </BentoItem>
          </BentoGrid>
        </Section>

        <Section
          title="Decision Cards — honest states"
          subtitle="Money-fail-safe (never ₹0), AI line omitted when no real trigger, loading skeleton, calm error+retry."
        >
          <BentoGrid>
            <BentoItem size="secondary">
              <WalletEarnCard
                href="#"
                available={safeMoney(null)}
                pending={safeMoney(null)}
                payoutStatus="Recorded & safe · payouts open soon"
                onRetry={() => undefined}
              />
            </BentoItem>
            <BentoItem size="secondary">
              {/* No aiLine → the ✨ line is omitted entirely, never faked (D-29). */}
              <ProgressCard
                href="#"
                percent={40}
                nextMilestone="Keep going — your next badge is close."
              />
            </BentoItem>
            <BentoItem size="secondary">
              <ContinueLearningCard
                href="#"
                size="secondary"
                courseTitle=""
                lessonLabel=""
                percent={0}
                state="loading"
              />
            </BentoItem>
            <BentoItem size="secondary">
              <NetworkCard
                href="#"
                activeL1={0}
                thisMonth={0}
                state="error"
                onRetry={() => undefined}
              />
            </BentoItem>
          </BentoGrid>
        </Section>

        <Section title="Colour ramps" subtitle="50 → 900, from CSS tokens.">
          <div className="space-y-4">
            {RAMPS.map((ramp) => (
              <div key={ramp.name}>
                <p className="mb-1.5 text-caption font-semibold text-ink-muted">
                  {ramp.name}
                </p>
                <div className="flex overflow-hidden rounded-gs border border-line">
                  {ramp.steps.map((s) => (
                    <div key={s} className={`h-10 flex-1 ${s}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Typography"
          subtitle="Sora display/headings · Inter body."
        >
          <div className="space-y-1.5 rounded-gs border border-line bg-surface-raised p-6">
            <p className="font-heading text-display font-extrabold text-ink">
              Display · Seekho. Badho. Kamao.
            </p>
            <p className="font-heading text-h1 font-bold text-ink">
              H1 · Making potential visible
            </p>
            <p className="font-heading text-h2 font-bold text-ink">
              H2 · Learn in-demand skills
            </p>
            <p className="font-heading text-h3 font-semibold text-ink">
              H3 · Your progress this week
            </p>
            <p className="text-body text-ink">
              Body · Practical, job-ready skills in Hinglish — learn at your own
              pace.
            </p>
            <p className="text-small text-ink-muted">
              Small · Supporting information and metadata.
            </p>
            <p className="text-caption uppercase tracking-wide text-ink-muted">
              Caption · Labels
            </p>
          </div>
        </Section>

        <Section title="Buttons & controls">
          <div className="flex flex-wrap items-center gap-3 rounded-gs border border-line bg-surface-raised p-6">
            <Button className="w-auto">Primary</Button>
            <Button variant="outline" className="w-auto">
              Outline
            </Button>
            <Button variant="ghost" className="w-auto">
              Ghost
            </Button>
            <Button variant="gold" className="w-auto">
              Gold (Earn)
            </Button>
            <Button loading className="w-auto">
              Loading
            </Button>
            <IconButton aria-label="Share">
              <Share2 className="h-5 w-5" />
            </IconButton>
            <Tooltip content="Ask Guru anything">
              <IconButton aria-label="Guru" variant="outline">
                <Sparkles className="h-5 w-5" />
              </IconButton>
            </Tooltip>
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid gap-4 rounded-gs border border-line bg-surface-raised p-6 md:grid-cols-2">
            <Input placeholder="Mobile number" aria-label="Mobile number" />
            <Select aria-label="Package" defaultValue="">
              <option value="" disabled>
                Choose a package
              </option>
              <option>Skill Builder</option>
              <option>Career Booster</option>
            </Select>
            <Textarea placeholder="Tell us your goal…" aria-label="Goal" />
            <div className="space-y-3">
              <Checkbox label="I agree to the terms" defaultChecked />
              <Radio name="demo" label="Skill" defaultChecked />
              <Radio name="demo" label="Income" />
              <Switch label="Notify me when payouts open" />
            </div>
          </div>
        </Section>

        <Section title="Badges, chips & avatars">
          <div className="flex flex-wrap items-center gap-3 rounded-gs border border-line bg-surface-raised p-6">
            <Badge variant="brand">Owned</Badge>
            <Badge variant="gold">Mentor</Badge>
            <Badge variant="muted">Coming soon</Badge>
            <Badge variant="outline">Draft</Badge>
            <Chip selected>All</Chip>
            <Chip>Learning</Chip>
            <Chip>Earning</Chip>
            <Chip onRemove={() => undefined}>Filter: This month</Chip>
            <Avatar name="Aarav Sharma" />
            <Avatar name="Priya" size="lg" />
          </div>
        </Section>

        <Section
          title="Money-never-fail-to-zero (Amendments §B)"
          subtitle="Left: real data. Right: data failed to load → Retry, never ₹0."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total earned"
              value={safeMoney(1575000)}
              icon={Wallet}
              family="financial"
              hint="Buyer-protected for 48h"
            />
            <StatCard
              label="Available"
              value={safeMoney(null)}
              icon={Wallet}
              family="financial"
              onRetry={() => undefined}
            />
            <StatCard
              label="Referrals"
              value={safeCount(42)}
              icon={Users}
              family="learning"
              trend={{ points: trend, deltaPct: 18.4 }}
            />
            <StatCard
              label="Courses"
              value={safeCount(3)}
              icon={BookOpen}
              family="learning"
              state="loading"
            />
          </div>
        </Section>

        <Section title="Wallet & charts (Financial + Analytics families)">
          <div className="grid gap-4 lg:grid-cols-2">
            <WalletCard
              available={safeMoney(0)}
              held={safeMoney(45000)}
              total={safeMoney(45000)}
              statusLine="Earnings recorded & safe. Payouts open soon — we'll notify you."
            />
            <ChartCard title="Earnings over time">
              <div className="flex h-40 items-end">
                <Sparkline
                  points={trend}
                  width={480}
                  height={150}
                  className="w-full"
                />
              </div>
            </ChartCard>
            <ChartCard title="Network growth" state="empty" />
            <ChartCard
              title="Weekly progress"
              state="error"
              onRetry={() => undefined}
            />
          </div>
        </Section>

        <Section title="Data display">
          <div className="grid gap-4 rounded-gs border border-line bg-surface-raised p-6 md:grid-cols-2">
            <div className="flex items-center gap-6">
              <ProgressRing value={72} />
              <div className="flex-1 space-y-3">
                <ProgressBar value={72} showValue label="Course completion" />
                <div className="text-h1 font-bold text-ink">
                  <StatValue value={1240} countUp /> learners
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KpiTile
                label="Active learners"
                value={<StatValue value={1240} />}
                icon={Users}
                deltaPct={12.5}
              />
              <KpiTile
                label="Completions"
                value={<StatValue value={318} />}
                icon={Award}
                deltaPct={-3.2}
              />
            </div>
          </div>
          <Timeline
            className="rounded-gs border border-line bg-surface-raised p-6"
            events={[
              {
                id: "1",
                icon: CheckCircle2,
                title: "Completed 'Intro to Digital Marketing'",
                time: "2h ago",
                tone: "success",
              },
              {
                id: "2",
                icon: Users,
                title: "Rahul joined with your link",
                time: "Yesterday",
                tone: "brand",
              },
              {
                id: "3",
                icon: Award,
                title: "Certificate unlocked",
                time: "3d ago",
                tone: "warning",
              },
            ]}
          />
          <DataTable
            className="rounded-gs border border-line bg-surface-raised p-2"
            rowKey={(r) => r.id}
            rows={[
              { id: "1", name: "Aarav", refs: 12, earned: 180000 },
              { id: "2", name: "Priya", refs: 9, earned: 135000 },
              { id: "3", name: "Rohan", refs: 7, earned: 105000 },
            ]}
            columns={[
              { key: "name", header: "Name", render: (r) => r.name },
              {
                key: "refs",
                header: "Referrals",
                align: "right",
                sortable: true,
                sortValue: (r) => r.refs,
                render: (r) => r.refs,
              },
              {
                key: "earned",
                header: "Earned",
                align: "right",
                sortable: true,
                sortValue: (r) => r.earned,
                render: (r) => <DataValue value={safeMoney(r.earned)} />,
              },
            ]}
          />
        </Section>

        <Section title="Cards — Learning & Earning families">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CourseCard
              title="Digital Marketing Mastery"
              meta="8 modules · 4h"
              progress={45}
              owned
              action={
                <Button className="w-full">
                  <PlayCircle className="h-4 w-4" /> Resume
                </Button>
              }
            />
            <CertificateCard
              title="Certified Digital Marketer"
              issuedOn="12 Jun 2026"
              serial="GS-DM-004821"
              action={
                <Button variant="outline" className="w-full">
                  Share on WhatsApp
                </Button>
              }
            />
            <RewardCard
              title="Community Champion"
              description="Refer friends who start learning"
              progress={60}
              progressLabel="12 of 20 referrals"
              lastDate="31 Jul"
            />
            <LeaderboardCard
              rank={2}
              name="Priya Nair"
              metricLabel="referrals"
              metricValue="18"
              tier="Mentor"
            />
            <LeaderboardCard
              rank={7}
              name="You"
              metricLabel="referrals"
              metricValue="9"
              tier="Contributor"
              isSelf
            />
            <AISuggestionCard
              title="Continue Module 4 of Digital Marketing"
              reason="You're 45% through — 20 min to finish this module."
              onDismiss={() => undefined}
              action={
                <Button variant="outline" className="w-auto">
                  Resume
                </Button>
              }
            />
            <ProfileCard
              name="Aarav Sharma"
              referralCode="AARAV42"
              joinedOn="Jan 2026"
              tier="Contributor"
            />
            <NotificationCard
              icon={Bell}
              title="Your certificate is ready"
              description="Download or share it now."
              time="1h"
              unread
              tone="success"
            />
            <QuickActionCard
              icon={Wallet}
              label="Open Wallet"
              href="#"
              primary
            />
          </div>
        </Section>

        <Section title="Hero, announcement, getting-started & share">
          <HeroBanner
            tone="learn"
            title="Welcome back, Aarav 👋"
            description="You're on a 4-day streak. Finish Module 4 to unlock your certificate."
            action={<Button className="w-auto">Continue learning</Button>}
          />
          <AnnouncementBanner
            dismissible
            title="Sunday concept webinar at 6 PM"
            description="Join live and ask questions."
            action={
              <Button variant="outline" className="w-auto">
                Register
              </Button>
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <GettingStartedCard
              icon={Rocket}
              subtitle="3 quick steps to your first win"
              steps={[
                { title: "Pick your first course", done: true },
                {
                  title: "Watch your first lesson",
                  description: "Just 2 minutes to your first win",
                  action: <Button className="w-auto">Start lesson</Button>,
                },
                { title: "Share your referral link" },
              ]}
            />
            <ShareWidget
              link="https://goskilled.in/r/AARAV42"
              whatsappMessage="Main GoSkilled par seekh raha hoon — tu bhi join kar: https://goskilled.in/r/AARAV42"
              commissionValue="₹150–₹250 per referral"
            />
          </div>
        </Section>

        <Section title="States — empty · error · coming-soon">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-gs border border-line bg-surface-raised">
              <EmptyState
                icon={BookOpen}
                title="Start your first lesson"
                description="Pick a course and finish your first lesson in 2 minutes."
                action={<Button className="w-auto">Browse courses</Button>}
              />
            </div>
            <div className="rounded-gs border border-line bg-surface-raised">
              <ErrorState onRetry={() => undefined} />
            </div>
            <ComingSoon
              title="Daily Missions"
              description="Bite-sized daily goals to keep your streak alive."
            />
          </div>
          <Alert variant="warning" title="Heads up">
            Payouts are not open yet — your earnings are recorded and safe.
          </Alert>
        </Section>

        <Section title="Navigation & flow">
          <Breadcrumb
            items={[
              { label: "Home", href: "#" },
              { label: "Earn", href: "#" },
              { label: "Wallet" },
            ]}
          />
          <Stepper
            className="rounded-gs border border-line bg-surface-raised p-6"
            current={1}
            steps={[
              { label: "Verify identity" },
              { label: "Bank details" },
              { label: "Get payout-ready" },
            ]}
          />
          <Tabs
            className="rounded-gs border border-line bg-surface-raised p-4"
            items={[
              {
                value: "overview",
                label: "Overview",
                content: (
                  <p className="text-small text-ink-muted">
                    Wallet overview panel.
                  </p>
                ),
              },
              {
                value: "tx",
                label: "Transactions",
                content: (
                  <p className="text-small text-ink-muted">Ledger panel.</p>
                ),
              },
            ]}
          />
          <div className="flex flex-wrap gap-3">
            <QuickActionCard icon={HomeIcon} label="Home" href="#" />
            <QuickActionCard icon={GraduationCap} label="Learn" href="#" />
            <QuickActionCard icon={Briefcase} label="Earn" href="#" />
            <QuickActionCard icon={Flame} label="Streak" href="#" />
          </div>
        </Section>

        <Section title="Overlays & feedback (interactive)">
          <div className="flex flex-wrap gap-3">
            <Button className="w-auto" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Button
              variant="outline"
              className="w-auto"
              onClick={() => setDrawerOpen(true)}
            >
              Open drawer
            </Button>
            <Popover
              trigger={
                <Button variant="outline" className="w-auto">
                  Open popover
                </Button>
              }
            >
              <div className="p-2 text-small text-ink">Profile menu</div>
            </Popover>
            <ToastDemo />
          </div>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Withdraw earnings"
            description="Payouts open soon — we'll notify you the moment they do."
            footer={
              <Button className="w-auto" onClick={() => setModalOpen(false)}>
                Got it
              </Button>
            }
          >
            <p className="text-small text-ink-muted">
              Your earnings are recorded and safe in your wallet.
            </p>
          </Modal>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Menu"
          >
            <p className="text-small text-ink-muted">
              Mobile navigation drawer.
            </p>
          </Drawer>
        </Section>

        <Section
          title="Workspace theme switch (green ↔ gold)"
          subtitle="Identical components; only the [data-theme] wrapper changes. The `theme` token re-skins accents, chips, rings, and stat-card family in place."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div
              data-theme="learn"
              className="rounded-gs-lg border border-line bg-surface p-6"
            >
              <p className="mb-3 text-caption font-semibold uppercase text-ink-muted">
                data-theme=&quot;learn&quot;
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="h-9 w-24 rounded-full bg-theme" />
                <Chip selected>Active</Chip>
                <ProgressRing value={64} size={56} />
                <Avatar name="Learn User" />
              </div>
            </div>
            <div
              data-theme="earn"
              className="rounded-gs-lg border border-line bg-surface p-6"
            >
              <p className="mb-3 text-caption font-semibold uppercase text-ink-muted">
                data-theme=&quot;earn&quot;
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="h-9 w-24 rounded-full bg-theme" />
                <Chip selected>Active</Chip>
                <ProgressRing value={64} size={56} />
                <Avatar name="Earn User" />
              </div>
            </div>
          </div>
        </Section>
      </main>
    </ToastProvider>
  );
}
