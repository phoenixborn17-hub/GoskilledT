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
        {/* Native <video> plays the mock MP4. HLS (Cloudflare Stream) is wired for a later ticket. */}
        <video
          key={src}
          controls
          playsInline
          poster={poster}
          className="aspect-video w-full"
          preload="metadata"
        >
          <source src={src} />
          Your browser does not support video playback.
        </video>
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
