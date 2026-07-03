// Admin read-only queries (Ticket 6). Server-only. Revenue/counts from real rows.
import { prisma } from "../prisma";
import { payoutsEnabled } from "../env";
import type { LeadStage } from "../../modules/crm/lead";
import type { OrderStatus } from "../generated/prisma";

const USERS_PAGE_SIZE = 20;

async function reviewState() {
  const [flags, resolved] = await Promise.all([
    prisma.adminAction.findMany({
      where: { action: "FLAG_MANUAL_REVIEW" },
      orderBy: { createdAt: "desc" },
      select: { id: true, entityId: true, meta: true, createdAt: true },
    }),
    prisma.adminAction.findMany({ where: { action: "REVIEW_RESOLVED" }, select: { entityId: true } }),
  ]);
  const resolvedIds = new Set(resolved.map((r) => r.entityId).filter((x): x is string => !!x));
  return { flags, resolvedIds };
}

export interface ReviewItem {
  id: string;
  orderId: string | null;
  reason: string | null;
  createdAt: Date;
  resolved: boolean;
}

export async function listReviewQueue(): Promise<ReviewItem[]> {
  const { flags, resolvedIds } = await reviewState();
  return flags.map((f) => ({
    id: f.id,
    orderId: f.entityId,
    reason: (f.meta as { reason?: string } | null)?.reason ?? null,
    createdAt: f.createdAt,
    resolved: f.entityId ? resolvedIds.has(f.entityId) : false,
  }));
}

export async function getAdminOverview() {
  const [users, paidOrders, revenue, leadGroups, queue] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({ _sum: { amountInPaise: true }, where: { status: "PAID" } }),
    prisma.lead.groupBy({ by: ["stage"], _count: { _all: true } }),
    listReviewQueue(),
  ]);
  return {
    users,
    paidOrders,
    revenueInPaise: revenue._sum.amountInPaise ?? 0,
    leadsByStage: Object.fromEntries(leadGroups.map((g) => [g.stage, g._count._all])) as Record<string, number>,
    pendingReview: queue.filter((q) => !q.resolved).length,
    payoutsEnabled: payoutsEnabled(),
  };
}

export async function listUsers(opts: { page: number; q?: string }) {
  const page = Math.max(1, opts.page);
  const q = opts.q?.trim();
  const where = q
    ? { OR: [{ phone: { contains: q } }, { referralCode: { contains: q.toUpperCase() } }] }
    : {};
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      select: {
        id: true,
        phone: true,
        referralCode: true,
        createdAt: true,
        referredBy: { select: { referralCode: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { rows, total, page, pageSize: USERS_PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)) };
}

export async function listPayments(opts: { status?: OrderStatus }) {
  return prisma.order.findMany({
    where: opts.status ? { status: opts.status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      amountInPaise: true,
      status: true,
      paidAt: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      createdAt: true,
      user: { select: { phone: true } },
      package: { select: { name: true } },
    },
  });
}

export async function listLeads(opts: { stage?: LeadStage }) {
  return prisma.lead.findMany({
    where: opts.stage ? { stage: opts.stage } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
