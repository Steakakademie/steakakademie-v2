/**
 * Rotations-Blocker für den Google-Kalender-Terminplan „Personal-Coaching (60 Min)"
 * tuwasduwillst.de · festgelegt von Uwe am 26.09.2026
 *
 * Was es tut: Der Terminplan in Google Kalender steht auf Mo–Fr 09:00–17:00
 * (Termine 60 Min, letzter Start 16:00). Dieses Skript trägt jeden Tag automatisch
 * für die nächsten 8 Wochen „belegt"-Blocker an allen Tagen ein, die im
 * 4-Wochen-Rhythmus NICHT buchbar sind. Google blendet diese Tage dann aus.
 *
 *   Woche 1: Mo, Mi, Fr   · Woche 2: Di, Mi, Do
 *   Woche 3: Mo–Fr        · Woche 4: Mo, Di, Do, Fr   · dann wieder Woche 1
 *
 * Dazu: gesetzliche Feiertage NRW werden geblockt, Tage vor ERSTER_TAG ebenfalls.
 * Eigene Abwesenheiten: einfach einen Termin („beschäftigt") in den Hauptkalender
 * eintragen — der Terminplan blendet die Zeit sofort aus. Nichts weiter zu tun.
 *
 * Kosten: 0 € (Google Apps Script, privates Google-Konto).
 */

const KONFIG = {
  kalenderId: 'primary',
  anker: '2026-10-05',            // Montag der ersten „Woche 1"
  ersterTag: '2026-10-05',        // vorher ist nichts buchbar (z. B. auf '2026-11-02' setzen)
  horizontTage: 63,               // 8 Wochen + 1 Woche Reserve
  von: 9, bis: 17,                // Blocker-Zeitraum = Verfügbarkeit im Terminplan
  muster: { 1: [1, 3, 5], 2: [2, 3, 4], 3: [1, 2, 3, 4, 5], 4: [1, 2, 4, 5] }, // 1 = Montag
  feiertageNRW: true,
  titel: 'Rotation: nicht buchbar',
  tag: 'rotationBlocker',
};

// ─── reine Logik (ohne Google-Dienste, testbar) ───────────────────────────────

function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function datum(s) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function plusTage(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }

function ostersonntag(j) { // Gauß/Anonymer Gregorianischer Algorithmus
  const a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(j, monat - 1, tag);
}

function feiertageNRW(j) {
  const o = ostersonntag(j);
  return [
    new Date(j, 0, 1), plusTage(o, -2), plusTage(o, 1), new Date(j, 4, 1), plusTage(o, 39),
    plusTage(o, 50), plusTage(o, 60), new Date(j, 9, 3), new Date(j, 10, 1), new Date(j, 11, 25), new Date(j, 11, 26),
  ].map(ymd);
}

/** Rhythmuswoche 1–4 für ein Datum (auch vor dem Anker korrekt). */
function rhythmusWoche(d, anker) {
  const tage = Math.round((datum(ymd(d)) - datum(anker)) / 86400000);
  const woche = Math.floor(tage / 7);
  return (((woche % 4) + 4) % 4) + 1;
}

/** true = Tag ist buchbar (nur Mo–Fr betrachtet). */
function istBuchbar(d, k) {
  const wt = d.getDay(); // 0 = So
  if (wt === 0 || wt === 6) return false;
  if (ymd(d) < k.ersterTag) return false;
  if (k.feiertageNRW && feiertageNRW(d.getFullYear()).indexOf(ymd(d)) !== -1) return false;
  return k.muster[rhythmusWoche(d, k.anker)].indexOf(wt) !== -1;
}

/** Werktage im Horizont, die geblockt werden müssen. */
function zuBlockendeTage(heute, k) {
  const out = [];
  for (let n = 0; n <= k.horizontTage; n++) {
    const d = plusTage(heute, n), wt = d.getDay();
    if (wt !== 0 && wt !== 6 && !istBuchbar(d, k)) out.push(ymd(d));
  }
  return out;
}

// ─── Google-Kalender (läuft nur in Apps Script) ───────────────────────────────

function aktualisiereBlocker() {
  const k = KONFIG;
  const kal = k.kalenderId === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(k.kalenderId);
  const heute = new Date();
  const soll = zuBlockendeTage(heute, k);
  const start = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  const ende = plusTage(start, k.horizontTage + 1);

  const vorhanden = {};
  kal.getEvents(start, ende).forEach(function (ev) {
    if (ev.getTag(k.tag) === '1') {
      const tag = ymd(ev.getStartTime());
      if (soll.indexOf(tag) === -1 || vorhanden[tag]) ev.deleteEvent(); // Rhythmus geändert oder doppelt
      else vorhanden[tag] = true;
    }
  });
  soll.forEach(function (tag) {
    if (vorhanden[tag]) return;
    const d = datum(tag);
    const ev = kal.createEvent(k.titel,
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), k.von),
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), k.bis),
      { description: 'Automatisch vom Rotations-Blocker (tuwasduwillst.de). Nicht von Hand ändern — Rhythmus in KONFIG anpassen.' });
    ev.setTag(k.tag, '1');
    ev.removeAllReminders();
  });
  console.log('Blocker gesetzt: ' + soll.length + ' Tage bis ' + ymd(ende));
}

/** Einmal ausführen: legt den täglichen Lauf (03:00 Uhr) an. */
function einrichten() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'aktualisiereBlocker') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('aktualisiereBlocker').timeBased().everyDays(1).atHour(3).create();
  aktualisiereBlocker();
}

if (typeof module !== 'undefined') module.exports = { KONFIG, istBuchbar, zuBlockendeTage, rhythmusWoche, feiertageNRW, ymd, datum };
