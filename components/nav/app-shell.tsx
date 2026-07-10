"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Sparkles,
  Share2,
  LogOut,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  visibleWorkspaces,
  activeWorkspaceKey,
  type Workspace,
} from "../../lib/nav/workspaces";
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
  children: React.ReactNode;
}

// Active-workspace accent for the switcher pill (green Learn / gold Earn / neutral else).
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
 * The GoSkilled app shell (Redesign U2 · IA v2.0). Left sidebar (workspace switcher + active-
 * workspace sub-nav + persistent Share) · sticky top bar (title · Guru entry · notifications ·
 * profile) · mobile drawer + 4-item bottom bar (Home · Learn · Earn · Share). Presentational chrome
 * only — it wraps the existing pages without touching any route or business logic. The active
 * workspace themes the subtree via `[data-theme]`. Guru is a floating entry everywhere (full chat
 * wiring is Phase 5); Feature-Visibility recomposition is stubbed (Phase 7).
 */
export function AppShell({
  userName,
  referralCode,
  shareUrl,
  children,
}: AppShellProps) {
  const pathname = usePathname() ?? "/dashboard";
  const workspaces = visibleWorkspaces();
  const activeKey = activeWorkspaceKey(pathname);
  const active = workspaces.find((w) => w.key === activeKey) ?? workspaces[0];
  const dataTheme = active.theme; // "learn" | "earn" | "neutral"

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [guruOpen, setGuruOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);

  const openGuru = () => {
    setDrawerOpen(false);
    setGuruOpen(true);
  };
  const openShare = () => {
    setDrawerOpen(false);
    setShareOpen(true);
  };

  const activeItemHref = longestActiveHref(
    active.items.map((i) => i.href),
    pathname,
  );

  const nav = (collapsed = false, onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Link
          href="/dashboard/home"
          className="font-heading text-lg font-extrabold text-brand"
          onClick={onNavigate}
        >
          GoSkilled
        </Link>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-3">
        {/* Workspace switcher — always shows the active surface (Amendments §A). */}
        <nav aria-label="Workspaces" className="space-y-1">
          {workspaces.map((ws) => {
            const isActive = ws.key === activeKey;
            const cls = cn(
              "flex w-full items-center gap-3 rounded-gs px-3 py-2.5 text-small font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
              isActive
                ? activePill[ws.theme]
                : "text-ink-muted hover:bg-charcoal/5 hover:text-ink",
            );
            const inner = (
              <>
                <ws.icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="flex-1 text-left">{ws.label}</span>
              </>
            );
            // Guru has no route — it opens the floating panel instead of navigating.
            return ws.href === null ? (
              <button
                key={ws.key}
                type="button"
                onClick={openGuru}
                className={cls}
              >
                {inner}
              </button>
            ) : (
              <Link
                key={ws.key}
                href={ws.href}
                aria-current={isActive ? "page" : undefined}
                onClick={onNavigate}
                className={cls}
              >
                {inner}
              </Link>
            );
          })}
        </nav>

        {/* Active-workspace sub-nav (contextual). */}
        {active.items.length > 0 && (
          <div className="space-y-1 border-t border-line pt-3">
            <p className="px-3 pb-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
              {active.label}
            </p>
            {active.items.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={item.href === activeItemHref}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>

      {/* Persistent Share (DR-039). */}
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={openShare}
          className="flex w-full items-center gap-2 rounded-gs bg-theme/10 px-3 py-2.5 text-small font-semibold text-theme-strong transition-colors hover:bg-theme/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Share &amp; earn
          <ChevronRight className="ml-auto h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );

  return (
    <div data-theme={dataTheme} className="min-h-dvh bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line bg-surface-raised md:block">
        {nav()}
      </aside>

      {/* Mobile drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="left"
      >
        {nav(false, () => setDrawerOpen(false))}
      </Drawer>

      {/* Main column */}
      <div className="md:pl-[264px]">
        <Topbar
          left={
            <>
              <IconButton
                aria-label="Open menu"
                className="md:hidden"
                onClick={() => setDrawerOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden />
              </IconButton>
              <h1 className="truncate font-heading text-h4 font-bold text-ink">
                {active.label}
              </h1>
            </>
          }
          actions={
            <>
              <IconButton
                aria-label="Ask Guru"
                variant="outline"
                onClick={openGuru}
              >
                <Sparkles className="h-5 w-5" aria-hidden />
              </IconButton>
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

      {/* Mobile bottom bar — Home · Learn · Earn · Share (Share opens the sheet). */}
      <nav
        aria-label="Primary"
        className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {workspaces
          .filter((w) => ["home", "learn", "earn"].includes(w.key))
          .map((w) => {
            const isActive = w.key === activeKey;
            return (
              <Link
                key={w.key}
                href={w.href ?? "/dashboard/home"}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-caption font-medium",
                  isActive ? "text-theme-strong" : "text-ink-muted",
                )}
              >
                <w.icon className="h-5 w-5" aria-hidden />
                {w.label}
              </Link>
            );
          })}
        <button
          type="button"
          onClick={openShare}
          className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-caption font-medium text-ink-muted"
        >
          <Share2 className="h-5 w-5" aria-hidden />
          Share
        </button>
      </nav>

      {/* Guru floating panel (Phase-5 full wiring). Honest entry to the real in-lesson Guru. */}
      <Drawer
        open={guruOpen}
        onClose={() => setGuruOpen(false)}
        side="right"
        title="Guru — your Hinglish study buddy"
      >
        <div className="space-y-4">
          <p className="text-small text-ink-muted">
            Ask a doubt in plain Hinglish and get unstuck — any time, on any
            lesson.
          </p>
          <Link
            href="/dashboard/learn"
            onClick={() => setGuruOpen(false)}
            className="press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-theme px-4 py-2.5 text-small font-semibold text-theme-fg hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Open Guru in your lesson
          </Link>
          <p className="text-caption text-ink-muted">
            A full Guru chat is coming to every screen soon.
          </p>
        </div>
      </Drawer>

      {/* Share sheet — the persistent Share affordance opens the full widget. */}
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
          Your referral code: <span className="font-mono">{referralCode}</span>
        </p>
      </Drawer>
    </div>
  );
}
