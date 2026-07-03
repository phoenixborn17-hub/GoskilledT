"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { completeLessonAction } from "../../app/dashboard/actions";

export function LessonPlayer({
  courseSlug,
  lessonId,
  title,
  src,
  poster,
  initiallyCompleted,
  nextLessonId,
}: {
  courseSlug: string;
  lessonId: string;
  title: string;
  src: string;
  poster?: string;
  initiallyCompleted: boolean;
  nextLessonId: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Video load-error failure path (§2.3): retry (reload) + WhatsApp "report issue" deep-link.
  const [videoError, setVideoError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const REPORT_HREF = `https://wa.me/918572887888?text=${encodeURIComponent(
    `Hi, I hit a video problem on the lesson: ${title}`,
  )}`; // // REPLACE: temp support number (matches /contact)

  async function markComplete() {
    setBusy(true);
    setError(null);
    const res = await completeLessonAction({ courseSlug, lessonId });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setCompleted(true);
    router.refresh(); // updates the lesson list + progress ring
  }

  function goNext() {
    if (nextLessonId)
      router.push(`/dashboard/learn/${courseSlug}?lesson=${nextLessonId}`);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-charcoal">
        {/* Guru companion-panel slot (§1E, GPS-M5) reserved alongside the player — no UI in M2. */}
        {videoError ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium text-white">
              This video didn&apos;t load.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setVideoError(false);
                  setAttempt((a) => a + 1);
                }}
                className="press rounded-xl bg-white px-4 py-2 text-sm font-semibold text-charcoal"
              >
                Retry
              </button>
              <a
                href={REPORT_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Report issue
              </a>
            </div>
          </div>
        ) : (
          // Native <video> plays the mock MP4. HLS (Cloudflare Stream) resolves via the video
          // provider when the account lands — the player interface stays identical (DR-022).
          <video
            key={`${src}-${attempt}`}
            controls
            playsInline
            poster={poster}
            className="aspect-video w-full"
            preload="metadata"
            onError={() => setVideoError(true)}
          >
            <source src={src} />
            {/* Captions slot: Hinglish <track kind="captions"> added when caption files land (§2.3). */}
            Your browser does not support video playback.
          </video>
        )}
      </div>

      <h2 className="font-heading text-xl font-bold">{title}</h2>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {completed ? (
          <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand/10 px-4 text-sm font-semibold text-brand">
            <Check className="h-4 w-4" aria-hidden /> Completed
          </span>
        ) : (
          <div className="w-full max-w-[14rem]">
            <Button onClick={markComplete} disabled={busy}>
              {busy ? "Saving…" : "Mark as complete"}
            </Button>
          </div>
        )}
        {nextLessonId && (
          <div className="w-full max-w-[12rem]">
            <Button variant="outline" onClick={goNext}>
              Next lesson →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
