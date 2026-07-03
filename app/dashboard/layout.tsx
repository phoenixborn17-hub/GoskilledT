// Dashboard shell (Blueprint §3, §7). Server-side auth guard (defence in depth with middleware).
// Desktop = left sidebar; mobile = bottom nav. Content is padded to clear both.
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth/session";
import { DashboardNav } from "../../components/dashboard/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <div className="min-h-dvh bg-offwhite">
      <DashboardNav />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:pb-8 md:pl-60">{children}</main>
    </div>
  );
}
