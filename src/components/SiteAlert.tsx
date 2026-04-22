import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { X, AlertTriangle, Info, CheckCircle } from "lucide-react";

export function SiteAlert() {
  const { general } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div suppressHydrationWarning />;

  const alertEnabled = general?.site_alert_enabled;
  const alertText = general?.site_alert_text;
  const alertType = general?.site_alert_type || "info"; // info, warning, success
  const alertDismissible = general?.site_alert_dismissible !== false;

  if (!alertEnabled || !alertText || dismissed) return null;

  // Check session storage
  if (typeof window !== "undefined") {
    const key = `site_alert_dismissed_${btoa(alertText).slice(0, 16)}`;
    if (sessionStorage.getItem(key)) return null;
  }

  const colors: Record<string, { bg: string; text: string; border: string }> = {
    info: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
    warning: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
    success: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
    error: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  };

  const c = colors[alertType] || colors.info;
  const icons: Record<string, typeof Info> = { info: Info, warning: AlertTriangle, success: CheckCircle, error: AlertTriangle };
  const Icon = icons[alertType] || Info;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      const key = `site_alert_dismissed_${btoa(alertText).slice(0, 16)}`;
      sessionStorage.setItem(key, "1");
    }
  };

  return (
    <div style={{ background: c.bg, color: c.text, borderBottom: `1px solid ${c.border}` }}>
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="font-medium">{alertText}</span>
        {alertDismissible && (
          <button onClick={handleDismiss} className="ml-2 opacity-60 hover:opacity-100 transition">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
