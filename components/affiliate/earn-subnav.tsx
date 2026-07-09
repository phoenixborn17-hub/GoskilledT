"use client";
// Earn section sub-nav (GPS-M3). Money tabs (Wallet/Commissions/KYC) appear only when the flag is
// ON; pre-flag the section is invite-only (§1C). The money pages still exist by URL in both states.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";

// Labels follow DR-038 (compliance-safe): "My Network" for the referral relationship; levels stay
// "Level 1/2/3" inside. Leaderboard + Rewards are Phase D (not here).
const BASE = [
  { href: "/dashboard/earn", label: "Overview", exact: true },
  { href: "/dashboard/earn/referrals", label: "Referrals" },
  { href: "/dashboard/earn/network", label: "My Network" },
  { href: "/dashboard/earn/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/earn/rewards", label: "Rewards" },
  { href: "/dashboard/earn/my-leads", label: "My Leads" },
];
const MONEY = [
  { href: "/dashboard/earn/wallet", label: "Wallet" },
  { href: "/dashboard/earn/commissions", label: "Commissions" },
  { href: "/dashboard/earn/commission-structure", label: "Rewards structure" },
  { href: "/dashboard/earn/kyc", label: "KYC" },
];

export function EarnSubNav({ showMoney }: { showMoney: boolean }) {
  const pathname = usePathname();
  const tabs = showMoney ? [...BASE, ...MONEY] : BASE;

  return (
    <nav
      aria-label="Earn sections"
      className="-mx-1 flex gap-1 overflow-x-auto pb-1"
    >
      {tabs.map((t) => {
        const active =
          "exact" in t && t.exact
            ? pathname === t.href
            : pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "press shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-gold text-charcoal"
                : "text-charcoal/70 hover:bg-gold/15",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
