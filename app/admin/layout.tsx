// Admin shell (Ticket 6, Task 3). RBAC is enforced by middleware; this re-checks server-side
// (defence in depth) and shows the admin identity + logout. Charcoal-neutral theme.
import { redirect } from "next/navigation";
import { getAdminUser } from "../../lib/auth/admin";
import { AdminNav } from "../../components/admin/admin-nav";
import { signOutAction } from "../dashboard/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/login?next=/admin");

  return (
    <div className="min-h-dvh bg-charcoal/5">
      <AdminNav />
      <div className="md:pl-56">
        <header className="flex h-14 items-center justify-between border-b border-charcoal/10 bg-white px-4">
          <span className="font-heading text-sm font-bold text-charcoal md:hidden">Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="max-w-[12rem] truncate text-sm text-muted" title={admin.email ?? undefined}>{admin.email ?? "admin"}</span>
            <form action={signOutAction}>
              <button type="submit" className="rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm font-medium text-charcoal hover:bg-charcoal/5">Log out</button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl p-4">{children}</main>
      </div>
    </div>
  );
}
