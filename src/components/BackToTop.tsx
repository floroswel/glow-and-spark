import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-primary-foreground shadow-lg hover:bg-accent hover:text-accent-foreground transition animate-in fade-in zoom-in duration-300"
      aria-label="Înapoi sus"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
