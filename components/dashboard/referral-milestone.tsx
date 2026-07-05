"use client";
// §2.6 Signature Moment — referral milestones. DERIVED from the real invite count (no new table,
// no fabricated data). D-29 floor: celebrates the ACT of inviting learners by count only — never
// earnings, rewards, or ₹. A one-time confetti fires the first time a new tier is crossed (tracked
// in localStorage so it never repeats on every dashboard load); reduced-motion is honoured by Confetti.
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Confetti } from "../ui/confetti";
import { AFFILIATE_COPY } from "../../lib/affiliate/copy";
import {
  REFERRAL_TIERS,
  highestReachedTier,
  nextTier,
} from "../../modules/affiliate/milestone";
import { cn } from "../../lib/utils";

const STORE_KEY = "gs_referral_tier";

export function ReferralMilestone({ inviteCount }: { inviteCount: number }) {
  const reached = highestReachedTier(inviteCount);
  const next = nextTier(inviteCount);
  const [celebrate, setCelebrate] = useState(false);

  // Fire once per newly-crossed tier. localStorage stores the highest tier already celebrated.
  useEffect(() => {
    if (reached === 0) return;
    try {
      const seen = Number(localStorage.getItem(STORE_KEY) ?? "0");
      if (reached > seen) {
        setCelebrate(true);
        localStorage.setItem(STORE_KEY, String(reached));
      }
    } catch {
      /* storage blocked (private mode) — silently skip the one-shot */
    }
  }, [reached]);

  return (
    <div className="space-y-3">
      <Confetti fire={celebrate} />

      {/* Milestone track — reached tiers filled gold (charcoal text = gold-contrast rule). */}
      <ol className="flex items-center gap-1.5" aria-label="Invite milestones">
        {REFERRAL_TIERS.map((tier) => {
          const done = inviteCount >= tier;
          const isCurrent = tier === reached;
          return (
            <li key={tier} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done
                    ? "bg-gold text-charcoal"
                    : "border border-charcoal/15 bg-white text-muted",
                  isCurrent && "ring-2 ring-brand/40 ring-offset-1",
                )}
                aria-hidden
              >
                {done ? <Check className="h-4 w-4" /> : tier}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  done ? "text-charcoal" : "text-muted",
                )}
              >
                {tier}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Status line — derived + count-only. */}
      <p className="text-sm font-semibold text-charcoal">
        {inviteCount === 0
          ? AFFILIATE_COPY.milestoneStart
          : next === null
            ? `${inviteCount} friends invited — top milestone reached! 🎉`
            : reached > 0
              ? `${inviteCount} invited · ${next - inviteCount} more to your next milestone (${next})`
              : `${inviteCount} invited · ${next - inviteCount} more to your first milestone (${next})`}
      </p>
    </div>
  );
}
