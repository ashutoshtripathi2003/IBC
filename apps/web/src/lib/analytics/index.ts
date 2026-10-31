/**
 * Vendor-neutral analytics. Components call `track()` with typed events; providers
 * (a console logger in development, a future vendor adapter in production) decide
 * where events go. No vendor SDK is referenced anywhere else in the codebase.
 */
export type AnalyticsEvent =
  | { name: 'page_view'; path: string }
  | { name: 'cta_click'; cta: string; location: string }
  | { name: 'join_click'; location: string }
  | { name: 'login_click'; location: string }
  | { name: 'nav_click'; item: string; surface: 'desktop' | 'mobile' | 'footer' }
  | { name: 'section_view'; section: string }
  | { name: 'pillar_explore'; pillar: string }
  | { name: 'network_interaction'; kind: string }
  | { name: 'signup_start'; location: string };

export interface AnalyticsProvider {
  readonly name: string;
  track(event: AnalyticsEvent): void;
}

const providers: AnalyticsProvider[] = [];

export function registerAnalyticsProvider(provider: AnalyticsProvider): () => void {
  if (!providers.some((p) => p.name === provider.name)) providers.push(provider);
  return () => {
    const index = providers.findIndex((p) => p.name === provider.name);
    if (index >= 0) providers.splice(index, 1);
  };
}

export function track(event: AnalyticsEvent): void {
  for (const provider of providers) {
    try {
      provider.track(event);
    } catch {
      // Analytics must never break the page.
    }
  }
}

/** Emits a DOM event so tests and tag managers can observe analytics without coupling. */
export const domEventProvider: AnalyticsProvider = {
  name: 'dom-event',
  track: (event) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ibc:analytics', { detail: event }));
    }
  },
};

export const consoleProvider: AnalyticsProvider = {
  name: 'console',
  track: (event) => {
    // Development-only provider (registered when NODE_ENV is development).
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event);
  },
};
