/**
 * Lightweight HTML sanitizer for admin-authored rich content
 * (e.g. footer column HTML blocks).
 *
 * Strategy: allow-list of tags + attributes. Strips:
 *  - <script>, <style>, <iframe>, <object>, <embed>, <link>, <meta>
 *  - on* event handlers
 *  - javascript:/data:/vbscript: URLs in href/src
 *
 * Not a replacement for DOMPurify, but safe enough for trusted-admin
 * content that still needs defence-in-depth.
 */

const ALLOWED_TAGS = new Set([
  "a", "p", "br", "strong", "em", "b", "i", "u", "s",
  "ul", "ol", "li", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6",
  "img", "blockquote", "code", "pre", "hr", "small",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  "*": new Set(["class", "style", "id"]),
};

const URL_ATTRS = new Set(["href", "src"]);

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:text/html")
  ) {
    return false;
  }
  return true;
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // SSR fallback: strip all tags + on* handlers conservatively
    return input
      .replace(/<\s*(script|style|iframe|object|embed|link|meta)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
      .replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*>/gi, "")
      .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
      .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  }

  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const walk = (node: Element) => {
    const children = Array.from(node.children);
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // unwrap unknown tags: keep text but drop element
        const text = doc.createTextNode(child.textContent || "");
        child.replaceWith(text);
        continue;
      }
      // Filter attributes
      const allowedForTag = ALLOWED_ATTRS[tag] || new Set<string>();
      const allowedGlobal = ALLOWED_ATTRS["*"];
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          child.removeAttribute(attr.name);
          continue;
        }
        const allowed = allowedForTag.has(name) || allowedGlobal.has(name);
        if (!allowed) {
          child.removeAttribute(attr.name);
          continue;
        }
        if (URL_ATTRS.has(name) && !isSafeUrl(attr.value)) {
          child.removeAttribute(attr.name);
          continue;
        }
      }
      // Force safe rel on external links
      if (tag === "a" && child.getAttribute("target") === "_blank") {
        child.setAttribute("rel", "noopener noreferrer");
      }
      walk(child);
    }
  };

  walk(root);
  return root.innerHTML;
}
