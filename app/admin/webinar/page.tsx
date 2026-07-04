// /admin/webinar — schedule the two-session model + see registrations (GPS-M4 §2.6). Scheduled
// sessions publish to /webinar + Event JSON-LD. Registrations come from CRM leads.
import {
  listWebinars,
  listWebinarRegistrations,
} from "../../../lib/admin/webinar";
import {
  ScheduleWebinarForm,
  WebinarActiveToggle,
} from "../../../components/admin/webinar-forms";
import {
  PageHeading,
  DataTable,
  type Column,
  fmtDateTime,
} from "../../../components/admin/primitives";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

export const dynamic = "force-dynamic";

type WRow = Awaited<ReturnType<typeof listWebinars>>[number];
type RRow = Awaited<ReturnType<typeof listWebinarRegistrations>>[number];

export default async function WebinarAdminPage() {
  const [sessions, registrations] = await Promise.all([
    listWebinars(),
    listWebinarRegistrations(),
  ]);

  const sessionCols: Column<WRow>[] = [
    { key: "title", header: "Topic", cell: (w) => w.title },
    { key: "startsAt", header: "Starts", cell: (w) => fmtDateTime(w.startsAt) },
    {
      key: "active",
      header: "Status",
      cell: (w) => (
        <Badge variant={w.isActive ? "brand" : "muted"}>
          {w.isActive ? "Active" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      cell: (w) => (
        <WebinarActiveToggle webinarId={w.id} isActive={w.isActive} />
      ),
    },
  ];

  const regCols: Column<RRow>[] = [
    { key: "name", header: "Name", cell: (r) => r.name ?? "—" },
    { key: "phone", header: "Phone", cell: (r) => r.phone ?? "—" },
    {
      key: "interest",
      header: "Interest",
      cell: (r) => r.packageInterest ?? "—",
    },
    {
      key: "when",
      header: "Registered",
      cell: (r) => fmtDateTime(r.createdAt),
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeading
        title="Webinar"
        subtitle="Schedule the Sun intro / Fri training sessions. Published sessions feed the public page."
      />

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold">
          Schedule a session
        </h2>
        <ScheduleWebinarForm />
      </Card>

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold">Sessions</h2>
        <DataTable
          columns={sessionCols}
          rows={sessions}
          rowKey={(w) => w.id}
          empty="No sessions scheduled yet."
          minWidth="40rem"
        />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold">
          Registrations{" "}
          <span className="text-muted">({registrations.length})</span>
        </h2>
        <DataTable
          columns={regCols}
          rows={registrations}
          rowKey={(r) => r.id}
          empty="No webinar registrations yet."
          minWidth="40rem"
        />
      </div>
    </section>
  );
}
