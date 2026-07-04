// /admin/catalog — course list (GPS-M4 §2.5). Real content enters the product via the per-course
// editor. DR-011: the 7-course catalog is fixed — an 8th course needs a DR (no create button here).
import Link from "next/link";
import { listAdminCatalog } from "../../../lib/admin/catalog";
import {
  PageHeading,
  DataTable,
  type Column,
} from "../../../components/admin/primitives";
import { Badge } from "../../../components/ui/badge";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listAdminCatalog>>[number];

const STATUS_VARIANT: Record<string, "brand" | "muted" | "gold" | "outline"> = {
  PUBLISHED: "brand",
  COMING_SOON: "gold",
  DRAFT: "muted",
};

export default async function CatalogPage() {
  const courses = await listAdminCatalog();

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Course",
      cell: (c) => (
        <Link
          href={`/admin/catalog/${c.id}`}
          className="font-semibold text-brand-deep hover:underline"
        >
          {c.title}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c) => (
        <Badge variant={STATUS_VARIANT[c.status] ?? "muted"}>
          {c.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "modules",
      header: "Modules",
      cell: (c) => c.modules.length,
    },
    {
      key: "lessons",
      header: "Lessons",
      cell: (c) => c.modules.reduce((n, m) => n + m.lessons.length, 0),
    },
    {
      key: "video",
      header: "With video",
      cell: (c) =>
        c.modules.reduce(
          (n, m) => n + m.lessons.filter((l) => !!l.videoAssetId).length,
          0,
        ),
    },
  ];

  return (
    <section className="space-y-4">
      <PageHeading
        title="Catalog"
        subtitle="Edit courses, modules, lessons and video asset ids. Publish is gated on real content."
      />
      <DataTable
        columns={columns}
        rows={courses}
        rowKey={(c) => c.id}
        empty="No courses. Seed the catalog first."
        minWidth="40rem"
      />
      <p className="text-xs text-muted">
        The 7-course catalog is fixed (DR-011). Adding an 8th course requires a
        Decision Register entry — it can’t be created here.
      </p>
    </section>
  );
}
