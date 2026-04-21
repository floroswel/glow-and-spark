export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Informații utile</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition">Cum cumpăr</a></li>
              <li><a href="#" className="hover:text-foreground transition">Politica de livrare</a></li>
              <li><a href="#" className="hover:text-foreground transition">Politica de returnare</a></li>
              <li><a href="#" className="hover:text-foreground transition">Termeni și condiții</a></li>
              <li><a href="#" className="hover:text-foreground transition">GDPR</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Contul meu</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition">Datele mele</a></li>
              <li><a href="#" className="hover:text-foreground transition">Comenzi</a></li>
              <li><a href="#" className="hover:text-foreground transition">Lista de dorințe</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Magazinul nostru</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition">Despre noi</a></li>
              <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Suport clienți</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>📞 0800 123 456</li>
              <li>✉️ suport@lumini.ro</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-semibold">LIVRARE:</span>
            <span className="rounded bg-secondary px-2 py-0.5">DPD</span>
            <span className="rounded bg-secondary px-2 py-0.5">Fan Courier</span>
            <span className="rounded bg-secondary px-2 py-0.5">Cargus</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">PLATĂ SECURIZATĂ:</span>
            <span className="rounded bg-secondary px-2 py-0.5">VISA</span>
            <span className="rounded bg-secondary px-2 py-0.5">MASTERCARD</span>
            <span className="rounded bg-secondary px-2 py-0.5">PAYPAL</span>
            <span className="rounded bg-secondary px-2 py-0.5">RAMBURS</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-secondary py-3 text-center text-xs text-muted-foreground">
        © 2026 LUMINI.RO - Toate drepturile rezervate | CUI: RO12345678
      </div>
    </footer>
  );
}
