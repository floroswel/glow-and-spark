import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/stock/movements")({
  component: StockMovements,
});

const typeLabels: Record<string, string> = {
  entry: "📥 Intrare", exit: "📤 Ieșire", transfer_in: "➡️ Transfer In",
  transfer_out: "⬅️ Transfer Out", adjustment: "✏️ Ajustare", return: "↩️ Retur",
};

function StockMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("stock_movements")
        .select("*, products(name, sku)")
        .order("created_at", { ascending: false }).limit(500);
      setMovements(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = movements;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m => (m as any).products?.name?.toLowerCase().includes(s) || (m as any).products?.sku?.toLowerCase().includes(s));
    }
    if (typeFilter) list = list.filter(m => m.movement_type === typeFilter);
    return list;
  }, [movements, search, typeFilter]);

  const exportCSV = () => {
    const rows = filtered.map(m => [
      new Date(m.created_at).toLocaleString("ro-RO"),
      (m as any).products?.name || "",
      m.movement_type,
      m.quantity,
      m.previous_stock,
      m.new_stock,
      m.reason || "",
    ]);
    const csv = "Data,Produs,Tip,Cantitate,Stoc Anterior,Stoc Nou,Motiv\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `miscari-stoc-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-heading text-xl font-bold text-foreground">📋 Mișcări Stoc</h1>
          <span className="text-sm text-muted-foreground">({filtered.length})</span>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-muted transition">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută produs..." className="pl-9" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="">Toate tipurile</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Data</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Produs</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Tip</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Cantitate</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Stoc Anterior</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground">Stoc Nou</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Motiv</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b border-border hover:bg-muted/20 transition">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(m.created_at).toLocaleString("ro-RO")}</td>
                    <td className="p-3 font-medium text-foreground">{(m as any).products?.name || "—"}</td>
                    <td className="p-3">{typeLabels[m.movement_type] || m.movement_type}</td>
                    <td className={`p-3 text-center font-bold ${m.quantity > 0 ? "text-chart-2" : "text-destructive"}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{m.previous_stock}</td>
                    <td className="p-3 text-center font-medium">{m.new_stock}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[200px]">{m.reason || "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nicio mișcare de stoc</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
