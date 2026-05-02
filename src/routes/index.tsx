import { createFileRoute } from "@tanstack/react-router";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteAlert } from "@/components/SiteAlert";
import { HeroSection } from "@/components/HeroSection";
import { TrustStrip } from "@/components/TrustStrip";
import { ProductGrid } from "@/components/ProductGrid";
import { CollectionBanners } from "@/components/CollectionBanners";
import { StorySection } from "@/components/StorySection";
import { HomepageWhyUs } from "@/components/HomepageWhyUs";
import { HowToBuy } from "@/components/HowToBuy";
import { SiteFooter } from "@/components/SiteFooter";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SocialProofToast } from "@/components/SocialProofToast";
import { CookieConsent } from "@/components/CookieConsent";
import { BackToTop } from "@/components/BackToTop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mama Lucica — Magazin Online Universal" },
      { name: "description", content: "Mama Lucica — magazin online universal cu produse atent selecționate pentru casă, familie și cadouri. Livrare rapidă în toată România." },
      { property: "og:title", content: "Mama Lucica — Magazin Online Universal" },
      { property: "og:description", content: "Descoperă o gamă variată de produse pentru casă, familie și cadouri pe Mama Lucica. Calitate, prețuri corecte și livrare rapidă în toată România." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <SiteAlert />
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />
      <TrustStrip />
      <HeroSection />
      <ProductGrid />
      <CollectionBanners />
      <HomepageWhyUs />
      <StorySection />
      <HowToBuy />
      <SiteFooter />
      <NewsletterPopup />
      <WhatsAppButton />
      <SocialProofToast />
      <CookieConsent />
      <BackToTop />
    </div>
  );
}
