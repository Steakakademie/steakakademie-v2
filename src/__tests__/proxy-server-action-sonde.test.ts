import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

/**
 * Waechter (12.10.2026, Sentry JAVASCRIPT-NEXTJS-7): Die App hat keine Server
 * Actions. Requests mit Next-Action-Header sind Sonden und muessen im Proxy mit
 * 404 enden, statt in Next den InvariantError "Expected RSC response" (500) zu
 * ausloesen.
 */
describe('proxy: Server-Action-Sonden', () => {
  it.each(['/tuwasduwillst.rsc', '/', '/kontakt'])('%s mit Next-Action -> 404', async (pfad) => {
    const req = new NextRequest(`https://tuwasduwillst.de${pfad}`, {
      method: 'POST',
      headers: { 'next-action': '00', 'content-type': 'text/plain;charset=UTF-8' },
      body: '[]',
    });
    const res = await proxy(req);
    expect(res.status).toBe(404);
  });

  it('normale Startseite ohne Next-Action bleibt unberuehrt', async () => {
    const res = await proxy(new NextRequest('https://steakakademie.de/'));
    expect(res.status).toBe(200);
  });
});
