import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Trash2, Pencil, Eye, EyeOff, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

export const Route = createFileRoute("/admin/pages")({
  component: AdminPages,
});

function AdminPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", status: "draft", meta_title: "", meta_description: "" });
  const [exporting, setExporting] = useState(false);

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

  const legalSlugs = [
    "termeni-si-conditii",
    "politica-confidentialitate",
    "politica-retur",
    "transport-livrare",
    "metode-plata",
    "garantie",
  ];

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const exportLegalPdf = async () => {
    setExporting(true);
    try {
      // Fetch legal CMS pages
      const { data: legalPages } = await supabase
        .from("cms_pages")
        .select("title, slug, content, status")
        .in("slug", legalSlugs)
        .eq("status", "published")
        .order("title");

      if (!legalPages?.length) {
        toast.error("Nu există pagini legale publicate pentru export.");
        setExporting(false);
        return;
      }

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginX = 20;
      const contentW = pageW - marginX * 2;
      let y = 0;

      // Cover page
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("Pachet Documente Legale", pageW / 2, 80, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Mama Lucica — SC Vomix Genius SRL", pageW / 2, 95, { align: "center" });
      doc.text(`Generat: ${new Date().toLocaleDateString("ro-RO")}`, pageW / 2, 105, { align: "center" });

      // Table of contents
      doc.setTextColor(60);
      doc.setFontSize(11);
      let tocY = 130;
      doc.setFont("helvetica", "bold");
      doc.text("Cuprins:", marginX, tocY);
      tocY += 8;
      doc.setFont("helvetica", "normal");
      legalPages.forEach((p, i) => {
        doc.text(`${i + 1}. ${p.title}`, marginX + 5, tocY);
        tocY += 7;
      });

      // Each legal page
      for (const page of legalPages) {
        doc.addPage();
        y = 25;

        // Title
        doc.setTextColor(0);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text(page.title, marginX, y);
        y += 10;

        // Divider
        doc.setDrawColor(200);
        doc.line(marginX, y, pageW - marginX, y);
        y += 8;

        // Content
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40);

        const plainText = stripHtml(page.content || "");
        const lines = doc.splitTextToSize(plainText, contentW);

        for (const line of lines) {
          if (y > pageH - 20) {
            doc.addPage();
            y = 25;
          }
          doc.text(line, marginX, y);
          y += 5;
        }
      }

      // Footer on every page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Mama Lucica — Documente Legale — Pagina ${i} din ${totalPages}`,
          pageW / 2, pageH - 10, { align: "center" }
        );
      }

      doc.save("Pachet_Documente_Legale_MamaLucica.pdf");
      toast.success("PDF generat și descărcat cu succes!");
    } catch (err: any) {
      console.error(err);
      toast.error("Eroare la generare PDF: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">Pagini CMS ({pages.length})</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportLegalPdf}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF Legal
          </button>
          <button onClick={() => { resetForm(); setEditing({}) }} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
            <Plus className="h-4 w-4" /> Pagină nouă
          </button>
        </div>
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
