"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveReviewAction } from "../../app/admin/review-queue/actions";

export function ResolveButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onClick() {
    setBusy(true);
    setError(false);
    const res = await resolveReviewAction(orderId);
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(true);
  }

  return (
    <button onClick={onClick} disabled={busy}
      className="rounded-lg bg-charcoal px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
      {busy ? "Saving…" : error ? "Retry" : "Mark resolved"}
    </button>
  );
}
