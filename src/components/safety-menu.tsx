import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { blockUser, reportContent } from "@/lib/safety";

const REASONS = ["Spam", "Harassment or bullying", "Hate speech", "Nudity or sexual content", "Violence", "Scam or fraud", "Other"];

export function SafetyMenu({ meId, authorId, postId }: { meId: string; authorId: string; postId: string }) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  if (meId === authorId) return null;
  const report = async (reason: string) => {
    const err = await reportContent(meId, "post", postId, reason);
    setOpen(false); setReporting(false);
    if (err) toast.error("Report could not be sent"); else toast.success("Thanks — your report was sent");
  };
  const block = async () => {
    const err = await blockUser(meId, authorId);
    setOpen(false);
    if (err) toast.error("Could not block this member"); else toast.success("Member blocked");
  };
  return <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setReporting(false); }}>
    <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Post options" className="ml-auto"><MoreHorizontal size={18} /></Button></PopoverTrigger>
    <PopoverContent align="end" className="w-60 p-1">
      {reporting
        ? REASONS.map((r) => <button key={r} onClick={() => void report(r)} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent">{r}</button>)
        : <>
          <button onClick={() => setReporting(true)} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent">Report post</button>
          <button onClick={() => void block()} className="block w-full rounded px-3 py-2 text-left text-sm text-destructive hover:bg-accent">Block member</button>
        </>}
    </PopoverContent>
  </Popover>;
}
