import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Handshake, Search, Check, X, Clock, Phone, Mail, Building2, MapPin, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/partners")({
  component: AdminPartnersPage,
});

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Nouă", cls: "bg-amber-100 text-amber-800" },
  contacted: { label: "Contactat", cls: "bg-blue-100 text-blue-800" },
  approved: { label: "Aprobat", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Respins", cls: "bg-red-100 text-red-800" },
};

const STATUS_OPTS = [
  { value: "all", label: "Toate" },
  { value: "pending", label: "Noi" },
  { value: "contacted", label: "Contactat" },
  { value: "approved", label: "Aprobat" },
  { value: "rejected", label: "Respins" },
] as const;

function AdminPartnersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; status: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const load = async () => {
    let q = supabase.from("partner_applications").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const t = searchTerm.toLowerCase();
    return items.filter((i) =>
      i.name?.toLowerCase().includes(t) ||
      i.email?.toLowerCase().includes(t) ||
      i.company_name?.toLowerCase().includes(t) ||
      i.city?.toLowerCase().includes(t)
    );
  }, [items, searchTerm]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("partner_applications").update({ status }).eq("id", id);
    setConfirmAction(null);
    if (error) { toast.error("Eroare"); return; }
    toast.success(`Status actualizat: ${STATUS_META[status]?.label ?? status}`);
    load();
  };

  const saveNotes = async (id: string) => {
    setSavingNote(id);
    const { error } = await supabase.from("partner_applications").update({ admin_notes: adminNotes[id]?.trim() || null }).eq("id", id);
    setSavingNote(null);
    if (error) toast.error("Eroare");
    else toast.success("Notă salvată");
  };

  const deleteApp = async (id: string) => {
    const { error } = await supabase.from("partner_applications").delete().eq("id", id);
    setDeleteConfirm(null);
    if (error) toast.error("Eroare");
    else { toast.success("Cerere ștearsă"); load(); }
  };

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    contacted: items.filter((i) => i.status === "contacted").length,
    approved: items.filter((i) => i.status === "approved").length,
  }), [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Handshake className="h-7 w-7 text-accent" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Cereri Parteneriat</h1>
            <p className="text-sm text-muted-foreground">Persoane și firme care vor să colaboreze / revândă produsele noastre</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">{stats.pending} noi</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{stats.contacted} contactați</span>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">{stats.approved} aprobați</span>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s.value
                  ? "bg-foreground text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Caută după nume, email, firmă, oraș..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} cereri</p>

      {/* List */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nicio cerere.</p>}
        {filtered.map((item) => {
          const sm = STATUS_META[item.status] ?? STATUS_META.pending;
          const expanded = expandedId === item.id;
          return (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => {
                setExpandedId(expanded ? null : item.id);
                if (!expanded && !(item.id in adminNotes)) {
                  setAdminNotes((n) => ({ ...n, [item.id]: item.admin_notes || "" }));
                }
              }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sm.cls}`}>{sm.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</span>
                    {item.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</span>}
                    {item.company_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{item.company_name}</span>}
                    {item.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.city}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(item.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-1.5 shrink-0">
                  {item.status === "pending" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: item.id, status: "contacted", name: item.name }); }}
                      className="rounded-md bg-blue-500 text-white px-2.5 py-1 text-xs hover:bg-blue-600 transition"
                      title="Marchează contactat"
                    >Contactat</button>
                  )}
                  {(item.status === "pending" || item.status === "contacted") && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: item.id, status: "approved", name: item.name }); }}
                        className="rounded-md bg-emerald-500 text-white px-2.5 py-1 text-xs hover:bg-emerald-600 transition flex items-center gap-1"
                      ><Check className="h-3 w-3" />Aprobă</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: item.id, status: "rejected", name: item.name }); }}
                        className="rounded-md bg-red-500 text-white px-2.5 py-1 text-xs hover:bg-red-600 transition flex items-center gap-1"
                      ><X className="h-3 w-3" />Respinge</button>
                    </>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: item.id, name: item.name }); }}
                    className="rounded-md border border-border text-muted-foreground px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600 transition"
                    title="Șterge"
                  ><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className="mt-4 pl-0 space-y-3 border-t border-border pt-4">
                  {item.message && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" /> Mesajul solicitantului
                      </span>
                      <p className="text-sm bg-secondary/50 rounded-lg p-3">{item.message}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Notă admin</label>
                    <textarea
                      value={adminNotes[item.id] ?? ""}
                      onChange={(e) => setAdminNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                      rows={2}
                      maxLength={1000}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Notă internă..."
                    />
                    <button
                      onClick={() => saveNotes(item.id)}
                      disabled={savingNote === item.id}
                      className="mt-1 rounded-md bg-foreground text-primary-foreground px-3 py-1 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      {savingNote === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Salvează nota
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status confirmation */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => { if (!o) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schimbă statusul</AlertDialogTitle>
            <AlertDialogDescription>
              Cererea de la <strong>{confirmAction?.name}</strong> va fi marcată ca <strong>{STATUS_META[confirmAction?.status ?? ""]?.label}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction && updateStatus(confirmAction.id, confirmAction.status)}>
              Confirmă
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge cererea</AlertDialogTitle>
            <AlertDialogDescription>
              Cererea de la <strong>{deleteConfirm?.name}</strong> va fi ștearsă definitiv.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => deleteConfirm && deleteApp(deleteConfirm.id)}>
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
