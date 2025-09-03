export type AnalyticEvent = {
  name: string;
  params?: Record<string, string | number | boolean>;
};

export function track(ev: AnalyticEvent) {
  // GA4 example: if (window.gtag) window.gtag('event', ev.name, ev.params);
  // Fallback: console so you see it while wiring
  if (typeof window !== 'undefined') console.log('[track]', ev.name, ev.params || {});
}