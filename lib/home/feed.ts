// Home "For you" feed — recent REAL activity events (Command_Center_Spec §2.6). Composed from
// existing tables only: lesson completions, certificates, and (Affiliate layer visible only) L1
// joins. No synthetic events, ever (D-29). Rule-driven NUDGES are composed in the page from the
// summary — this loader only supplies the activity tail.
import { prisma } from "../prisma";
import { isFeatureVisible } from "../feature-visibility/context";
import { getReferralTree } from "../affiliate/referrals";

export type FeedEventKind = "lesson" | "certificate" | "referral";

export interface FeedEvent {
  kind: FeedEventKind;
  title: string;
  description: string;
  at: Date;
}

export async function getRecentActivity(
  userId: string,
  limit = 3,
): Promise<FeedEvent[]> {
  const [lessons, certificate, affiliateVisible] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: limit,
      select: { completedAt: true, lesson: { select: { title: true } } },
    }),
    prisma.certificate.findFirst({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      select: { issuedAt: true, course: { select: { title: true } } },
    }),
    isFeatureVisible("earn"),
  ]);

  const events: FeedEvent[] = lessons.map((l) => ({
    kind: "lesson" as const,
    title: "Lesson completed",
    description: l.lesson.title,
    at: l.completedAt,
  }));

  if (certificate) {
    events.push({
      kind: "certificate",
      title: "Certificate earned",
      description: certificate.course.title,
      at: certificate.issuedAt,
    });
  }

  // Referral joins are an Affiliate-layer event — never surfaced when the layer is hidden (DR-040).
  if (affiliateVisible) {
    const tree = await getReferralTree(userId);
    const latest = [...tree.l1].sort(
      (a, b) => b.joinedAt.getTime() - a.joinedAt.getTime(),
    )[0];
    if (latest) {
      events.push({
        kind: "referral",
        title: "A friend joined",
        description: "Someone signed up with your link",
        at: latest.joinedAt,
      });
    }
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/** Compact honest relative label ("Today" · "Yesterday" · "5d ago") for feed rows. */
export function relativeDayLabel(at: Date, now: Date = new Date()): string {
  const ist = (d: Date) =>
    new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  if (ist(at) === ist(now)) return "Today";
  const days = Math.max(
    1,
    Math.round(
      (Date.parse(ist(now)) - Date.parse(ist(at))) / 86_400_000,
    ),
  );
  return days === 1 ? "Yesterday" : `${days}d ago`;
}
