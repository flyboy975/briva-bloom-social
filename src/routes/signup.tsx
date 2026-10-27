import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [
    { title: "Join Briva — Create an account" },
    { name: "description", content: "Join Briva to share posts, Reels and moments with members." },
    { property: "og:title", content: "Join Briva — Create an account" },
    { property: "og:description", content: "Create a Briva account to connect and share with members." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => { throw redirect({ to: "/login" }); },
});
