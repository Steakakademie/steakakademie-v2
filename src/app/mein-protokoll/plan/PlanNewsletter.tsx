import NewsletterSignup from '@/components/ui/NewsletterSignup';

/**
 * Newsletter-Anmeldung im Plan — nutzt die zentrale NewsletterSignup-Komponente
 * (DSGVO-Consent, Honeypot, Double-Opt-In-Erfolgszustand). Segmentierung über
 * source="mein-protokoll-plan".
 *
 * Bis 02.10.2026 stand hier „Wochenstart-Erinnerung — jeden Montag eine kurze
 * Erinnerung mit dem Wochenthema". Diese Erinnerung gibt es nicht: In Loops ist
 * kein Workflow dafür angelegt, die Anmeldung landet im allgemeinen Verteiler.
 * Versprochen wird deshalb nur, was die Anmeldung tatsächlich auslöst. Wer die
 * Montags-Erinnerung baut, stellt den Text hier wieder um — nicht vorher.
 */
export default function PlanNewsletter() {
  return (
    <NewsletterSignup
      source="mein-protokoll-plan"
      eyebrow="Newsletter"
      headline="Mehr Grillwissen per E-Mail."
      subline="Der Newsletter der Steakakademie: Cuts, Techniken, Temperaturen — präzise, ehrlich, jederzeit abbestellbar."
      cta="Anmelden"
      className="print:hidden my-8"
    />
  );
}
