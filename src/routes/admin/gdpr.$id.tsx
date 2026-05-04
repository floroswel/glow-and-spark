import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Download, Trash2, FileEdit, ArrowLeft, Clock, Check, X, MessageSquare, Paperclip, Upload, File, Loader2, FileDown, AlertTriangle, ScrollText, CheckCircle2, XCircle } from "lucide-react";
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
import { GDPR_RESPONSE_DAYS } from "@/lib/compliance";

export const Route = createFileRoute("/admin/gdpr/$id")({
  component: AdminGdprDetailPage,
});

const TYPE_LABEL: Record<string, string> = {
  export: "Export date",
  delete: "Ștergere cont",
  rectify: "Rectificare date",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "În așteptare", cls: "bg-amber-100 text-amber-800" },
  processing: { label: "În procesare", cls: "bg-blue-100 text-blue-800" },
  completed: { label: "Finalizată", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Respinsă", cls: "bg-red-100 text-red-800" },
};

const ICONS: Record<string, any> = { export: Download, delete: Trash2, rectify: FileEdit };

function AdminGdprDetailPage() {
  const { id } = Route.useParams();
  const [req, setReq] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editDetails, setEditDetails] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [savingFields, setSavingFields] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string; description: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [{ data: r }, { data: h }, { data: docs }, { data: audit }] = await Promise.all([
      supabase.from("gdpr_requests").select("*").eq("id", id).single(),
      supabase.from("gdpr_request_history" as any).select("*").eq("request_id", id).order("created_at", { ascending: true }) as any,
      supabase.from("gdpr_documents" as any).select("*").eq("request_id", id).order("created_at", { ascending: true }) as any,
      supabase.from("gdpr_notification_audit" as any).select("*").eq("request_id", id).order("created_at", { ascending: false }) as any,
    ]);
    setReq(r);
    setHistory(h ?? []);
    setDocuments(docs ?? []);
    setAuditLog(audit ?? []);
    if (r) {
      setEditDetails(r.details ?? "");
      setEditAdminNotes(r.admin_notes ?? "");
    }
    setLoading(false);
  };

  const uploadDocument = async (file: globalThis.File) => {
    if (!req) return;
    setUploading(true);
    const path = `admin/${id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("gdpr-documents").upload(path, file);
    if (uploadErr) { toast.error("Eroare la încărcare"); setUploading(false); return; }
    const { error: dbErr } = await (supabase.from("gdpr_documents" as any).insert({
      request_id: id,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
    }) as any);
    if (dbErr) toast.error("Eroare la salvare");
    else { toast.success("Document atașat"); load(); }
    setUploading(false);
  };

  const downloadDoc = async (doc: any) => {
    const { data, error } = await supabase.storage.from("gdpr-documents").download(doc.file_path);
    if (error || !data) { toast.error("Eroare descărcare"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a"); a.href = url; a.download = doc.file_name; a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    const { error } = await supabase
      .from("gdpr_requests")
      .update({ status, processed_at: new Date().toISOString() })
      .eq("id", id);
    setActionLoading(false);
    setConfirmAction(null);
    if (error) { toast.error("Eroare la actualizarea statusului"); return; }
    toast.success(`Status actualizat: ${STATUS_META[status]?.label ?? status}`);
    load();
  };
  const saveFields = async () => {
    setSavingFields(true);
    const { error } = await supabase
      .from("gdpr_requests")
      .update({
        details: editDetails.trim() || null,
        admin_notes: editAdminNotes.trim() || null,
      })
      .eq("id", id);
    setSavingFields(false);
    if (error) { toast.error("Eroare la salvare"); return; }
    toast.success("Salvat cu succes");
    load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    const { error } = await (supabase.from("gdpr_request_history" as any).insert({
      request_id: id,
      old_status: req.status,
      new_status: req.status,
      note: note.trim(),
    }) as any);
    if (error) { toast.error("Eroare"); return; }
    setNote("");
    toast.success("Notă adăugată");
    load();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;
  if (!req) return <div className="p-8 text-center text-muted-foreground">Cererea nu a fost găsită.</div>;

  const Icon = ICONS[req.request_type] ?? Shield;
  const shortId = req.id.slice(0, 8).toUpperCase();
  const daysSince = Math.floor((Date.now() - new Date(req.created_at).getTime()) / 86400000);
  const daysLeft = Math.max(0, GDPR_RESPONSE_DAYS - daysSince);
  const overdue = daysLeft === 0 && req.status !== "completed" && req.status !== "rejected";
  const sm = STATUS_META[req.status] ?? STATUS_META.pending;

  const STEPS = ["pending", "processing", "completed"];
  const stepIndex = req.status === "rejected" ? -1 : STEPS.indexOf(req.status);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link to="/admin/gdpr" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> Înapoi la lista GDPR
      </Link>

      {/* Header card */}
      <div className={`rounded-xl border p-6 space-y-4 ${overdue ? "border-red-300 bg-red-50/50 dark:bg-red-950/10" : "border-border bg-card"}`}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Icon className="h-7 w-7 text-accent" />
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">{TYPE_LABEL[req.request_type] ?? req.request_type}</h1>
              <code className="text-xs text-muted-foreground font-mono">GDPR-{shortId}</code>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${sm.cls}`}>{sm.label}</span>
        </div>

        {/* Stepper */}
        {req.status !== "rejected" ? (
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const done = i <= stepIndex;
              const labels = ["Trimisă", "În procesare", "Finalizată"];
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-2 rounded-full ${done ? "bg-accent" : "bg-border"}`} />
                  <span className={`text-xs ${done ? "text-accent font-medium" : "text-muted-foreground"}`}>{labels[i]}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-100 dark:bg-red-950/30 rounded-lg p-3">
            <X className="h-4 w-4" /> Cererea a fost respinsă.
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span>
            <span className="ml-2 font-medium text-foreground">{req.email}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Trimisă:</span>
            <span className="ml-2 font-medium text-foreground">{new Date(req.created_at).toLocaleString("ro-RO")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Termen:</span>
            <span className={`ml-2 font-medium ${overdue ? "text-red-600" : "text-foreground"}`}>
              {req.status === "completed" || req.status === "rejected"
                ? "—"
                : daysLeft > 0 ? `${daysLeft} zile rămase` : "TERMEN DEPĂȘIT"}
            </span>
          </div>
          {req.processed_at && (
            <div>
              <span className="text-muted-foreground">Procesată:</span>
              <span className="ml-2 font-medium text-foreground">{new Date(req.processed_at).toLocaleString("ro-RO")}</span>
            </div>
          )}
        </div>

        {/* Editable details */}
        <div>
          <label className="text-xs text-muted-foreground font-medium">Detalii solicitant (editabil):</label>
          <textarea
            value={editDetails}
            onChange={(e) => setEditDetails(e.target.value.slice(0, 2000))}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm"
            placeholder="Detalii cerere…"
          />
        </div>

        {/* Admin processing notes */}
        <div>
          <label className="text-xs text-muted-foreground font-medium">Comentariu de procesare (admin):</label>
          <textarea
            value={editAdminNotes}
            onChange={(e) => setEditAdminNotes(e.target.value.slice(0, 2000))}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm"
            placeholder="Notează aici detalii de procesare, rezoluție, pași urmați…"
          />
        </div>

        <button
          onClick={saveFields}
          disabled={savingFields}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 transition disabled:opacity-50 flex items-center gap-1.5"
        >
          {savingFields ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Salvează modificările
        </button>
      </div>

      {/* Actions */}
      {req.status !== "completed" && req.status !== "rejected" && (
        <div className="flex flex-wrap gap-2">
          {req.status === "pending" && (
            <button
              onClick={() => setConfirmAction({
                status: "processing",
                label: 'Marchează "În procesare"',
                description: `Cererea GDPR-${shortId} (${req.email}) va fi marcată ca "În procesare". Solicitantul va fi notificat.`,
              })}
              className="rounded-lg bg-blue-500 text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 transition"
            >
              Marchează &bdquo;În procesare&rdquo;
            </button>
          )}
          <button
            onClick={() => setConfirmAction({
              status: "completed",
              label: "Finalizează cererea",
              description: `Cererea GDPR-${shortId} (${req.email}) va fi marcată ca finalizată. Asigură-te că ai procesat complet solicitarea înainte de confirmare.`,
            })}
            className="rounded-lg bg-emerald-500 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-600 transition flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" /> Finalizează
          </button>
          <button
            onClick={() => setConfirmAction({
              status: "rejected",
              label: "Respinge cererea",
              description: `Cererea GDPR-${shortId} (${req.email}) va fi respinsă. Această acțiune este ireversibilă. Notează motivul în comentariul de procesare.`,
            })}
            className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-medium hover:bg-red-600 transition flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Respinge
          </button>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmAction?.status === "rejected" && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {confirmAction?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Anulează</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={() => confirmAction && updateStatus(confirmAction.status)}
              className={confirmAction?.status === "rejected" ? "bg-red-500 hover:bg-red-600" : confirmAction?.status === "completed" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirmă
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add note */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Adaugă notă internă
        </h3>
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="Notă internă (vizibilă doar admin)…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button onClick={addNote} disabled={!note.trim()} className="rounded-lg bg-foreground text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">
            Salvează
          </button>
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
          <Paperclip className="h-5 w-5" /> Documente atașate
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun document atașat.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <button
                key={doc.id}
                onClick={() => downloadDoc(doc)}
                className="w-full flex items-center gap-2.5 rounded-lg border border-border p-3 text-left hover:bg-secondary/50 transition text-sm"
              >
                <File className="h-5 w-5 text-accent shrink-0" />
                <span className="flex-1 truncate font-medium">{doc.file_name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{formatSize(doc.file_size)}</span>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(doc.created_at).toLocaleDateString("ro-RO")}</span>
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f); e.target.value = ""; }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-sm text-accent hover:underline disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Se încarcă…" : "Atașează document"}
          </button>
        </div>
      </div>

      {/* History timeline */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" /> Istoric cerere
          </h2>
          {history.length > 0 && (
            <button
              onClick={() => {
                const bom = "\uFEFF";
                const header = "Data,Eveniment,Notă\n";
                const rows = history.map((h: any) => {
                  const isNote = h.old_status === h.new_status && h.note;
                  const date = new Date(h.created_at).toLocaleString("ro-RO");
                  const event = isNote
                    ? "Notă internă"
                    : h.old_status
                      ? `${STATUS_META[h.old_status]?.label ?? h.old_status} → ${STATUS_META[h.new_status]?.label ?? h.new_status}`
                      : `Cerere creată (${STATUS_META[h.new_status]?.label ?? h.new_status})`;
                  const note = (h.note ?? "").replace(/"/g, '""');
                  return `"${date}","${event}","${note}"`;
                }).join("\n");
                const blob = new Blob([bom + header + rows], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `gdpr-${shortId}-istoric.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition"
            >
              <FileDown className="h-3.5 w-3.5" /> Export CSV
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun eveniment înregistrat.</p>
        ) : (
          <div className="relative pl-6 space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
            {history.map((h: any, i: number) => {
              const isNote = h.old_status === h.new_status && h.note;
              const hStatus = STATUS_META[h.new_status];
              return (
                <div key={h.id} className="relative pb-5">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 ${
                    isNote ? "bg-secondary border-muted-foreground" : hStatus ? "bg-card border-accent" : "bg-card border-border"
                  } flex items-center justify-center`}>
                    {!isNote && <div className="w-2 h-2 rounded-full bg-accent" />}
                    {isNote && <MessageSquare className="h-2.5 w-2.5 text-muted-foreground" />}
                  </div>

                  <div className="ml-2">
                    {isNote ? (
                      <>
                        <div className="text-sm font-medium text-foreground">Notă internă</div>
                        <p className="text-sm text-muted-foreground mt-0.5 bg-secondary/50 rounded p-2">{h.note}</p>
                      </>
                    ) : (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">
                          {h.old_status
                            ? `${STATUS_META[h.old_status]?.label ?? h.old_status} → ${hStatus?.label ?? h.new_status}`
                            : `Cerere creată (${hStatus?.label ?? h.new_status})`}
                        </span>
                        {h.note && <p className="text-muted-foreground mt-0.5">{h.note}</p>}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(h.created_at).toLocaleString("ro-RO")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
