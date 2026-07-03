// Profile tab (Blueprint §3): name, email, goal, logout.
import Link from "next/link";
import { getCurrentUserRecord } from "../../../lib/auth/session";
import { signOutAction } from "../actions";
import { Card, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export const dynamic = "force-dynamic";

const GOAL_LABEL: Record<string, string> = {
  SKILL: "Learn a skill",
  INCOME: "Earn income",
  BOTH: "Both",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-charcoal/5 py-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-charcoal">{value}</span>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await getCurrentUserRecord();

  return (
    <section aria-labelledby="profile-heading" className="space-y-6">
      <h1 id="profile-heading" className="font-heading text-2xl font-bold">
        Profile
      </h1>

      <Card>
        <CardTitle className="mb-2 text-lg">Your details</CardTitle>
        <Row label="Name" value={user?.name || "Not set"} />
        <Row label="Email" value={user?.email || "Not set"} />
        <Row label="Phone" value={user?.phone || "—"} />
        <Row
          label="Goal"
          value={user?.goal ? GOAL_LABEL[user.goal] : "Not set"}
        />
        {!user?.onboardedAt && (
          <div className="mt-4">
            <Link href="/onboarding">
              <Button variant="outline">Complete your profile</Button>
            </Link>
          </div>
        )}
      </Card>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </section>
  );
}
