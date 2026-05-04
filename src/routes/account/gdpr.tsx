import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Download, Trash2, FileEdit, Clock, CheckCircle2, XCircle, Loader2, Copy } from "lucide-react";
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

  const [lastConfirmation, setLastConfirmation] = useState<{ id: string; type: string } | null>(null);

  const submit = async (request_type: "export" | "delete" | "rectify") => {
    if (!user) return;
    if (request_type === "delete" && !confirm("Sigur dorești ștergerea contului și a tuturor datelor? Această acțiune este ireversibilă.")) return;
    setLoading(true);
    const { data: inserted, error } = await supabase.from("gdpr_requests").insert({
      user_id: user.id,
      email: user.email!,
      request_type,
      details: details.trim() || null,
    }).select("id").single();
    setLoading(false);
    if (error || !inserted) {
      toast.error("Nu am putut trimite cererea");
      return;
    }
    const shortId = inserted.id.slice(0, 8).toUpperCase();
    setLastConfirmation({ id: shortId, type: request_type === "export" ? "Export date" : request_type === "delete" ? "Ștergere cont" : "Rectificare date" });
    toast.success(`Cerere înregistrată — ID: ${shortId}`);
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

      {/* Confirmation banner */}
      {lastConfirmation && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">Cerere înregistrată cu succes!</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-emerald-700 dark:text-emerald-400">ID cerere:</span>
            <code className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-md font-mono text-lg font-bold tracking-wider">
              GDPR-{lastConfirmation.id}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`GDPR-${lastConfirmation.id}`);
                toast.success("ID copiat!");
              }}
              className="text-emerald-600 hover:text-emerald-800 transition"
              title="Copiază ID"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Tip: {lastConfirmation.type} · Vom răspunde în maxim {GDPR_RESPONSE_DAYS} zile calendaristice. Păstrează acest ID pentru referință.
          </p>
          <button onClick={() => setLastConfirmation(null)} className="text-xs text-emerald-500 hover:underline mt-1">Închide</button>
        </div>
      )}

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
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Cererile tale</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nu ai trimis încă nicio cerere.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
              const Icon = s.Icon;
              const STEPS = ["pending", "processing", "completed"];
              const stepIndex = r.status === "rejected" ? -1 : STEPS.indexOf(r.status);
              const typeLabel = r.request_type === "export" ? "Export date" : r.request_type === "delete" ? "Ștergere cont" : "Rectificare date";
              const daysSince = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
              const daysLeft = Math.max(0, GDPR_RESPONSE_DAYS - daysSince);

              return (
                <div key={r.id} className="rounded-xl border border-border p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {r.request_type === "export" ? <Download className="h-5 w-5 text-accent" /> : r.request_type === "delete" ? <Trash2 className="h-5 w-5 text-red-500" /> : <FileEdit className="h-5 w-5 text-blue-500" />}
                      <div>
                        <div className="font-semibold text-foreground">{typeLabel}</div>
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ro-RO")}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {s.label}
                    </span>
                  </div>

                  {/* Details */}
                  {r.details && (
                    <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2.5">{r.details}</p>
                  )}

                  {/* Progress stepper */}
                  {r.status !== "rejected" ? (
                    <div className="flex items-center gap-1">
                      {STEPS.map((step, i) => {
                        const done = i <= stepIndex;
                        const labels = ["Trimisă", "În procesare", "Finalizată"];
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-full h-1.5 rounded-full ${done ? "bg-accent" : "bg-border"}`} />
                            <span className={`text-[10px] ${done ? "text-accent font-medium" : "text-muted-foreground"}`}>{labels[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg p-2">
                      <XCircle className="h-3.5 w-3.5" />
                      Cererea a fost respinsă. Te rugăm să ne contactezi pentru detalii.
                    </div>
                  )}

                  {/* Time estimate */}
                  {r.status !== "completed" && r.status !== "rejected" && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {daysLeft > 0
                        ? `Termen legal de răspuns: ${daysLeft} zile rămase din ${GDPR_RESPONSE_DAYS}`
                        : "Termenul legal de răspuns a expirat. Te rugăm să ne contactezi."}
                    </div>
                  )}

                  {/* Processed info */}
                  {r.processed_at && (
                    <div className="text-xs text-muted-foreground">
                      Procesat la: {new Date(r.processed_at).toLocaleString("ro-RO")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
