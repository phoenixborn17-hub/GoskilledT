// Dashboard checklist-state parsing helper. The old `getHubData` loader (and its Hub* types) was
// superseded by lib/home/summary.ts + lib/learn/dashboard.ts and REMOVED (DR-040 cleanup — it carried
// dead affiliate/referral markup). Only the checklistState parser remains, still used by the Home hub.
// checklistState JSON is validated on read — never trusted as-is (Golden Rule 4 at every boundary).
import { z } from "zod";
import type { Prisma } from "../generated/prisma";

const ChecklistStateSchema = z
  .object({ dismissedAt: z.string().optional() })
  .catch({ dismissedAt: undefined });

export function parseChecklistState(raw: Prisma.JsonValue | null | undefined): {
  dismissedAt?: string;
} {
  return ChecklistStateSchema.parse(raw ?? {});
}
