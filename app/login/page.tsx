import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { AuthShell } from "../../components/marketing/auth-shell";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Log in",
  description:
    "Log in to GoSkilled with your mobile number and password, or sign in with a one-time code (OTP).",
  path: "/login",
});

// Server page wraps the client form so useSearchParams() has a Suspense boundary (next build).
// AuthShell is a presentation-only split-screen wrapper — the LoginForm logic is unchanged.
export default function LoginPage() {
  return (
    <main>
      <AuthShell
        heading="Welcome back"
        subheading="Pick up right where you left off — your courses, progress, and certificate path are waiting."
      >
        <Suspense>
          <LoginForm />
        </Suspense>
      </AuthShell>
    </main>
  );
}
