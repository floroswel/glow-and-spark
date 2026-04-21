import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "@tanstack/react-router";

export function TopBar() {
  const { header } = useSiteSettings();
  if (!header?.show_topbar) return null;

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs text-muted-foreground">
        <span>
          {header.topbar_text || "Bine ai venit pe Lumini.ro!"}{" "}
          <Link to="/account" className="ml-2 underline hover:text-foreground">Contul meu</Link>{" | "}
          <Link to="/track-order" className="underline hover:text-foreground">Urmărește comanda</Link>
        </span>
        <div className="flex items-center gap-3">
          <span>{header.topbar_right || "RO / RON"}</span>
        </div>
      </div>
    </div>
  );
}
