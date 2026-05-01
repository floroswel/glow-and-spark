import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  general: Record<string, any>;
  theme: Record<string, any>;
  header: Record<string, any>;
  ticker: Record<string, any>;
  homepage: Record<string, any>;
  footer: Record<string, any>;
  popup: Record<string, any>;
  social_proof: Record<string, any>;
  seo_global: Record<string, any>;
  trust_badges: Record<string, any>;
  redirects: any[];
  email_templates: any[];
  automations: any[];
}

const RefreshContext = createContext<() => void>(() => {});
const defaultSettings: SiteSettings = {
  general: {},
  theme: {},
  header: {},
  ticker: {},
  homepage: {},
  footer: {},
  popup: {},
  social_proof: {},
  seo_global: {},
  trust_badges: {},
  redirects: [],
  email_templates: [],
  automations: [],
};

const CACHE_KEY = "site_settings_cache";
const CACHE_VERSION_KEY = "site_settings_cache_v";
const CACHE_VERSION = "2";

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: defaultSettings,
  refreshSettings: () => {},
});

// Load Google Fonts dynamically
function loadGoogleFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

function applyThemeVariables(theme: Record<string, any>) {
  const root = document.documentElement;

  const colorMap: Record<string, string> = {
    primary_color: "--primary",
    accent_color: "--accent",
    background_color: "--background",
    foreground_color: "--foreground",
    card_color: "--card",
    secondary_color: "--secondary",
    muted_color: "--muted",
    destructive_color: "--destructive",
    border_color: "--border",
  };

  for (const [key, cssVar] of Object.entries(colorMap)) {
    if (theme[key]) {
      const oklch = hexToOklch(theme[key]);
      root.style.setProperty(cssVar, oklch);
    }
  }

  // Derived foreground tokens
  if (theme.foreground_color) {
    const fg = hexToOklch(theme.foreground_color);
    root.style.setProperty("--card-foreground", fg);
    root.style.setProperty("--popover-foreground", fg);
  }
  if (theme.card_color) {
    root.style.setProperty("--popover", hexToOklch(theme.card_color));
  }
  if (theme.background_color) {
    const bgOklch = hexToOklch(theme.background_color);
    root.style.setProperty("--sidebar", bgOklch);
  }
  if (theme.primary_color) {
    // primary-foreground = light color for contrast
    root.style.setProperty("--primary-foreground", "oklch(0.98 0.005 80)");
  }
  if (theme.secondary_color) {
    root.style.setProperty("--secondary-foreground", theme.foreground_color ? hexToOklch(theme.foreground_color) : "oklch(0.30 0.03 50)");
  }
  if (theme.muted_color) {
    // muted-foreground = mid-tone
    root.style.setProperty("--muted-foreground", "oklch(0.50 0.02 50)");
  }
  if (theme.accent_color) {
    root.style.setProperty("--accent-foreground", theme.foreground_color ? hexToOklch(theme.foreground_color) : "oklch(0.20 0.02 50)");
    root.style.setProperty("--ring", hexToOklch(theme.accent_color));
    root.style.setProperty("--warm-gold", hexToOklch(theme.accent_color));
    root.style.setProperty("--chart-1", hexToOklch(theme.accent_color));
  }
  if (theme.destructive_color) {
    root.style.setProperty("--destructive-foreground", "oklch(0.98 0.005 80)");
    root.style.setProperty("--sale", hexToOklch(theme.destructive_color));
  }
  if (theme.border_color) {
    root.style.setProperty("--input", hexToOklch(theme.border_color));
    root.style.setProperty("--sidebar-border", hexToOklch(theme.border_color));
  }

  // Typography
  if (theme.heading_font) {
    loadGoogleFont(theme.heading_font);
    root.style.setProperty("--font-heading", `'${theme.heading_font}', serif`);
  }
  if (theme.body_font) {
    loadGoogleFont(theme.body_font);
    root.style.setProperty("--font-body", `'${theme.body_font}', sans-serif`);
  }

  // Border radius
  if (theme.border_radius) {
    root.style.setProperty("--radius", `${theme.border_radius}rem`);
  }

  // Button style → maps to a CSS var consumed via Tailwind arbitrary values / button variants
  // Values: "rounded" (default), "pill", "square"
  if (theme.button_style) {
    const map: Record<string, string> = {
      pill: "9999px",
      square: "0px",
      rounded: "var(--radius)",
    };
    root.style.setProperty("--button-radius", map[theme.button_style] || "var(--radius)");
  }

  // Product card shadow → CSS var consumed by ProductCard
  // Values: "none" | "sm" | "md" | "lg"
  if (theme.product_card_shadow) {
    const map: Record<string, string> = {
      none: "none",
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    };
    root.style.setProperty("--product-card-shadow", map[theme.product_card_shadow] || map.sm);
  }
}

function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
  const l_ = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m_ = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s_ = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
  const l3 = Math.cbrt(l_), m3 = Math.cbrt(m_), s3 = Math.cbrt(s_);
  const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
  const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
  const bOk = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;
  const C = Math.sqrt(a * a + bOk * bOk);
  let H = Math.atan2(bOk, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  // Always start with defaults to avoid hydration mismatch (no localStorage on server)
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    // Load from cache first for instant display
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setSettings(parsed);
        if (parsed.theme && Object.keys(parsed.theme).length) {
          applyThemeVariables(parsed.theme);
        }
      }
    } catch {}

    // Then fetch fresh from DB
    supabase
      .from("site_settings")
      .select("key, value")
      .then(({ data }) => {
        if (data && mounted.current) {
          const s = { ...defaultSettings };
          data.forEach((row) => {
            if (row.key in s) {
              (s as any)[row.key] = row.value;
            }
          });
          setSettings(s);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
          if (s.theme && Object.keys(s.theme).length) applyThemeVariables(s.theme);
        }
      });

    const channel = supabase
      .channel("site_settings_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        (payload) => {
          const row = payload.new as any;
          if (row?.key) {
            setSettings((prev) => {
              const next = { ...prev, [row.key]: row.value };
              try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
              if (row.key === "theme") applyThemeVariables(row.value);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}