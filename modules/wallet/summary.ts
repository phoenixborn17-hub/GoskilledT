// Wallet summary — DR-025 UX rule: held is VISIBLE but not withdrawable.
import { availableBalanceOf, heldBalanceOf, balanceOf } from "../ledger/ledger";

export interface WalletEntryView { amountInPaise: number; holdUntil?: Date | null }

export interface WalletSummary {
  totalInPaise: number;      // held + available (what the wallet card shows big)
  heldInPaise: number;       // "unlocks soon" — countdown UI
  availableInPaise: number;  // withdrawable now
  lifetimeEarnedInPaise: number; // sum of positive credits ever (trust metric)
}

export function walletSummary(entries: WalletEntryView[], now: Date = new Date()): WalletSummary {
  return {
    totalInPaise: balanceOf(entries),
    heldInPaise: heldBalanceOf(entries, now),
    availableInPaise: availableBalanceOf(entries, now),
    lifetimeEarnedInPaise: entries.reduce((a, e) => (e.amountInPaise > 0 ? a + e.amountInPaise : a), 0),
  };
}
