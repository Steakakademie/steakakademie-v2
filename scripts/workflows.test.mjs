/**
 * Workflow-Hygiene (03.10.2026) — nach dem Entfernen von Automationen.
 *
 * Ein Workflow, der ein geloeschtes Skript ruft, faellt erst auf, wenn er das
 * naechste Mal laeuft — bei einem Handknopf also vielleicht nie. Und eine
 * hart eingetragene Node-Version laeuft still von der Produktion weg
 * (CLAUDE.md Abschnitt A: einzige Quelle ist .nvmrc).
 *
 * Geprueft wird der Text der Dateien, kein YAML-Parser: die Regeln sind
 * Zeilenregeln, und der Test soll ohne zusaetzliche Abhaengigkeit laufen.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WF_DIR = join(ROOT, '.github', 'workflows')
const ACTIONS_DIR = join(ROOT, '.github', 'actions')

function yamlDateien(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const voll = join(dir, name)
    if (statSync(voll).isDirectory()) return yamlDateien(voll)
    return /\.ya?ml$/.test(name) ? [voll] : []
  })
}

const dateien = [...yamlDateien(WF_DIR), ...yamlDateien(ACTIONS_DIR)].map((pfad) => {
  const text = readFileSync(pfad, 'utf-8')
  return {
    name: pfad.slice(ROOT.length + 1),
    text,
    // Kommentarzeilen zaehlen nicht: dort darf Geschichte stehen.
    code: text.split('\n').filter((z) => !/^\s*#/.test(z)).join('\n'),
  }
})

const paket = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))

describe('.github/workflows — Hygiene', () => {
  it('es gibt Workflows zu pruefen', () => {
    expect(dateien.filter((d) => d.name.includes('workflows')).length).toBeGreaterThan(10)
  })

  it('Node kommt ueberall aus .nvmrc, nie als Zahl', () => {
    for (const d of dateien) {
      expect(d.code, d.name).not.toMatch(/^\s*node-version:/m)
      const setups = (d.code.match(/uses:\s*actions\/setup-node@/g) ?? []).length
      const ausNvmrc = (d.code.match(/node-version-file:\s*\.nvmrc/g) ?? []).length
      expect(ausNvmrc, `${d.name}: ${setups}× setup-node, ${ausNvmrc}× .nvmrc`).toBe(setups)
    }
  })

  it('jedes aufgerufene Skript existiert', () => {
    const fehlt = []
    for (const d of dateien) {
      const treffer = d.code.matchAll(/\b(?:node|bash|sh|python3?)\s+((?:scripts|tools|\.github)\/[\w./-]+)/g)
      for (const [, pfad] of treffer) {
        if (!existsSync(join(ROOT, pfad))) fehlt.push(`${d.name} → ${pfad}`)
      }
    }
    expect(fehlt).toEqual([])
  })

  it('jedes aufgerufene npm-Script steht in package.json', () => {
    const fehlt = []
    for (const d of dateien) {
      // Schalter wie --silent vor dem Namen ueberspringen.
      for (const [, script] of d.code.matchAll(/\bnpm run (?:--[\w-]+\s+)*([\w:][\w:-]*)/g)) {
        if (!paket.scripts[script]) fehlt.push(`${d.name} → npm run ${script}`)
      }
    }
    expect(fehlt).toEqual([])
  })

  it('jede lokale Action, die ein Workflow nutzt, existiert', () => {
    const fehlt = []
    for (const d of dateien) {
      for (const [, pfad] of d.code.matchAll(/uses:\s*\.\/([\w./-]+)/g)) {
        if (!existsSync(join(ROOT, pfad, 'action.yml'))) fehlt.push(`${d.name} → ${pfad}`)
      }
    }
    expect(fehlt).toEqual([])
  })

  it('die am 03.10.2026 entfernten Automationen sind wirklich weg', () => {
    for (const weg of ['newsletter-weekly.yml', 'auto-fix.yml', 'ideen-radar.yml']) {
      expect(existsSync(join(WF_DIR, weg)), weg).toBe(false)
    }
    for (const weg of ['scripts/newsletter-weekly.mjs', 'scripts/ideen-radar.mjs', 'data/ideen-backlog.json']) {
      expect(existsSync(join(ROOT, weg)), weg).toBe(false)
    }
    for (const d of dateien) {
      expect(d.code, d.name).not.toMatch(/newsletter-weekly|ideen-radar\.mjs|ideen-backlog/)
    }
  })

  it('jeder Zeitplan hat genau fuenf Felder', () => {
    for (const d of dateien) {
      for (const [, ausdruck] of d.code.matchAll(/-\s*cron:\s*'([^']+)'/g)) {
        expect(ausdruck.trim().split(/\s+/), `${d.name}: ${ausdruck}`).toHaveLength(5)
      }
    }
  })
})
