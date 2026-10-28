import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/briva";
import { ReelsFeed } from "@/components/reels-feed";

export const Route = createFileRoute("/reels")({
  component: ReelsPage,
});

function ReelsPage() {
  return (
    <Shell title="Reels">
      <ReelsFeed />
    </Shell>
  );
}