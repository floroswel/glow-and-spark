import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Download, Trash2, FileEdit, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/gdpr")({
  component: AdminGdprPage,
});

function AdminGdprPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"pending" | "processing" | "completed" | "all">("pending");

  const load = async () => {
    let q = supabase.from("gdpr_requests").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("gdpr_requests")
      .update({ status, processed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Eroare"); else { toast.success("Actualizat"); load(); }
  };

  const ICONS: Record<string, any> = { export: Download, delete: Trash2, rectify: FileEdit };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-accent" />
        <div>
          <h1 className="font-heading text-2xl font-bold">Cereri GDPR</h1>
          <p className="text-sm text-muted-foreground">Răspuns obligatoriu în 30 zile (Reg. UE 2016/679)</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["pending", "processing", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm ${filter === f ? "bg-foreground text-primary-foreground" : "bg-secondary"}`}
          >
            {f === "all" ? "Toate" : f === "pending" ? "Noi" : f === "processing" ? "În lucru" : "Finalizate"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {items.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nicio cerere.</p>}
        {items.map((r) => {
          const Icon = ICONS[r.request_type] ?? Shield;
          return (
            <div key={r.id} className="p-4 flex flex-wrap items-start gap-4">
              <Icon className="h-5 w-5 text-accent mt-0.5" />
              <div className="flex-1 min-w-[240px]">
                <div className="font-semibold capitalize">
                  {r.request_type === "export" ? "Export date" : r.request_type === "delete" ? "Ștergere cont" : "Rectificare"}
                </div>
                <div className="text-xs text-muted-foreground">{r.email} · {new Date(r.created_at).toLocaleString("ro-RO")}</div>
                {r.details && <p className="mt-2 text-sm bg-secondary/50 rounded p-2">{r.details}</p>}
              </div>
              <div className="flex gap-2">
                {r.status === "pending" && (
                  <button onClick={() => updateStatus(r.id, "processing")} className="rounded-md bg-blue-500 text-white px-3 py-1.5 text-xs">În lucru</button>
                )}
                {r.status !== "completed" && r.status !== "rejected" && (
                  <>
                    <button onClick={() => updateStatus(r.id, "completed")} className="rounded-md bg-emerald-500 text-white px-3 py-1.5 text-xs flex items-center gap-1"><Check className="h-3 w-3" />Finalizează</button>
                    <button onClick={() => updateStatus(r.id, "rejected")} className="rounded-md bg-red-500 text-white px-3 py-1.5 text-xs flex items-center gap-1"><X className="h-3 w-3" />Respinge</button>
                  </>
                )}
                <span className="rounded-full bg-secondary px-2 py-1 text-xs capitalize">{r.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
