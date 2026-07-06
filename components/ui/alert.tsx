import * as React from "react";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

type Variant = "info" | "success" | "warning" | "error";

// Soft tint + accessible text — never a "red wall" (DESIGN_DIRECTION §15). `warning` uses the
// darker `warning-strong` amber (not gold — Golden Rule 14) so text + icon clear WCAG AA/1.4.11 on
// the amber tint. All four variants measured ≥4.5:1 text / ≥3:1 icon on their own surface.
// error/warning announce assertively (role="alert"); info/success are polite (role="status").
const styles: Record<
  Variant,
  {
    wrap: string;
    icon: LucideIcon;
    iconColor: string;
    role: "alert" | "status";
  }
> = {
  info: {
    wrap: "border-info/20 bg-info/10 text-info",
    icon: Info,
    iconColor: "text-info",
    role: "status",
  },
  success: {
    wrap: "border-brand/20 bg-brand/10 text-brand-deep",
    icon: CheckCircle2,
    iconColor: "text-brand-deep",
    role: "status",
  },
  warning: {
    wrap: "border-warning/30 bg-warning/10 text-warning-strong",
    icon: AlertTriangle,
    iconColor: "text-warning-strong",
    role: "alert",
  },
  error: {
    wrap: "border-danger/20 bg-danger/10 text-danger",
    icon: AlertCircle,
    iconColor: "text-danger",
    role: "alert",
  },
};

export interface AlertProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  variant?: Variant;
  /** Optional bold lead line above the body. */
  title?: React.ReactNode;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const s = styles[variant];
  const Icon = s.icon;
  return (
    <div
      role={s.role}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        s.wrap,
        className,
      )}
      {...props}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", s.iconColor)}
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
