"use client";
// Webinar scheduling + activation controls (GPS-M4 §2.6). Schedule feeds the public page; toggling
// active hides/shows a session.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  scheduleWebinarAction,
  setWebinarActiveAction,
} from "../../app/admin/webinar/actions";

const inputCls =
  "w-full rounded-lg border border-charcoal/20 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function ScheduleWebinarForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    const res = await scheduleWebinarAction({ title, startsAt, joinUrl });
    setBusy(false);
    if (res.ok) {
      setTitle("");
      setStartsAt("");
      setJoinUrl("");
      setMsg({ ok: true, text: "Session scheduled." });
      router.refresh();
    } else setMsg({ ok: false, text: res.error });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Topic</span>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunday intro session"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Date &amp; time (IST)</span>
          <input
            className={inputCls}
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Join link (optional)</span>
        <input
          className={inputCls}
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="https://…"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={busy || !title.trim() || !startsAt}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-50"
        >
          {busy ? "Scheduling…" : "Schedule session"}
        </button>
        {msg && (
          <span
            className={`text-sm ${msg.ok ? "text-brand-deep" : "text-red-600"}`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

export function WebinarActiveToggle({
  webinarId,
  isActive,
}: {
  webinarId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await setWebinarActiveAction(webinarId, !isActive);
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-charcoal/5 disabled:opacity-50"
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
