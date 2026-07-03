// /videos — designed coming-soon (planned vision state). Linked in nav/footer. Server component.
import { Video } from "lucide-react";
import { pageMetadata } from "../../lib/seo";
import { ComingSoon } from "../../components/marketing/coming-soon";

export const metadata = pageMetadata({
  title: "Videos",
  description: "Free video lessons, skill demos, and webinar highlights from GoSkilled — coming soon.",
  path: "/videos",
});

export default function VideosPage() {
  return (
    <ComingSoon
      badge="Coming soon"
      Icon={Video}
      title="Free videos are coming"
      intro="A growing shelf of free video lessons and demos — a taste of the GoSkilled teaching style before you ever pay."
      planned={[
        { title: "Free lessons", body: "Short, practical clips you can watch on the go — no sign-up needed." },
        { title: "Skill demos", body: "See a skill in action so you know exactly what you'll learn." },
        { title: "Webinar highlights", body: "Missed a live session? Catch the best moments here." },
      ]}
      cta={{ href: "/webinar", label: "Register for the free webinar", sub: "Can't wait? Join a live webinar for free." }}
    />
  );
}
