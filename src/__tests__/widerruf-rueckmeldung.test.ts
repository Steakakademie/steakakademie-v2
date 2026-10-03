/**
 * Rückmeldung des Widerrufsformulars zur Eingangsbestätigung (03.10.2026).
 *
 * Anlass: Ohne versandte Mail stand immer „Eine Eingangsbestätigung folgt per
 * E-Mail." — auch wenn gar keine Adresse angegeben war oder der Versand
 * gescheitert ist. In beiden Lagen folgt nichts von selbst (src/app/api/widerruf/
 * route.ts: `emailSent` ist das Ergebnis des einzigen Versuchs).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BESTAETIGUNGS_TEXT, bestaetigungsLage, istEmailAdresse } from '@/lib/widerruf-rueckmeldung';
import { KONTAKT_EMPFAENGER } from '@/lib/kontakt';

describe('bestaetigungsLage', () => {
  it('Mail verschickt → gesendet', () => {
    expect(bestaetigungsLage({ emailSent: true, email: 'kim@example.de' })).toBe('gesendet');
  });

  it('nur Bestellnummer, keine Adresse → keine-adresse', () => {
    expect(bestaetigungsLage({ emailSent: false, email: '' })).toBe('keine-adresse');
    expect(bestaetigungsLage({ emailSent: false, email: '   ' })).toBe('keine-adresse');
    expect(bestaetigungsLage({ emailSent: false, email: 'kein-at-zeichen' })).toBe('keine-adresse');
  });

  it('Adresse angegeben, Versand gescheitert → nicht-gesendet', () => {
    expect(bestaetigungsLage({ emailSent: false, email: ' kim@example.de ' })).toBe('nicht-gesendet');
  });

  it('die Adressprüfung ist die der Route', () => {
    const route = readFileSync(join(__dirname, '..', 'app/api/widerruf/route.ts'), 'utf8');
    expect(route).toContain('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)');
    expect(istEmailAdresse('kim@example.de')).toBe(true);
    expect(istEmailAdresse('kim@example')).toBe(false);
  });
});

describe('Text zur Eingangsbestätigung', () => {
  it('verspricht nur dann eine Mail, wenn sie verschickt wurde', () => {
    expect(BESTAETIGUNGS_TEXT.gesendet).toMatch(/haben wir dir per E-Mail gesendet/);
    for (const lage of ['keine-adresse', 'nicht-gesendet'] as const) {
      expect(BESTAETIGUNGS_TEXT[lage], lage).not.toMatch(/folgt per E-Mail|haben wir dir per E-Mail gesendet/);
    }
  });

  it('ohne Mail: Datum und Uhrzeit notieren, und der Weg per E-Mail steht dabei', () => {
    for (const lage of ['keine-adresse', 'nicht-gesendet'] as const) {
      expect(BESTAETIGUNGS_TEXT[lage], lage).toMatch(/notiere dir Datum und Uhrzeit/);
      expect(BESTAETIGUNGS_TEXT[lage], lage).toContain(KONTAKT_EMPFAENGER);
    }
  });

  it('ohne Adresse sagt der Text, warum keine Mail kommt', () => {
    expect(BESTAETIGUNGS_TEXT['keine-adresse']).toMatch(/keine E-Mail-Adresse angegeben/);
  });

  it('das Formular nimmt den Text aus dieser Auswahl und nennt keinen eigenen', () => {
    const formular = readFileSync(join(__dirname, '..', 'app/widerruf/WiderrufForm.tsx'), 'utf8');
    expect(formular).toContain('BESTAETIGUNGS_TEXT[');
    expect(formular).not.toMatch(/folgt per E-Mail/);
  });
});
