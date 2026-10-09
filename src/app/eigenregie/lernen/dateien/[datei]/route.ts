import { readFile } from 'node:fs/promises';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { kursdateiPfad } from '@/lib/eigenregie/kursdateien';

export const dynamic = 'force-dynamic';

/**
 * Download einer Kursdatei — nur mit Kurszugang (sonst Weiterleitung auf
 * Login bzw. Verkaufsseite, wie bei den Modulseiten).
 */
export async function GET(_req: Request, props: { params: Promise<{ datei: string }> }) {
  const { datei } = await props.params;
  const pfad = kursdateiPfad(datei);
  if (!pfad) return new Response('Nicht gefunden', { status: 404 });

  await requireCourseAccess('eigenregie', '/eigenregie/lernen');

  let inhalt: Buffer;
  try {
    inhalt = await readFile(pfad);
  } catch {
    // Fehlt die Datei, ist beim Build der Abruf aus dem privaten Repo schiefgegangen.
    console.error(`[eigenregie] Kursdatei fehlt im Deploy: ${datei}`);
    return new Response('Die Datei ist gerade nicht verfügbar.', { status: 503 });
  }

  return new Response(new Uint8Array(inhalt), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${datei}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
