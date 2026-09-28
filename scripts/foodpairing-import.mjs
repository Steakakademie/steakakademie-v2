#!/usr/bin/env node
/**
 * Steakakademie — Foodpairing-Import
 *
 * Importiert ein bipartites Zutat<->Aromamolekül-Netzwerk in Supabase
 * (Tabellen aroma_ingredient / aroma_compound / aroma_ingredient_compound).
 * Quelle-agnostisch: erwartet drei TSV/CSV-Dateien im --dir.
 *
 * ⚖️  RECHTLICH: Nur ein offenes, kommerziell freigegebenes Dataset einspielen.
 *     Standard: unsere EIGENE Kuration (data/foodpairing/*.tsv, siehe SOURCES.md).
 *     ACHTUNG: Ahn-Flavor-Network (Sci. Rep. 2011) ist CC BY-NC — NICHT kommerziell.
 *     "Frei einsehbar" ≠ "frei weiterverbreitbar" — Lizenz vor Live-Gang prüfen
 *     (siehe docs/foodpairing-steckbrief.md). Dieses Skript lädt NICHTS herunter;
 *     die Dateien legst du selbst rechtssicher in data/foodpairing/ ab.
 *
 * Erwartete Dateien (Standard-Layout; Spalten tab- ODER komma-getrennt,
 * Kommentar-/Headerzeilen mit '#' werden übersprungen):
 *   ingr_info.tsv  ->  id  name  category
 *   comp_info.tsv  ->  id  name  CAS
 *   ingr_comp.tsv  ->  ingredient_id  compound_id
 *
 * Sync-Modus (seit v2, 28.09.2026, Freigabe Uwe): Die Dateien sind die Quelle der
 * Wahrheit. Nach dem Upsert werden Kanten, Moleküle und Zutaten gelöscht, die NICHT
 * mehr in den Dateien stehen — sonst blieben z. B. die v1-Stoffgruppen („Röst-Pyrazine")
 * und die Doppel-Zutaten „Ribeye"/„Steak" dauerhaft in der DB und verfälschten Treffer.
 * Sicherungen:
 *   - --dry-run zeigt mit gesetzten Env-Variablen vorher an, was gelöscht WÜRDE (nur lesend).
 *   - Abbruch ohne jeden Schreibvorgang, wenn die Dateien weniger als die Hälfte der
 *     Zutaten oder Kanten der DB enthalten (Schutz vor leerer/abgeschnittener Datei).
 *     Bewusst übersteuern: --force-prune.
 *   - --no-prune schaltet das Aufräumen ab (reiner Upsert wie in v1).
 *
 * Usage:
 *   node scripts/foodpairing-import.mjs --dir data/foodpairing --dry-run
 *   node scripts/foodpairing-import.mjs --dir data/foodpairing
 *   node scripts/foodpairing-import.mjs --dir data/foodpairing --no-prune
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
dotenv.config({ path: join(ROOT, '.env.local') })

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name, def = undefined) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def
}
const DIR     = String(flag('dir', 'data/foodpairing'))
const DRY_RUN = !!flag('dry-run', false)
const PRUNE   = !flag('no-prune', false)
const FORCE   = !!flag('force-prune', false)
const BATCH   = 1000

// ─── Helpers ─────────────────────────────────────────────────────────────────
const slug = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

/** Liest eine TSV/CSV: erkennt Trenner, überspringt '#'-/Leerzeilen. */
function readTable(file) {
  const raw = readFileSync(join(ROOT, DIR, file), 'utf8')
  const rows = []
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue
    rows.push(line.split(line.includes('\t') ? '\t' : ',').map((c) => c.trim()))
  }
  return rows
}

async function upsert(admin, table, rows, conflict) {
  if (DRY_RUN || rows.length === 0) return
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await admin.from(table).upsert(chunk, { onConflict: conflict })
    if (error) throw new Error(`${table}: ${error.message}`)
    process.stdout.write(`   ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`)
  }
  process.stdout.write('\n')
}

/** Liest den DB-Stand und ermittelt, was nach dem Import überzählig wäre. Rein lesend. */
async function prunePlan(admin, ingredients, compounds, edges) {
  const alle = async (table, cols) => {
    const out = []
    for (let from = 0; ; from += BATCH) {
      const { data, error } = await admin.from(table).select(cols).range(from, from + BATCH - 1)
      if (error) throw new Error(`${table} lesen: ${error.message}`)
      out.push(...data)
      if (data.length < BATCH) break
    }
    return out
  }
  const [dbI, dbC, dbE] = await Promise.all([
    alle('aroma_ingredient', 'id, name'),
    alle('aroma_compound', 'id, name'),
    alle('aroma_ingredient_compound', 'ingredient_id, compound_id'),
  ])
  const iIds = new Set(ingredients.map((i) => i.id))
  const cIds = new Set(compounds.map((c) => c.id))
  const eKeys = new Set(edges.map((e) => `${e.ingredient_id}:${e.compound_id}`))
  return {
    db: { zutaten: dbI.length, stoffe: dbC.length, kanten: dbE.length },
    zutaten: dbI.filter((i) => !iIds.has(i.id)),
    stoffe: dbC.filter((c) => !cIds.has(c.id)),
    // Kanten, deren Zutat und Stoff bleiben — die übrigen verschwinden per ON DELETE CASCADE
    kanten: dbE.filter((e) => !eKeys.has(`${e.ingredient_id}:${e.compound_id}`)
      && iIds.has(e.ingredient_id) && cIds.has(e.compound_id)),
  }
}

function zeigePlan(plan) {
  const namen = (l) => l.slice(0, 12).map((x) => x.name).join(', ') + (l.length > 12 ? ' …' : '')
  console.log(`   DB vorher: ${plan.db.zutaten} Zutaten · ${plan.db.stoffe} Moleküle · ${plan.db.kanten} Kanten`)
  console.log(`   🧹 zu entfernen: ${plan.zutaten.length} Zutaten${plan.zutaten.length ? ` (${namen(plan.zutaten)})` : ''}`)
  console.log(`                    ${plan.stoffe.length} Moleküle${plan.stoffe.length ? ` (${namen(plan.stoffe)})` : ''}`)
  console.log(`                    ${plan.kanten.length} weitere Kanten zwischen verbleibenden Einträgen (+ Kanten der entfernten per Cascade)`)
}

/** Sicherung: Dateien deutlich kleiner als die DB → vermutlich kaputte Eingabe. */
function pruefeUmfang(plan, ingredients, edges) {
  const zuWenig = ingredients.length < plan.db.zutaten / 2 || edges.length < plan.db.kanten / 2
  if (zuWenig && !FORCE) {
    throw new Error(
      `Sync abgebrochen: Dateien enthalten ${ingredients.length} Zutaten/${edges.length} Kanten, ` +
      `die DB ${plan.db.zutaten}/${plan.db.kanten}. Weniger als die Hälfte — Eingabe prüfen ` +
      `oder bewusst mit --force-prune übersteuern. Es wurde nichts geschrieben.`,
    )
  }
}

async function prune(admin, plan) {
  for (const e of plan.kanten) {
    const { error } = await admin.from('aroma_ingredient_compound').delete()
      .eq('ingredient_id', e.ingredient_id).eq('compound_id', e.compound_id)
    if (error) throw new Error(`Kante löschen: ${error.message}`)
  }
  if (plan.stoffe.length) {
    const { error } = await admin.from('aroma_compound').delete().in('id', plan.stoffe.map((c) => c.id))
    if (error) throw new Error(`Moleküle entfernen: ${error.message}`)
  }
  if (plan.zutaten.length) {
    const { error } = await admin.from('aroma_ingredient').delete().in('id', plan.zutaten.map((i) => i.id))
    if (error) throw new Error(`Zutaten entfernen: ${error.message}`)
  }
  console.log(`   🧹 entfernt: ${plan.zutaten.length} Zutaten · ${plan.stoffe.length} Moleküle · ${plan.kanten.length} Kanten (+ Cascade)`)
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const ingrRows = readTable('ingr_info.tsv')
  const compRows = readTable('comp_info.tsv')
  const edgeRows = readTable('ingr_comp.tsv')

  const ingredients = ingrRows
    .map(([id, name, category]) => ({ id: parseInt(id, 10), name, slug: slug(name), category: category || null }))
    .filter((r) => Number.isFinite(r.id) && r.name)

  const compounds = compRows
    .map(([id, name, cas, hubRole]) => ({
      id: parseInt(id, 10),
      name,
      cas: cas || null,
      pubchem_cid: null,
      hub_role: hubRole && hubRole.trim() ? hubRole.trim() : null,
      is_hub: !!(hubRole && hubRole.trim()),
    }))
    .filter((r) => Number.isFinite(r.id) && r.name)

  const edges = edgeRows
    .map(([iid, cid]) => ({ ingredient_id: parseInt(iid, 10), compound_id: parseInt(cid, 10) }))
    .filter((r) => Number.isFinite(r.ingredient_id) && Number.isFinite(r.compound_id))

  console.log(`📥 Foodpairing-Import aus ${DIR}/${DRY_RUN ? '  (Trockenlauf)' : ''}`)
  console.log(`   Zutaten: ${ingredients.length} · Moleküle: ${compounds.length} · Kanten: ${edges.length}`)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (DRY_RUN) {
    console.log('   → Trockenlauf, kein Schreibvorgang. Beispiel-Zutat:', ingredients[0])
    if (PRUNE && url && key) {
      const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
      const plan = await prunePlan(admin, ingredients, compounds, edges)
      zeigePlan(plan)
      pruefeUmfang(plan, ingredients, edges)
    } else if (PRUNE) {
      console.log('   (Aufräum-Vorschau braucht NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.)')
    }
    return
  }

  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen.')
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // Umfang VOR jedem Schreibvorgang prüfen — bei Abbruch bleibt die DB unberührt.
  let plan = null
  if (PRUNE) {
    plan = await prunePlan(admin, ingredients, compounds, edges)
    pruefeUmfang(plan, ingredients, edges)
  }

  await upsert(admin, 'aroma_ingredient', ingredients, 'id')
  // Robust: falls die Hub-Spalten (is_hub/hub_role) im Schema noch fehlen,
  // ohne sie importieren (Hub-Migration später nachziehen, Re-Import übernimmt sie).
  try {
    await upsert(admin, 'aroma_compound', compounds, 'id')
  } catch (e) {
    if (/is_hub|hub_role|column|schema cache/i.test(e.message)) {
      console.warn('   ⚠️ Hub-Spalten fehlen im Schema — importiere Moleküle ohne is_hub/hub_role.')
      const lean = compounds.map(({ is_hub: _h, hub_role: _r, ...rest }) => rest)
      await upsert(admin, 'aroma_compound', lean, 'id')
    } else throw e
  }
  await upsert(admin, 'aroma_ingredient_compound', edges, 'ingredient_id,compound_id')

  if (PRUNE) {
    zeigePlan(plan)
    await prune(admin, plan)
  }
  console.log('✅ Import abgeschlossen.')
}

main().catch((e) => {
  console.error('✖ Import fehlgeschlagen:', e.message)
  process.exit(1)
})
