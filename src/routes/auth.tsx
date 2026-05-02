import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react";

async function logLoginAttempt(email: string, success: boolean, failure_reason?: string) {
  try {
    await supabase.from("login_attempts").insert({
      email,
      success,
      failure_reason: failure_reason ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch (e) { /* fail open */ }
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Autentificare — Mama Lucica" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { signIn, signUp } = useAuth();
  const { general } = useSiteSettings();
  const navigate = useNavigate();

  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);

  const siteName = general?.site_name || "Mama Lucica";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (password !== confirmPassword) { setError("Parolele nu se potrivesc"); setLoading(false); return; }
        if (password.length < 6) { setError("Parola trebuie să aibă minim 6 caractere"); setLoading(false); return; }
        if (!acceptTerms) { setError("Trebuie să accepți termenii și politica de confidențialitate."); setLoading(false); return; }
        const { error } = await signUp(email, password, fullName);
        if (error) setError(error.message);
        else {
          // Log consent for registration [LEGAL_REVIEW]
          supabase.from("gdpr_consents").insert({
            email,
            consent_type: "terms_and_privacy",
            granted: true,
            metadata: { context: "register", policy_version: "2025-05-02" },
          }).then(() => {});
          setRegisterSuccess(true);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          await logLoginAttempt(email, false, error.message);
          setError("Email sau parolă incorectă");
        } else {
          // Check if MFA is required
          const { data: factorsData } = await supabase.auth.mfa.listFactors();
          const verifiedFactors = factorsData?.totp?.filter((f) => f.status === "verified") || [];

          if (verifiedFactors.length > 0) {
            // User has MFA enrolled — need challenge
            setMfaFactorId(verifiedFactors[0].id);
            setMfaStep(true);
            setLoading(false);
            return;
          }

          await logLoginAttempt(email, true);
          navigate({ to: "/" });
        }
      }
    } catch { setError("A apărut o eroare"); }
    finally { setLoading(false); }
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId || mfaCode.length !== 6) return;
    setMfaBusy(true);
    setError("");
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (chErr) { setError(chErr.message); setMfaBusy(false); return; }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      });

      if (verifyErr) {
        setError("Cod invalid. Încearcă din nou.");
        setMfaCode("");
        setMfaBusy(false);
        return;
      }

      await logLoginAttempt(email, true);
      navigate({ to: "/" });
    } catch {
      setError("Eroare la verificarea codului.");
    } finally {
      setMfaBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary px-4 py-12">
      <Link to="/" className="mb-6 font-heading text-3xl font-bold text-foreground tracking-tight">
        {siteName.replace(".RO", "")}
        <span className="text-accent">.RO</span>
      </Link>

      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
        {/* MFA Challenge Step */}
        {mfaStep ? (
          <div className="text-center space-y-5">
            <Shield className="h-12 w-12 text-accent mx-auto" />
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">Verificare 2FA</h2>
              <p className="text-sm text-muted-foreground mt-1">Introdu codul de 6 cifre din aplicația de autentificare.</p>
            </div>
            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && mfaCode.length === 6 && handleMfaVerify()}
              className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-background border border-border rounded-lg px-4 py-4 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
            <button
              onClick={handleMfaVerify}
              disabled={mfaCode.length !== 6 || mfaBusy}
              className="w-full h-12 bg-foreground text-primary-foreground rounded-lg font-semibold text-sm tracking-wide hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {mfaBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verifică"}
            </button>
            <button
              onClick={() => { setMfaStep(false); setMfaFactorId(null); setMfaCode(""); setError(""); supabase.auth.signOut(); }}
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              ← Înapoi la autentificare
            </button>
          </div>
        ) : registerSuccess ? (
          <div className="text-center">
            <p className="text-5xl mb-4">✅</p>
            <h1 className="text-2xl font-heading font-bold mb-2">Cont creat cu succes!</h1>
            <p className="text-sm text-muted-foreground mb-6">Verifică email-ul pentru a confirma contul.</p>
            <button onClick={() => { setRegisterSuccess(false); setMode("login"); }} className="px-6 py-2.5 bg-foreground text-primary-foreground rounded-lg font-semibold text-sm hover:bg-accent hover:text-accent-foreground transition">
              Înapoi la autentificare
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground">
                {mode === "login" ? "Bun venit" : "Cont nou"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login" ? "Autentifică-te pentru a continua" : `Creează un cont ${siteName}`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <input
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Nume complet *" required
                  className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              )}
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email *" type="email" required
                className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <div className="relative">
                <input
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Parolă *" type={showPassword ? "text" : "password"} required
                  className="w-full h-11 px-3 pr-10 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "register" && (
                <input
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmă parola *" type="password" required
                  className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              )}
              {mode === "login" && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-xs text-accent font-semibold hover:underline">Ai uitat parola?</Link>
                </div>
              )}
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-12 bg-foreground text-primary-foreground rounded-lg font-semibold text-sm tracking-wide hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition">
                {loading ? "Se procesează..." : mode === "login" ? "Autentifică-te" : "Creează cont"}
              </button>
            </form>

            <div className="relative my-6">
              <hr className="border-border" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">sau</span>
            </div>

            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="w-full h-11 border border-border text-foreground rounded-lg font-semibold text-sm hover:bg-secondary transition">
              {mode === "login" ? "Creează un cont nou" : "Am deja cont — Autentifică-te"}
            </button>
          </>
        )}
      </div>

      <Link to="/" className="mt-6 text-xs text-muted-foreground hover:text-foreground transition">
        ← Înapoi la magazin
      </Link>
    </div>
  );
}
