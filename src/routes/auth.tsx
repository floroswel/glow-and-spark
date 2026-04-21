import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Autentificare — Lumini.ro" },
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
  const [error, setError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { signIn, signUp } = useAuth();
  const { general } = useSiteSettings();
  const navigate = useNavigate();

  const siteName = general?.site_name || "LUMINI.RO";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (password !== confirmPassword) { setError("Parolele nu se potrivesc"); setLoading(false); return; }
        if (password.length < 6) { setError("Parola trebuie să aibă minim 6 caractere"); setLoading(false); return; }
        const { error } = await signUp(email, password, fullName);
        if (error) setError(error.message);
        else setRegisterSuccess(true);
      } else {
        const { error } = await signIn(email, password);
        if (error) setError("Email sau parolă incorectă");
        else navigate({ to: "/" });
      }
    } catch { setError("A apărut o eroare"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary px-4 py-12">
      <Link to="/" className="mb-6 font-heading text-3xl font-bold text-foreground tracking-tight">
        {siteName.replace(".RO", "")}
        <span className="text-accent">.RO</span>
      </Link>

      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
        {registerSuccess ? (
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
