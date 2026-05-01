// Component invizibil care înregistrează service worker și gestionează push subscription
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const VAPID_PUBLIC = "BEjnQEeqoxAEGvSgencv17mwt79jwxQdBHwlSXAX2F-Kc30_n62W5VVb3WvxyA5Xq6oBTBQWuOyXRJg3FIYE8Nk";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushNotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const subscribe = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // already subscribed

        if (Notification.permission === "default") return; // wait for explicit prompt
        if (Notification.permission !== "granted") return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
        const json = sub.toJSON();
        await (supabase.from("push_subscriptions" as any).insert({
          user_id: user?.id || null,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        } as any) as any);
      } catch (e) {
        console.warn("Push subscribe failed", e);
      }
    };

    subscribe();
  }, [user]);

  return null;
}

export async function requestPushPermission() {
  if (!("Notification" in window)) return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}
