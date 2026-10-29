import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/briva";
import { ReelsFeed } from "@/components/reels-feed";

export const Route = createFileRoute("/reels")({
  head: () => ({ meta: [
    { title: "Briva — Reels" },
    { name: "description", content: "Watch and share short videos with your Briva community." },
    { property: "og:title", content: "Briva — Reels" },
    { property: "og:description", content: "Watch and share short videos with your Briva community." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ReelsPage,
});

function ReelsPage() {
  return (
    <Shell title="Reels">
      <ReelsFeed />
    </Shell>
  );
}