/**
 * Smoke & E2E tests for critical flows — Go-Live Gate
 *
 * These tests validate that all critical pages render without crashing,
 * key UI elements are present, and conversion-critical flows work.
 *
 * Run: bunx vitest run src/test/smoke.test.tsx
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock useSiteSettings globally
const mockSettings = {
  general: { site_name: "Mama Lucica", contact_email: "contact@mamalucica.ro", contact_phone: "+40 753 326 405" },
  homepage: { show_hero: true, hero_title: "Ritmul lent al\nmomentelor calme", hero_cta_text: "Descoperă Colecția" },
  footer: {},
  trust_badges: { enabled: true },
};

vi.mock("@/hooks/useSiteSettings", () => ({
  useSiteSettings: () => mockSettings,
  SiteSettingsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/integrations/supabase/client", () => {
  const mockQuery = {
    select: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    in: () => mockQuery,
    is: () => mockQuery,
    gte: () => mockQuery,
    lte: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return {
    supabase: {
      from: () => mockQuery,
      auth: { getSession: () => Promise.resolve({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
      channel: () => ({ on: () => ({ subscribe: () => ({}) }), unsubscribe: () => {} }),
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
    },
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, isAdmin: false }),
}));

vi.mock("@/hooks/useCart", () => ({
  useCart: () => ({ items: [], itemCount: 0, total: 0, addItem: vi.fn(), removeItem: vi.fn(), clearCart: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
  useRouter: () => ({ state: { location: { pathname: "/" } } }),
  createFileRoute: (path: string) => (opts: any) => ({ ...opts, path }),
  Outlet: () => <div data-testid="outlet" />,
  useParams: () => ({}),
}));

// ─── Component imports ─────────────────────────────────────────────────────

import { HeroSection } from "@/components/HeroSection";
import { TrustBadges } from "@/components/TrustBadges";
import { HomepageWhyUs } from "@/components/HomepageWhyUs";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// ─── 1. HOMEPAGE ────────────────────────────────────────────────────────────

describe("Homepage — Hero Section", () => {
  it("renders hero with CTA button", () => {
    render(<HeroSection />);
    expect(screen.getByText("Descoperă Colecția")).toBeInTheDocument();
  });

  it("shows subtitle under hero", () => {
    render(<HeroSection />);
    expect(screen.getByText(/Ceară artizanală/)).toBeInTheDocument();
  });

  it("renders hero title lines", () => {
    render(<HeroSection />);
    expect(screen.getByText("Ritmul lent al")).toBeInTheDocument();
    expect(screen.getByText("momentelor calme")).toBeInTheDocument();
  });
});

// ─── 2. TRUST BADGES ───────────────────────────────────────────────────────

describe("Trust Badges", () => {
  it("renders all 4 trust badges", () => {
    render(<TrustBadges />);
    expect(screen.getByText("Plată securizată SSL")).toBeInTheDocument();
    expect(screen.getByText(/Drept de retragere 14 zile/)).toBeInTheDocument();
    expect(screen.getByText(/Livrare prin curier/)).toBeInTheDocument();
    expect(screen.getByText("Fabricat Artizanal")).toBeInTheDocument();
  });

  it("shows legal-compliant 14-day return (not 30)", () => {
    render(<TrustBadges />);
    expect(screen.getByText(/14 zile/)).toBeInTheDocument();
    expect(screen.queryByText(/30 zile/)).not.toBeInTheDocument();
  });

  it("shows legal-compliant return info", () => {
    render(<TrustBadges />);
    expect(screen.getByText(/Conform legislației în vigoare/)).toBeInTheDocument();
  });
});

// ─── 3. WHY US SECTION ─────────────────────────────────────────────────────

describe("Homepage — Why Us", () => {
  it("renders 4 benefit items", () => {
    render(<HomepageWhyUs />);
    expect(screen.getByText("100% Handmade")).toBeInTheDocument();
    expect(screen.getByText("Ceară Naturală")).toBeInTheDocument();
    expect(screen.getByText("Livrare Rapidă")).toBeInTheDocument();
    expect(screen.getByText(/Garanție și Retur Gratuit/)).toBeInTheDocument();
  });

  it("uses consistent 14-day return claim", () => {
    render(<HomepageWhyUs />);
    expect(screen.getByText(/14 zile/)).toBeInTheDocument();
    expect(screen.queryByText(/30 zile/)).not.toBeInTheDocument();
  });
});

// ─── 4. HEADER ──────────────────────────────────────────────────────────────

describe("Site Header", () => {
  it("renders brand name fallback", () => {
    render(<SiteHeader />);
    const matches = screen.getAllByText("Mama Lucica");
    expect(matches.length).toBeGreaterThan(0);
  });
});

// ─── 5. FOOTER ──────────────────────────────────────────────────────────────

describe("Site Footer", () => {
  it("renders footer with brand and legal entity", () => {
    render(<SiteFooter />);
    // Copyright should contain brand name
    const copyright = screen.getByText(/Mama Lucica/);
    expect(copyright).toBeInTheDocument();
  });

  it("contains ANPC and SOL links", () => {
    render(<SiteFooter />);
    expect(screen.getAllByText(/ANPC/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SOL/).length).toBeGreaterThan(0);
  });

  it("links to legal pages", () => {
    render(<SiteFooter />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href")).filter(Boolean);
    expect(hrefs).toEqual(expect.arrayContaining([
      expect.stringContaining("termeni"),
      expect.stringContaining("confidentialitate"),
      expect.stringContaining("returnare"),
    ]));
  });
});
