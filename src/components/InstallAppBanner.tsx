import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "install_banner_dismissed_at";
const DISMISS_DAYS = 14;

export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show in iframes (Lovable preview)
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    // Already installed?
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // @ts-expect-error iOS Safari
    if (window.navigator.standalone) return;

    // Recently dismissed?
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days < DISMISS_DAYS) return;
    }

    let timer: number | undefined;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timer = window.setTimeout(() => setVisible(true), 30000);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setVisible(false);
      setDeferred(null);
      if (outcome === "dismissed") {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      }
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!visible || !deferred) return null;

  return (
    <div className="fixed bottom-16 left-3 right-3 z-50 md:hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg p-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Instalează aplicația</p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">Acces rapid de pe ecranul principal</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
        >
          Instalează
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Închide"
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
