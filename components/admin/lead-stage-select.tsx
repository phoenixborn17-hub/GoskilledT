"use client";
import { useState } from "react";
import { updateLeadStageAction } from "../../app/admin/leads/actions";
import { cn } from "../../lib/utils";

const STAGES = ["NEW", "CONTACTED", "WEBINAR_REGISTERED", "CONVERTED", "LOST"];

export function LeadStageSelect({
  leadId,
  stage,
}: {
  leadId: string;
  stage: string;
}) {
  const [value, setValue] = useState(stage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setBusy(true);
    setError(false);
    const res = await updateLeadStageAction(leadId, next);
    setBusy(false);
    if (res.ok) setValue(next);
    else setError(true);
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={busy}
      aria-label="Lead stage"
      className={cn(
        "h-8 rounded-lg border bg-white px-2 text-xs font-medium",
        error ? "border-red-400" : "border-charcoal/15",
      )}
    >
      {STAGES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
