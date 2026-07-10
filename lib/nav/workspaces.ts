// App-shell navigation model (Nav_Workspace_Architecture v1.1 — LOCKED). ONE nav system: a THIN
// persistent switcher (Home · Learn · Earn · Account) + a CONTEXTUAL sidebar that lists ONLY the
// active workspace's pages. No all-workspaces list, no separate in-workspace sub-nav, no Guru,
// no Explore (Explore folded into Learn "Browse" + a Home "Store" card). Every href points at a
// REAL existing route — the shell wraps the app; it never invents routes. Dedup: KYC = Account
// only; Wallet includes Withdraw; My-Team → My Network.
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Award,
  CalendarDays,
  Compass,
  Briefcase,
  Users,
  Upload,
  Wallet,
  Percent,
  User,
  ShieldCheck,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { isFeatureVisible, type FeatureKey } from "../feature-visibility";
import type { WorkspaceTheme } from "../../components/nav/workspace-switcher";

export type WorkspaceKey = "home" | "learn" | "earn" | "account";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface Workspace {
  key: WorkspaceKey;
  /** Feature-Visibility key (Phase 7 can hide a workspace + recompose the switcher). */
  feature: FeatureKey;
  label: string;
  icon: LucideIcon;
  href: string;
  theme: WorkspaceTheme;
  /** The contextual sidebar for this workspace (its pages only). */
  items: NavItem[];
}

export const WORKSPACES: Workspace[] = [
  {
    key: "home",
    feature: "home",
    label: "Home",
    icon: Home,
    href: "/dashboard/home",
    theme: "neutral",
    items: [], // Home is the hub — no contextual sub-pages.
  },
  {
    key: "learn",
    feature: "learn",
    label: "Learn",
    icon: GraduationCap,
    href: "/dashboard/learn",
    theme: "learn",
    items: [
      { label: "Dashboard", href: "/dashboard/learn", icon: LayoutDashboard },
      { label: "My Courses", href: "/dashboard/courses", icon: BookOpen },
      { label: "Certificates", href: "/dashboard/progress", icon: Award },
      { label: "Webinars", href: "/webinar", icon: CalendarDays },
      { label: "Browse", href: "/courses", icon: Compass },
    ],
  },
  {
    key: "earn",
    feature: "earn",
    label: "Earn",
    icon: Briefcase,
    href: "/dashboard/earn",
    theme: "earn",
    items: [
      { label: "Dashboard", href: "/dashboard/earn", icon: LayoutDashboard },
      { label: "My Network", href: "/dashboard/earn/network", icon: Users },
      { label: "Leads", href: "/dashboard/earn/my-leads", icon: Upload },
      { label: "Wallet", href: "/dashboard/earn/wallet", icon: Wallet },
      {
        label: "Commission Structure",
        href: "/dashboard/earn/commission-structure",
        icon: Percent,
      },
    ],
  },
  {
    key: "account",
    feature: "account",
    label: "Account",
    icon: User,
    href: "/dashboard/profile",
    theme: "neutral",
    items: [
      { label: "Profile", href: "/dashboard/profile", icon: User },
      { label: "KYC", href: "/dashboard/earn/kyc", icon: ShieldCheck },
      { label: "Support", href: "/contact", icon: LifeBuoy },
    ],
  },
];

/** Workspaces the current viewer may see (Feature-Visibility stub → all; Phase 7 resolves). */
export function visibleWorkspaces(): Workspace[] {
  return WORKSPACES.filter((w) => isFeatureVisible(w.feature));
}

/** Which workspace a pathname belongs to — drives the switcher highlight + theme. */
export function activeWorkspaceKey(pathname: string): WorkspaceKey {
  if (pathname.startsWith("/dashboard/home")) return "home";
  // KYC is de-duplicated to Account (its route still lives under /dashboard/earn).
  if (pathname.startsWith("/dashboard/earn/kyc")) return "account";
  if (pathname.startsWith("/dashboard/earn")) return "earn";
  if (pathname.startsWith("/dashboard/profile")) return "account";
  if (
    pathname.startsWith("/dashboard/learn") ||
    pathname.startsWith("/dashboard/courses") ||
    pathname.startsWith("/dashboard/progress")
  ) {
    return "learn";
  }
  return "home"; // /dashboard root + anything else → Home
}
