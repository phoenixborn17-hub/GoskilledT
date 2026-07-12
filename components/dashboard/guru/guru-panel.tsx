"use client";
// GPS-M5 §2.1 — Guru companion panel (Register 1: warm "mera apna teacher"). A CSS-only bottom-sheet
// (mobile) / right-drawer (desktop) that never covers the video. Full state contract: empty · typing ·
// answered(+citations) · redirected · blocked · capped · empty-corpus · error · not-enrolled. All
// answers come from the server engine (askGuruAction) — the client only renders verdicts.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Lock,
  BookOpen,
  Moon,
  RefreshCw,
} from "lucide-react";
import { askGuruAction } from "../../../app/dashboard/guru-actions";
import type { GuruVerdict, Citation } from "../../../modules/ai/guru/types";
import { cn } from "../../../lib/utils";

interface Msg {
  id: number;
  role: "user" | "guru";
  text: string;
  verdict?: GuruVerdict;
  citations?: Citation[];
}

const EXAMPLES = [
  "Is lesson ka main idea kya hai?",
  "Ye concept simple words me samjhao",
  "Ek example ke saath batao",
];

// Focusable elements inside the sheet (backdrop is deliberately excluded via tabIndex=-1).
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Non-ANSWERED verdicts get a calm icon (never a red wall). ANSWERED → no icon (clean).
const VERDICT_ICON: Partial<Record<GuruVerdict, typeof Moon>> = {
  CAPPED: Moon,
  EMPTY: BookOpen,
  REDIRECTED: Sparkles,
  ERROR: RefreshCw,
};

export function GuruPanel({
  lessonId,
  courseSlug,
  enrolled,
  initialOpen = false,
  initialQuestion,
}: {
  lessonId: string;
  courseSlug: string;
  enrolled: boolean;
  initialOpen?: boolean;
  initialQuestion?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const idRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const nextId = () => ++idRef.current;

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || busy || !enrolled) return;
      setInput("");
      setMsgs((m) => [...m, { id: nextId(), role: "user", text: q }]);
      setBusy(true);
      const res = await askGuruAction({ lessonId, question: q });
      setBusy(false);
      setMsgs((m) => [
        ...m,
        res.ok
          ? {
              id: nextId(),
              role: "guru",
              text: res.answer,
              verdict: res.verdict,
              citations: res.citations,
            }
          : { id: nextId(), role: "guru", text: res.error, verdict: "ERROR" },
      ]);
    },
    [busy, enrolled, lessonId],
  );

  // Deep-link "explain my gap": prefill + auto-ask once when opened with a question.
  const askedInitial = useRef(false);
  useEffect(() => {
    if (open && initialQuestion && enrolled && !askedInitial.current) {
      askedInitial.current = true;
      void send(initialQuestion);
    }
  }, [open, initialQuestion, enrolled, send]);

  // Focus the composer on open; Escape closes; Tab is trapped inside the sheet; focus returns to the
  // launcher on close (WCAG 2.4.3 — keyboard focus never escapes the modal onto the dimmed backdrop).
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const items = Array.from(
        sheet.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null); // visible only
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // Wrap at the edges, and pull focus back inside if it ever lands outside the sheet.
      if (e.shiftKey) {
        if (active === first || !sheet.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !sheet.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      launcherRef.current?.focus(); // restore focus to the trigger on close
    };
  }, [open]);

  // Keep the newest message in view.
  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, busy]);

  const lastUser = [...msgs].reverse().find((m) => m.role === "user")?.text;

  return (
    <>
      {/* Launcher — always reachable, above the mobile bottom-nav. */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="guru-panel"
        className="press fixed bottom-24 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-brand-fg shadow-lg md:bottom-8"
      >
        <Sparkles className="h-5 w-5" aria-hidden />
        <span className="text-sm font-semibold">Ask Guru</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guru-title"
          id="guru-panel"
        >
          {/* Backdrop — click-to-close, but NOT in the tab order (focus stays trapped in the sheet). */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-charcoal/40"
          />
          {/* Sheet: bottom on mobile, right drawer on desktop */}
          <div
            ref={sheetRef}
            className="guru-sheet absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-offwhite shadow-2xl md:inset-y-4 md:left-auto md:right-4 md:max-h-none md:w-[26rem] md:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-charcoal/10 px-5 py-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"
                aria-hidden
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  id="guru-title"
                  className="font-heading font-bold text-charcoal"
                >
                  Guru
                </p>
                <p className="text-xs text-muted">
                  Aapka course tutor · Hinglish me
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="press flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-charcoal/5"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {/* Chat log */}
            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
            >
              {msgs.length === 0 && (
                <GuruEmpty enrolled={enrolled} onPick={send} />
              )}

              {msgs.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-charcoal px-4 py-2.5 text-sm text-white">
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <GuruBubble
                    key={m.id}
                    msg={m}
                    courseSlug={courseSlug}
                    onCite={() => setOpen(false)}
                    onRetry={() => lastUser && send(lastUser)}
                  />
                ),
              )}

              {busy && (
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-brand/5 px-4 py-3">
                  <span className="sr-only">Guru soch raha hai…</span>
                  <span className="guru-dot h-2 w-2 rounded-full bg-brand" />
                  <span className="guru-dot h-2 w-2 rounded-full bg-brand" />
                  <span className="guru-dot h-2 w-2 rounded-full bg-brand" />
                </div>
              )}
            </div>

            {/* Composer / not-enrolled lock */}
            {enrolled ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="flex items-end gap-2 border-t border-charcoal/10 p-3"
              >
                <label htmlFor="guru-input" className="sr-only">
                  Guru se apna sawaal poocho
                </label>
                <textarea
                  id="guru-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  rows={1}
                  maxLength={500}
                  placeholder="Apna sawaal likho…"
                  className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-charcoal/15 px-3 py-2.5 text-sm text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-fg disabled:opacity-40"
                >
                  <Send className="h-5 w-5" aria-hidden />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3 border-t border-charcoal/10 p-4">
                <Lock className="h-5 w-5 shrink-0 text-muted" aria-hidden />
                <p className="flex-1 text-sm text-muted">
                  Guru enrolled students ke liye hai.
                </p>
                <a
                  href="/dashboard/learn/browse#packages"
                  className="press shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg"
                >
                  Unlock
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function GuruEmpty({
  enrolled,
  onPick,
}: {
  enrolled: boolean;
  onPick: (q: string) => void;
}) {
  return (
    <div className="py-6 text-center">
      <span
        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand"
        aria-hidden
      >
        <Sparkles className="h-7 w-7" />
      </span>
      <p className="font-heading font-bold text-charcoal">
        Koi doubt? Pooch lo!
      </p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
        {enrolled
          ? "Main is course ke notes se aapke sawaal Hinglish me samjhaata hoon."
          : "Guru enrolled students ke liye hai — enroll karke saare lessons + Guru unlock ho jaayenge."}
      </p>
      {enrolled && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className="press rounded-full border border-brand/30 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GuruBubble({
  msg,
  courseSlug,
  onCite,
  onRetry,
}: {
  msg: Msg;
  courseSlug: string;
  onCite: () => void;
  onRetry: () => void;
}) {
  const router = useRouter();
  const Icon = msg.verdict ? VERDICT_ICON[msg.verdict] : undefined;
  const answered = msg.verdict === "ANSWERED" || msg.verdict === undefined;
  return (
    <div className="flex flex-col items-start gap-2">
      <div
        className={cn(
          "max-w-[90%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm",
          answered ? "bg-brand/5 text-charcoal" : "bg-charcoal/5 text-charcoal",
        )}
      >
        <p className="flex items-start gap-2">
          {Icon && (
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
          )}
          <span className="whitespace-pre-wrap">{msg.text}</span>
        </p>
      </div>

      {/* Citations — jump back to the cited lesson. */}
      {msg.citations && msg.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {msg.citations.map((c) => (
            <button
              key={c.lessonId}
              type="button"
              onClick={() => {
                onCite();
                router.push(
                  `/dashboard/learn/${courseSlug}?lesson=${c.lessonId}`,
                );
              }}
              className="press inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-semibold text-charcoal"
            >
              <BookOpen className="h-3 w-3" aria-hidden />
              Lesson {c.lessonOrder}
            </button>
          ))}
        </div>
      )}

      {msg.verdict === "ERROR" && (
        <button
          type="button"
          onClick={onRetry}
          className="press inline-flex items-center gap-1 pl-1 text-xs font-semibold text-brand"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}
