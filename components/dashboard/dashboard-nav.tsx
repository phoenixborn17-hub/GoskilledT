"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BarChart3, Coins, User } from "lucide-react";
import { cn } from "../../lib/utils";

const TABS = [
  { href: "/dashboard", label: "Learn", Icon: BookOpen, match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/learn") },
  { href: "/dashboard/progress", label: "Progress", Icon: BarChart3, match: (p: string) => p.startsWith("/dashboard/progress") },
  { href: "/dashboard/earn", label: "Earn", Icon: Coins, match: (p: string) => p.startsWith("/dashboard/earn") },
  { href: "/dashboard/profile", label: "Profile", Icon: User, match: (p: string) => p.startsWith("/dashboard/profile") },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: left sidebar */}
      <nav aria-label="Dashboard" className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-charcoal/10 bg-white p-4 md:flex">
        <span className="mb-6 px-2 font-heading text-lg font-bold text-brand">GoSkilled</span>
        <ul className="flex flex-col gap-1">
          {TABS.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-brand text-brand-fg" : "text-charcoal/70 hover:bg-brand/5")}>
                  <Icon className="h-5 w-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: bottom navigation */}
      <nav aria-label="Dashboard" className="glass fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-charcoal/10 md:hidden">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={cn("flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-brand" : "text-muted")}>
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
