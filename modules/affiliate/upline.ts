// Upline resolution — DR-007: L1 = direct referrer, L2 = their referrer, L3 = next.
// Pure: caller fetches the referredBy chain; we validate + cap it.
import type { Level } from "./commission";

export interface UplineHop { userId: string; level: Level }

/**
 * chain = [buyer's referrer, referrer's referrer, ...] in order, as fetched from DB.
 * Guards: cap at 3 levels, no self-credit, no duplicate credit if a cycle sneaks in.
 */
export function resolveUplines(buyerUserId: string, chain: string[]): UplineHop[] {
  const seen = new Set<string>([buyerUserId]);
  const hops: UplineHop[] = [];
  for (const userId of chain) {
    if (hops.length >= 3) break;
    if (seen.has(userId)) break; // cycle or self-referral — stop climbing
    seen.add(userId);
    hops.push({ userId, level: (hops.length + 1) as Level });
  }
  return hops;
}
