"use client";
// Root error boundary — catches failures in the root layout itself, so it REPLACES <html>/<body>
// and can't rely on the app shell, fonts, or Tailwind tokens. Kept deliberately self-contained
// with inline styles so it renders even in a catastrophic failure. No error text is shown to the
// user (no internal leak); only an opaque digest for support.
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#FEFEFE", color: "#2A302A" }}>
        <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1.5rem" }}>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#137E49", margin: 0 }}>GoSkilled</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "1rem", marginBottom: 0 }}>Something went wrong</h1>
          <p style={{ maxWidth: "28rem", color: "#5B635B", marginTop: "0.5rem" }}>
            A hiccup on our end — not you. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: "1.5rem", height: "2.75rem", padding: "0 1.5rem", borderRadius: "0.75rem", border: "none", background: "#137E49", color: "#FEFEFE", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#5B635B" }}>Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
