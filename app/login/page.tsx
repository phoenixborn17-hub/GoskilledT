import { Suspense } from "react";
import { LoginForm } from "./login-form";

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
