import { useEffect, useState } from "react";
import { ArrowLeftRight, Check, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { ACCOUNT_KEY, readAccounts, rememberAccount, type SavedAccount } from "@/lib/account-rules";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { inputCls } from "@/components/briva";

export function AccountControls() {
  const { me, signup } = useStore();
  const { lang } = useLanguage();
  const words = lang === "sw" ? { accounts: "Akaunti", add: "Ongeza akaunti", switch: "Badilisha akaunti", current: "Inatumika", login: "Ingia", create: "Fungua akaunti", hint: "Ingia kwenye akaunti nyingine ili kubadilisha.", remove: "Ondoa akaunti" }
    : lang === "sheng" ? { accounts: "Akaunti", add: "Ongeza akaunti", switch: "Switch akaunti", current: "Unatumia", login: "Ingia", create: "Tengeneza akaunti", hint: "Ingia kwa akaunti ingine kuswitch.", remove: "Ondoa akaunti" }
    : { accounts: "Accounts", add: "Add account", switch: "Switch account", current: "Current", login: "Log in", create: "Create account", hint: "Sign in to another account to switch. Your current account stays signed in until you succeed.", remove: "Remove account" };
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [open, setOpen] = useState<"add" | "switch" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [create, setCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let mounted = true;
    let stored: SavedAccount[] = [];
    try { stored = readAccounts(localStorage.getItem(ACCOUNT_KEY)); } catch { /* Storage may be blocked. */ }
    setAccounts(stored);
    if (me) void supabase.auth.getUser().then(({ data }) => {
      if (!mounted || data.user?.id !== me.id || !data.user.email) return;
      const next = rememberAccount(stored, { id: me.id, name: me.name, username: me.username, email: data.user.email });
      setAccounts(next);
      try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next)); } catch { /* Keep this visit usable. */ }
    });
    return () => { mounted = false; };
  }, [me?.id, me?.name, me?.username]);
  const start = (mode: "add" | "switch") => {
    setOpen(mode); setCreate(false); setEmail(""); setPassword(""); setError(""); setNotice("");
  };
  return <>
    <section aria-label={words.accounts} className="border-b bg-card py-2">
      <h2 className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{words.accounts}</h2>
      <Button variant="ghost" onClick={() => start("switch")} className="h-12 w-full justify-start rounded-none px-4"><ArrowLeftRight className="text-primary" />{words.switch}</Button>
      <Button variant="ghost" onClick={() => start("add")} className="h-12 w-full justify-start rounded-none px-4"><UserPlus className="text-primary" />{words.add}</Button>
    </section>
    <Dialog open={open !== null} onOpenChange={(value) => { if (!busy && !value) { setOpen(null); setPassword(""); } }}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <DialogHeader><DialogTitle>{open === "switch" ? words.switch : words.add}</DialogTitle><DialogDescription>{words.hint}</DialogDescription></DialogHeader>
        {open === "switch" && <div className="divide-y border-y">
          {accounts.map((account) => <div key={account.id} className="flex items-center gap-2 py-2">
            <Button variant="ghost" disabled={busy || account.id === me?.id} className="h-auto min-w-0 flex-1 justify-start whitespace-normal text-left" onClick={() => { setEmail(account.email); setPassword(""); setError(""); }}>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{account.name}</span><span className="block truncate text-xs text-muted-foreground">@{account.username}</span></span>
              {account.id === me?.id && <span className="flex items-center gap-1 text-xs"><Check />{words.current}</span>}
            </Button>
            {account.id !== me?.id && <Button variant="ghost" size="icon" disabled={busy} aria-label={`${words.remove}: ${account.name}`} title={words.remove} onClick={() => {
              const next = accounts.filter((a) => a.id !== account.id); setAccounts(next);
              try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next)); } catch { /* No stored data to remove. */ }
            }}><X /></Button>}
          </div>)}
        </div>}
        <form className="space-y-3" onSubmit={async (event) => {
          event.preventDefault(); setBusy(true); setError(""); setNotice("");
          try {
            if (create) {
              const result = await signup({ name, username, email, password });
              if (result) setError(result);
              else { setNotice("Account created. If confirmation is required, check your email, then log in."); setCreate(false); setPassword(""); }
            } else {
              const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
              if (result.error) setError(result.error.message);
              else { setOpen(null); setPassword(""); }
            }
          } catch { setError("Could not sign in. Check your connection and try again."); }
          finally { setBusy(false); }
        }}>
          {create && <><input aria-label="Full name" className={inputCls} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required disabled={busy} /><input aria-label="Username" className={inputCls} placeholder="Username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={busy} /></>}
          <input aria-label="Email" type="email" autoComplete="username" autoCapitalize="none" className={inputCls} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={busy} />
          <input aria-label="Password" type="password" autoComplete={create ? "new-password" : "current-password"} className={inputCls} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={create ? 6 : undefined} disabled={busy} />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : create ? words.create : words.login}</Button>
          {open === "add" && <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={() => { setCreate(!create); setError(""); setNotice(""); }}>{create ? words.login : words.create}</Button>}
        </form>
      </DialogContent>
    </Dialog>
  </>;
}