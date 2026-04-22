import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Crown, TrendingUp, ShoppingBag, UserCheck, UserX, Search,
  Tag, Download, BarChart3, ArrowUpDown, Filter, Zap, Target
} from "lucide-react";

export const Route = createFileRoute("/admin/crm")({
  component: AdminCRM,
});

interface SegmentRule {
  field: string;
  op: ">" | "<" | ">=" | "<=" | "==" | "!=";
  value: number;
}

const presetSegments: { name: string; desc: string; rules: SegmentRule[] }[] = [
  { name: "Cumpărători frecvenți", desc: "3+ comenzi plasate", rules: [{ field: "orders", op: ">=", value: 3 }] },
  { name: "One-time buyers", desc: "Exact 1 comandă", rules: [{ field: "orders", op: "==", value: 1 }] },
  { name: "High spenders", desc: "Total >1000 RON", rules: [{ field: "total", op: ">", value: 1000 }] },
  { name: "Risc churning", desc: "Cu comenzi dar inactivi 60+ zile", rules: [{ field: "orders", op: ">=", value: 1 }, { field: "daysSince", op: ">=", value: 60 }] },
  { name: "Clienți noi activi", desc: "Prima comandă în ultimele 30 zile", rules: [{ field: "daysSince", op: "<=", value: 30 }, { field: "orders", op: "==", value: 1 }] },
  { name: "Top VIP", desc: "Total >2000 RON", rules: [{ field: "total", op: ">", value: 2000 }] },
];

function matchesRules(c: any, rules: SegmentRule[]): boolean {
  return rules.every(r => {
    const v = r.field === "orders" ? c.orders : r.field === "total" ? c.total : r.field === "daysSince" ? c.daysSince : c.aov;
    switch (r.op) {
      case ">": return v > r.value;
      case "<": return v < r.value;
      case ">=": return v >= r.value;
      case "<=": return v <= r.value;
      case "==": return v === r.value;
      case "!=": return v !== r.value;
      default: return false;
    }
  });
}

function AdminCRM() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    supabase.from("orders").select("customer_email, customer_name, customer_phone, total, created_at, status, city, county").then(({ data }) => {
      setOrders(data || []);
      setLoading(false);
    });
  }, []);

  const enriched = useMemo(() => {
    const ordersByEmail: Record<string, { count: number; total: number; last: string; name: string; phone: string; city: string; county: string }> = {};
    (orders || []).forEach(o => {
      const e = o.customer_email?.toLowerCase();
      if (!e) return;
      if (!ordersByEmail[e]) ordersByEmail[e] = { count: 0, total: 0, last: o.created_at, name: o.customer_name, phone: o.customer_phone || "", city: o.city || "", county: o.county || "" };
      ordersByEmail[e].count++;
      ordersByEmail[e].total += Number(o.total || 0);
      if (o.created_at > ordersByEmail[e].last) ordersByEmail[e].last = o.created_at;
    });

    return Object.entries(ordersByEmail).map(([email, stats]) => {
      const daysSinceOrder = Math.floor((Date.now() - new Date(stats.last).getTime()) / 86400000);
      return {
        email,
        name: stats.name,
        phone: stats.phone,
        city: stats.city,
        county: stats.county,
        orders: stats.count,
        total: stats.total,
        aov: stats.total / stats.count,
        lastOrder: stats.last,
        daysSince: daysSinceOrder,
        segment: stats.total >= 500 ? "vip" : stats.count >= 3 ? "loyal" : daysSinceOrder > 90 ? "inactive" : "regular",
      };
    }).sort((a, b) => {
      const va = (a as any)[sortField] ?? 0;
      const vb = (b as any)[sortField] ?? 0;
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [orders, sortField, sortDir]);

  const segments = useMemo(() => ({
    all: enriched,
    vip: enriched.filter(c => c.segment === "vip"),
    loyal: enriched.filter(c => c.segment === "loyal"),
    regular: enriched.filter(c => c.segment === "regular"),
    inactive: enriched.filter(c => c.segment === "inactive"),
  }), [enriched]);

  const displayList = useMemo(() => {
    let list = activePreset !== null
      ? enriched.filter(c => matchesRules(c, presetSegments[activePreset].rules))
      : (segments[activeTab as keyof typeof segments] || enriched);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(q) || c.email.includes(q) || c.phone?.includes(q));
    }
    return list;
  }, [enriched, segments, activeTab, activePreset, search]);

  const segmentConfig: Record<string, { label: string; icon: any; color: string; desc: string }> = {
    all: { label: "Toți", icon: Users, color: "bg-secondary text-foreground", desc: "Toți clienții cu comenzi" },
    vip: { label: "VIP", icon: Crown, color: "bg-amber-100 text-amber-700", desc: "Total > 500 RON" },
    loyal: { label: "Fideli", icon: UserCheck, color: "bg-green-100 text-green-700", desc: "3+ comenzi" },
    regular: { label: "Regulari", icon: ShoppingBag, color: "bg-blue-100 text-blue-700", desc: "Activi, sub 3 comenzi" },
    inactive: { label: "Inactivi", icon: UserX, color: "bg-red-100 text-red-700", desc: "Fără comandă >90 zile" },
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleExport = () => {
    const headers = "Nume,Email,Telefon,Județ,Comenzi,Total,AOV,Segment,Ultima Comandă\n";
    const rows = displayList.map(c =>
      `"${c.name || ""}","${c.email}","${c.phone || ""}","${c.county || ""}",${c.orders},${c.total.toFixed(2)},${c.aov.toFixed(2)},"${c.segment}","${new Date(c.lastOrder).toLocaleDateString("ro-RO")}"`
    ).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `crm_segment_${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  // KPI
  const totalRevenue = enriched.reduce((s, c) => s + c.total, 0);
  const avgAOV = enriched.length ? enriched.reduce((s, c) => s + c.aov, 0) / enriched.length : 0;
  const avgOrders = enriched.length ? enriched.reduce((s, c) => s + c.orders, 0) / enriched.length : 0;

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">CRM — Segmente & Grupuri</h1>
          <p className="text-sm text-muted-foreground">{enriched.length} clienți unici din comenzi · segmentare automată</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Clienți unici", value: enriched.length, icon: Users },
          { label: "Venituri totale", value: `${(totalRevenue / 1000).toFixed(1)}k RON`, icon: TrendingUp },
          { label: "AOV Mediu", value: `${avgAOV.toFixed(0)} RON`, icon: BarChart3 },
          { label: "Frecvență medie", value: `${avgOrders.toFixed(1)} cmd`, icon: ShoppingBag },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <kpi.icon className="h-4 w-4" />
              <span className="text-xs">{kpi.label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Segment buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(segmentConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => { setActiveTab(key); setActivePreset(null); }}
            className={`rounded-xl border p-4 text-left transition ${activeTab === key && activePreset === null ? "border-accent ring-1 ring-accent" : "bg-card hover:border-accent/30"}`}>
            <div className="flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${cfg.color}`}><cfg.icon className="h-3.5 w-3.5" /></div>
              <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{segments[key as keyof typeof segments]?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">{cfg.desc}</p>
          </button>
        ))}
      </div>

      {/* Dynamic segments presets */}
      <div>
        <h2 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" /> Segmente Dinamice Pre-definite
        </h2>
        <div className="flex flex-wrap gap-2">
          {presetSegments.map((ps, idx) => {
            const count = enriched.filter(c => matchesRules(c, ps.rules)).length;
            return (
              <button key={idx} onClick={() => { setActivePreset(activePreset === idx ? null : idx); setActiveTab("all"); }}
                className={`rounded-lg border px-3 py-2 text-left transition ${activePreset === idx ? "border-accent bg-accent/5 ring-1 ring-accent" : "bg-card hover:border-accent/30"}`}>
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium">{ps.name}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ps.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Caută client..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:outline-none" />
      </div>

      {/* Results info */}
      <p className="text-xs text-muted-foreground">
        {displayList.length} clienți
        {activePreset !== null && ` — segment: ${presetSegments[activePreset].name}`}
      </p>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left"><button onClick={() => handleSort("name")} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"><span>Client</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Județ</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Segment</th>
              <th className="px-4 py-3 text-right"><button onClick={() => handleSort("orders")} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground justify-end"><span>Comenzi</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-right"><button onClick={() => handleSort("total")} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground justify-end"><span>Total</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-right"><button onClick={() => handleSort("aov")} className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground justify-end"><span>AOV</span><ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Ultima comandă</th>
            </tr>
          </thead>
          <tbody>
            {displayList.slice(0, 100).map((c, i) => {
              const seg = segmentConfig[c.segment] || segmentConfig.regular;
              return (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${c.segment === "vip" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                        {c.segment === "vip" ? <Crown className="h-3.5 w-3.5" /> : (c.name || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                        {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{c.county || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${seg.color}`}>{seg.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{c.orders}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.total.toFixed(0)} RON</td>
                  <td className="px-4 py-3 text-right">{c.aov.toFixed(0)} RON</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {new Date(c.lastOrder).toLocaleDateString("ro-RO")} <span className="text-muted-foreground/60">({c.daysSince}z)</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!displayList.length && (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Niciun client în acest segment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
