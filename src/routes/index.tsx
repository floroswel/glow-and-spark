import { createFileRoute } from "@tanstack/react-router";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteAlert } from "@/components/SiteAlert";
import { HeroSection } from "@/components/HeroSection";
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
      { title: "Lumini.ro - Lumânări Artizanale Premium din Ceară de Soia" },
      { name: "description", content: "Magazin online de lumânări artizanale premium din ceară de soia pură. Diffuzoare, seturi cadou și lumânări turnate manual cu esențe rare." },
      { property: "og:title", content: "Lumini.ro - Lumânări Artizanale Premium" },
      { property: "og:description", content: "Lumânări artizanale din ceară de soia pură, turnate manual cu esențe sintetice rare." },
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
