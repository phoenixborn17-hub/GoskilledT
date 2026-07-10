import * as React from "react";
import { cn } from "../../lib/utils";

/** Multi-line text input, styled to match <Input>. Pairs with <FormField> for label + error. */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      "w-full rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 text-body text-ink",
      "placeholder:text-ink-muted/70",
      "focus-visible:border-theme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme/30",
      "disabled:cursor-not-allowed disabled:opacity-60",
      "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/30",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
