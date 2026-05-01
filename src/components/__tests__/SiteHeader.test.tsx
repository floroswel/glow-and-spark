import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock useSiteSettings to return controlled values
const mockUseSiteSettings = vi.fn();
const mockUseRefreshSiteSettings = vi.fn(() => vi.fn());

vi.mock("@/hooks/useSiteSettings", () => ({
  useSiteSettings: () => mockUseSiteSettings(),
  useRefreshSiteSettings: () => mockUseRefreshSiteSettings(),
}));

// Mock dependencies used by SiteHeader
vi.mock("@/hooks/useCart", () => ({
  useCart: () => ({ cartCount: 0, items: [], addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn(), cartTotal: 0 }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }), order: () => ({ data: [], error: null }), data: [], error: null }) }),
    rpc: () => ({ data: [], error: null }),
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

// Dynamically import after mocks
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
    expect(screen.getByText("Mama Lucica")).toBeInTheDocument();
  });

  it("shows 'Mama Lucica' as fallback when general settings are empty", () => {
    mockUseSiteSettings.mockReturnValue({
      header: {},
      general: {},
    });

    render(<SiteHeader />);
    expect(screen.getByText("Mama Lucica")).toBeInTheDocument();
  });

  it("shows logo image when logo_url is set", () => {
    mockUseSiteSettings.mockReturnValue({
      header: {},
      general: { logo_url: "https://example.com/logo.png", site_name: "Mama Lucica" },
    });

    render(<SiteHeader />);
    const img = screen.getByAltText("Mama Lucica");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
  });

  it("uses custom logo_alt when provided", () => {
    mockUseSiteSettings.mockReturnValue({
      header: {},
      general: { logo_url: "https://example.com/logo.png", logo_alt: "Logo Custom", site_name: "Mama Lucica" },
    });

    render(<SiteHeader />);
    expect(screen.getByAltText("Logo Custom")).toBeInTheDocument();
  });
});
