import { useState, useEffect } from "react";

const names = [
  "Ion din București", "Maria din Cluj", "Andrei din Timișoara",
  "Elena din Iași", "Mihai din Brașov", "Ana din Constanța",
  "George din Sibiu", "Ioana din Oradea", "Vlad din Craiova",
];

const products = [
  "Lumânare Vanilla...", "Set Cadou Trandafir...", "Lumânare Cedru...",
  "Diffuzor Lavandă...", "Lumânare Pilar Santal...", "Set Premium Rose...",
];

export function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState(names[0]);
  const [product, setProduct] = useState(products[0]);
  const [minutes, setMinutes] = useState(5);

  useEffect(() => {
    const show = () => {
      setName(names[Math.floor(Math.random() * names.length)]);
      setProduct(products[Math.floor(Math.random() * products.length)]);
      setMinutes(Math.floor(Math.random() * 15) + 1);
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    };

    const initial = setTimeout(show, 8000);
    const interval = setInterval(show, 30000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[90] flex w-80 items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xl animate-fade-in-up">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg">
        🕯️
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Acum {minutes} minute</p>
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">a cumpărat: {product}</p>
      </div>
      <span className="shrink-0 rounded bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">✔ Verificat</span>
    </div>
  );
}
