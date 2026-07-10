"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, Share2, LogOut, ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  visibleWorkspaces,
  activeWorkspaceKey,
  type Workspace,
} from "../../lib/nav/workspaces";
import { isVisibleIn, type FeatureKey } from "../../lib/feature-visibility";
import { signOutAction } from "../../app/dashboard/actions";
import { Topbar } from "./topbar";
import { SidebarItem } from "./sidebar-item";
import { IconButton } from "../ui/icon-button";
import { Avatar } from "../ui/avatar";
import { Popover } from "../ui/popover";
import { Drawer } from "../ui/drawer";
import { ShareWidget } from "../cards/share-widget";

export interface AppShellProps {
  userName: string;
  referralCode: string;
  shareUrl: string;
  /** Server-resolved feature visibility map (Feature Visibility, DR-040). Presentation gate on top
   *  of server enforcement — the switcher, Share affordance, etc. recompose from this. */
  visibleFeatures: Partial<Record<FeatureKey, boolean>>;
  children: React.ReactNode;
}

// Active-workspace accent (green Learn / gold Earn / neutral Home·Account).
const activePill: Record<Workspace["theme"], string> = {
  neutral: "bg-charcoal/5 text-ink",
  learn: "bg-green-600/10 text-green-800",
  earn: "bg-gold-400/20 text-warning-strong",
};

function longestActiveHref(hrefs: string[], pathname: string): string | null {
  return (
    hrefs
      .filter((h) => pathname === h || pathname.startsWith(h + "/"))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}

/**
 * The GoSkilled app shell (Nav_Workspace_Architecture v1.1 — LOCKED). ONE nav system: a THIN
 * persistent workspace switcher (a left icon-rail on desktop; the bottom bar on mobile) + a
 * CONTEXTUAL sidebar that lists ONLY the active workspace's pages. No all-workspaces list, no
 * separate sub-nav, no Guru. Persistent Share lives in the top bar (+ the desktop rail). Presentational
 * chrome only — wraps the existing pages without touching any route or business logic; the active
 * workspace themes the subtree via `[data-theme]`.
 */
export function AppShell({
  userName,
  referralCode,
  shareUrl,
  visibleFeatures,
  children,
}: AppShellProps) {
  const pathname = usePathname() ?? "/dashboard/home";
  // Presentation recomposition from the server-resolved map (server routes/actions enforce for real).
  const workspaces = visibleWorkspaces((f) => isVisibleIn(visibleFeatures, f));
  // The referral share affordance is part of the Affiliate layer — hide it when `earn` is hidden.
  const shareVisible = isVisibleIn(visibleFeatures, "earn");
  const activeKey = activeWorkspaceKey(pathname);
  const active = workspaces.find((w) => w.key === activeKey) ?? workspaces[0];
  const hasContext = active.items.length > 0;
  const dataTheme = active.theme;

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const openShare = () => {
    setDrawerOpen(false);
    setShareOpen(true);
  };

  const activeItemHref = longestActiveHref(
    active.items.map((i) => i.href),
    pathname,
  );

  // The persistent workspace switcher (icon rail on desktop, bottom bar on mobile).
  const switcher = (variant: "rail" | "bar") =>
    workspaces.map((ws) => {
      const isActive = ws.key === activeKey;
      return (
        <Link
          key={ws.key}
          href={ws.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex flex-col items-center justify-center gap-1 font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
            variant === "rail"
              ? "w-14 rounded-gs py-2 text-caption"
              : "min-h-[56px] flex-1 py-1.5 text-caption",
            isActive
              ? variant === "rail"
                ? activePill[ws.theme]
                : "text-theme-strong"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <ws.icon className="h-5 w-5" aria-hidden />
          {ws.label}
        </Link>
      );
    });

  // Contextual page list for the active workspace (drawer + desktop sidebar).
  const contextNav = (onNavigate?: () => void) => (
    <nav aria-label={`${active.label} pages`} className="space-y-1">
      {active.items.map((item) => (
        <SidebarItem
          key={item.href}
          icon={item.icon}
          label={item.label}
          href={item.href}
          active={item.href === activeItemHref}
        />
      ))}
      {active.key !== "home" && (
        <Link
          href="/dashboard/home"
          onClick={onNavigate}
          className="mt-2 flex items-center gap-3 rounded-gs px-3 py-2.5 text-small font-medium text-ink-muted hover:bg-charcoal/5 hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
          Home
        </Link>
      )}
    </nav>
  );

  return (
    <div data-theme={dataTheme} className="min-h-dvh bg-surface">
      {/* Desktop: thin workspace switcher rail */}
      <nav
        aria-label="Workspaces"
        className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center gap-1 border-r border-line bg-surface-raised py-3 md:flex"
      >
        <Link
          href="/dashboard/home"
          aria-label="GoSkilled home"
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-heading text-lg font-extrabold text-brand-fg"
        >
          G
        </Link>
        {switcher("rail")}
        {shareVisible && (
          <div className="mt-auto">
            <IconButton
              aria-label="Share your link"
              variant="outline"
              onClick={openShare}
            >
              <Share2 className="h-5 w-5" aria-hidden />
            </IconButton>
          </div>
        )}
      </nav>

      {/* Desktop: contextual sidebar (only when the workspace has pages) */}
      {hasContext && (
        <aside className="fixed inset-y-0 left-[72px] z-30 hidden w-[232px] flex-col border-r border-line bg-surface-raised md:flex">
          <div className="flex h-16 items-center px-4">
            <p className="font-heading text-h4 font-bold text-ink">
              {active.label}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3">{contextNav()}</div>
        </aside>
      )}

      {/* Mobile drawer — the contextual pages (overflow only). */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="left"
        title={active.label}
      >
        {contextNav(() => setDrawerOpen(false))}
      </Drawer>

      {/* Main column */}
      <div className={cn("md:pl-[72px]", hasContext && "md:pl-[304px]")}>
        <Topbar
          left={
            <>
              {hasContext && (
                <IconButton
                  aria-label="Open menu"
                  className="md:hidden"
                  onClick={() => setDrawerOpen(true)}
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </IconButton>
              )}
              <h1 className="truncate font-heading text-h4 font-bold text-ink">
                {active.label}
              </h1>
            </>
          }
          actions={
            <>
              {shareVisible && (
                <IconButton
                  aria-label="Share your link"
                  variant="outline"
                  onClick={openShare}
                >
                  <Share2 className="h-5 w-5" aria-hidden />
                </IconButton>
              )}
              <IconButton aria-label="Notifications">
                <Bell className="h-5 w-5" aria-hidden />
              </IconButton>
              <Popover
                align="end"
                trigger={
                  <button
                    type="button"
                    aria-label="Profile menu"
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
                  >
                    <Avatar name={userName} size="sm" />
                  </button>
                }
              >
                <div className="px-2 py-1.5">
                  <p className="truncate text-small font-semibold text-ink">
                    {userName}
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="block rounded-lg px-2 py-2 text-small text-ink hover:bg-surface-sunken"
                >
                  Profile &amp; settings
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-small text-ink hover:bg-surface-sunken"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Log out
                  </button>
                </form>
              </Popover>
            </>
          }
        />

        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile: workspace switcher bottom bar */}
      <nav
        aria-label="Workspaces"
        className="glass fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {switcher("bar")}
      </nav>

      {/* Share sheet — the persistent Share affordance opens the full widget. Part of the Affiliate
          layer: not rendered (and not reachable) when `earn` is hidden. */}
      {shareVisible && (
        <Drawer
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          side="bottom"
          title="Share & earn"
        >
          <ShareWidget
            link={shareUrl}
            whatsappMessage={`Main GoSkilled par seekh raha hoon — tu bhi join kar: ${shareUrl}`}
            className="border-0 p-0 shadow-none"
          />
          <p className="mt-3 text-caption text-ink-muted">
            Your referral code:{" "}
            <span className="font-mono">{referralCode}</span>
          </p>
        </Drawer>
      )}
    </div>
  );
}
