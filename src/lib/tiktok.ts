declare global {
  interface Window {
    ttq: any;
    TiktokAnalyticsObject: string;
  }
}

/**
 * Initialize TikTok Pixel.
 * Loaded ONLY after marketing consent + admin configures a Pixel ID.
 */
export function initTikTokPixel(pixelId?: string) {
  const id = pixelId;
  if (!id || typeof document === "undefined") return;
  if (window.ttq) return;

  const ttq: any = (window.ttq = window.ttq || []);
  ttq.methods = [
    "page", "track", "identify", "instances", "debug", "on", "off",
    "once", "ready", "alias", "group", "enableCookie", "disableCookie",
  ];
  ttq.setAndDefer = function (t: any, e: string) {
    t[e] = function (...args: any[]) {
      t.push([e, ...args]);
    };
  };
  for (const method of ttq.methods) {
    ttq.setAndDefer(ttq, method);
  }

  ttq.instance = function (id: string) {
    const inst = ttq._i[id] || [];
    for (const method of ttq.methods) {
      ttq.setAndDefer(inst, method);
    }
    return inst;
  };

  ttq.load = function (pixelCode: string) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${pixelCode}&lib=ttq`;
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(script, first);
  };

  ttq._i = ttq._i || {};
  ttq._i[id] = [];
  ttq._t = ttq._t || {};
  ttq._t[id] = +new Date();
  ttq._o = ttq._o || {};
  ttq._o[id] = {};

  ttq.load(id);
  ttq.page();
}

export function trackTikTokPageView() {
  if (typeof window === "undefined" || !window.ttq) return;
  window.ttq.page();
}

export function trackTikTokEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || !window.ttq) return;
  window.ttq.track(eventName, params || {});
}
