import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";

const CANONICAL_HOST = "mamalucica.ro";
const PREVIEW_HOST_PATTERNS = [
  /^localhost(:\d+)?$/,
  /^127\.0\.0\.1(:\d+)?$/,
  /^id-preview--[a-z0-9-]+\.lovable\.app$/,
  /^project--[a-z0-9-]+(-dev)?\.lovable\.app$/,
  /\.lovable\.app$/,
];

/**
 * Server-side canonical host check.
 * Returns redirect URL if www or non-canonical host, null otherwise.
 */
export const checkCanonicalHost = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const url = getRequestUrl();
      const parsed = new URL(url);
      const host = parsed.hostname;

      // Already canonical
      if (host === CANONICAL_HOST) return null;

      // Preview/dev environments — don't redirect
      if (PREVIEW_HOST_PATTERNS.some((re) => re.test(host))) return null;

      // www or any other host → 301 to canonical
      return `https://${CANONICAL_HOST}${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  });
