/**
 * Rotations-Blocker für den Google-Kalender-Terminplan „Personal-Coaching (60 Min)"
 * tuwasduwillst.de · festgelegt von Uwe am 26.09.2026
 *
 * Was es tut: Das Buchungstool (Cal.com) bietet Mo–Fr 09:00–12:00 und 13:00–17:00 an,
 * Termine 60 Min, danach 30 Min Vorbereitung — Starts 09:00, 10:30, 13:00, 14:30, 16:00,
 * höchstens 4 Termine am Tag (Uwe, 27.09.2026). Dieses Skript trägt jeden Tag automatisch
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
 * Belegt-Optik (Uwe, 27.09.2026): An buchbaren Tagen werden zusätzlich einzelne Termine
 * nach Zufall geblockt — vorne im Kalender mehr, weiter hinten weniger, jeden Tag anders.
 * Der Zufall ist je Datum fest (gleiche Termine bei jedem Lauf), damit nichts „flackert".
 * Echte Buchungen werden angerechnet: Hat ein Tag schon echte Termine, fallen entsprechend
 * weniger Zufallsblocker an. Wirkt auf Google-Terminplan und Cal.com gleichermaßen, weil
 * beide die Belegung aus dem Google-Kalender lesen.
 * Raster (27.09.2026): Jeder Blocker und jeder echte Termin wird bis zum nächsten Terminbeginn
 * (Termin + 30 Min) belegt. So bleiben die Starts 09:00 · 10:30 · 13:00 · 14:30 · 16:00 fest.
 * Grenze: Die Buchungsseite zeigt nur freie Zeiten — nirgends Texte wie „gebucht" oder
 * „nur noch 2 frei" dazuschreiben, solange das nicht stimmt (irreführende Knappheit, UWG).
 *
 * Kosten: 0 € (Google Apps Script, privates Google-Konto).
 */

const KONFIG = {
  kalenderId: 'primary',
  anker: '2026-10-05',            // Montag der ersten „Woche 1"
  ersterTag: '2026-11-02',        // vorher ist nichts buchbar (Jobcenter: bezahlte Coachings erst ab Gewerbeanmeldung 01.11.)
  horizontTage: 63,               // 8 Wochen + 1 Woche Reserve
  von: 9, bis: 17,                // Rotations-Blocker: ganzer Tag
  slots: ['09:00', '10:30', '13:00', '14:30', '16:00'], // Terminbeginne (60 Min + 30 Min Vorbereitung, Mittag 12–13)
  dauerMin: 60,
  pauseMin: 30,                   // Vorbereitung nach jedem Termin; Zufallsblocker = Termin + Pause
  muster: { 1: [1, 3, 5], 2: [2, 3, 4], 3: [1, 2, 3, 4, 5], 4: [1, 2, 4, 5] }, // 1 = Montag
  feiertageNRW: true,
  titel: 'Rotation: nicht buchbar',
  tag: 'rotationBlocker',
  // Zufällig geblockte Termine an buchbaren Tagen (5 Termine am Tag, höchstens 4 buchbar)
  zufall: {
    aktiv: true,
    salz: 'tuwasduwillst-2026',   // ändern = neue Verteilung
    // [bis Tag x ab heute, min, max] geblockte Termine pro Tag
    staffel: [[14, 1, 3], [35, 1, 2], [999, 0, 1]],
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

/** Die Terminbeginne in fester Zufallsreihenfolge für einen Tag. */
function zufallsSlots(tag, k) {
  return k.slots.slice().sort(function (a, b) {
    return zufallszahl(k.zufall.salz + '|' + tag + '|' + a) - zufallszahl(k.zufall.salz + '|' + tag + '|' + b);
  });
}

function hhmm(min) { return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
function minuten(hm) { const p = hm.split(':').map(Number); return p[0] * 60 + p[1]; }
// Blocker reichen bis zum nächsten Terminbeginn: Cal.com setzt freie Zeiten sonst direkt hinter
// einen belegten Block (geprüft 27.09.2026: 09:00 geblockt → 10:00 statt 10:30 angeboten).
function slotEnde(slot, k) { return hhmm(minuten(slot) + k.dauerMin + k.pauseMin); }

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
 * Soll-Liste aller Blocker: ganze Tage (Rhythmus) + einzelne Zufallstermine.
 * belegt(tag) liefert die Terminbeginne ('HH:MM'), die schon durch echte Termine belegt sind.
 * Schlüssel: 'YYYY-MM-DD@HH:MM-HH:MM'.
 */
function sollBlocker(heute, k, belegt) {
  const out = {};
  zuBlockendeTage(heute, k).forEach(function (tag) { out[tag + '@' + hhmm(k.von * 60) + '-' + hhmm(k.bis * 60)] = k.titel; });
  for (let n = 0; n <= k.horizontTage; n++) {
    const d = plusTage(heute, n), tag = ymd(d);
    if (!istBuchbar(d, k)) continue;
    const echt = belegt ? belegt(tag) : [];
    // Echte Termine ins Raster ziehen, sonst bietet Cal.com z. B. 13:45 statt 14:30 an
    echt.forEach(function (slot) { out[tag + '@' + slot + '-' + slotEnde(slot, k)] = k.zufall.titel; });
    if (!k.zufall.aktiv) continue;
    let rest = Math.max(0, zufallsAnzahl(tag, n, k) - echt.length);
    zufallsSlots(tag, k).forEach(function (slot) {
      if (rest > 0 && echt.indexOf(slot) === -1) { out[tag + '@' + slot + '-' + slotEnde(slot, k)] = k.zufall.titel; rest--; }
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
  const uhr = function (d) { return hhmm(d.getHours() * 60 + d.getMinutes()); };
  const schluessel = function (ev) { return ymd(ev.getStartTime()) + '@' + uhr(ev.getStartTime()) + '-' + uhr(ev.getEndTime()); };

  // Echte Termine: welche Terminbeginne überschneiden sich mit einem nicht-automatischen Termin?
  const events = kal.getEvents(start, ende);
  const echt = {};
  events.forEach(function (ev) {
    if (ev.getTag(k.tag) === '1' || ev.isAllDayEvent()) return;
    const tag = ymd(ev.getStartTime());
    const von = ev.getStartTime().getHours() * 60 + ev.getStartTime().getMinutes();
    const bis = ev.getEndTime().getHours() * 60 + ev.getEndTime().getMinutes();
    k.slots.forEach(function (slot) {
      const s0 = minuten(slot), s1 = s0 + k.dauerMin;
      if (von < s1 && bis > s0) {
        echt[tag] = echt[tag] || [];
        if (echt[tag].indexOf(slot) === -1) echt[tag].push(slot);
      }
    });
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
    const tag = key.split('@')[0], zeiten = key.split('@')[1].split('-').map(minuten), d = datum(tag);
    const ev = kal.createEvent(soll[key],
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, zeiten[0]),
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, zeiten[1]),
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
