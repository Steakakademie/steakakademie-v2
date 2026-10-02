import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ADMIN_SITZUNG_SEKUNDEN,
  erzeugeAdminToken,
  istAdminCookie,
  istAdminPasswort,
} from '@/lib/admin-auth';

/**
 * Waechter fuer die Admin-Sitzung (02.10.2026).
 *
 * Anlass: Der Cookie admin_auth trug bis dahin das Passwort selbst. Die Tests
 * halten fest, was seitdem gelten muss — vor allem, dass das rohe Passwort als
 * Cookie-Wert NICHT mehr durchgeht.
 */
const PW = 'ein-langes-test-passwort';
const JETZT = Date.UTC(2026, 9, 2, 12, 0, 0);

describe('admin-auth', () => {
  const vorher = process.env.ADMIN_PASSWORD;
  beforeEach(() => { process.env.ADMIN_PASSWORD = PW; });
  afterEach(() => {
    if (vorher === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = vorher;
  });

  it('prueft die Passwort-Eingabe im Login', () => {
    expect(istAdminPasswort(PW)).toBe(true);
    expect(istAdminPasswort(PW + 'x')).toBe(false);
    expect(istAdminPasswort('')).toBe(false);
    expect(istAdminPasswort(undefined)).toBe(false);
  });

  it('akzeptiert ein frisch erzeugtes Token', async () => {
    const token = await erzeugeAdminToken(JETZT);
    expect(token).toMatch(/^v1\.\d+\.[0-9a-f]{64}$/);
    expect(await istAdminCookie(token, JETZT)).toBe(true);
  });

  it('das Token enthaelt das Passwort nicht', async () => {
    const token = await erzeugeAdminToken(JETZT);
    expect(token).not.toContain(PW);
  });

  it('lehnt das rohe Passwort als Cookie-Wert ab', async () => {
    expect(await istAdminCookie(PW, JETZT)).toBe(false);
  });

  it('lehnt ein abgelaufenes Token ab', async () => {
    const token = await erzeugeAdminToken(JETZT);
    const spaeter = JETZT + (ADMIN_SITZUNG_SEKUNDEN + 1) * 1000;
    expect(await istAdminCookie(token, spaeter)).toBe(false);
  });

  it('lehnt ein Token mit verlaengerter Ablaufzeit ab', async () => {
    const token = (await erzeugeAdminToken(JETZT))!;
    const [v, ablauf, sig] = token.split('.');
    const gefaelscht = `${v}.${Number(ablauf) + 3600}.${sig}`;
    expect(await istAdminCookie(gefaelscht, JETZT)).toBe(false);
  });

  it('lehnt ein Token nach Passwortwechsel ab', async () => {
    const token = await erzeugeAdminToken(JETZT);
    process.env.ADMIN_PASSWORD = 'ein-anderes-passwort';
    expect(await istAdminCookie(token, JETZT)).toBe(false);
  });

  it('lehnt Unsinn ab', async () => {
    for (const wert of [undefined, null, '', 'v1', 'v1..', 'v2.9999999999.abc', 'v1.abc.def', 'a.b.c.d']) {
      expect(await istAdminCookie(wert, JETZT)).toBe(false);
    }
  });

  it('ohne ADMIN_PASSWORD gibt es keinen Admin und kein Token', async () => {
    const token = await erzeugeAdminToken(JETZT);
    delete process.env.ADMIN_PASSWORD;
    expect(await erzeugeAdminToken(JETZT)).toBeNull();
    expect(await istAdminCookie(token, JETZT)).toBe(false);
    expect(istAdminPasswort(undefined)).toBe(false);
    process.env.ADMIN_PASSWORD = '';
    expect(istAdminPasswort('')).toBe(false);
    expect(await istAdminCookie('', JETZT)).toBe(false);
  });
});
