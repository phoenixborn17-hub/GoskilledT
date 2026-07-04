// Dashboard Hub data loader (DR-030 §6). Assembles every card's data server-side in one pass so
// the Hub page stays declarative. Truthful by construction: checklist progress + invite counts +
// webinar dates are all DERIVED from real rows — nothing fabricated, every card has a real
// zero/locked/coming-soon state (§6 "no card ever renders blank").
import { z } from "zod";
import type { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import { siteUrl } from "../seo";
import { getEnrolledCourses, getCoursePlayerView } from "../lms/queries";
import { getLesson0Status, GETTING_STARTED_SLUG } from "../lms/getting-started";
import { getReferralTree } from "../affiliate/referrals";
import { getNextWebinar } from "../crm/webinar";
import { listCatalogCourses } from "../catalog/queries";

// checklistState JSON is validated on read — never trusted as-is (Golden Rule 4 at every boundary).
const ChecklistStateSchema = z
  .object({ dismissedAt: z.string().optional() })
  .catch({ dismissedAt: undefined });

export function parseChecklistState(raw: Prisma.JsonValue | null | undefined): {
  dismissedAt?: string;
} {
  return ChecklistStateSchema.parse(raw ?? {});
}

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

export interface HubLearnLesson {
  title: string;
  locked: boolean;
  isFreePreview: boolean;
  completed: boolean;
}
export interface HubLearnCourse {
  slug: string;
  title: string;
  lessonCount: number;
  lockedCount: number;
  isEnrolled: boolean;
  percent: number;
  firstPreviewLessonId: string | null;
  modules: { title: string; lessons: HubLearnLesson[] }[];
}

export interface HubContinue {
  href: string;
  cta: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  percent: number | null;
}

export interface HubData {
  name: string | null;
  goal: string | null;
  referralCode: string;
  shareUrl: string;
  continue: HubContinue;
  learnCourses: HubLearnCourse[];
  inviteCount: number;
  checklist: {
    items: ChecklistItem[];
    doneCount: number;
    total: number;
    dismissed: boolean;
  };
  webinar: { startsAt: Date | null; title: string | null };
}

export async function getHubData(userId: string): Promise<HubData> {
  const [record, lesson0, enrolled, catalog, tree, webinar, previewProgress] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          goal: true,
          referralCode: true,
          checklistState: true,
        },
      }),
      getLesson0Status(userId),
      getEnrolledCourses(userId),
      listCatalogCourses(),
      getReferralTree(userId),
      getNextWebinar(),
      // Item 2 = watched any real course preview (a completed free-preview lesson, excluding L0).
      prisma.lessonProgress.findFirst({
        where: {
          userId,
          lesson: {
            isFreePreview: true,
            module: { course: { slug: { not: GETTING_STARTED_SLUG } } },
          },
        },
        select: { id: true },
      }),
    ]);

  const referralCode = record?.referralCode ?? "";
  const shareUrl = `${siteUrl()}/register?ref=${referralCode}`;

  // Launch courses = PUBLISHED catalog courses (system course already excluded by the query).
  const launchSlugs = catalog
    .filter((c) => c.status === "PUBLISHED")
    .map((c) => c.slug);
  const playerViews = await Promise.all(
    launchSlugs.map((slug) => getCoursePlayerView(userId, slug)),
  );

  const learnCourses: HubLearnCourse[] = playerViews
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .map((v) => {
      const lessons = v.modules.flatMap((m) => m.lessons);
      const firstPreview = lessons.find((l) => l.isFreePreview);
      return {
        slug: v.course.slug,
        title: v.course.title,
        lessonCount: lessons.length,
        lockedCount: lessons.filter((l) => l.locked).length,
        isEnrolled: v.isEnrolled,
        percent: v.progress.percent,
        firstPreviewLessonId: firstPreview?.id ?? null,
        modules: v.modules.map((m) => ({
          title: m.title,
          lessons: m.lessons.map((l) => ({
            title: l.title,
            locked: l.locked,
            isFreePreview: l.isFreePreview,
            completed: l.completed,
          })),
        })),
      };
    });

  // ── Continue card (§6.3): always a resume action, never empty ──
  const continueCard = buildContinue(lesson0, enrolled, learnCourses);

  // ── Get-Started checklist (§6.2): derived from real data ──
  const inviteCount = tree.l1Count;
  const firstPreview = learnCourses.find((c) => c.firstPreviewLessonId);
  const items: ChecklistItem[] = [
    {
      key: "lesson0",
      label: "Complete Lesson 0",
      done: lesson0.completed,
      href: lesson0.lessonId
        ? `/dashboard/learn/${lesson0.courseSlug}?lesson=${lesson0.lessonId}`
        : "/dashboard",
      cta: "Watch (2 min)",
    },
    {
      key: "preview",
      label: "Watch a course preview",
      done: !!previewProgress,
      href: firstPreview
        ? `/dashboard/learn/${firstPreview.slug}?lesson=${firstPreview.firstPreviewLessonId}`
        : "/dashboard/learn",
      cta: "Watch a preview",
    },
    {
      // No booking system yet (webinar schedule = LAUNCH_CONFIG #27); item completes when booking
      // lands. Stays honestly unchecked — never faked.
      key: "webinar",
      label: "Book a webinar seat",
      done: false,
      href: "/webinar",
      cta: webinar ? "See sessions" : "Coming soon",
    },
    {
      key: "invite",
      label: "Invite 2 friends",
      done: inviteCount >= 2,
      href: "/dashboard/earn",
      cta: "Share your link",
    },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const dismissed = !!parseChecklistState(record?.checklistState).dismissedAt;

  return {
    name: record?.name?.trim() || null,
    goal: record?.goal ?? null,
    referralCode,
    shareUrl,
    continue: continueCard,
    learnCourses,
    inviteCount,
    checklist: { items, doneCount, total: items.length, dismissed },
    webinar: {
      startsAt: webinar?.startsAt ?? null,
      title: webinar?.title ?? null,
    },
  };
}

function buildContinue(
  lesson0: { lessonId: string | null; completed: boolean; courseSlug: string },
  enrolled: Awaited<ReturnType<typeof getEnrolledCourses>>,
  learnCourses: HubLearnCourse[],
): HubContinue {
  // 1) Lesson 0 first, until it's done.
  if (lesson0.lessonId && !lesson0.completed) {
    return {
      href: `/dashboard/learn/${lesson0.courseSlug}?lesson=${lesson0.lessonId}`,
      cta: "Start",
      eyebrow: "Start here",
      title: "GoSkilled kaise kaam karta hai",
      subtitle: "Your 2-minute intro to how everything works.",
      percent: null,
    };
  }
  // 2) An enrolled course still in progress.
  const active = enrolled.find((c) => c.progress.percent < 100);
  if (active) {
    return {
      href: `/dashboard/learn/${active.slug}`,
      cta: active.progress.completed === 0 ? "Start" : "Resume",
      eyebrow: "Continue learning",
      title: active.title,
      subtitle: `${active.progress.completed} / ${active.progress.total} lessons`,
      percent: active.progress.percent,
    };
  }
  // 3) No active enrollment → a free preview of a launch course (never empty).
  const preview = learnCourses.find((c) => c.firstPreviewLessonId);
  if (preview) {
    return {
      href: `/dashboard/learn/${preview.slug}?lesson=${preview.firstPreviewLessonId}`,
      cta: "Watch free",
      eyebrow: "Try a free preview",
      title: preview.title,
      subtitle: "Watch the first lesson free — no purchase needed.",
      percent: null,
    };
  }
  // 4) Absolute fallback (no catalog yet) — still a real destination.
  return {
    href: "/dashboard/learn",
    cta: "Explore",
    eyebrow: "Start learning",
    title: "Explore courses",
    subtitle: "Browse what you can learn on GoSkilled.",
    percent: null,
  };
}
