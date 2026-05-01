import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Pencil, Eye, Save, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin/content/email-templates")({
  component: AdminEmailTemplates,
});

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  description: string;
}

const defaultTemplates: EmailTemplate[] = [
  { id: "order_confirmation", name: "Confirmare comandă", subject: "Comanda ta #{order_number} a fost plasată ✨", body: "Dragă {customer_name},\n\nÎți mulțumim pentru comanda ta #{order_number}!\n\nProdusele tale vor fi pregătite cu grijă și expediate în cel mai scurt timp.\n\nTotal comandă: {total} RON\n\nCu drag,\nEchipa Mama Lucica 🕯️", variables: ["customer_name", "order_number", "total", "items"], description: "Trimis automat la plasarea unei comenzi" },
  { id: "order_shipped", name: "Comandă expediată", subject: "Comanda #{order_number} a fost expediată! 📦", body: "Dragă {customer_name},\n\nComanda ta #{order_number} a fost expediată!\n\nPoți urmări coletul folosind AWB: {awb_number}\n\nLivrare estimată: {estimated_delivery}\n\nCu drag,\nEchipa Mama Lucica", variables: ["customer_name", "order_number", "awb_number", "estimated_delivery"], description: "Trimis când comanda este predată curierului" },
  { id: "order_delivered", name: "Comandă livrată", subject: "Comanda #{order_number} a fost livrată! 🎉", body: "Dragă {customer_name},\n\nComanda ta #{order_number} a fost livrată cu succes!\n\nSperăm că vei savura fiecare moment cu lumânările tale.\n\nNe-ar face plăcere să ne spui părerea ta. Lasă o recenzie aici: {review_link}\n\nCu drag,\nEchipa Mama Lucica", variables: ["customer_name", "order_number", "review_link"], description: "Trimis la confirmarea livrării" },
  { id: "welcome", name: "Bun venit", subject: "Bun venit în lumea Mama Lucica! 🕯️✨", body: "Dragă {customer_name},\n\nÎți mulțumim că te-ai alăturat comunității noastre!\n\nDescoperă colecția noastră de lumânări artizanale din ceară de soia, parfumate cu uleiuri esențiale.\n\nFolosește codul BINE10 pentru 10% reducere la prima comandă.\n\nCu drag,\nEchipa Mama Lucica", variables: ["customer_name"], description: "Trimis la crearea contului" },
  { id: "password_reset", name: "Resetare parolă", subject: "Resetare parolă — Mama Lucica", body: "Dragă {customer_name},\n\nAi solicitat resetarea parolei.\n\nAccesează link-ul de mai jos pentru a seta o parolă nouă:\n{reset_link}\n\nDacă nu ai solicitat acest lucru, ignoră acest email.\n\nCu drag,\nEchipa Mama Lucica", variables: ["customer_name", "reset_link"], description: "Trimis la cererea de resetare parolă" },
  { id: "abandoned_cart", name: "Coș abandonat", subject: "Ai uitat ceva în coș... 🕯️", body: "Dragă {customer_name},\n\nAm observat că ai lăsat câteva produse în coș.\n\nLumânările tale te așteaptă! Finalizează comanda acum și bucură-te de aromaterapie la tine acasă.\n\n{cart_link}\n\nCu drag,\nEchipa Mama Lucica", variables: ["customer_name", "cart_link", "items"], description: "Trimis automat la 24h după abandon coș" },
];

function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subject: "", body: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "email_templates").maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value)) setTemplates(data.value as unknown as EmailTemplate[]);
      else setTemplates(defaultTemplates);
      setLoading(false);
    });
  }, []);

  const save = async (updated: EmailTemplate[]) => {
    setTemplates(updated);
    await supabase.from("site_settings").upsert({ key: "email_templates", value: updated as any }, { onConflict: "key" });
    setToast("Salvat!"); setTimeout(() => setToast(""), 2500);
  };

  const startEdit = (t: EmailTemplate) => { setEditing(t.id); setEditForm({ subject: t.subject, body: t.body }); };
  const cancelEdit = () => { setEditing(null); };
  const saveEdit = (id: string) => {
    save(templates.map(t => t.id === id ? { ...t, subject: editForm.subject, body: editForm.body } : t));
    setEditing(null);
  };

  const renderPreview = (t: EmailTemplate) => {
    let html = t.body.replace(/\n/g, "<br/>");
    t.variables.forEach(v => { html = html.replace(new RegExp(`\\{${v}\\}`, "g"), `<span style="background:#fef3c7;padding:0 4px;border-radius:4px;font-weight:600">{${v}}</span>`); });
    return html;
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-foreground text-background px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}
      {templates.map(t => (
        <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-foreground text-sm">{t.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Variabile: {t.variables.map(v => `{${v}}`).join(", ")}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setPreview(preview === t.id ? null : t.id)} className="p-2 hover:bg-secondary rounded-lg"><Eye className="h-4 w-4" /></button>
              <button onClick={() => startEdit(t)} className="p-2 hover:bg-secondary rounded-lg"><Pencil className="h-4 w-4" /></button>
            </div>
          </div>
          {preview === t.id && (
            <div className="border-t border-border px-5 py-4 bg-secondary/30">
              <p className="text-xs font-medium text-muted-foreground mb-1">Subiect: {t.subject}</p>
              <div className="bg-background rounded-lg p-4 text-sm" dangerouslySetInnerHTML={{ __html: renderPreview(t) }} />
            </div>
          )}
          {editing === t.id && (
            <div className="border-t border-border px-5 py-4 space-y-3">
              <input value={editForm.subject} onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subiect email" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea value={editForm.body} onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))} rows={8} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(t.id)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium"><Save className="h-3.5 w-3.5 inline mr-1" />Salvează</button>
                <button onClick={cancelEdit} className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm">Anulează</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
