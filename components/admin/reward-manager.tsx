"use client";
// Admin reward manager (Phase E/D). Create a reward definition + toggle active. Charcoal admin
// styling. No money, no PII.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRewardAction,
  setRewardActiveAction,
} from "../../app/admin/rewards/actions";

export function CreateRewardForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await createRewardAction({
      title,
      description: description.trim() || undefined,
      target: Number(target),
      lastDate: lastDate || undefined,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setTitle("");
    setDescription("");
    setTarget("");
    setLastDate("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">
          Target (completed referrals)
        </span>
        <input
          type="number"
          min={1}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          required
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">
          Description (optional)
        </span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-ink">
          Last date (optional)
        </span>
        <input
          type="date"
          value={lastDate}
          onChange={(e) => setLastDate(e.target.value)}
          className="h-10 w-full rounded-lg border border-line px-3"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-charcoal px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Creating…" : "Create reward"}
        </button>
      </div>
    </form>
  );
}

export function ToggleRewardActive({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await setRewardActiveAction(id, !isActive);
    setBusy(false);
    router.refresh();
  }
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="rounded-lg border border-line px-3 py-1 text-xs font-semibold text-ink hover:bg-charcoal/5 disabled:opacity-40"
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
