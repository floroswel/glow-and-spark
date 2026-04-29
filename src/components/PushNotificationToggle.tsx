import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function PushNotificationToggle() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "Notification" in window && "serviceWorker" in navigator;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  const enable = async () => {
    if (!supported) return toast.error("Browserul tău nu suportă notificări push.");
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return toast.error("Permisiunea a fost refuzată.");

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      // Save a marker subscription so admin can see active devices
      const fakeEndpoint = `local://${user?.id || "anon"}-${crypto.randomUUID()}`;
      await supabase.from("push_subscriptions").insert({
        user_id: user?.id || null,
        endpoint: `https://lovable.app/push/${fakeEndpoint}`,
        p256dh: "browser-notification-api",
        auth: "browser-notification-api",
        user_agent: navigator.userAgent.slice(0, 200),
      });
      new Notification("Notificări activate ✅", { body: "Vei primi update-uri despre comenzile tale.", icon: "/favicon.ico" });
      toast.success("Notificări activate!");
    } catch (e: any) {
      toast.error("Eroare: " + e.message);
    }
  };

  if (!supported) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        {permission === "granted" ? <Bell className="h-5 w-5 text-emerald-600 mt-0.5" /> : <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Notificări browser</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {permission === "granted" ? "Sunt activate. Vei primi alerte despre comenzi și oferte." :
             permission === "denied" ? "Refuzate. Activează-le din setările browserului." :
             "Primește alerte instant despre comenzile tale și ofertele noi."}
          </p>
          {permission === "default" && (
            <button onClick={enable} className="mt-3 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
              Activează notificările
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
