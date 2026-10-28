import { Link } from "@tanstack/react-router";
import { Home, PlusSquare, User, Clapperboard, Bell, Send } from "lucide-react";
import type { ReactNode } from "react";

const nav = "flex flex-col items-center justify-center gap-1 text-xs text-zinc-500";
const active = { className: "flex flex-col items-center justify-center gap-1 text-xs text-blue-600 font-semibold" };

export function Shell({ children, title, wide }: { children: ReactNode; title?: string; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-3xl font-black text-blue-600 tracking-tight">briva</Link>
        <div className="flex items-center gap-4">
          <Bell className="w-6 h-6" />
          <Send className="w-6 h-6" />
        </div>
      </header>

      <main className={wide ? "flex-1 w-full" : "flex-1 max-w-[600px] w-full mx-auto"}>
        {children}
      </main>

      <nav className="sticky bottom-0 z-20 bg-white border-t flex justify-around py-2">
        <Link to="/" className={nav} activeProps={active} activeOptions={{ exact: true }}>
          <Home size={22} />Home
        </Link>
        <Link to="/reels" className={nav} activeProps={active}>
          <Clapperboard size={22} />Reels
        </Link>
        <Link to="/create" className={nav} activeProps={active}>
          <PlusSquare size={22} />Post
        </Link>
        <Link to="/profile" className={nav} activeProps={active}>
          <User size={22} />Profile
        </Link>
      </nav>
    </div>
  );
}