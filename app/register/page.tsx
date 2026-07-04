import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "./register-form";
import { pageMetadata } from "../../lib/seo";

// Public + indexable (DR-030 §3). Minimal SEO; final copy is a LAUNCH_CONFIG slot.
export const metadata = pageMetadata({
  title: "Register free — GoSkilled",
  description:
    "Create your free GoSkilled account with your mobile number and a one-time password. No passwords, ever. Start learning in minutes.",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Suspense>
        <RegisterForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </main>
  );
}
