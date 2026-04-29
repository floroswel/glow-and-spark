// Centralized list of allowed hostnames for safe redirects.
// Used to prevent open-redirect vulnerabilities across the app.
export const ALLOWED_HOSTNAMES: readonly string[] = [
  "mamalucica.ro",
  "www.mamalucica.ro",
];

/**
 * Returns true if the given URL string points to an allowed hostname,
 * a relative path, or the current window origin.
 */
export function isAllowedRedirect(url: string): boolean {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://mamalucica.ro";
    const parsed = new URL(url, base);
    if (!parsed.hostname) return true;
    if (ALLOWED_HOSTNAMES.includes(parsed.hostname)) return true;
    if (typeof window !== "undefined" && parsed.hostname === window.location.hostname) return true;
    return false;
  } catch {
    return false;
  }
}
