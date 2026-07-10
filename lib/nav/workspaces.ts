// App-shell navigation model (Redesign U2 · IA v2.0 §1/§12 naming via Frozen_Spec_Amendments §A).
// Six workspaces — Home · Learn · Earn · Explore · Guru AI · Account. Every href points at a REAL,
// already-built route (the shell wraps the app; it never invents routes). Sub-pages that don't
// exist yet are simply not listed (built in later phases) — no dead links (D-29). The whole model
// is filtered through the Feature-Visibility hook so Phase 7 can hide any workspace with graceful
// recomposition (DR-040 · Amendments §E).
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Target,
  Briefcase,
  Users,
  Upload,
  Wallet,
  Gift,
  Trophy,
  Percent,
  ShieldCheck,
  Compass,
  Layers,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { isFeatureVisible, type FeatureKey } from "../feature-visibility";
import type { WorkspaceTheme } from "../../components/nav/workspace-switcher";

export type WorkspaceKey = FeatureKey;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface Workspace {
  key: WorkspaceKey;
  label: string;
  icon: LucideIcon;
  /** Landing route. `null` = opens an in-app panel instead of navigating (Guru, Phase-5 wiring). */
  href: string | null;
  theme: WorkspaceTheme;
  items: NavItem[];
}

export const WORKSPACES: Workspace[] = [
  {
    key: "home",
    label: "Home",
    icon: Home,
    href: "/dashboard/home",
    theme: "neutral",
    items: [
      { label: "Dashboard", href: "/dashboard/home", icon: LayoutDashboard },
    ],
  },
  {
    key: "learn",
    label: "Learn",
    icon: GraduationCap,
    href: "/dashboard/learn",
    theme: "learn",
    items: [
      {
        label: "Learning Dashboard",
        href: "/dashboard/learn",
        icon: LayoutDashboard,
      },
      { label: "My Courses", href: "/dashboard/courses", icon: BookOpen },
      { label: "Progress", href: "/dashboard/progress", icon: Target },
    ],
  },
  {
    key: "earn",
    label: "Earn",
    icon: Briefcase,
    href: "/dashboard/earn",
    theme: "earn",
    items: [
      {
        label: "Affiliate Dashboard",
        href: "/dashboard/earn",
        icon: LayoutDashboard,
      },
      { label: "Network", href: "/dashboard/earn/network", icon: Users },
      { label: "My Leads", href: "/dashboard/earn/my-leads", icon: Upload },
      { label: "Wallet", href: "/dashboard/earn/wallet", icon: Wallet },
      { label: "Rewards", href: "/dashboard/earn/rewards", icon: Gift },
      {
        label: "Leaderboard",
        href: "/dashboard/earn/leaderboard",
        icon: Trophy,
      },
      {
        label: "Commission Structure",
        href: "/dashboard/earn/commission-structure",
        icon: Percent,
      },
      {
        label: "Verification (KYC)",
        href: "/dashboard/earn/kyc",
        icon: ShieldCheck,
      },
    ],
  },
  {
    key: "explore",
    label: "Explore",
    icon: Compass,
    href: "/courses",
    theme: "neutral",
    items: [
      { label: "Explore Courses", href: "/courses", icon: Compass },
      { label: "Membership Plans", href: "/packages", icon: Layers },
    ],
  },
  {
    // Guru AI is its own workspace (Amendments §A) AND floats on every surface (top-bar entry).
    // Full chat wiring is Phase 5 — href is null, so the shell opens the Guru panel instead.
    key: "guru",
    label: "Guru AI",
    icon: Sparkles,
    href: null,
    theme: "neutral",
    items: [],
  },
  {
    key: "account",
    label: "Account",
    icon: User,
    href: "/dashboard/profile",
    theme: "neutral",
    items: [
      { label: "Profile", href: "/dashboard/profile", icon: User },
      {
        label: "Verification (KYC)",
        href: "/dashboard/earn/kyc",
        icon: ShieldCheck,
      },
    ],
  },
];

/** Workspaces the current viewer may see (Feature-Visibility stub → all; Phase 7 resolves). */
export function visibleWorkspaces(): Workspace[] {
  return WORKSPACES.filter((w) => isFeatureVisible(w.key));
}

/** Which workspace a pathname belongs to — drives the active highlight + theme. */
export function activeWorkspaceKey(pathname: string): WorkspaceKey {
  if (pathname.startsWith("/dashboard/home")) return "home";
  if (pathname.startsWith("/dashboard/earn")) return "earn";
  if (pathname.startsWith("/dashboard/profile")) return "account";
  if (
    pathname.startsWith("/dashboard/learn") ||
    pathname.startsWith("/dashboard/courses") ||
    pathname.startsWith("/dashboard/progress")
  ) {
    return "learn";
  }
  if (
    pathname.startsWith("/courses") ||
    pathname.startsWith("/packages") ||
    pathname.startsWith("/checkout")
  ) {
    return "explore";
  }
  return "home"; // /dashboard root + anything else → Home
}
