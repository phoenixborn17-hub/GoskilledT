// /blog — designed coming-soon (planned vision state). Linked in nav/footer. Server component.
import { PenLine } from "lucide-react";
import { pageMetadata } from "../../lib/seo";
import { ComingSoon } from "../../components/marketing/coming-soon";

export const metadata = pageMetadata({
  title: "Blog",
  description:
    "Practical guides, skill breakdowns, and honest career advice from GoSkilled — coming soon.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <ComingSoon
      badge="Coming soon"
      Icon={PenLine}
      title="The GoSkilled blog is on the way"
      intro="Soon this will be your library of practical, no-fluff guides — written in simple Hinglish to help you learn faster and put skills to work."
      planned={[
        {
          title: "Skill breakdowns",
          body: "Step-by-step explainers for the skills we teach — bite-sized and practical.",
        },
        {
          title: "Honest career advice",
          body: "Real guidance on learning and growing — no hype, no guarantees.",
        },
        {
          title: "Learn-anywhere tips",
          body: "How to make the most of short lessons on a budget phone and slow data.",
        },
      ]}
      cta={{
        href: "/webinar",
        label: "Register for the free webinar",
        sub: "Want to learn now? Start with a free session.",
      }}
    />
  );
}
