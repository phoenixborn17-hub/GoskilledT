// Shared public shell — one wrapper so every marketing page gets the same chrome (scroll-progress
// hairline + sticky header + premium footer) without a route-group move. Pages provide their own
// <main> so landmarks stay correct. Server component; ScrollProgress is the only client island.
import * as React from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { ScrollProgress } from "./scroll-progress";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
