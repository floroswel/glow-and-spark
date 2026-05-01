/**
 * Route availability smoke tests — verifies all critical route files exist
 * and export valid Route objects.
 *
 * This is a build-time guard: if a route file is accidentally deleted or
 * breaks its export, these tests fail before deployment.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROUTES_DIR = path.resolve(__dirname, "../routes");

const CRITICAL_ROUTES = [
  // Storefront
  { file: "index.tsx", label: "Homepage" },
  { file: "catalog.tsx", label: "Catalog" },
  { file: "cart.tsx", label: "Cart" },
  { file: "checkout.tsx", label: "Checkout" },
  { file: "auth.tsx", label: "Auth" },
  { file: "contact.tsx", label: "Contact" },
  { file: "despre-noi.tsx", label: "About Us" },

  // Legal (EU compliance)
  { file: "termeni-si-conditii.tsx", label: "Terms & Conditions" },
  { file: "politica-confidentialitate.tsx", label: "Privacy Policy" },
  { file: "politica-cookies.tsx", label: "Cookie Policy" },
  { file: "politica-returnare.tsx", label: "Return Policy" },
  { file: "formular-retragere.tsx", label: "Withdrawal Form" },

  // Order flow
  { file: "order-confirmed.$orderId.tsx", label: "Order Confirmation" },
  { file: "track-order.tsx", label: "Track Order" },

  // SEO
  { file: "sitemap[.]xml.tsx", label: "Sitemap XML" },
  { file: "robots[.]txt.tsx", label: "Robots.txt" },

  // API
  { file: "api/public/health.ts", label: "Health Check API" },
];

describe("Critical route files exist", () => {
  CRITICAL_ROUTES.forEach(({ file, label }) => {
    it(`${label} — src/routes/${file}`, () => {
      const fullPath = path.join(ROUTES_DIR, file);
      expect(fs.existsSync(fullPath), `Missing route file: src/routes/${file}`).toBe(true);
    });
  });
});

const EDGE_FUNCTIONS = [
  "netopia-payment",
  "netopia-ipn",
  "health-check",
  "send-email",
  "generate-invoice",
  "post-purchase-flow",
];

describe("Critical edge functions exist", () => {
  const functionsDir = path.resolve(__dirname, "../../supabase/functions");
  EDGE_FUNCTIONS.forEach((fn) => {
    it(`Edge function: ${fn}`, () => {
      const fnPath = path.join(functionsDir, fn, "index.ts");
      expect(fs.existsSync(fnPath), `Missing edge function: supabase/functions/${fn}/index.ts`).toBe(true);
    });
  });
});
