import { useState } from "react";
import { Check, UserMinus, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { friendshipState } from "@/lib/social-rules";

export function FriendshipActions({ otherId }: { otherId: string }) {
  const { me, friendships, friendAction } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!me || me.id === otherId) return null;
  const state = friendshipState(friendships, me.id, otherId);
  const act = async (action: "request" | "accept" | "remove") => {
    setBusy(true); setError("");
    try { setError(await friendAction(otherId, action) ?? ""); }
    catch { setError("Could not update this friendship. Try again."); }
    finally { setBusy(false); }
  };
  return <div className="flex flex-wrap items-center gap-2">
    {state === "none" && <Button size="sm" disabled={busy} onClick={() => void act("request")}><UserPlus />Add Friend</Button>}
    {state === "incoming" && <><Button size="sm" disabled={busy} onClick={() => void act("accept")}><Check />Accept</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void act("remove")}><X />Decline</Button></>}
    {state === "outgoing" && <><span className="text-xs text-muted-foreground">Request sent</span><Button size="sm" variant="outline" disabled={busy} onClick={() => void act("remove")}><X />Cancel request</Button></>}
    {state === "friends" && <Button size="sm" variant="outline" disabled={busy} onClick={() => void act("remove")}><UserMinus />Unfriend</Button>}
    {error && <p role="alert" className="w-full text-xs text-destructive">{error}</p>}
  </div>;
}