/**
 * Visible DRAFT notice for legal pages.
 * Displays a warning that documents are scaffolding, not final legal text.
 */
export function LegalDraftNotice() {
  return (
    <div className="border border-orange-300/40 bg-orange-50/30 dark:bg-orange-950/20 rounded-lg px-4 py-3 text-xs text-orange-800 dark:text-orange-300 mb-6">
      <strong>⚠ DRAFT — PROIECT DE LUCRU</strong>
      <p className="mt-1 leading-relaxed">
        Acest document este un draft tehnic și <strong>nu constituie consiliere juridică</strong>.
        Textul final trebuie revizuit și aprobat de un avocat specializat în dreptul consumatorilor / GDPR
        înainte de publicare definitivă.
      </p>
    </div>
  );
}
