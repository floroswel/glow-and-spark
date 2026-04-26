const ESCAPE_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function sanitizeText(input: string): string {
  if (!input) return "";
  return input.replace(/[<>"']/g, (c) => ESCAPE_MAP[c] || c);
}

export function sanitizePhone(input: string): string {
  if (!input) return "";
  return input.replace(/[^0-9+\-() ]/g, "");
}

export function sanitizeEmail(input: string): string {
  if (!input) return "";
  return input.toLowerCase().trim().slice(0, 254);
}
