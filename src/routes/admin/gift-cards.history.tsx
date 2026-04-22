import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Search, Receipt, ShoppingCart, Calendar, ArrowRight, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/gift-cards/history")({
  component: GiftCardHistory,
});

interface GiftCard {
  id: string;
  code: string;
  initial_value: number;
  balance: number;
  status: string;
  buyer_name: string;
  buyer_email: string;
  recipient_name: string;
  recipient_email: string;
  message: string;
  expires_at: string;
  created_at: string;
  used_at?: string;
  order_id?: string;
  usage_history?: UsageEntry[];
}

interface UsageEntry {
  date: string;
  amount: number;
  order_id?: string;
  order_number?: string;
  type: "purchase" | "refund" | "adjustment";
  note?: string;
}

function GiftCardHistory() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", "gift_cards").maybeSingle(),
      supabase.from("orders").select("id, order_number, total, status, customer_name, created_at, discount_code, discount_amount").order("created_at", { ascending: false }).limit(500),
    ]).then(([gc, ord]) => {
      const rawCards = (gc.data?.value && Array.isArray(gc.data.value) ? gc.data.value : []) as unknown as GiftCard[];
      const allOrders = ord.data || [];
      setOrders(allOrders);

      // Enrich cards with usage history by matching discount_code to card codes
      const enriched = rawCards.map(card => {
        const linkedOrders = allOrders.filter(
          (o: any) => o.discount_code?.toUpperCase() === card.code.toUpperCase()
        );
        const usage: UsageEntry[] = linkedOrders.map((o: any) => ({
          date: o.created_at,
          amount: o.discount_amount || 0,
          order_id: o.id,
          order_number: o.order_number,
          type: "purchase" as const,
          note: `Comandă ${o.order_number} — ${o.customer_name}`,
        }));

        // If card has explicit usage_history, merge
        if (card.usage_history?.length) {
          usage.push(...card.usage_history.filter(u => !usage.some(e => e.order_id === u.order_id)));
        }

        usage.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { ...card, usage_history: usage };
      });

      setCards(enriched);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return cards;
    const s = search.toLowerCase();
    return cards.filter(c =>
      c.code.toLowerCase().includes(s) ||
      c.buyer_name?.toLowerCase().includes(s) ||
      c.recipient_name?.toLowerCase().includes(s) ||
      c.buyer_email?.toLowerCase().includes(s)
    );
  }, [cards, search]);

  const totalUsed = useMemo(() =>
    cards.reduce((sum, c) => sum + (c.initial_value - c.balance), 0),
    [cards]
  );
  const totalTransactions = useMemo(() =>
    cards.reduce((sum, c) => sum + (c.usage_history?.length || 0), 0),
    [cards]
  );

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    used: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    disabled: "bg-muted text-muted-foreground",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">📜 Istoric Carduri Cadou</h1>
        <p className="text-sm text-muted-foreground">Vizualizează utilizarea fiecărui card cadou, comenzile și facturile asociate</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Carduri</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{cards.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Carduri Utilizate</p>
          <p className="mt-1 text-2xl font-bold text-accent">{cards.filter(c => (c.usage_history?.length || 0) > 0).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Valoare Utilizată</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalUsed.toLocaleString()} RON</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Tranzacții</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalTransactions}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Caută cod, cumpărător, destinatar..."
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm"
        />
      </div>

      {/* Detail drawer */}
      {selectedCard && (
        <div className="rounded-xl border-2 border-accent/30 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground font-mono">{selectedCard.code}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedCard.buyer_name} → {selectedCard.recipient_name || "—"} | Emis: {new Date(selectedCard.created_at).toLocaleDateString("ro-RO")}
              </p>
            </div>
            <button onClick={() => setSelectedCard(null)} className="text-sm text-muted-foreground hover:text-foreground">✕ Închide</button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Valoare Inițială</p>
              <p className="font-bold text-foreground">{selectedCard.initial_value} RON</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Sold Rămas</p>
              <p className="font-bold text-amber-500">{selectedCard.balance} RON</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Utilizat</p>
              <p className="font-bold text-accent">{selectedCard.initial_value - selectedCard.balance} RON</p>
            </div>
          </div>

          {/* Usage timeline */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Istoric Utilizare</h4>
            {selectedCard.usage_history && selectedCard.usage_history.length > 0 ? (
              <div className="space-y-2">
                {selectedCard.usage_history.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                    <div className={`rounded-full p-1.5 ${entry.type === "refund" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"}`}>
                      {entry.type === "purchase" ? <ShoppingCart className="h-3.5 w-3.5" /> : <Receipt className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{entry.note || entry.type}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.date).toLocaleString("ro-RO")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${entry.type === "refund" ? "text-red-500" : "text-foreground"}`}>
                        {entry.type === "refund" ? "+" : "−"}{entry.amount} RON
                      </p>
                      {entry.order_number && (
                        <p className="text-[10px] text-accent font-mono">#{entry.order_number}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Nicio utilizare înregistrată</p>
            )}
          </div>
        </div>
      )}

      {/* Cards table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cod</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cumpărător</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Destinatar</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valoare</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sold</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Utilizări</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Detalii</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(card => (
              <tr key={card.id} className="border-b last:border-0 hover:bg-muted/20 transition">
                <td className="px-4 py-3 font-mono text-xs font-bold">{card.code}</td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-foreground">{card.buyer_name}</p>
                  <p className="text-[10px] text-muted-foreground">{card.buyer_email}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-foreground">{card.recipient_name || "—"}</p>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{card.initial_value} RON</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-500">{card.balance} RON</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    (card.usage_history?.length || 0) > 0
                      ? "bg-accent/10 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {card.usage_history?.length || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[card.status] || statusColor.active}`}>
                    {card.status === "active" ? "Activ" : card.status === "used" ? "Folosit" : card.status === "expired" ? "Expirat" : "Dezactivat"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedCard(card)}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> Vezi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <Gift className="mx-auto h-8 w-8 mb-2 opacity-40" />
            Niciun card cadou găsit
          </div>
        )}
      </div>
    </div>
  );
}
