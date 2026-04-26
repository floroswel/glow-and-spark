import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouter, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteSettingsProvider, useSiteSettings } from "@/hooks/useSiteSettings";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { CompareProvider } from "@/hooks/useCompare";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { initGTM } from "@/lib/gtm";
import { initPixel, trackPageView } from "@/lib/fbpixel";
import { updateSiteName } from "@/lib/seo";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lumini.ro - Lumânări Artizanale Premium" },
      { name: "description", content: "Magazin online de lumânări artizanale premium din ceară de soia pură." },
      { name: "author", content: "Lumini.ro" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Lumini.ro - Lumânări Artizanale Premium" },
      { name: "twitter:title", content: "Lumini.ro - Lumânări Artizanale Premium" },
      { property: "og:description", content: "Magazin online de lumânări artizanale premium din ceară de soia pură." },
      { name: "twitter:description", content: "Magazin online de lumânări artizanale premium din ceară de soia pură." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/848fc03d-3dcb-4f52-825d-f0d1bb6c1ec8/id-preview-3bff9c21--b382c71c-cfbb-4967-add4-5e8c15bf4fcd.lovable.app-1776749135330.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/848fc03d-3dcb-4f52-825d-f0d1bb6c1ec8/id-preview-3bff9c21--b382c71c-cfbb-4967-add4-5e8c15bf4fcd.lovable.app-1776749135330.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
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
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    if (general?.site_name) updateSiteName(general.site_name);

    const gtmId = import.meta.env.VITE_GTM_ID || general?.google_analytics_id;
    if (gtmId) initGTM(gtmId);

    const pixelId = import.meta.env.VITE_FB_PIXEL_ID || general?.facebook_pixel_id;
    if (pixelId) initPixel(pixelId);

    initialized.current = true;
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
      window.location.href = match.to;
    } else {
      router.navigate({ to: match.to, replace: true });
    }
  }, [location.pathname, redirects]);

  return null;
}

function RootComponent() {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <CompareProvider>
              <TrackingInit />
              <RedirectHandler />
              <div className="pb-14 md:pb-0">
                <Outlet />
              </div>
              <MobileBottomNav />
              <ExitIntentPopup />
            </CompareProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </SiteSettingsProvider>
  );
}
