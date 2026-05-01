import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock useSiteSettings to return controlled values
const mockUseSiteSettings = vi.fn();

vi.mock("@/hooks/useSiteSettings", () => ({
  useSiteSettings: () => mockUseSiteSettings(),
  useRefreshSiteSettings: () => vi.fn(),
}));

vi.mock("@/hooks/useCart", () => ({
  useCart: () => ({ cartCount: 0, items: [], addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn(), cartTotal: 0 }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

const mockChain = () => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    single: () => chain,
    then: (cb: any) => { cb({ data: [], error: null }); return chain; },
    data: [],
    error: null,
  };
  return chain;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => mockChain(),
    rpc: () => Promise.resolve({ data: [], error: null }),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));

const { SiteHeader } = await import("@/components/SiteHeader");

describe("SiteHeader branding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Mama Lucica' text when no logo_url is set", () => {
    mockUseSiteSettings.mockReturnValue({
      header: {},
      general: { site_name: "Mama Lucica" },
    });

    render(<SiteHeader />);
    const matches = screen.getAllByText("Mama Lucica");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Mama Lucica' as fallback when general settings are empty", () => {
    mockUseSiteSettings.mockReturnValue({
      header: {},
      general: {},
    });

    render(<SiteHeader />);
    const matches = screen.getAllByText("Mama Lucica");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("shows logo image when logo_url is set", () => {
    mockUseSiteSettings.mockReturnValue({
      header: {},
      general: { logo_url: "https://example.com/logo.png", site_name: "Mama Lucica" },
    });

    render(<SiteHeader />);
    const imgs = screen.getAllByAltText("Mama Lucica");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    expect(imgs[0]).toHaveAttribute("src", "https://example.com/logo.png");
  });

  it("uses custom logo_alt when provided", () => {
    mockUseSiteSettings.mockReturnValue({
      header: {},
      general: { logo_url: "https://example.com/logo.png", logo_alt: "Logo Custom", site_name: "Mama Lucica" },
    });

    render(<SiteHeader />);
    const imgs = screen.getAllByAltText("Logo Custom");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });
});
