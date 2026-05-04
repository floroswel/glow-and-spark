import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Download, Trash2, FileEdit, Clock, CheckCircle2, XCircle, Loader2, MessageSquare, Paperclip, Upload, File } from "lucide-react";
import { toast } from "sonner";
import { GDPR_RESPONSE_DAYS } from "@/lib/compliance";

const TYPE_LABEL: Record<string, string> = {
  export: "Export date",
  delete: "Ștergere cont",
  rectify: "Rectificare date",
};

const STATUS_META: Record<string, { label: string; cls: string; Icon: any }> = {
  pending: { label: "În așteptare", cls: "bg-amber-100 text-amber-800", Icon: Clock },
  processing: { label: "În procesare", cls: "bg-blue-100 text-blue-800", Icon: Loader2 },
  completed: { label: "Finalizată", cls: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
  rejected: { label: "Respinsă", cls: "bg-red-100 text-red-800", Icon: XCircle },
};

const TYPE_ICON: Record<string, any> = { export: Download, delete: Trash2, rectify: FileEdit };

interface Props {
  requestId: string | null;
  onClose: () => void;
}

export function GdprRequestDetailDialog({ requestId, onClose }: Props) {
  const [req, setReq] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    loadData();
  }, [requestId]);

  const loadData = async () => {
    if (!requestId) return;
    const [{ data: r }, { data: h }, { data: docs }] = await Promise.all([
      supabase.from("gdpr_requests").select("*").eq("id", requestId).single(),
      supabase.from("gdpr_request_history" as any).select("*").eq("request_id", requestId).order("created_at", { ascending: true }) as any,
      supabase.from("gdpr_documents" as any).select("*").eq("request_id", requestId).order("created_at", { ascending: true }) as any,
    ]);
    setReq(r);
    setHistory(h ?? []);
    setDocuments(docs ?? []);
    setLoading(false);
  };

  const uploadDocument = async (file: globalThis.File) => {
    if (!req) return;
    setUploading(true);
    const path = `${req.user_id}/${requestId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("gdpr-documents").upload(path, file);
    if (uploadErr) {
      toast.error("Eroare la încărcarea fișierului");
      setUploading(false);
      return;
    }
    const { error: dbErr } = await (supabase.from("gdpr_documents" as any).insert({
      request_id: requestId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      uploaded_by: req.user_id,
    }) as any);
    if (dbErr) {
      toast.error("Eroare la salvarea documentului");
    } else {
      toast.success("Document atașat cu succes");
      loadData();
    }
    setUploading(false);
  };

  const downloadDoc = async (doc: any) => {
    const { data, error } = await supabase.storage.from("gdpr-documents").download(doc.file_path);
    if (error || !data) {
      toast.error("Nu s-a putut descărca fișierul");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (!requestId) return null;

  const STEPS = ["pending", "processing", "completed"];

  return (
    <Dialog open={!!requestId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !req ? (
          <div className="py-8 text-center text-muted-foreground">Cererea nu a fost găsită.</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => { const Icon = TYPE_ICON[req.request_type] ?? Shield; return <Icon className="h-5 w-5 text-accent" />; })()}
                {TYPE_LABEL[req.request_type] ?? req.request_type}
                <code className="text-xs font-mono text-muted-foreground ml-auto">GDPR-{req.id.slice(0, 8).toUpperCase()}</code>
              </DialogTitle>
            </DialogHeader>

            {/* Status badge + stepper */}
            <div className="space-y-3">
              {(() => {
                const sm = STATUS_META[req.status] ?? STATUS_META.pending;
                const Icon = sm.Icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${sm.cls}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {sm.label}
                  </span>
                );
              })()}

              {req.status !== "rejected" ? (
                <div className="flex items-center gap-1">
                  {STEPS.map((step, i) => {
                    const stepIndex = STEPS.indexOf(req.status);
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
                  <XCircle className="h-3.5 w-3.5" /> Cererea a fost respinsă.
                </div>
              )}
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div>
                <span className="text-muted-foreground text-xs">Trimisă:</span>
                <div className="font-medium">{new Date(req.created_at).toLocaleString("ro-RO")}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Termen:</span>
                <div className="font-medium">
                  {(() => {
                    if (req.status === "completed" || req.status === "rejected") return "—";
                    const daysSince = Math.floor((Date.now() - new Date(req.created_at).getTime()) / 86400000);
                    const daysLeft = Math.max(0, GDPR_RESPONSE_DAYS - daysSince);
                    return daysLeft > 0 ? `${daysLeft} zile rămase` : <span className="text-red-600">TERMEN DEPĂȘIT</span>;
                  })()}
                </div>
              </div>
              {req.processed_at && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Procesată:</span>
                  <div className="font-medium">{new Date(req.processed_at).toLocaleString("ro-RO")}</div>
                </div>
              )}
            </div>

            {req.details && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">Detalii cerere:</span>
                <p className="text-sm bg-secondary/50 rounded-lg p-2.5 mt-1">{req.details}</p>
              </div>
            )}

            {/* Documents */}
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Paperclip className="h-4 w-4" /> Documente atașate
              </h3>
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Niciun document atașat.</p>
              ) : (
                <div className="space-y-1.5">
                  {documents.map((doc: any) => (
                    <button
                      key={doc.id}
                      onClick={() => downloadDoc(doc)}
                      className="w-full flex items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:bg-secondary/50 transition text-sm"
                    >
                      <File className="h-4 w-4 text-accent shrink-0" />
                      <span className="flex-1 truncate font-medium">{doc.file_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatSize(doc.file_size)}</span>
                      <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {/* Upload */}
              {req.status !== "completed" && req.status !== "rejected" && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadDocument(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? "Se încarcă…" : "Atașează document"}
                  </button>
                </>
              )}
            </div>

            {/* History timeline */}
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Istoric status
              </h3>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">Niciun eveniment înregistrat.</p>
              ) : (
                <div className="relative pl-5 space-y-0">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                  {history.map((h: any) => {
                    const isNote = h.old_status === h.new_status && h.note;
                    const hStatus = STATUS_META[h.new_status];
                    return (
                      <div key={h.id} className="relative pb-4">
                        <div className={`absolute -left-5 top-1 w-[14px] h-[14px] rounded-full border-2 ${
                          isNote ? "bg-secondary border-muted-foreground" : "bg-card border-accent"
                        } flex items-center justify-center`}>
                          {!isNote && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                          {isNote && <MessageSquare className="h-2 w-2 text-muted-foreground" />}
                        </div>
                        <div className="ml-1.5">
                          {isNote ? (
                            <>
                              <div className="text-xs font-medium">Notă</div>
                              <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-1.5 mt-0.5">{h.note}</p>
                            </>
                          ) : (
                            <div className="text-xs">
                              <span className="font-medium">
                                {h.old_status
                                  ? `${STATUS_META[h.old_status]?.label ?? h.old_status} → ${hStatus?.label ?? h.new_status}`
                                  : `Cerere creată (${hStatus?.label ?? h.new_status})`}
                              </span>
                              {h.note && <p className="text-muted-foreground mt-0.5">{h.note}</p>}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(h.created_at).toLocaleString("ro-RO")}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
