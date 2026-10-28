import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Plus, Tag } from "lucide-react";
import { Avatar, Shell } from "@/components/briva";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useListings } from "@/lib/community";
import { useLanguage } from "@/lib/i18n";
import { formatPrice } from "@/lib/community-rules";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Briva — Marketplace" },
      { name: "description", content: "Buy and sell items with price and location on the Briva marketplace." },
      { property: "og:title", content: "Briva — Marketplace" },
      { property: "og:description", content: "Buy and sell items on Briva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const { me, users } = useStore();
  const { t } = useLanguage();
  const { listings, loading, error, createListing, setStatus, removeListing } = useListings();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!me) {
    return (
      <Shell>
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("membersOnlyPage")}</p>
          <Button asChild className="mt-4"><Link to="/login">{t("loginOrSignup")}</Link></Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={t("market")}>
      <div className="flex items-center justify-between border-b bg-card px-4 py-3">
        <h2 className="font-semibold">{t("market")}</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={16} />Sell something</Button>
      </div>
      {error && <p role="alert" className="p-4 text-sm text-destructive">{error}</p>}
      {loading && <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>}
      {!loading && !listings.length && (
        <div className="space-y-3 px-6 py-16 text-center">
          <Tag className="mx-auto text-primary" size={36} />
          <h3 className="font-semibold">Nothing for sale yet</h3>
          <p className="text-sm text-muted-foreground">List the first item with a price and location.</p>
        </div>
      )}
      {listings.map((listing) => {
        const seller = users.find((u) => u.id === listing.seller_id);
        const mine = listing.seller_id === me.id;
        return (
          <article key={listing.id} className="border-b bg-card px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{listing.title}{listing.status === "sold" && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">Sold</span>}</p>
                <p className="text-sm font-bold text-primary">{formatPrice(listing.price_cents, listing.currency)}</p>
              </div>
              {mine && (
                <div className="flex shrink-0 gap-2">
                  {listing.status === "active" && <Button size="sm" variant="outline" onClick={async () => { const err = await setStatus(listing.id, "sold"); if (err) setFormError(err); }}>Mark sold</Button>}
                  <Button size="sm" variant="ghost" onClick={async () => { const err = await removeListing(listing.id); if (err) setFormError(err); }}>Delete</Button>
                </div>
              )}
            </div>
            {listing.description && <p className="mt-2 whitespace-pre-wrap text-sm">{listing.description}</p>}
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} />{listing.location}</p>
            <Link to="/u/$username" params={{ username: seller?.username ?? "unknown" }} className="mt-2 flex items-center gap-2">
              <Avatar user={seller} size={24} />
              <span className="text-xs font-medium">@{seller?.username ?? "member"}</span>
            </Link>
          </article>
        );
      })}
      <Dialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); if (!value) setFormError(""); } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg">
          <DialogTitle>Sell something</DialogTitle>
          <DialogDescription>Add a clear title, price and location so buyers can find you.</DialogDescription>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            const err = await createListing({ title, description, priceCents: Math.round(Number(price) * 100), currency, location });
            setBusy(false);
            if (err) { setFormError(err); return; }
            setOpen(false); setTitle(""); setDescription(""); setPrice(""); setLocation("");
          }}>
            <label className="block text-sm font-medium">Title
              <input aria-label="Listing title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" />
            </label>
            <label className="block text-sm font-medium">Description
              <textarea aria-label="Listing description" value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" rows={2} />
            </label>
            <div className="flex gap-2">
              <label className="block flex-1 text-sm font-medium">Price
                <input aria-label="Listing price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" />
              </label>
              <label className="block w-28 text-sm font-medium">Currency
                <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3">
                  <option value="KES">KES</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="NGN">NGN</option><option value="ZAR">ZAR</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium">Location
              <input aria-label="Listing location" value={location} maxLength={80} placeholder="e.g. Nairobi, Westlands" onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3" />
            </label>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "List item"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
