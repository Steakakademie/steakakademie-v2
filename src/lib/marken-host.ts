/**
 * Eigene Marke unter eigener Domain (Entscheidung Uwe, 23.09.2026):
 * tuwasduwillst.de laeuft in DIESER App, zeigt aber nur das Eigenregie-Angebot —
 * ohne Steakakademie-Widgets (Marco-Chat, Exit-Intent, Consent-Banner).
 * Die Weiche fuer Seitenaufrufe steht in next.config.mjs (rewrites/redirects).
 */
export const TUWAS_HOSTS = ['tuwasduwillst.de', 'www.tuwasduwillst.de'] as const;

/** Nur im Browser aussagekraeftig; auf dem Server immer false. */
export function istTuwasHost(): boolean {
  return typeof window !== 'undefined' && (TUWAS_HOSTS as readonly string[]).includes(window.location.hostname);
}
