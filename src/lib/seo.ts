const SITE_NAME = "Glow & Spark — Lumânări Artizanale";

function setOrCreateMeta(attr: string, key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setPageMeta({
  title,
  description,
  image,
  url,
  price,
  type = "website",
}: {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  price?: number;
  type?: string;
}) {
  document.title = `${title} | ${SITE_NAME}`;

  if (description) setOrCreateMeta("name", "description", description);

  // Open Graph
  setOrCreateMeta("property", "og:title", title);
  if (description) setOrCreateMeta("property", "og:description", description);
  setOrCreateMeta("property", "og:type", type);
  if (image) setOrCreateMeta("property", "og:image", image);
  const pageUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  if (pageUrl) setOrCreateMeta("property", "og:url", pageUrl);
  if (price != null) {
    setOrCreateMeta("property", "og:price:amount", String(price));
    setOrCreateMeta("property", "og:price:currency", "RON");
  }

  // Twitter
  setOrCreateMeta("name", "twitter:card", "summary_large_image");
  setOrCreateMeta("name", "twitter:title", title);
  if (description) setOrCreateMeta("name", "twitter:description", description);
  if (image) setOrCreateMeta("name", "twitter:image", image);
}
