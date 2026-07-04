// /admin/kyc — the KYC review queue (GPS-M4 §2.2). SUBMITTED records, oldest first; the human gate
// before money leaves. No PII in the queue — click through to the (masked) detail.
import Link from "next/link";
import { listKycQueue } from "../../../lib/admin/kyc";
import {
  PageHeading,
  DataTable,
  type Column,
  fmtDateTime,
} from "../../../components/admin/primitives";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listKycQueue>>[number];

export default async function KycQueuePage() {
  const rows = await listKycQueue();

  const columns: Column<Row>[] = [
    { key: "phone", header: "Phone", cell: (r) => r.phone ?? "—" },
    {
      key: "submitted",
      header: "Submitted",
      cell: (r) => fmtDateTime(r.submittedAt),
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      cell: (r) => (
        <Link
          href={`/admin/kyc/${r.userId}`}
          className="font-semibold text-brand-deep hover:underline"
        >
          Review →
        </Link>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <PageHeading
        title="KYC review"
        subtitle={`${rows.length} awaiting review — oldest first.`}
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.userId}
        empty="No KYC submissions awaiting review. 🎉"
        minWidth="34rem"
      />
      <p className="text-xs text-muted">
        Sensitive details stay masked until you explicitly reveal them (each
        reveal is logged).
      </p>
    </section>
  );
}
