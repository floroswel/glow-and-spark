import { useSiteSettings } from "@/hooks/useSiteSettings";

interface ProductJsonLdProps {
  product: {
    name: string;
    slug: string;
    price: number;
    old_price?: number | null;
    description?: string | null;
    short_description?: string | null;
    image_url?: string | null;
    images?: string[] | null;
    sku?: string | null;
    brand?: string | null;
    stock?: number;
    rating?: number;
    reviews_count?: number;
  };
  category?: { name: string; slug: string } | null;
}

export function ProductJsonLd({ product, category }: ProductJsonLdProps) {
  const { general } = useSiteSettings();
  const siteUrl = general?.site_url || "https://mamalucica.ro";
  const storeName = general?.store_name || "Mama Lucica";

  const images = [
    product.image_url,
    ...(product.images || []),
  ].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.description || product.name,
    image: images.length > 0 ? images : undefined,
    sku: product.sku || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : { "@type": "Brand", name: storeName },
    url: `${siteUrl}/produs/${product.slug}`,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produs/${product.slug}`,
      priceCurrency: "RON",
      price: product.price,
      availability: (product.stock ?? 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: storeName,
      },
    },
    ...(product.rating && product.reviews_count && product.reviews_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews_count,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: siteUrl },
      ...(category
        ? [{ "@type": "ListItem", position: 2, name: category.name, item: `${siteUrl}/categorie/${category.slug}` }]
        : []),
      { "@type": "ListItem", position: category ? 3 : 2, name: product.name },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}

export function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Mama Lucica",
          legalName: "SC Vomix Genius SRL",
          url: "https://mamalucica.ro",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+40753326405",
            email: "contact@mamalucica.ro",
            contactType: "customer service",
            availableLanguage: "Romanian",
          },
          address: {
            "@type": "PostalAddress",
            streetAddress: "Strada Constructorilor Nr 39, sat Voievoda",
            addressLocality: "Furculești",
            addressRegion: "Teleorman",
            postalCode: "147148",
            addressCountry: "RO",
          },
        }),
      }}
    />
  );
}

interface FaqItem {
  q: string;
  a: string;
}

export function FAQPageJsonLd({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function LocalBusinessJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Mama Lucica",
          legalName: "SC Vomix Genius SRL",
          url: "https://mamalucica.ro",
          telephone: "+40753326405",
          email: "contact@mamalucica.ro",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Strada Constructorilor Nr 39, sat Voievoda",
            addressLocality: "Furculești",
            addressRegion: "Teleorman",
            postalCode: "147148",
            addressCountry: "RO",
          },
          openingHours: "Mo-Fr 09:00-17:00",
          priceRange: "$$",
        }),
      }}
    />
  );
}
