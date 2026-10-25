import { useEffect, useState } from "react";
import { X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "briva-install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (standalone || !mobile || localStorage.getItem(KEY)) return;
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setIos(true);
      setShow(true);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!show) return null;
  const close = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border bg-card p-3 shadow-brand">
      <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-foreground">Add Briva to your Home Screen</p>
        <p className="text-muted-foreground">
          {ios ? "Tap Share, then “Add to Home Screen”." : "Open it like an app, in one tap."}
        </p>
      </div>
      {evt && (
        <button
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice;
            close();
          }}
        >
          Install
        </button>
      )}
      <button aria-label="Dismiss" onClick={close} className="p-1 text-muted-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
