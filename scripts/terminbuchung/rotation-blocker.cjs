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
 * Belegt-Optik (Uwe, 27.09.2026): An buchbaren Tagen werden zusätzlich einzelne Stunden
 * nach Zufall geblockt — vorne im Kalender mehr, weiter hinten weniger, jeden Tag anders.
 * Der Zufall ist je Datum fest (gleiche Stunden bei jedem Lauf), damit nichts „flackert".
 * Echte Buchungen werden angerechnet: Hat ein Tag schon echte Termine, fallen entsprechend
 * weniger Zufallsblocker an. Wirkt auf Google-Terminplan und Cal.com gleichermaßen, weil
 * beide die Belegung aus dem Google-Kalender lesen.
 * Grenze: Die Buchungsseite zeigt nur freie Zeiten — nirgends Texte wie „gebucht" oder
 * „nur noch 2 frei" dazuschreiben, solange das nicht stimmt (irreführende Knappheit, UWG).
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
  // Zufällig geblockte Stunden an buchbaren Tagen (8 Termine am Tag: 9–16 Uhr)
  zufall: {
    aktiv: true,
    salz: 'tuwasduwillst-2026',   // ändern = neue Verteilung
    // [bis Tag x ab heute, min, max] Stunden pro Tag
    staffel: [[14, 2, 4], [35, 1, 3], [999, 0, 2]],
    titel: 'Nicht verfügbar',
  },
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

/** FNV-1a + Murmur3-Finalizer → gut gestreute Zahl in [0, 1), fest je Eingabe. */
function zufallszahl(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Zielzahl zufällig geblockter Stunden für einen buchbaren Tag (abstand = Tage ab heute). */
function zufallsAnzahl(tag, abstand, k) {
  const st = k.zufall.staffel.find(function (x) { return abstand <= x[0]; });
  return st[1] + Math.floor(zufallszahl(k.zufall.salz + '|n|' + tag) * (st[2] - st[1] + 1));
}

/** Die Stunden (Startzeit) in fester Zufallsreihenfolge für einen Tag. */
function zufallsStunden(tag, k) {
  const stunden = [];
  for (let h = k.von; h < k.bis; h++) stunden.push(h);
  return stunden.sort(function (a, b) {
    return zufallszahl(k.zufall.salz + '|' + tag + '|' + a) - zufallszahl(k.zufall.salz + '|' + tag + '|' + b);
  });
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

/**
 * Soll-Liste aller Blocker: ganze Tage (Rhythmus) + einzelne Zufallsstunden.
 * belegt(tag) liefert die Startstunden echter Termine an diesem Tag (werden angerechnet).
 * Schlüssel: 'YYYY-MM-DD@von-bis'.
 */
function sollBlocker(heute, k, belegt) {
  const out = {};
  zuBlockendeTage(heute, k).forEach(function (tag) { out[tag + '@' + k.von + '-' + k.bis] = k.titel; });
  if (!k.zufall.aktiv) return out;
  for (let n = 0; n <= k.horizontTage; n++) {
    const d = plusTage(heute, n), tag = ymd(d);
    if (!istBuchbar(d, k)) continue;
    const echt = belegt ? belegt(tag) : [];
    let rest = Math.max(0, zufallsAnzahl(tag, n, k) - echt.length);
    zufallsStunden(tag, k).forEach(function (h) {
      if (rest > 0 && echt.indexOf(h) === -1) { out[tag + '@' + h + '-' + (h + 1)] = k.zufall.titel; rest--; }
    });
  }
  return out;
}

function aktualisiereBlocker() {
  const k = KONFIG;
  const kal = k.kalenderId === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(k.kalenderId);
  const heute = new Date();
  const start = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  const ende = plusTage(start, k.horizontTage + 1);
  const schluessel = function (ev) { return ymd(ev.getStartTime()) + '@' + ev.getStartTime().getHours() + '-' + ev.getEndTime().getHours(); };

  const events = kal.getEvents(start, ende);
  const echt = {};
  events.forEach(function (ev) {
    if (ev.getTag(k.tag) === '1' || ev.isAllDayEvent()) return;
    const tag = ymd(ev.getStartTime());
    (echt[tag] = echt[tag] || []).push(ev.getStartTime().getHours());
  });
  const soll = sollBlocker(heute, k, function (tag) { return echt[tag] || []; });

  const vorhanden = {};
  events.forEach(function (ev) {
    if (ev.getTag(k.tag) !== '1') return;
    const key = schluessel(ev);
    if (!soll[key] || vorhanden[key]) ev.deleteEvent(); // Rhythmus/Zufall geändert oder doppelt
    else vorhanden[key] = true;
  });
  Object.keys(soll).forEach(function (key) {
    if (vorhanden[key]) return;
    const tag = key.split('@')[0], zeiten = key.split('@')[1].split('-').map(Number), d = datum(tag);
    const ev = kal.createEvent(soll[key],
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), zeiten[0]),
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), zeiten[1]),
      { description: 'Automatisch vom Rotations-Blocker (tuwasduwillst.de). Nicht von Hand ändern — KONFIG anpassen.' });
    ev.setTag(k.tag, '1');
    ev.removeAllReminders();
  });
  console.log('Blocker gesetzt: ' + Object.keys(soll).length + ' bis ' + ymd(ende));
}

/** Einmal ausführen: legt den täglichen Lauf (03:00 Uhr) an. */
function einrichten() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'aktualisiereBlocker') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('aktualisiereBlocker').timeBased().everyDays(1).atHour(3).create();
  aktualisiereBlocker();
}

if (typeof module !== 'undefined') module.exports = { KONFIG, istBuchbar, zuBlockendeTage, rhythmusWoche, feiertageNRW, ymd, datum, sollBlocker, zufallsAnzahl, plusTage };
