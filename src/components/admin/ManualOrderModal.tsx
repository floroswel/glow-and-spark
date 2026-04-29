import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createManualOrder } from "@/utils/admin-orders.functions";
import { X, Plus, Trash2, Search, Loader2 } from "lucide-react";

type Line = {
  key: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  sku?: string | null;
  manual: boolean;
};

type ProductHit = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  sku: string | null;
  stock: number | null;
};

function newKey() {
  return Math.random().toString(36).slice(2);
}

export default function ManualOrderModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    billing_type: "individual" as "individual" | "company",
    company_name: "",
    company_cui: "",
    company_reg: "",
  });
  const [shipping, setShipping] = useState({
    address: "",
    city: "",
    county: "",
    postal_code: "",
  });
  const [lines, setLines] = useState<Line[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ramburs" | "card" | "transfer">("ramburs");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed" | "refunded">("pending");
  const [status, setStatus] = useState<"pending" | "processing">("pending");
  const [notes, setNotes] = useState("");

  // Product picker
  const [productSearch, setProductSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<ProductHit[]>([]);

  useEffect(() => {
    if (!open) {
      setError("");
      setSubmitting(false);
      setCustomer({ name: "", email: "", phone: "", billing_type: "individual", company_name: "", company_cui: "", company_reg: "" });
      setShipping({ address: "", city: "", county: "", postal_code: "" });
      setLines([]);
      setShippingCost(0);
      setDiscountAmount(0);
      setDiscountCode("");
      setPaymentMethod("ramburs");
      setPaymentStatus("pending");
      setStatus("pending");
      setNotes("");
      setProductSearch("");
      setHits([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = productSearch.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, sku, stock")
        .ilike("name", `%${term}%`)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .limit(10);
      if (!cancelled) {
        if (error) {
          console.error("[manual-order] product search failed", error);
          setHits([]);
        } else {
          setHits((data || []) as ProductHit[]);
        }
        setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [productSearch, open]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);
  const total = Math.max(0, subtotal + Number(shippingCost || 0) - Number(discountAmount || 0));

  function addProduct(p: ProductHit) {
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        product_id: p.id,
        name: p.name,
        price: Number(p.price),
        quantity: 1,
        image_url: p.image_url,
        sku: p.sku,
        manual: false,
      },
    ]);
    setProductSearch("");
    setHits([]);
  }

  function addManualLine() {
    setLines((prev) => [
      ...prev,
      { key: newKey(), product_id: null, name: "", price: 0, quantity: 1, manual: true },
    ]);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  async function submit() {
    setError("");
    if (!customer.name.trim() || customer.name.trim().length < 2) {
      setError("Numele clientului este obligatoriu (min 2 caractere).");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email.trim())) {
      setError("Email invalid.");
      return;
    }
    if (customer.billing_type === "company" && (!customer.company_name.trim() || !customer.company_cui.trim())) {
      setError("Pentru firmă, nume și CUI sunt obligatorii.");
      return;
    }
    if (lines.length === 0) {
      setError("Adaugă cel puțin o linie de comandă.");
      return;
    }
    for (const l of lines) {
      if (!l.name.trim()) { setError("Toate liniile au nevoie de un nume."); return; }
      if (!Number.isFinite(l.price) || l.price < 0) { setError("Preț invalid pe o linie."); return; }
      if (!Number.isInteger(l.quantity) || l.quantity < 1) { setError("Cantitate invalidă pe o linie."); return; }
    }

    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;
      if (!accessToken) {
        setError("Sesiune expirată. Reautentifică-te.");
        setSubmitting(false);
        return;
      }

      const result = await createManualOrder({
        data: {
          access_token: accessToken,
          customer,
          shipping,
          lines: lines.map((l) => ({
            product_id: l.product_id,
            name: l.name,
            price: Number(l.price),
            quantity: Number(l.quantity),
            image_url: l.image_url ?? null,
            sku: l.sku ?? null,
            manual: l.manual,
          })),
          shipping_cost: Number(shippingCost || 0),
          discount_amount: Number(discountAmount || 0),
          discount_code: discountCode || null,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          status,
          notes: notes || null,
        },
      });

      if (result?.ok) {
        onCreated();
        onClose();
      } else {
        setError("Comanda nu a putut fi creată.");
      }
    } catch (e: any) {
      console.error("[manual-order] submit error", e);
      const msg = typeof e?.message === "string" ? e.message : "Eroare la creare comandă.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-card shadow-xl my-8 border border-border">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-heading text-lg font-bold">Adaugă comandă manuală</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Client */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Client</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Nume complet *" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Email *" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Telefon" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={customer.billing_type} onChange={(e) => setCustomer({ ...customer, billing_type: e.target.value as any })}>
                <option value="individual">Persoană fizică</option>
                <option value="company">Firmă</option>
              </select>
              {customer.billing_type === "company" && (
                <>
                  <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Nume firmă *" value={customer.company_name} onChange={(e) => setCustomer({ ...customer, company_name: e.target.value })} />
                  <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="CUI *" value={customer.company_cui} onChange={(e) => setCustomer({ ...customer, company_cui: e.target.value })} />
                  <input className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Nr. Reg. Com." value={customer.company_reg} onChange={(e) => setCustomer({ ...customer, company_reg: e.target.value })} />
                </>
              )}
            </div>
          </section>

          {/* Linii */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Linii comandă</h3>
            <div className="rounded-md border border-border bg-background p-3 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm" placeholder="Caută produs din catalog..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                {productSearch.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-md border border-border bg-card shadow-lg">
                    {searching ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">Se caută...</div>
                    ) : hits.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">Niciun produs găsit.</div>
                    ) : hits.map((p) => (
                      <button key={p.id} type="button" onClick={() => addProduct(p)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary">
                        {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{Number(p.price).toFixed(2)} RON {p.sku ? `· ${p.sku}` : ""} {typeof p.stock === "number" ? `· stoc: ${p.stock}` : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {lines.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nicio linie. Caută un produs sau adaugă manual.</p>
              ) : (
                <div className="space-y-2">
                  {lines.map((l) => (
                    <div key={l.key} className="grid grid-cols-12 gap-2 items-center">
                      <input className="col-span-5 rounded-md border border-border bg-card px-2 py-1.5 text-sm" placeholder="Nume produs" value={l.name} onChange={(e) => updateLine(l.key, { name: e.target.value })} disabled={!l.manual} />
                      <input className="col-span-2 rounded-md border border-border bg-card px-2 py-1.5 text-sm" type="number" min={0} step="0.01" value={l.price} onChange={(e) => updateLine(l.key, { price: Number(e.target.value) })} disabled={!l.manual} />
                      <input className="col-span-2 rounded-md border border-border bg-card px-2 py-1.5 text-sm" type="number" min={1} step={1} value={l.quantity} onChange={(e) => updateLine(l.key, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} />
                      <span className="col-span-2 text-right text-sm font-medium">{(l.price * l.quantity).toFixed(2)} RON</span>
                      <button type="button" onClick={() => removeLine(l.key)} className="col-span-1 justify-self-end rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      {l.manual && <span className="col-span-12 text-[10px] uppercase tracking-wide text-muted-foreground">Linie manuală</span>}
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={addManualLine} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs hover:bg-secondary">
                <Plus className="h-3.5 w-3.5" /> Adaugă linie manuală
              </button>
            </div>
          </section>

          {/* Livrare */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Livrare</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Adresă" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
              <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Localitate" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
              <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Județ" value={shipping.county} onChange={(e) => setShipping({ ...shipping, county: e.target.value })} />
              <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Cod poștal" value={shipping.postal_code} onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })} />
            </div>
          </section>

          {/* Plată & sume */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Plată & sume</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                <option value="ramburs">Ramburs</option>
                <option value="card">Card online</option>
                <option value="transfer">Transfer bancar</option>
              </select>
              <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)}>
                <option value="pending">Plată: în așteptare</option>
                <option value="paid">Plată: plătită</option>
                <option value="failed">Plată: eșuată</option>
                <option value="refunded">Plată: rambursată</option>
              </select>
              <select className="rounded-md border border-border bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="pending">Status: în așteptare</option>
                <option value="processing">Status: în procesare</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <span className="w-32 text-muted-foreground">Cost livrare</span>
                <input className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" type="number" min={0} step="0.01" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value) || 0)} />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="w-32 text-muted-foreground">Reducere</span>
                <input className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" type="number" min={0} step="0.01" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)} />
              </label>
              <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Cod reducere (opțional)" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
            </div>
          </section>

          <section>
            <textarea className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" rows={2} placeholder="Note interne (opțional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </section>

          <div className="rounded-lg bg-secondary/50 p-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)} RON</span></div>
            <div className="flex justify-between"><span>Livrare</span><span>{Number(shippingCost || 0).toFixed(2)} RON</span></div>
            {Number(discountAmount || 0) > 0 && <div className="flex justify-between text-destructive"><span>Reducere</span><span>-{Number(discountAmount || 0).toFixed(2)} RON</span></div>}
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-bold"><span>Total (estimat client)</span><span>{total.toFixed(2)} RON</span></div>
            <p className="mt-1 text-[10px] text-muted-foreground">Totalurile finale sunt recalculate server-side pe baza cataloagului.</p>
          </div>

          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">Anulează</button>
          <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Creează comanda
          </button>
        </div>
      </div>
    </div>
  );
}
