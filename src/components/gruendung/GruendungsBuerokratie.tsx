import {
  AlertTriangle, ShieldCheck, FileText, Coins, ListChecks, Scale,
  PiggyBank, MailWarning, ShieldAlert, Check, X,
} from 'lucide-react';
import {
  STATUS_SCHRITTE,
  ANTRAEGE,
  KOSTEN_6_MONATE,
  RECHTSFORMEN,
  ANTI_SCAM_WARNSIGNALE,
  ANTI_SCAM_SCHUTZ,
  BEHOERDEN_BRIEF_WARNUNG,
  RUECKLAGEN_REGEL,
  NACHZAHLUNGS_FALLE,
  BUEROKRATIE_STAND,
  BUEROKRATIE_DISCLAIMER,
  type Pflichtgrad,
} from '@/lib/gruendung-buerokratie';
import ScrollBereich from '@/components/ui/ScrollBereich';

const GOLD = '#C8882A';
const FIRE = '#E85018';

const PFLICHT_LABEL: Record<Pflichtgrad, string> = {
  pflicht: 'Pflicht',
  meist: 'meist Pflicht',
  optional: 'optional',
  situativ: 'situativ',
};

const PFLICHT_COLOR: Record<Pflichtgrad, string> = {
  pflicht: FIRE,
  meist: '#B8860B',
  optional: '#5B7A8C',
  situativ: '#7A6A55',
};

function PflichtBadge({ grad }: { grad: Pflichtgrad }) {
  const c = PFLICHT_COLOR[grad];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{ color: `color-mix(in srgb, ${c} 65%, white)`, background: `${c}1A`, border: `1px solid ${c}40` }}
    >
      {PFLICHT_LABEL[grad]}
    </span>
  );
}

function SectionTitle({
  icon, kicker, title,
}: { icon: React.ReactNode; kicker: string; title: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 shrink-0" style={{ color: GOLD }}>{icon}</span>
      <div>
        <div className="font-sans text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
          {kicker}
        </div>
        <h2 className="font-serif text-2xl text-text-primary sm:text-[1.7rem]">{title}</h2>
      </div>
    </div>
  );
}

/**
 * Gründungs-Bürokratie — die vollständige Orientierungs-Übersicht.
 * Holt Menschen ab, die noch nie mit Gewerbe/Freiberuflichkeit zu tun hatten:
 * Schritte zum Status · was beantragen · Kosten erste 6 Monate · Rechtsformen.
 * Server-Komponente (kein State).
 */
export default function GruendungsBuerokratie() {
  return (
    <div className="space-y-16">
      {/* Haftungsausschluss zuerst */}
      <aside
        className="rounded-r-sm border-l-[3px] py-4 pl-5 pr-5"
        style={{ borderLeftColor: FIRE, background: `${FIRE}0F` }}
      >
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: FIRE }} className="shrink-0" />
          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: FIRE }}>
            Keine Steuer- oder Rechtsberatung
          </span>
        </div>
        <p className="font-body text-[0.95rem] leading-relaxed text-text-secondary">
          {BUEROKRATIE_DISCLAIMER}
        </p>
      </aside>

      {/* 1) Schritte zum Status */}
      <section>
        <SectionTitle
          icon={<ListChecks size={20} />}
          kicker="Schritt für Schritt"
          title="Was muss ich angehen, um selbständig zu werden?"
        />
        <ol className="space-y-3">
          {STATUS_SCHRITTE.map((s) => (
            <li
              key={s.nr}
              className="flex gap-4 rounded-sm border border-border-subtle bg-surface-elevated p-4"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-sans text-sm font-bold"
                style={{ color: GOLD, background: `${GOLD}1A`, border: `1px solid ${GOLD}40` }}
              >
                {s.nr}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-sans text-[0.98rem] font-semibold text-text-primary">{s.titel}</h3>
                  <span className="font-sans text-[10px] uppercase tracking-[0.08em] text-text-muted">
                    {s.wer}
                  </span>
                </div>
                <p className="mt-1 font-body text-[0.92rem] leading-relaxed text-text-secondary">
                  {s.beschreibung}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 2) Was beantragen */}
      <section>
        <SectionTitle
          icon={<FileText size={20} />}
          kicker="Anträge & Behörden"
          title="Was muss beantragt werden?"
        />
        <ScrollBereich className="rounded-sm border border-border-subtle">
          <table className="w-full border-collapse text-left font-body text-[0.9rem]">
            <thead>
              <tr className="bg-surface-elevated text-text-primary">
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Was</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Wo</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Wann</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Status</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Hinweis</th>
              </tr>
            </thead>
            <tbody>
              {ANTRAEGE.map((a) => (
                <tr key={a.was} className="border-t border-border-subtle align-top">
                  <td className="p-3 font-semibold text-text-primary">{a.was}</td>
                  <td className="p-3 text-text-secondary">{a.wo}</td>
                  <td className="p-3 text-text-secondary">{a.wann}</td>
                  <td className="p-3"><PflichtBadge grad={a.pflicht} /></td>
                  <td className="p-3 text-text-muted">{a.hinweis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollBereich>
      </section>

      {/* 3) Kosten 6 Monate */}
      <section>
        <SectionTitle
          icon={<Coins size={20} />}
          kicker="Realistisch rechnen"
          title="Welche Kosten kommen in den ersten 6 Monaten?"
        />
        <p className="mb-4 font-body text-[0.92rem] leading-relaxed text-text-secondary">
          Ab dem Tag der Gewerbeanmeldung — typischer Fall: solo, hauptberuflich, Einzelunternehmen,
          Kleinunternehmer. Der mit Abstand größte Posten ist die Krankenversicherung.
        </p>
        <ScrollBereich className="rounded-sm border border-border-subtle">
          <table className="w-full border-collapse text-left font-body text-[0.9rem]">
            <thead>
              <tr className="bg-surface-elevated text-text-primary">
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Posten</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Art</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Betrag (ca.)</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Status</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Hinweis</th>
              </tr>
            </thead>
            <tbody>
              {KOSTEN_6_MONATE.map((k) => (
                <tr key={k.posten} className="border-t border-border-subtle align-top">
                  <td className="p-3 font-semibold text-text-primary">{k.posten}</td>
                  <td className="p-3 capitalize text-text-secondary">{k.art}</td>
                  <td className="p-3 font-semibold" style={{ color: GOLD }}>{k.betragCa}</td>
                  <td className="p-3"><PflichtBadge grad={k.pflichtgrad} /></td>
                  <td className="p-3 text-text-muted">{k.hinweis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollBereich>
        <p className="mt-3 font-body text-[0.82rem] italic leading-relaxed text-text-muted">
          Faustregel: Die ersten 6 Monate kosten dich abseits der Krankenversicherung wenig —
          der Kapitalbedarf entsteht v. a. durch KV + deine Lebenshaltung, solange noch kein
          Umsatz fließt. Plane einen finanziellen Puffer ein. {BUEROKRATIE_STAND}.
        </p>

        {/* Rücklagen-Disziplin */}
        <aside
          className="mt-6 rounded-r-sm border-l-[3px] py-4 pl-5 pr-5"
          style={{ borderLeftColor: GOLD, background: `${GOLD}0F` }}
        >
          <div className="mb-2 flex items-center gap-2">
            <PiggyBank size={15} style={{ color: GOLD }} className="shrink-0" />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
              Die wichtigste Geld-Regel
            </span>
          </div>
          <p className="font-body text-[0.95rem] leading-relaxed text-text-secondary">{RUECKLAGEN_REGEL}</p>
          <p className="mt-3 border-t border-border-subtle pt-3 font-body text-[0.95rem] leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Die Nachzahlungsfalle: </strong>
            {NACHZAHLUNGS_FALLE}
          </p>
        </aside>

        {/* Behörden-Brief-Falle */}
        <aside
          className="mt-4 rounded-r-sm border-l-[3px] py-4 pl-5 pr-5"
          style={{ borderLeftColor: FIRE, background: `${FIRE}0F` }}
        >
          <div className="mb-2 flex items-center gap-2">
            <MailWarning size={15} style={{ color: FIRE }} className="shrink-0" />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: FIRE }}>
              Vorsicht: Fake-Rechnungen nach der Anmeldung
            </span>
          </div>
          <p className="font-body text-[0.95rem] leading-relaxed text-text-secondary">{BEHOERDEN_BRIEF_WARNUNG}</p>
        </aside>
      </section>

      {/* Rechtsform-Vergleich */}
      <section>
        <SectionTitle
          icon={<Scale size={20} />}
          kicker="Welche Hülle passt?"
          title="Rechtsform-Schnellvergleich"
        />
        <ScrollBereich className="rounded-sm border border-border-subtle">
          <table className="w-full border-collapse text-left font-body text-[0.88rem]">
            <thead>
              <tr className="bg-surface-elevated text-text-primary">
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Rechtsform</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Für wen</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Kapital</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Haftung</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Gründung</th>
                <th className="p-3 font-sans text-[11px] font-bold uppercase tracking-[0.08em]">Buchführung</th>
              </tr>
            </thead>
            <tbody>
              {RECHTSFORMEN.map((r) => (
                <tr key={r.name} className="border-t border-border-subtle align-top">
                  <td className="p-3">
                    <div className="font-semibold text-text-primary">{r.name}</div>
                    <div className="mt-0.5 text-[0.78rem] italic text-text-muted">{r.empfehlung}</div>
                  </td>
                  <td className="p-3 text-text-secondary">{r.fuerWen}</td>
                  <td className="p-3 text-text-secondary">{r.stammkapital}</td>
                  <td className="p-3 text-text-secondary">{r.haftung}</td>
                  <td className="p-3 text-text-secondary">{r.gruendung}</td>
                  <td className="p-3 text-text-secondary">{r.buchfuehrung}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollBereich>
      </section>

      {/* Anti-Scam — Das ehrliche System */}
      <section>
        <SectionTitle
          icon={<ShieldAlert size={20} />}
          kicker="Das ehrliche System"
          title="Erkenne unseriöse Modelle"
        />
        <p className="mb-5 font-body text-[0.95rem] leading-relaxed text-text-secondary">
          Wer in die Selbständigkeit startet, läuft online ständig „schnell reich werden&quot;-Maschen
          über den Weg. Hier baust du etwas Echtes auf — also lern, den Unterschied auf einen Blick
          zu sehen.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
            <h3 className="mb-3 font-sans text-[0.95rem] font-bold text-text-primary">Warnsignale</h3>
            <ul className="space-y-2">
              {ANTI_SCAM_WARNSIGNALE.map((w) => (
                <li key={w} className="flex gap-2 font-body text-[0.9rem] leading-relaxed text-text-secondary">
                  <X size={15} style={{ color: FIRE }} className="mt-0.5 shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
            <h3 className="mb-3 font-sans text-[0.95rem] font-bold text-text-primary">So schützt du dich</h3>
            <ul className="space-y-2">
              {ANTI_SCAM_SCHUTZ.map((s) => (
                <li key={s} className="flex gap-2 font-body text-[0.9rem] leading-relaxed text-text-secondary">
                  <Check size={15} style={{ color: GOLD }} className="mt-0.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Rechtsschutz-Hinweis (Regel 13) */}
      <aside
        className="rounded-r-sm border-l-[3px] py-4 pl-5 pr-5"
        style={{ borderLeftColor: GOLD, background: `${GOLD}0F` }}
      >
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck size={15} style={{ color: GOLD }} className="shrink-0" />
          <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
            Vor dem Go-Live absichern
          </span>
        </div>
        <p className="font-body text-[0.95rem] leading-relaxed text-text-secondary">
          Bevor deine Website live geht: <strong className="text-text-primary">Rechtssicherheits-Check</strong>{' '}
          (Impressum, Datenschutz, AGB, Widerruf, Cookie-Consent, Preisangaben) und eine{' '}
          <strong className="text-text-primary">Rechtsschutzversicherung mit Internet-/Wettbewerbsrecht</strong>.
          Eine einzige Abmahnung kann eine junge Geschäftsidee am Start ersticken — lieber abgesichert
          starten als ungeschützt wachsen.
        </p>
      </aside>
    </div>
  );
}
