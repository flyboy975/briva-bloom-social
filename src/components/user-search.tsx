import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Avatar, inputCls } from "@/components/briva";
import { useStore } from "@/lib/store";
import { FriendshipActions } from "@/components/friendship-actions";

export function UserSearch() {
  const { users, me } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  if (!me) return null;
  const term = q.trim().toLowerCase();
  const results = term ? users.filter((u) => u.id !== me.id && (u.username.includes(term) || u.name.toLowerCase().includes(term))).slice(0, 8) : [];
  return <div className="relative border-b bg-card px-4 py-2">
    <Search size={18} className="pointer-events-none absolute left-7 top-5 text-muted-foreground" />
    <input type="search" aria-label="Search people" placeholder={`Search ${users.length} members by name or username`} className={`${inputCls} pl-10`} value={q}
      onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
    {open && term && <div role="listbox" className="absolute left-4 right-4 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border bg-popover shadow-lg">
      {!results.length ? <p className="p-3 text-sm text-muted-foreground">No members found</p> : results.map((u) =>
        <Link key={u.id} to="/u/$username" params={{ username: u.username }} className="flex items-center gap-3 px-3 py-2 hover:bg-accent">
          <Avatar user={u} size={36} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{u.name}</p><p className="truncate text-xs text-muted-foreground">@{u.username}</p></div>
        </Link>)}
    </div>}
  </div>;
}

export function DiscoverPeople() {
  const { users, me } = useStore();
  const [seed] = useState(() => Math.random());
  if (!me) return null;
  const others = users.filter((u) => u.id !== me.id);
  const picks = [...others].sort((a, b) => ((a.id.charCodeAt(0) * seed) % 1) - ((b.id.charCodeAt(0) * seed) % 1)).slice(0, 5);
  return <section className="p-4">
    <h2 className="mb-3 font-semibold">Discover people to follow</h2>
    {!picks.length ? <p className="text-sm text-muted-foreground">No other members yet.</p> : <div className="space-y-2">{picks.map((u) =>
      <div key={u.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <Link to="/u/$username" params={{ username: u.username }} className="flex min-w-0 flex-1 items-center gap-3"><Avatar user={u} size={40} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{u.name}</p><p className="truncate text-xs text-muted-foreground">@{u.username}</p></div></Link>
        <div className="shrink-0"><FriendshipActions otherId={u.id} /></div>
      </div>)}</div>}
    <Link to="/explore" className="mt-3 inline-block text-sm font-semibold text-primary">See all members</Link>
  </section>;
}
