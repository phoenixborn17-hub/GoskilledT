"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, PartyPopper, Gauge, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Confetti } from "../ui/confetti";
import { CertificateMoment } from "./certificate-moment";
import { completeLessonAction } from "../../app/dashboard/actions";
import { detectDeviceTier } from "../../lib/device-tier";

// mm:ss for the visible resume-position affordance.
function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LessonPlayer({
  courseSlug,
  courseTitle,
  lessonId,
  title,
  src,
  poster,
  initiallyCompleted,
  nextLessonId,
}: {
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  title: string;
  src: string;
  poster?: string;
  initiallyCompleted: boolean;
  nextLessonId: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [celebrate, setCelebrate] = useState(false);
  const [firstWin, setFirstWin] = useState(false);
  const [certSerial, setCertSerial] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Video load-error failure path (§2.3): retry (reload) + WhatsApp "report issue" deep-link.
  const [videoError, setVideoError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const REPORT_HREF = `https://wa.me/918572887888?text=${encodeURIComponent(
    `Hi, I hit a video problem on the lesson: ${title}`,
  )}`; // // REPLACE: temp support number (matches /contact)

  // ── Data saver + visible resume-position (Fable P1) — client-only UX. Does NOT touch the signed
  //    playback URL (resolved server-side). Data saver defers download now (preload=none) and marks
  //    the 480p cap for when adaptive HLS (Cloudflare Stream, DR-022) lands. Resume-position
  //    remembers where you stopped (localStorage) and offers a visible "Resume from mm:ss". ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const posKey = `gs:lesson-pos:${lessonId}`;

  useEffect(() => {
    // Default data saver ON for low-tier / Save-Data devices; a stored choice always wins.
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("gs:data-saver")
        : null;
    setDataSaver(
      stored != null ? stored === "1" : detectDeviceTier() === "low",
    );
    // Read a saved resume position for this lesson.
    const raw =
      typeof localStorage !== "undefined" ? localStorage.getItem(posKey) : null;
    const secs = raw ? Number(raw) : NaN;
    if (Number.isFinite(secs) && secs > 5) setResumeAt(secs);
  }, [posKey]);

  const toggleDataSaver = (on: boolean) => {
    setDataSaver(on);
    try {
      localStorage.setItem("gs:data-saver", on ? "1" : "0");
    } catch {
      /* storage unavailable — preference just isn't persisted */
    }
  };

  // Throttled save of the current position (every ~5s) so a return offers "Resume from…".
  const lastSaved = useRef(0);
  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    if (t - lastSaved.current >= 5 || t < lastSaved.current) {
      lastSaved.current = t;
      try {
        // Clear the marker near the end so a finished lesson doesn't nag to resume.
        if (v.duration && t > v.duration - 15) localStorage.removeItem(posKey);
        else localStorage.setItem(posKey, String(Math.floor(t)));
      } catch {
        /* storage unavailable */
      }
    }
  }, [posKey]);

  const resume = () => {
    const v = videoRef.current;
    if (v && resumeAt != null) {
      v.currentTime = resumeAt;
      void v.play();
    }
    setResumeAt(null);
  };

  async function markComplete() {
    setBusy(true);
    setError(null);
    const res = await completeLessonAction({ courseSlug, lessonId });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setCompleted(true);
    // Course-complete → the Certificate Earned signature moment (§2.6); otherwise a confetti win, and
    // the FIRST-ever completion (progress.completed === 1) earns a warm first-win banner (§2.6).
    if (res.certificateSerial) {
      setCertSerial(res.certificateSerial);
    } else {
      setCelebrate(true); // purposeful-delight moment (§5) — reduced-motion safe inside <Confetti>
      if (res.progress.completed === 1) setFirstWin(true);
    }
    router.refresh(); // updates the lesson list + progress ring
  }

  function goNext() {
    if (nextLessonId)
      router.push(`/dashboard/learn/${courseSlug}?lesson=${nextLessonId}`);
  }

  return (
    <div className="space-y-4">
      <Confetti fire={celebrate} />
      {firstWin && (
        <div
          role="status"
          className="enter flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand/10 to-gold/15 p-4"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand"
            aria-hidden
          >
            <PartyPopper className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-heading font-bold text-charcoal">
              Pehla lesson complete! 🎉
            </p>
            <p className="text-sm text-muted">
              Shabaash — aapne shuru kar diya. Isi tarah aage badhte raho.
            </p>
          </div>
        </div>
      )}
      {certSerial && (
        <CertificateMoment
          serial={certSerial}
          courseTitle={courseTitle}
          onClose={() => setCertSerial(null)}
        />
      )}
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
          // `data-quality` is the seam the data-saver 480p cap wires to once HLS quality levels exist.
          <video
            key={`${src}-${attempt}`}
            ref={videoRef}
            controls
            playsInline
            poster={poster}
            className="aspect-video w-full"
            preload={dataSaver ? "none" : "metadata"}
            data-quality={dataSaver ? "480p" : "auto"}
            onError={() => setVideoError(true)}
            onTimeUpdate={onTimeUpdate}
          >
            <source src={src} />
            {/* Captions slot: Hinglish <track kind="captions"> added when caption files land (§2.3). */}
            Your browser does not support video playback.
          </video>
        )}
      </div>

      {/* Player controls: visible resume-position + data saver (Fable P1). */}
      {!videoError && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {resumeAt != null ? (
            <button
              type="button"
              onClick={resume}
              className="press inline-flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2 text-sm font-semibold text-brand-deep"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Resume from {mmss(resumeAt)}
            </button>
          ) : (
            <span />
          )}
          <Switch
            checked={dataSaver}
            onChange={(e) => toggleDataSaver(e.target.checked)}
            label={
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <Gauge className="h-4 w-4" aria-hidden />
                Data saver
              </span>
            }
          />
        </div>
      )}

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
