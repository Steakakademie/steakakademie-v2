/**
 * Tagesfakten — reine Funktionen (ohne Netz, ohne Datenbank), damit sie testbar sind.
 * Der Runner scripts/tagesfakten.mjs holt die Daten und ruft diese Funktionen.
 *
 * Tag = UTC-Kalendertag. Die Datenbank speichert created_at in UTC, Plausible
 * wird mit date_range [tag, tag] gefragt — beides derselbe Schnitt.
 */

/** Gestern (UTC) als YYYY-MM-DD, oder ein per --tag uebergebener Tag. */
export function zielTag (argv = [], jetzt = new Date()) {
  const i = argv.indexOf('--tag')
  if (i >= 0 && argv[i + 1]) {
    const t = argv[i + 1]
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) throw new Error(`--tag erwartet YYYY-MM-DD, bekam „${t}"`)
    return t
  }
  const d = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), jetzt.getUTCDate() - 1))
  return d.toISOString().slice(0, 10)
}

/** [von, bis) als ISO-Zeitstempel fuer den UTC-Tag. */
export function tagesFenster (tag) {
  const von = new Date(`${tag}T00:00:00.000Z`)
  const bis = new Date(von.getTime() + 24 * 60 * 60 * 1000)
  return { von: von.toISOString(), bis: bis.toISOString() }
}

const KAUF_EVENTS = new Set(['payment', 'on_payment'])

/** Zaehlt Kaeufe und Erstattungen aus digistore_orders-Zeilen eines Tages. */
export function zaehleBestellungen (zeilen = []) {
  let kaeufe = 0
  let erstattungen = 0
  for (const z of zeilen) {
    if (z.processing_status !== 'processed') continue
    if (KAUF_EVENTS.has(z.ds_event)) kaeufe++
    else if (z.ds_event === 'refund') erstattungen++
  }
  return { kaeufe, erstattungen }
}

/**
 * Baut die Tageszeile. Jede Quelle liefert entweder { wert } oder { fehlt: 'Grund' };
 * fehlende Quellen werden NULL und der Grund landet in `quellen`.
 */
export function baueZeile (tag, q) {
  const quellen = {}
  const wert = (name, quelle, fallback = null) => {
    if (quelle && 'wert' in quelle) { quellen[name] = quelle.quelle ?? 'ok'; return quelle.wert }
    quellen[name] = `fehlt: ${quelle?.fehlt ?? 'keine Quelle'}`
    return fallback
  }
  return {
    tag,
    besucher: wert('besucher', q.besucher),
    produkt_klicks: wert('produkt_klicks', q.produkt_klicks),
    anmeldungen: wert('anmeldungen', q.anmeldungen),
    bestaetigungen: wert('bestaetigungen', q.bestaetigungen),
    kaeufe: wert('kaeufe', q.kaeufe, 0),
    erstattungen: wert('erstattungen', q.erstattungen, 0),
    widerrufe: wert('widerrufe', q.widerrufe, 0),
    provisionen_cent: wert('provisionen_cent', q.provisionen_cent),
    quellen,
  }
}

/** Markdown-Bilanz fuer das Job-Summary. */
export function bilanz (zeile) {
  const z = (v) => (v === null || v === undefined ? '—' : String(v))
  const fehlend = Object.entries(zeile.quellen).filter(([, q]) => String(q).startsWith('fehlt:'))
  return [
    `## 📊 Tagesfakten ${zeile.tag}`,
    '',
    '| Besucher | Produkt-Klicks | Anmeldungen | Bestätigungen | Käufe | Erstattungen | Widerrufe | Provisionen |',
    '|---|---|---|---|---|---|---|---|',
    `| ${z(zeile.besucher)} | ${z(zeile.produkt_klicks)} | ${z(zeile.anmeldungen)} | ${z(zeile.bestaetigungen)} | ${z(zeile.kaeufe)} | ${z(zeile.erstattungen)} | ${z(zeile.widerrufe)} | ${zeile.provisionen_cent === null ? '—' : (zeile.provisionen_cent / 100).toFixed(2) + ' €'} |`,
    '',
    fehlend.length
      ? `Ohne Quelle (NULL): ${fehlend.map(([k, q]) => `${k} (${String(q).slice(7)})`).join(' · ')}`
      : 'Alle Spalten mit Quelle.',
  ].join('\n')
}
