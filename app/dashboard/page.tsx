// The dashboard root now redirects to the Home hub — one home (DR-039 · Redesign U3/U4).
// The old composite hub was superseded by /dashboard/home; post-auth already lands there.
import { redirect } from "next/navigation";

export default function DashboardIndex() {
  redirect("/dashboard/home");
}
