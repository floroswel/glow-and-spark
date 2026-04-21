import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import { CartProvider } from "@/hooks/useCart";

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

function RootComponent() {
  return (
    <SiteSettingsProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </SiteSettingsProvider>
  );
}
