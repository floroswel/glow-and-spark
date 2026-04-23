import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BackToTop } from "@/components/BackToTop";
import { Gift, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/gift-card")({
  head: () => ({
    meta: [
      { title: "Card Cadou — Mama Lucica" },
      { name: "description", content: "Oferă un card cadou cu valoare personalizată. Cadoul perfect pentru cei dragi!" },
      { property: "og:title", content: "Card Cadou — Mama Lucica" },
      { property: "og:description", content: "Oferă un card cadou cu valoare personalizată." },
    ],
  }),
  component: GiftCardPage,
});

const PRESETS = [50, 100, 150, 200];

function GiftCardPage() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");

  const activeAmount = isCustom ? Number(customAmount) || 0 : amount;
  const isValid =
    activeAmount >= 10 &&
    activeAmount <= 1000 &&
    recipientName.trim() &&
    recipientEmail.trim() &&
    senderName.trim();

  const handleAddToCart = () => {
    if (!isValid) {
      toast.error("Completează toate câmpurile obligatorii.");
      return;
    }
    addItem({
      id: "gift-card-" + Date.now(),
      name: "Card Cadou " + activeAmount + " RON",
      price: activeAmount,
      slug: "gift-card",
      image_url: undefined,
    });
    toast.success("Cardul cadou a fost adăugat în coș!");
    navigate({ to: "/cart" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Gift className="h-8 w-8 text-accent" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Card Cadou</h1>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Oferă cadoul perfect — un card cadou pe care destinatarul îl poate folosi pentru orice produs din magazin.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            {/* Amount selector */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Valoare card *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setAmount(v); setIsCustom(false); }}
                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold border transition ${
                      !isCustom && amount === v
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-secondary text-foreground hover:border-accent/50"
                    }`}
                  >
                    {v} RON
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold border transition ${
                    isCustom
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-secondary text-foreground hover:border-accent/50"
                  }`}
                >
                  Altă sumă
                </button>
              </div>
              {isCustom && (
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Introdu suma (10–1000)"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 pr-14 text-sm text-foreground focus:border-accent focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">RON</span>
                </div>
              )}
            </div>

            {/* Recipient */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Numele destinatarului *</label>
                <input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  maxLength={100}
                  placeholder="Ex: Maria Popescu"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Email destinatar *</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="email@exemplu.com"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Mesaj personal (opțional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="La mulți ani! Cu drag..."
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">{message.length}/200</p>
            </div>

            {/* Sender */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Numele tău *</label>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                maxLength={100}
                placeholder="Ex: Ion Ionescu"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            {/* Summary + CTA */}
            <div className="rounded-xl bg-secondary/50 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total card cadou</p>
                <p className="text-2xl font-bold text-foreground">{activeAmount > 0 ? activeAmount : "—"} RON</p>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!isValid}
                className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Adaugă în coș
              </button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}
