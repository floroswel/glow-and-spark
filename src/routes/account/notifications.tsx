import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, ShoppingBag, RotateCcw, Gift, Info, Check, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/account/notifications")({
  component: NotificationsPage,
});

const typeConfig: Record<string, { icon: typeof Bell; label: string; color: string }> = {
  order: { icon: ShoppingBag, label: "Comandă", color: "bg-blue-100 text-blue-700" },
  refund: { icon: RotateCcw, label: "Retur/Anulare", color: "bg-red-100 text-red-700" },
  gift_card: { icon: Gift, label: "Card Cadou", color: "bg-purple-100 text-purple-700" },
  system: { icon: Info, label: "Sistem", color: "bg-gray-100 text-gray-700" },
};

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleRowClick = async (n: any) => {
    if (!n.is_read) {
      await supabase.from("user_notifications").update({ is_read: true }).eq("id", n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    if (n.link) navigate({ to: n.link });
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("user_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    await supabase.from("user_notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-accent" />
            Notificări
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Istoric notificări: comenzi, retururi, carduri cadou.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <CheckCheck className="h-4 w-4" />
            Marchează toate ca citite
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium text-foreground">Nicio notificare</p>
          <p className="mt-1 text-sm text-muted-foreground">Vei primi notificări despre comenzi, retururi și carduri cadou.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || typeConfig.system;
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleRowClick(n)}
                className={`rounded-xl border bg-card p-4 transition cursor-pointer hover:shadow-md ${
                  n.is_read ? "border-border opacity-70" : "border-accent/30 bg-accent/5 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${config.color}`}>
                            {config.label}
                          </span>
                          {!n.is_read && (
                            <span className="h-2 w-2 rounded-full bg-accent" />
                          )}
                        </div>
                        <p className="mt-1 text-sm font-semibold text-foreground">{n.title}</p>
                        {n.message && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(n.created_at).toLocaleDateString("ro-RO", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {!n.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                            title="Marchează ca citit"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
