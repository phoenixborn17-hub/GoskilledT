"use client";
// Segmented OTP input — the shared one-time-code component (DR-030 Day-0 · clears the M1 OTP UX
// debt). Used by /register and /login so the entry experience is identical everywhere. Accessible
// (labelled group + per-digit labels), paste-aware (a full code pasted into any box fills all),
// numeric-only, and keyboard-complete (Backspace/Arrow navigation). No motion — nothing to reduce.
import * as React from "react";
import { cn } from "../../lib/utils";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  onComplete,
  ariaLabel = "One-time password",
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
  ariaLabel?: string;
  id?: string;
}) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = React.useMemo(() => {
    const arr = onlyDigits(value).slice(0, length).split("");
    return Array.from({ length }, (_, i) => arr[i] ?? "");
  }, [value, length]);

  function commit(next: string) {
    const cleaned = onlyDigits(next).slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) onComplete?.(cleaned);
  }

  function focusBox(i: number) {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  }

  function onBoxChange(i: number, raw: string) {
    const typed = onlyDigits(raw);
    if (!typed) return;
    // Multi-char (autofill / fast typing / paste) → distribute from this box onward.
    const chars = typed.split("");
    const arr = [...digits];
    let cursor = i;
    for (const c of chars) {
      if (cursor >= length) break;
      arr[cursor] = c;
      cursor += 1;
    }
    commit(arr.join(""));
    focusBox(cursor);
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = [...digits];
      if (arr[i]) {
        arr[i] = "";
        commit(arr.join(""));
      } else if (i > 0) {
        arr[i - 1] = "";
        commit(arr.join(""));
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(i + 1);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = onlyDigits(e.clipboardData.getData("text"));
    if (!pasted) return;
    commit(pasted);
    focusBox(pasted.length);
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex items-center justify-between gap-2"
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={i === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={
            length
          } /* allow autofill/paste of the whole code into one box */
          aria-label={`Digit ${i + 1} of ${length}`}
          value={d}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => onBoxChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border bg-surface-raised text-center text-2xl font-bold text-ink",
            "border-line/15 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
      ))}
    </div>
  );
}
