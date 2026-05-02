import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Download, Trash2, FileEdit, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GDPR_RESPONSE_DAYS } from "@/lib/compliance";

export const Route = createFileRoute("/account/gdpr")({
  head: () => ({
    meta: [
      { title: "Date Personale GDPR — Mama Lucica" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GdprPage,
});

const STATUS_LABEL: Record<string, { label: string; cls: string; Icon: any }> = {
  pending: { label: "În așteptare", cls: "bg-amber-100 text-amber-800", Icon: Clock },
  processing: { label: "În procesare", cls: "bg-blue-100 text-blue-800", Icon: Loader2 },
  completed: { label: "Finalizată", cls: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
  rejected: { label: "Respinsă", cls: "bg-red-100 text-red-800", Icon: XCircle },
};

function GdprPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("gdpr_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const submit = async (request_type: "export" | "delete" | "rectify") => {
    if (!user) return;
    if (request_type === "delete" && !confirm("Sigur dorești ștergerea contului și a tuturor datelor? Această acțiune este ireversibilă.")) return;
    setLoading(true);
    const { error } = await supabase.from("gdpr_requests").insert({
      user_id: user.id,
      email: user.email!,
      request_type,
      details: details.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Nu am putut trimite cererea");
      return;
    }
    toast.success(`Cerere înregistrată. Te vom contacta în maxim ${GDPR_RESPONSE_DAYS} de zile calendaristice.`);
    setDetails("");
    load();
  };

  const downloadMyData = async () => {
    if (!user) return;
    setLoading(true);
    const [profile, orders, addresses, favorites, points, returnsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("orders").select("*").eq("customer_email", user.email!),
      supabase.from("addresses").select("*").eq("user_id", user.id),
      supabase.from("favorites").select("*").eq("user_id", user.id),
      supabase.from("user_points").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("returns").select("*").eq("user_id", user.id),
    ]);
    setLoading(false);

    const payload = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email, created_at: user.created_at },
      profile: profile.data,
      orders: orders.data ?? [],
      addresses: addresses.data ?? [],
      favorites: favorites.data ?? [],
      loyalty: points.data,
      returns: returnsRes.data ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `date-personale-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Datele tale au fost descărcate");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-accent mt-1" />
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Datele Tale Personale (GDPR)</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Conform legislației privind protecția datelor personale, ai dreptul să accesezi, rectifici sau ștergi datele tale.
              Răspundem în maxim {GDPR_RESPONSE_DAYS} zile calendaristice.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={downloadMyData}
          disabled={loading}
          className="rounded-xl border border-border bg-card p-5 text-left hover:border-accent transition group disabled:opacity-50"
        >
          <Download className="h-6 w-6 text-accent" />
          <h3 className="mt-3 font-semibold text-foreground">Descarcă datele mele</h3>
          <p className="mt-1 text-xs text-muted-foreground">Export instant JSON cu toate datele tale.</p>
        </button>

        <button
          onClick={() => submit("rectify")}
          disabled={loading}
          className="rounded-xl border border-border bg-card p-5 text-left hover:border-accent transition disabled:opacity-50"
        >
          <FileEdit className="h-6 w-6 text-blue-500" />
          <h3 className="mt-3 font-semibold text-foreground">Rectifică datele</h3>
          <p className="mt-1 text-xs text-muted-foreground">Cere corectarea unor informații greșite.</p>
        </button>

        <button
          onClick={() => submit("delete")}
          disabled={loading}
          className="rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 p-5 text-left hover:border-red-400 transition disabled:opacity-50"
        >
          <Trash2 className="h-6 w-6 text-red-600" />
          <h3 className="mt-3 font-semibold text-red-700 dark:text-red-400">Șterge contul</h3>
          <p className="mt-1 text-xs text-muted-foreground">Ștergere definitivă a contului și datelor.</p>
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Detalii suplimentare (opțional)
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="Descrie aici cererea ta (ex: ce date dorești rectificate)…"
          className="w-full rounded-lg border border-border bg-background p-3 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">{details.length}/1000</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Cererile tale</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nu ai trimis încă nicio cerere.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {requests.map((r) => {
              const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
              const Icon = s.Icon;
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground capitalize">{r.request_type === "export" ? "Export date" : r.request_type === "delete" ? "Ștergere cont" : "Rectificare"}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ro-RO")}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${s.cls}`}>
                    <Icon className="h-3 w-3" />
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
