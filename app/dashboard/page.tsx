// Dashboard Hub (DR-030 §6) — the landing surface (Home tab). Mobile-first vertical stack; desktop
// 2-col grid for the lower cards. Every card has a truthful zero/locked/coming-soon state — none
// ever renders blank. No income language, no ₹, no scarcity anywhere on Day-0 surfaces (D-29).
import Link from "next/link";
import { format } from "date-fns";
import {
  Users,
  CalendarDays,
  Sparkles,
  Lock,
  PlayCircle,
  CheckCircle2,
  Award,
} from "lucide-react";
import { getCurrentUser } from "../../lib/auth/session";
import { getHubData } from "../../lib/dashboard/hub";
import { AFFILIATE_COPY } from "../../lib/affiliate/copy";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ShareBlock } from "../../components/affiliate/share-block";
import {
  ChecklistCard,
  type ChecklistItemView,
} from "../../components/dashboard/hub/checklist-card";

export const dynamic = "force-dynamic";

const GOAL_CHIP: Record<string, string> = {
  SKILL: "Learning a skill",
  INCOME: "Building for the future",
  BOTH: "Learning at my own pace",
};

export default async function DashboardHubPage() {
  const user = await getCurrentUser();
  const hub = await getHubData(user!.id);

  return (
    <section aria-labelledby="hub-heading" className="space-y-6">
      {/* 1 · Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="hub-heading" className="font-heading text-2xl font-bold">
            Namaste{hub.name ? `, ${hub.name}` : ""}
          </h1>
          {hub.goal && GOAL_CHIP[hub.goal] && (
            <p className="mt-1 text-sm text-muted">{GOAL_CHIP[hub.goal]}</p>
          )}
        </div>
        <Badge variant="gold">Founding Batch</Badge>
      </header>

      {/* 2 · Get-Started checklist */}
      {!hub.checklist.dismissed && (
        <ChecklistCard
          items={hub.checklist.items as ChecklistItemView[]}
          doneCount={hub.checklist.doneCount}
          total={hub.checklist.total}
        />
      )}

      {/* 3 · Continue (hero) — always a resume action */}
      <Card className="bg-brand/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {hub.continue.eyebrow}
        </p>
        <div className="mt-1 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-xl font-bold text-charcoal">
              {hub.continue.title}
            </p>
            <p className="mt-0.5 text-sm text-muted">{hub.continue.subtitle}</p>
          </div>
          {typeof hub.continue.percent === "number" && (
            <span className="shrink-0 text-sm font-bold text-brand">
              {hub.continue.percent}%
            </span>
          )}
        </div>
        <div className="mt-4 max-w-[14rem]">
          <Link href={hub.continue.href}>
            <Button>{hub.continue.cta}</Button>
          </Link>
        </div>
      </Card>

      {/* 4 · Learn — both launch courses, full syllabus, first lesson free */}
      <LearnCard courses={hub.learnCourses} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* 5 · Earn — invite-only pre-D-01 (no ₹, real invite count) */}
        <EarnCard shareUrl={hub.shareUrl} inviteCount={hub.inviteCount} />

        {/* 6 · Webinar — opportunity, never a prerequisite */}
        <WebinarCard
          startsAt={hub.webinar.startsAt}
          title={hub.webinar.title}
        />

        {/* 7 · Guru — the AI Hinglish tutor (GPS-M5 §2.1). Opens on your continue-lesson. */}
        <GuruCard continueHref={hub.continue.href} />
      </div>
    </section>
  );
}

function LearnCard({
  courses,
}: {
  courses: Awaited<ReturnType<typeof getHubData>>["learnCourses"];
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="text-lg">Learn</CardTitle>
        <Link
          href="/dashboard/learn"
          className="text-sm font-semibold text-brand"
        >
          My courses →
        </Link>
      </div>

      {courses.length === 0 ? (
        <CardDescription>
          Courses are being prepared — check back shortly.
        </CardDescription>
      ) : (
        courses.map((c) => (
          <div
            key={c.slug}
            className="rounded-xl border border-charcoal/10 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-heading font-bold text-charcoal">
                  {c.title}
                </p>
                <p className="text-xs text-muted">
                  {c.lessonCount} lessons
                  {c.percent > 0 ? ` · ${c.percent}% complete` : ""}
                </p>
              </div>
              {c.firstPreviewLessonId && (
                <Link
                  href={`/dashboard/learn/${c.slug}?lesson=${c.firstPreviewLessonId}`}
                  className="shrink-0 text-sm font-semibold text-brand"
                >
                  Free preview →
                </Link>
              )}
            </div>

            {/* Full syllabus visible (§6.4): locked lessons show a lock + honest line. */}
            <ul className="mt-3 space-y-1">
              {c.modules.flatMap((m) =>
                m.lessons.map((l, i) => (
                  <li
                    key={`${m.title}-${i}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    {l.completed ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-brand"
                        aria-hidden
                      />
                    ) : l.locked ? (
                      <Lock
                        className="h-4 w-4 shrink-0 text-muted"
                        aria-hidden
                      />
                    ) : (
                      <PlayCircle
                        className="h-4 w-4 shrink-0 text-brand"
                        aria-hidden
                      />
                    )}
                    <span
                      className={
                        l.locked
                          ? "min-w-0 flex-1 truncate text-muted"
                          : "min-w-0 flex-1 truncate text-charcoal"
                      }
                    >
                      {l.title}
                    </span>
                    {l.isFreePreview && !l.locked && (
                      <span className="shrink-0 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-charcoal">
                        FREE
                      </span>
                    )}
                  </li>
                )),
              )}
            </ul>

            {c.lockedCount > 0 && (
              <div className="mt-4">
                <Link href="/packages">
                  <Button variant="outline">
                    Unlock all {c.lessonCount} lessons + certificate
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ))
      )}

      {/* Sample certificate — real template pending (LAUNCH_CONFIG #14). Honest placeholder slot,
          NOT a fabricated certificate image (D-29). */}
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-charcoal/15 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal/5 text-muted"
          aria-hidden
        >
          <Award className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted">
          Finish a course to earn a certificate. Preview of the certificate
          design coming soon.
        </p>
      </div>
    </Card>
  );
}

function EarnCard({
  shareUrl,
  inviteCount,
}: {
  shareUrl: string;
  inviteCount: number;
}) {
  return (
    <Card className="space-y-4 bg-gold/10">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-charcoal" aria-hidden />
        <CardTitle className="text-lg">Invite friends</CardTitle>
      </div>
      <CardDescription>{AFFILIATE_COPY.inviteBody}</CardDescription>
      <p className="text-sm font-semibold text-charcoal">
        {inviteCount === 0
          ? AFFILIATE_COPY.inviteZero
          : `${inviteCount} friend${inviteCount === 1 ? "" : "s"} invited`}
      </p>
      <ShareBlock
        shareUrl={shareUrl}
        shareMessage={AFFILIATE_COPY.shareMessage}
      />
      <Link
        href="/dashboard/earn"
        className="inline-block text-sm font-semibold text-brand"
      >
        Go to Earn →
      </Link>
    </Card>
  );
}

function WebinarCard({
  startsAt,
  title,
}: {
  startsAt: Date | null;
  title: string | null;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-brand" aria-hidden />
        <CardTitle className="text-lg">Live webinar</CardTitle>
      </div>
      {startsAt ? (
        <>
          <p className="font-medium text-charcoal">{title ?? "Live session"}</p>
          <p className="text-sm text-muted">
            {format(startsAt, "EEE, d MMM · h:mm a")}
          </p>
          <Link href="/webinar">
            <Button variant="outline">Book your seat</Button>
          </Link>
        </>
      ) : (
        <>
          <CardDescription>
            Sessions announced soon — a live intro to help you get started.
            Always optional, never required.
          </CardDescription>
          <Link href="/webinar" className="text-sm font-semibold text-brand">
            Learn more →
          </Link>
        </>
      )}
    </Card>
  );
}

function GuruCard({ continueHref }: { continueHref: string }) {
  // Open Guru on the learner's continue-lesson (its context). Preserve any existing query.
  const guruHref = `${continueHref}${continueHref.includes("?") ? "&" : "?"}guru=1`;
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" aria-hidden />
        <CardTitle className="text-lg">Ask Guru</CardTitle>
      </div>
      <CardDescription>
        Your Hinglish study buddy — ask a doubt about your lesson and get
        unstuck, any time.
      </CardDescription>
      <Link href={guruHref} className="inline-block">
        <Button variant="outline">Ask Guru →</Button>
      </Link>
    </Card>
  );
}
