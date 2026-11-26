import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Terms of Service — Briva" },
    { name: "description", content: "The rules for using Briva and keeping the community safe." },
    { property: "og:title", content: "Terms of Service — Briva" },
    { property: "og:description", content: "The rules for using Briva and keeping the community safe." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <LegalPage title="Terms of Service" sections={[
    ["Using Briva", "You must be at least 13 years old. Keep your password safe and give true account details."],
    ["Your content", "You own what you post. You give Briva permission to store and show it to the people you choose so the app works."],
    ["Not allowed", "Harassment, hate speech, threats, nudity or sexual content, violence, scams, fake marketplace listings, spam, impersonation, or anything illegal."],
    ["Safety tools", "You can report posts and block members. We review reports and may remove content or suspend accounts that break these rules."],
    ["Marketplace and events", "Briva does not take part in sales or events between members. Meet safely and check items before paying."],
    ["Ending your account", "You can stop using Briva at any time and ask us to delete your account."],
    ["No warranty", "Briva is provided as it is. We are not responsible for content posted by members."],
    ["Contact", "Questions: brianvaati2233@gmail.com. Last updated: November 2026."],
  ]} />,
});
