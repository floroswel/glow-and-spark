import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Copy, TrendingUp, MousePointer, ShoppingBag, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/afiliat")({
  component: AfiliatPage,
  head: () => ({ meta: [{ title: "Program de Afiliere | Mama Lucica" }] }),
});

function AfiliatPage() {
  const { user } = useAuth();
  const [aff, setAff] = useState<any>(null);
  const [stats, setStats] = useState({ clicks: 0, conversions: 0, earned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: a } = await (supabase.from("affiliates" as any).select("*").eq("user_id", user.id).maybeSingle() as any);
      setAff(a);
      if (a) {
        const [{ count: clicks }, { data: convs }] = await Promise.all([
          supabase.from("affiliate_clicks" as any).select("id", { count: "exact", head: true }).eq("affiliate_id", a.id) as any,
          supabase.from("affiliate_conversions" as any).select("commission_amount").eq("affiliate_id", a.id) as any,
        ]);
        setStats({
          clicks: clicks || 0,
          conversions: convs?.length || 0,
          earned: convs?.reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0) || 0,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const apply = async () => {
    if (!user) return;
    const code = (user.email?.split("@")[0] || "ref") + Math.random().toString(36).slice(2, 6).toUpperCase();
    const { data, error } = await (supabase.from("affiliates" as any).insert({
      user_id: user.id,
      code,
      name: user.user_metadata?.full_name || user.email,
      email: user.email,
      commission_percent: 10,
      status: "pending",
    } as any).select().single() as any);
    if (error) { toast.error("Eroare: " + error.message); return; }
    setAff(data);
    toast.success("Cerere trimisă! Așteaptă aprobarea.");
  };

  const refLink = aff ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${aff.code}` : "";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Program de Afiliere</h1>
        <p className="text-muted-foreground mb-8">Câștigă comision pentru fiecare client adus.</p>

        {!user ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Trebuie să fii autentificat pentru a accesa programul.</p>
            <Link to="/auth" className="inline-block bg-accent text-accent-foreground px-6 py-3 rounded-lg font-bold">Autentifică-te</Link>
          </div>
        ) : loading ? (
          <div className="text-center text-muted-foreground">Se încarcă...</div>
        ) : !aff ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-3">Devino afiliat</h2>
            <p className="text-muted-foreground mb-6">Câștigă <strong>10% comision</strong> din fiecare comandă adusă prin linkul tău.</p>
            <button onClick={apply} className="bg-accent text-accent-foreground px-8 py-3 rounded-lg font-bold">Aplică acum</button>
          </div>
        ) : aff.status === "pending" ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800">⏳ Cererea ta este în curs de aprobare. Vei primi email când e activată.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<MousePointer />} label="Clickuri" value={stats.clicks} />
              <StatCard icon={<ShoppingBag />} label="Conversii" value={stats.conversions} />
              <StatCard icon={<TrendingUp />} label="Rată conversie" value={stats.clicks > 0 ? `${((stats.conversions / stats.clicks) * 100).toFixed(1)}%` : "0%"} />
              <StatCard icon={<Wallet />} label="Câștigat" value={`${stats.earned.toFixed(2)} RON`} />
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h3 className="font-bold text-foreground mb-3">Linkul tău de afiliere</h3>
              <div className="flex gap-2">
                <input value={refLink} readOnly className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm" />
                <button
                  onClick={() => { navigator.clipboard.writeText(refLink); toast.success("Copiat!"); }}
                  className="bg-accent text-accent-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                  <Copy className="h-4 w-4" /> Copiază
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Cod: <strong className="text-accent">{aff.code}</strong> · Comision: {aff.commission_percent}%</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-foreground mb-3">Cum funcționează?</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Distribuie linkul tău unic pe social media, blog, email.</li>
                <li>Când cineva cumpără prin linkul tău, primești {aff.commission_percent}% comision.</li>
                <li>Cookie-ul de tracking este valid 30 de zile.</li>
                <li>Plata se face lunar, la solicitare, când ajungi la 100 RON.</li>
              </ol>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="text-accent">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
