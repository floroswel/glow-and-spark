import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Resetare parolă — Lumini.ro" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { general } = useSiteSettings();
  const siteName = general?.site_name || "LUMINI.RO";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary px-4 py-12">
      <Link to="/" className="mb-6 font-heading text-3xl font-bold text-foreground">
        {siteName.replace(".RO", "")}<span className="text-accent">.RO</span>
      </Link>
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
        {sent ? (
          <div className="text-center">
            <p className="text-5xl mb-4">📧</p>
            <h1 className="text-2xl font-heading font-bold mb-2">Email trimis!</h1>
            <p className="text-sm text-muted-foreground mb-6">Verifică inbox-ul pentru linkul de resetare.</p>
            <Link to="/auth" className="px-6 py-2.5 bg-foreground text-primary-foreground rounded-lg font-semibold text-sm hover:bg-accent hover:text-accent-foreground transition">
              Înapoi la autentificare
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-2">Resetare parolă</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Introdu email-ul și îți trimitem un link de resetare.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email *" required className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-12 bg-foreground text-primary-foreground rounded-lg font-semibold text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition">
                {loading ? "Se trimite..." : "Trimite link de resetare"}
              </button>
            </form>
          </>
        )}
      </div>
      <Link to="/auth" className="mt-6 text-xs text-muted-foreground hover:text-foreground transition">← Înapoi la autentificare</Link>
    </div>
  );
}
