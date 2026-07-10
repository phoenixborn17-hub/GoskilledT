"use client";
import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: {
    title: string;
    description?: string;
    variant?: ToastVariant;
  }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const config: Record<
  ToastVariant,
  { icon: typeof Info; className: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    className: "border-success/30",
    iconClass: "text-success",
  },
  error: {
    icon: AlertTriangle,
    className: "border-danger/30",
    iconClass: "text-danger",
  },
  info: { icon: Info, className: "border-info/30", iconClass: "text-info" },
};

/**
 * Toast provider — mount once near the app root. Consumers call `useToast().toast(...)`. Toasts
 * slide in, auto-dismiss after 4s, and stack bottom-right (offset above the mobile bottom bar).
 * `aria-live="polite"` so screen readers announce without stealing focus.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ title, description, variant = "info" }) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 sm:bottom-4"
      >
        {items.map((t) => {
          const c = config[t.variant];
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-gs border bg-surface-raised p-3.5 shadow-gs-lg",
                "motion-safe:animate-[enter-up_200ms_cubic-bezier(0.16,1,0.3,1)]",
                c.className,
              )}
            >
              <Icon
                className={cn("mt-0.5 h-5 w-5 shrink-0", c.iconClass)}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-small font-semibold text-ink">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-caption text-ink-muted">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => remove(t.id)}
                className="rounded p-0.5 text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}
