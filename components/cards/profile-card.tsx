import * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";

export interface ProfileCardProps {
  name: string;
  avatarUrl?: string | null;
  /** Real referral code (copy affordance is provided by the caller via `action`). */
  referralCode?: string;
  joinedOn?: string;
  tier?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Compact profile summary (Account §5.6). Referral code is shown only when the Affiliate module is
 * visible (DR-040 leak-channel — the caller omits it otherwise, Amendments §E).
 */
export function ProfileCard({
  name,
  avatarUrl,
  referralCode,
  joinedOn,
  tier,
  action,
  className,
}: ProfileCardProps) {
  return (
    <Card elevation="raised" className={cn("p-5", className)}>
      <div className="flex items-center gap-4">
        <Avatar name={name} src={avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-h4 font-bold text-ink">
              {name}
            </h3>
            {tier && <Badge variant="gold">{tier}</Badge>}
          </div>
          {joinedOn && (
            <p className="mt-0.5 text-caption text-ink-muted">
              Joined {joinedOn}
            </p>
          )}
        </div>
      </div>
      {referralCode && (
        <div className="mt-4 flex items-center justify-between rounded-gs bg-surface-sunken px-3 py-2">
          <span className="text-caption font-medium text-ink-muted">
            Referral code
          </span>
          <span className="font-mono text-small font-semibold text-ink">
            {referralCode}
          </span>
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
