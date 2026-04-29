import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouter, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { setCanonical } from "@/lib/seo";
import { isAllowedRedirect } from "@/lib/allowed-hosts";
import { SiteSettingsProvider, useSiteSettings } from "@/hooks/useSiteSettings";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { CompareProvider } from "@/hooks/useCompare";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { initGTM } from "@/lib/gtm";
import { initPixel, trackPageView } from "@/lib/fbpixel";
import { updateSiteName } from "@/lib/seo";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getConsent } from "@/components/CookieConsent";
import { NotFound } from "@/components/NotFound";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mama Lucica — Lumânări Artizanale Premium din Ceară de Soia" },
      { name: "description", content: "Mama Lucica — lumânări artizanale premium din ceară de soia 100% naturală. Parfumuri elegante, livrare în toată România." },
      { name: "author", content: "Mama Lucica" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Mama Lucica" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Mama Lucica — Lumânări Artizanale Premium" },
      { name: "twitter:title", content: "Mama Lucica — Lumânări Artizanale Premium" },
      { property: "og:description", content: "Lumânări artizanale premium din ceară de soia 100% naturală, turnate manual cu dragoste în România." },
      { name: "twitter:description", content: "Lumânări artizanale premium din ceară de soia 100% naturală, turnate manual cu dragoste în România." },
      { property: "og:image", content: "https://mamalucica.ro/og-image.jpg" },
      { name: "twitter:image", content: "https://mamalucica.ro/og-image.jpg" },
      { name: "theme-color", content: "#C9A24A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Mama Lucica" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=20260429" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function upsertMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function TrackingInit() {
  const router = useRouter();
  const { general, seo_global } = useSiteSettings();
  const gtmInitialized = useRef(false);
  const pixelInitialized = useRef(false);

  useEffect(() => {
    if (general?.site_name) updateSiteName(general.site_name);

    const applyConsent = () => {
      const consent = getConsent();
      const gtmId = import.meta.env.VITE_GTM_ID || general?.google_analytics_id;
      const pixelId = import.meta.env.VITE_FB_PIXEL_ID || general?.facebook_pixel_id;

      if (consent?.analytics && gtmId && !gtmInitialized.current) {
        initGTM(gtmId);
        gtmInitialized.current = true;
      }
      if (consent?.marketing && pixelId && !pixelInitialized.current) {
        initPixel(pixelId);
        pixelInitialized.current = true;
      }
    };

    applyConsent();

    const onChange = () => applyConsent();
    window.addEventListener("cookie-consent-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("cookie-consent-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [general]);

  // SEO: verification meta tags & Organization JSON-LD
  useEffect(() => {
    if (seo_global?.google_verification) {
      upsertMeta("google-site-verification", seo_global.google_verification);
    }
    if (seo_global?.bing_verification) {
      upsertMeta("msvalidate.01", seo_global.bing_verification);
    }
    if (seo_global?.pinterest_verification) {
      upsertMeta("p:domain_verify", seo_global.pinterest_verification);
    }

    // Organization JSON-LD
    const scriptId = "__org_jsonld";
    const oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();

    if (seo_global?.schema_org_name) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: seo_global.schema_org_name,
        ...(seo_global.schema_org_phone && { telephone: seo_global.schema_org_phone }),
        ...(seo_global.schema_org_email && { email: seo_global.schema_org_email }),
        ...(seo_global.schema_org_address && {
          address: {
            "@type": "PostalAddress",
            addressCountry: "RO",
            streetAddress: seo_global.schema_org_address,
          },
        }),
        ...(seo_global.schema_org_logo && { logo: seo_global.schema_org_logo }),
      });
      document.head.appendChild(script);
    }

    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
    };
  }, [seo_global]);

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => {
      trackPageView();
    });
    return unsub;
  }, [router]);

  return null;
}

function RedirectHandler() {
  const router = useRouter();
  const location = useLocation();
  const { redirects } = useSiteSettings();

  useEffect(() => {
    if (!redirects || !redirects.length) return;
    const match = redirects.find(
      (r: any) => r.active && r.from === location.pathname
    );
    if (!match) return;
    if (match.to.startsWith("http")) {
      if (isAllowedRedirect(match.to)) {
        window.location.href = match.to;
      } else {
        router.navigate({ to: "/", replace: true });
      }
    } else {
      router.navigate({ to: match.to, replace: true });
    }
  }, [location.pathname, redirects]);

  return null;
}

const CANONICAL_HOST = "mamalucica.ro";
// Hosts that should NOT be redirected (dev / preview environments).
const PREVIEW_HOST_PATTERNS = [
  /^localhost$/,
  /^127\.0\.0\.1$/,
  /^id-preview--[a-z0-9-]+\.lovable\.app$/,
  /^project--[a-z0-9-]+(-dev)?\.lovable\.app$/,
];

function CanonicalDomainRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (host === CANONICAL_HOST || host === `www.${CANONICAL_HOST}`) return;
    if (PREVIEW_HOST_PATTERNS.some((re) => re.test(host))) return;
    // Redirect any other host (e.g. glow-and-spark.lovable.app) to canonical.
    const target = `https://${CANONICAL_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, []);
  return null;
}

function CanonicalUrlSync() {
  const location = useLocation();
  const searchStr =
    typeof window !== "undefined" ? window.location.search : "";
  useEffect(() => {
    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const url = `https://${CANONICAL_HOST}${location.pathname}${search}`;
    setCanonical(url);
    let og = document.querySelector('meta[property="og:url"]');
    if (!og) {
      og = document.createElement("meta");
      og.setAttribute("property", "og:url");
      document.head.appendChild(og);
    }
    og.setAttribute("content", url);
  }, [location.pathname, searchStr]);
  return null;
}

function RootComponent() {
  return (
    <ErrorBoundary variant="app">
      <SiteSettingsProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <CompareProvider>
                <CanonicalDomainRedirect />
                <CanonicalUrlSync />
                <TrackingInit />
                <RedirectHandler />
                <div className="pb-14 md:pb-0">
                  <Outlet />
                </div>
                <MobileBottomNav />
                <ExitIntentPopup />
                <InstallAppBanner />
              </CompareProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </ErrorBoundary>
  );
}
