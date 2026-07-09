import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Log in",
  description:
    "Log in to GoSkilled with your mobile number and password, or sign in with a one-time code (OTP).",
  path: "/login",
});

// Server page wraps the client form so useSearchParams() has a Suspense boundary (next build).
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
