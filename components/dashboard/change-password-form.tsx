"use client";
import * as React from "react";
import { useActionState } from "react";
import {
  changePasswordAction,
  type ChangePasswordResult,
} from "../../app/dashboard/account/actions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

/**
 * Change-password form — USER-PERFORMED (no automation). Submits to the server action, which reuses
 * the existing Supabase session helper. New password is entered twice; success/error is announced.
 */
export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<
    ChangePasswordResult | null,
    FormData
  >(changePasswordAction, null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-small font-medium text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-small font-medium text-success">
          Password updated.
        </p>
      )}
      <Button type="submit" loading={pending} className="w-auto">
        Update password
      </Button>
    </form>
  );
}
