// Schluessel der Tabelle `kochwissen` (siehe supabase/migrations/20260615_kochwissen.sql):
//   titel_key  — unique je source (Dedup/Merge beim Ingest)
//   quelle_key — Anker, ueber den kochwissen-resolve-anchors.mjs Platzhalter mit Volltext verbindet
//
// Einzige Quelle dieser Normalisierung: kochwissen-ingest.mjs und die Schluessel-Migration
// (scripts/kochwissen-rekey.mjs) importieren sie von hier. Aendert sich die Logik, aendern
// sich die Schluessel bestehender Zeilen — dann Migration mitliefern, sonst Dubletten.

/**
 * Reihenfolge ist entscheidend (Fix 15.09.2026): Umlaute ZUERST ausschreiben, DANN die
 * restlichen Diakritika entfernen. Vorher lief NFKD zuerst, "ä" wurde zu "a", und
 * "Spießhähnchen" / "Spiesshaehnchen" ergaben zwei verschiedene Schluessel.
 * NFC vorab, damit auch zerlegte Umlaute ("a" + U+0308) als "ä" erkannt werden.
 */
export function titelKey (s) {
  return String(s ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Anker fuer Index-Platzhalter: Seitenangabe ("S. 267" → "modernist:s267"), sonst normalisierte Quelle. */
export function quelleKey (source, quelle) {
  if (!quelle) return null
  const page = quelle.match(/s\.?\s*(\d+)/i)
  return `${source}:${page ? `s${page[1]}` : titelKey(quelle)}`
}
