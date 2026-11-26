import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy — Briva" },
    { name: "description", content: "How Briva collects, uses and protects your information." },
    { property: "og:title", content: "Privacy Policy — Briva" },
    { property: "og:description", content: "How Briva collects, uses and protects your information." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <LegalPage title="Privacy Policy" sections={[
    ["Who we are", "Briva is a social network for sharing posts, photos, stories, Reels and messages with your community. Contact: brianvaati2233@gmail.com."],
    ["What we collect", "Account details you give us (name, username, email, password stored securely), profile photo, posts, comments, likes, stories, Reels, sounds, messages, group, marketplace and event content, friend connections, reports and blocks, and your settings (language, theme, privacy, active status)."],
    ["How we use it", "To run Briva: show your content to the people you choose, deliver messages, keep accounts secure, review reports of abuse and improve the app. We do not sell your personal information."],
    ["Who can see your content", "Content is visible only to signed-in members. Private profiles share posts and stories only with accepted friends. Messages are visible only to the people in the conversation. Photos and videos are stored privately and shared through short-lived links."],
    ["Visitor analytics", "Our hosting provider, Lovable, counts page visits, referring sites, country, browser, device type, time on page, page speed and errors. It uses no cookies, stores nothing on your device, does not keep IP addresses and does not identify you. Detailed data is kept for 90 days and daily summaries for a year. Lovable collects this data for us; Lovable's privacy policy (https://lovable.dev/privacy) explains how it handles it."],
    ["Storage on your device", "Briva saves your sign-in session, language, theme and the names of accounts you added for switching in your browser's storage. Passwords are never saved there."],
    ["Keeping and deleting data", "We keep your data while your account is active. Stories disappear after 24 hours. To delete your account and data, email us and we will remove it within 30 days."],
    ["Children", "Briva is not for children under 13."],
    ["Changes", "We may update this policy and will show the new date here. Last updated: November 2026."],
  ]} />,
});

export function LegalPage({ title, sections }: { title: string; sections: [string, string][] }) {
  return <main className="mx-auto max-w-2xl space-y-5 bg-background p-5 pb-16 text-foreground">
    <Link to="/" className="text-sm font-semibold text-primary">← Briva</Link>
    <h1 className="text-2xl font-bold">{title}</h1>
    {sections.map(([h, p]) => <section key={h}><h2 className="mb-1 font-semibold">{h}</h2><p className="text-sm leading-relaxed text-muted-foreground">{p}</p></section>)}
    <p className="text-sm"><Link to="/privacy" className="text-primary underline">Privacy</Link> · <Link to="/terms" className="text-primary underline">Terms</Link></p>
  </main>;
}
