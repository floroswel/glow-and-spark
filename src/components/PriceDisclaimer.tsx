/**
 * PriceDisclaimer — renders the admin-editable price disclaimer.
 * Use in footer, cart summary, checkout, and invoice templates.
 * [CONTABIL] — text must be reviewed by accountant.
 */
import { useFiscalInfo } from "@/hooks/useFiscalInfo";

export function PriceDisclaimer({ className = "" }: { className?: string }) {
  const { priceDisclaimer } = useFiscalInfo();
  if (!priceDisclaimer) return null;
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      {priceDisclaimer}
    </p>
  );
}
