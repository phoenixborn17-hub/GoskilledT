"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Contact, Flag } from "lucide-react";
import { cn } from "../../lib/utils";

// Admin = charcoal-neutral (Blueprint), not green-forward.
const TABS = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/payments", label: "Payments", Icon: CreditCard },
  { href: "/admin/leads", label: "Leads", Icon: Contact },
  { href: "/admin/review-queue", label: "Review", Icon: Flag },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <nav aria-label="Admin" className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-charcoal/10 bg-charcoal p-4 md:flex">
        <span className="mb-6 px-2 font-heading text-lg font-bold text-white">GoSkilled <span className="text-white/50">Admin</span></span>
        <ul className="flex flex-col gap-1">
          {TABS.map(({ href, label, Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-white text-charcoal" : "text-white/70 hover:bg-white/10")}>
                  <Icon className="h-5 w-5" aria-hidden /> {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile top tabs (horizontal scroll) */}
      <nav aria-label="Admin" className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-charcoal/10 bg-charcoal px-2 py-2 md:hidden">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                active ? "bg-white text-charcoal" : "text-white/70")}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
