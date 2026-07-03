"use client";
// Logout with a confirm step (GPS-M2 §2.5) — no accidental sign-outs. Calls the server action.
import { useState } from "react";
import { signOutAction } from "../../app/dashboard/actions";
import { Button } from "../ui/button";

export function LogoutButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)}>
        Log out
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted">Log out of GoSkilled?</span>
      <form action={signOutAction}>
        <Button type="submit">Yes, log out</Button>
      </form>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
