import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HelpCircle, Plus, Trash2, Pencil, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

export const Route = createFileRoute("/admin/content/faq")({
  component: AdminFaq,
});

interface FaqItem { question: string; answer: string; category: string; order: number }

const defaultCategories = ["General", "Comenzi", "Livrare", "Retururi", "Produse Lumânări", "Plăți"];

function AdminFaq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "General" });
  const [toast, setToast] = useState("");
  const [openCat, setOpenCat] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "faq_items").maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value)) setItems(data.value as unknown as FaqItem[]);
      else setItems([
        { question: "Cum aleg lumânarea potrivită?", answer: "Alegerea depinde de preferințele de parfum, dimensiunea camerei și durata de ardere dorită. Lumânările din soia sunt ideale pentru spații mici.", category: "Produse Lumânări", order: 0 },
        { question: "Cât durează livrarea?", answer: "Livrarea standard durează 1-3 zile lucrătoare. Livrarea gratuită este disponibilă pentru comenzi peste 200 RON.", category: "Livrare", order: 0 },
        { question: "Pot returna o lumânare?", answer: "Da, acceptăm retururi în 14 zile dacă produsul nu a fost utilizat și este în ambalajul original.", category: "Retururi", order: 0 },
      ]);
      setLoading(false);
    });
  }, []);

  const save = async (updated: FaqItem[]) => {
    setItems(updated);
    await supabase.from("site_settings").upsert({ key: "faq_items", value: updated as any }, { onConflict: "key" });
    setToast("Salvat!"); setTimeout(() => setToast(""), 2500);
  };

  const addItem = () => {
    if (!form.question.trim()) return;
    const updated = [...items, { ...form, order: items.length }];
    save(updated);
    setForm({ question: "", answer: "", category: "General" });
  };

  const updateItem = (idx: number) => {
    const updated = [...items];
    updated[idx] = { ...form, order: idx };
    save(updated);
    setEditing(null);
    setForm({ question: "", answer: "", category: "General" });
  };

  const deleteItem = (idx: number) => {
    save(items.filter((_, i) => i !== idx));
  };

  const grouped = defaultCategories.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {} as Record<string, FaqItem[]>);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-secondary animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 bg-foreground text-background px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">{editing !== null ? "Editare întrebare" : "Adaugă întrebare nouă"}</h3>
        <div className="grid gap-3">
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {defaultCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Întrebarea" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <textarea placeholder="Răspunsul" value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => editing !== null ? updateItem(editing) : addItem()} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90">
              {editing !== null ? "Actualizează" : "Adaugă"}
            </button>
            {editing !== null && <button onClick={() => { setEditing(null); setForm({ question: "", answer: "", category: "General" }); }} className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm">Anulează</button>}
          </div>
        </div>
      </div>

      {defaultCategories.map(cat => {
        const catItems = grouped[cat] || [];
        if (catItems.length === 0) return null;
        const isOpen = openCat === cat;
        return (
          <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
            <button onClick={() => setOpenCat(isOpen ? null : cat)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/50 transition">
              <span className="font-semibold text-foreground">{cat} ({catItems.length})</span>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {isOpen && (
              <div className="border-t border-border divide-y divide-border">
                {catItems.map((item, _ci) => {
                  const globalIdx = items.indexOf(item);
                  return (
                    <div key={globalIdx} className="px-5 py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{item.question}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.answer}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditing(globalIdx); setForm({ question: item.question, answer: item.answer, category: item.category }); }} className="p-1.5 hover:bg-secondary rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteItem(globalIdx)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground">Total: {items.length} întrebări în {Object.values(grouped).filter(g => g.length > 0).length} categorii</p>
    </div>
  );
}
