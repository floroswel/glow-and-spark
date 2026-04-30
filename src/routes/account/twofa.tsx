import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Check, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/twofa")({
  component: TwoFAPage,
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      // gate handled in component
    }
  },
});

function TwoFAPage() {
  const { user, loading: authLoading } = useAuth();
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user]);

  const refresh = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp || []);
  };

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator" });
    if (error) { toast.error(error.message); setEnrolling(false); return; }
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
  };

  const verify = async () => {
    if (!factorId) return;
    setBusy(true);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) { toast.error(chErr.message); setBusy(false); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
    setBusy(false);
    if (error) { toast.error("Cod invalid"); return; }
    toast.success("2FA activat!");
    setEnrolling(false); setQr(null); setSecret(null); setFactorId(null); setCode("");
    refresh();
  };

  const unenroll = async (id: string) => {
    if (!confirm("Sigur dezactivezi 2FA?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) toast.error(error.message);
    else { toast.success("2FA dezactivat"); refresh(); }
  };

  if (authLoading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  if (!user) return <div className="p-8 text-center">Trebuie să fii autentificat.</div>;

  const active = factors.find((f) => f.status === "verified");

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-7 w-7 text-accent" />
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Autentificare în 2 pași</h1>
          <p className="text-sm text-muted-foreground">Protejează contul cu un cod TOTP suplimentar.</p>
        </div>
      </div>

      {active ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <Check className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-900">2FA este activ</p>
              <p className="text-sm text-green-700">Vei avea nevoie de cod la fiecare login.</p>
            </div>
          </div>
          <button onClick={() => unenroll(active.id)} className="text-sm text-red-600 hover:underline">Dezactivează 2FA</button>
        </div>
      ) : enrolling && qr ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <p className="text-sm text-muted-foreground">1. Scanează codul QR cu Google Authenticator, Authy sau similar.</p>
          <img src={qr} alt="QR 2FA" className="mx-auto w-48 h-48 border border-border rounded-lg p-2 bg-white" />
          {secret && <p className="text-center text-xs text-muted-foreground">Sau introdu manual: <code className="bg-secondary px-2 py-1 rounded">{secret}</code></p>}
          <p className="text-sm text-muted-foreground">2. Introdu codul de 6 cifre din aplicație:</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-widest bg-background border border-border rounded-lg px-4 py-3"
          />
          <div className="flex gap-2">
            <button onClick={verify} disabled={code.length !== 6 || busy} className="flex-1 bg-accent text-accent-foreground px-4 py-3 rounded-lg font-bold disabled:opacity-50">
              {busy ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verifică și activează"}
            </button>
            <button onClick={() => { setEnrolling(false); setQr(null); }} className="px-4 py-3 border border-border rounded-lg">Anulează</button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-foreground">2FA nu este activat</p>
              <p className="text-sm text-muted-foreground">Activează-l pentru protecție suplimentară.</p>
            </div>
          </div>
          <button onClick={startEnroll} className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-bold">Activează 2FA</button>
        </div>
      )}
    </div>
  );
}
