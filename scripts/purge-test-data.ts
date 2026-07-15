// Purge integration-test rows from the (shared) database. DRY-RUN by default — prints exactly what
// it WOULD delete and changes nothing. Pass --confirm to actually delete.
//
//   tsx scripts/purge-test-data.ts            # dry run (safe)
//   tsx scripts/purge-test-data.ts --confirm  # delete
//
// SAFETY:
//   • Only role=USER accounts whose referralCode / supabaseId match documented TEST patterns.
//   • Admins are never matched.
//   • APPEND-ONLY LEDGER IS SACRED: this script NEVER deletes LedgerTransaction or LedgerEntry
//     rows. Any matched user that HAS ledger entries is EXCLUDED from deletion and listed for
//     manual review instead (money history must be reviewed by a human, never bulk-purged).
//   • Empty LedgerAccount rows (zero entries) for purged users are removed so the user delete
//     doesn't FK-violate — an account with no entries carries no financial history.
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();
const CONFIRM = process.argv.includes("--confirm");

// Documented test-data markers (see tests/*.integration.test.ts run-id generators):
//   referralCode = `${runId}${tag}`.toUpperCase() → "IT…" (money-flow), "T3…" (checkout),
//   "LMS…" (lms), "REF…" (user-sync), "RC…" (referral-click). supabaseId → "sb_…" / "admin_…"
//   (never a real UUID). ReferralClick rows themselves are NOT user-linked (no FK) — they use the
//   same "RC…" code prefix and are cheap, unattributable analytics rows; left for manual review.
const REFERRAL_PREFIXES = ["IT", "T3", "LMS", "REF", "RC"];
const SUPABASE_PREFIXES = ["sb_", "admin_"];
// Leads aren't FK-linked to a user; match by test-only source prefixes or the test users' phones.
const LEAD_SOURCE_PREFIXES = ["t3", "t6-", "it", "lms"];
// WebhookEvent isn't user-linked; test ids are synthetic ("evt_capture_…", "evt_refund_…").
const WEBHOOK_EVENT_PREFIXES = ["evt_capture_", "evt_refund_"];

function maskDbHost(): string {
  const url = process.env.DATABASE_URL ?? "";
  const m = url.match(/@([^/:]+)/);
  return m ? m[1] : "(unknown host)";
}

async function main() {
  console.log(`\nPurge test data — target DB host: ${maskDbHost()}`);
  console.log(
    CONFIRM
      ? "MODE: --confirm (will DELETE)\n"
      : "MODE: DRY RUN (no changes)\n",
  );

  const candidates = await prisma.user.findMany({
    where: {
      role: "USER",
      OR: [
        ...REFERRAL_PREFIXES.map((p) => ({ referralCode: { startsWith: p } })),
        ...SUPABASE_PREFIXES.map((p) => ({ supabaseId: { startsWith: p } })),
      ],
    },
    select: {
      id: true,
      phone: true,
      referralCode: true,
      supabaseId: true,
      createdAt: true,
      ledgerAccount: { select: { id: true } },
    },
  });

  // Which candidate ledger accounts actually hold entries? Those users are OFF-LIMITS.
  const accountIds = candidates
    .map((u) => u.ledgerAccount?.id)
    .filter((x): x is string => !!x);
  const withEntries = new Set<string>();
  if (accountIds.length > 0) {
    const grouped = await prisma.ledgerEntry.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds } },
      _count: { _all: true },
    });
    for (const g of grouped)
      if (g._count._all > 0) withEntries.add(g.accountId);
  }

  const review = candidates.filter(
    (u) => u.ledgerAccount && withEntries.has(u.ledgerAccount.id),
  );
  const purge = candidates.filter(
    (u) => !(u.ledgerAccount && withEntries.has(u.ledgerAccount.id)),
  );

  console.log(
    `Matched ${candidates.length} test user(s): ${purge.length} purgeable, ${review.length} held for manual review (ledger history).\n`,
  );

  if (review.length > 0) {
    console.log("HELD FOR MANUAL REVIEW (has ledger entries — NOT touched):");
    for (const u of review) {
      console.log(
        `  • ${u.id}  phone=${u.phone ?? "-"}  ref=${u.referralCode}`,
      );
    }
    console.log("");
  }

  if (purge.length === 0) {
    console.log("Nothing to purge.\n");
    return;
  }

  console.log("PURGEABLE test users:");
  for (const u of purge) {
    console.log(
      `  • ${u.id}  phone=${u.phone ?? "-"}  ref=${u.referralCode}  supabaseId=${u.supabaseId ?? "-"}  created=${u.createdAt.toISOString()}`,
    );
  }

  const ids = purge.map((u) => u.id);
  const phones = purge.map((u) => u.phone).filter((p): p is string => !!p);

  // Count the collateral rows so the dry run is fully transparent.
  const [
    progress,
    certs,
    enrollments,
    withdrawals,
    kyc,
    referrals,
    affiliates,
    orders,
    emptyAccounts,
    leadCount,
    webhookCount,
  ] = await Promise.all([
    prisma.lessonProgress.count({ where: { userId: { in: ids } } }),
    prisma.certificate.count({ where: { userId: { in: ids } } }),
    prisma.enrollment.count({ where: { userId: { in: ids } } }),
    prisma.withdrawal.count({ where: { userId: { in: ids } } }),
    prisma.kyc.count({ where: { userId: { in: ids } } }),
    prisma.referral.count({
      where: {
        OR: [{ uplineUserId: { in: ids } }, { downlineUserId: { in: ids } }],
      },
    }),
    prisma.affiliate.count({ where: { userId: { in: ids } } }),
    prisma.order.count({ where: { userId: { in: ids } } }),
    prisma.ledgerAccount.count({ where: { userId: { in: ids } } }),
    prisma.lead.count({
      where: {
        OR: [
          { phone: { in: phones } },
          ...LEAD_SOURCE_PREFIXES.map((p) => ({ source: { startsWith: p } })),
        ],
      },
    }),
    prisma.webhookEvent.count({
      where: {
        OR: WEBHOOK_EVENT_PREFIXES.map((p) => ({ eventId: { startsWith: p } })),
      },
    }),
  ]);

  console.log(
    `\nCollateral rows: ${orders} orders · ${enrollments} enrollments · ${progress} lessonProgress · ` +
      `${certs} certificates · ${referrals} referrals · ${affiliates} affiliates · ${withdrawals} withdrawals · ` +
      `${kyc} kyc · ${emptyAccounts} empty ledgerAccounts · ${leadCount} leads · ${webhookCount} webhookEvents`,
  );
  console.log(
    "(LedgerTransaction / LedgerEntry rows are NEVER deleted by this script.)\n",
  );

  if (!CONFIRM) {
    console.log(
      "DRY RUN complete — nothing deleted. Re-run with --confirm to delete.\n",
    );
    return;
  }

  // Delete children before parents; break self-referential referredById first.
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({ where: { userId: { in: ids } } }),
    prisma.certificate.deleteMany({ where: { userId: { in: ids } } }),
    prisma.enrollment.deleteMany({ where: { userId: { in: ids } } }),
    prisma.withdrawal.deleteMany({ where: { userId: { in: ids } } }),
    prisma.kyc.deleteMany({ where: { userId: { in: ids } } }),
    prisma.referral.deleteMany({
      where: {
        OR: [{ uplineUserId: { in: ids } }, { downlineUserId: { in: ids } }],
      },
    }),
    prisma.affiliate.deleteMany({ where: { userId: { in: ids } } }),
    prisma.order.deleteMany({ where: { userId: { in: ids } } }),
    prisma.ledgerAccount.deleteMany({ where: { userId: { in: ids } } }), // zero-entry accounts only
    prisma.user.updateMany({
      where: { referredById: { in: ids } },
      data: { referredById: null },
    }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);

  const leadsDeleted = await prisma.lead.deleteMany({
    where: {
      OR: [
        { phone: { in: phones } },
        ...LEAD_SOURCE_PREFIXES.map((p) => ({ source: { startsWith: p } })),
      ],
    },
  });
  const webhooksDeleted = await prisma.webhookEvent.deleteMany({
    where: {
      OR: WEBHOOK_EVENT_PREFIXES.map((p) => ({ eventId: { startsWith: p } })),
    },
  });

  console.log(
    `Deleted ${purge.length} users, ${leadsDeleted.count} leads, ${webhooksDeleted.count} webhookEvents (+ collateral above).`,
  );
  if (review.length > 0)
    console.log(
      `${review.length} user(s) with ledger history were left untouched — review manually.`,
    );
  console.log("");
}

main()
  .catch((e) => {
    console.error("purge-test-data failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
