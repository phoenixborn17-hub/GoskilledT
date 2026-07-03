// Admin audit writer (Ticket 6). EVERY admin mutation records one AdminAction row with the
// real admin as actor (never "system"). Accepts a tx client so the audit is atomic with the
// mutation it accompanies.
import { Prisma } from "../generated/prisma";
import type { AdminIdentity } from "../auth/admin";

export interface AdminActionInput {
  actor: AdminIdentity;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
}

export async function recordAdminAction(
  client: Prisma.TransactionClient,
  input: AdminActionInput,
) {
  return client.adminAction.create({
    data: {
      actorSupabaseId: input.actor.supabaseId,
      actorEmail: input.actor.email,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      meta: input.meta,
    },
  });
}
