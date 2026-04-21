import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Trash2, Pencil, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/pages")({
  component: AdminPages,
});

function AdminPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", status: "draft", meta_title: "", meta_description: "" });

  const load = async () => {
    const { data } = await supabase.from("cms_pages").select("*").order("created_at", { ascending: false });
    setPages(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ title: "", slug: "", content: "", status: "draft", meta_title: "", meta_description: "" });
    setEditing(null);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, slug: form.slug || generateSlug(form.title) };
    if (editing?.id) {
      await supabase.from("cms_pages").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("cms_pages").insert(payload);
    }
    resetForm();
    load();
  };

  const handleEdit = (p: any) => {
    setForm({ title: p.title, slug: p.slug, content: p.content || "", status: p.status, meta_title: p.meta_title || "", meta_description: p.meta_description || "" });
    setEditing(p);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sigur dorești să ștergi această pagină?")) return;
    await supabase.from("cms_pages").delete().eq("id", id);
    load();
  };

  const toggleStatus = async (id: string, current: string) => {
    await supabase.from("cms_pages").update({ status: current === "published" ? "draft" : "published" }).eq("id", id);
    load();
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Pagini CMS ({pages.length})</h1>
        <button onClick={() => { resetForm(); setEditing({}) }} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
          <Plus className="h-4 w-4" /> Pagină nouă
        </button>
      </div>

      {editing !== null && (
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">{editing?.id ? "Editează Pagină" : "Pagină Nouă"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Titlu *" required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input placeholder="Slug (auto)" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="draft">Draft</option>
              <option value="published">Publicat</option>
            </select>
          </div>
          <textarea placeholder="Conținut pagină (HTML)" value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} rows={10}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-mono focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Meta Title (SEO)" value={form.meta_title} onChange={(e) => setForm({...form, meta_title: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input placeholder="Meta Description (SEO)" value={form.meta_description} onChange={(e) => setForm({...form, meta_description: e.target.value})}
              className="rounded-lg border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">Salvează</button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground hover:bg-secondary transition">Anulează</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {pages.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{p.title}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span className="font-mono">/{p.slug}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${p.status === "published" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                  {p.status === "published" ? "Publicat" : "Draft"}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => toggleStatus(p.id, p.status)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition">
                {p.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {!pages.length && (
          <div className="text-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Nicio pagină CMS creată.</p>
          </div>
        )}
      </div>
    </div>
  );
}
