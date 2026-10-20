/**
 * Pinterest-Pin-Planung — reine Funktionen (20.10.2026).
 */
import { describe, it, expect } from 'vitest'
import { frontmatter, pin, pinnwand, reihum, titelTeile, zeit } from './pins.mjs'

describe('pinnwand', () => {
  it('ordnet nach Kategorie, Garmethode und Fleischart zu', () => {
    expect(pinnwand({ kategorie: 'fisch' })).toBe('Fisch vom Grill')
    expect(pinnwand({ kategorie: 'saucen-rubs' })).toBe('Beilagen, Saucen & Rubs')
    expect(pinnwand({ kategorie: 'wine-spirits' })).toBeNull()
    expect(pinnwand({ kategorie: 'fleisch', meatType: 'Spareribs', cookingMethod: '3-2-1, Smoker' })).toBe('Low & Slow BBQ')
    expect(pinnwand({ kategorie: 'fleisch', meatType: 'Hähnchen/Rind/Lamm', cookingMethod: 'Spieß, Holzkohle' })).toBe('Geflügel vom Grill')
    expect(pinnwand({ kategorie: 'fleisch', meatType: 'Lammkoteletts', cookingMethod: 'Direkt, heiß' })).toBe('Lamm vom Grill')
    expect(pinnwand({ kategorie: 'fleisch', meatType: 'Secreto', cookingMethod: 'Heiß direkt' })).toBe('Schwein & Iberico')
    expect(pinnwand({ kategorie: 'fleisch', meatType: 'Picanha', cookingMethod: 'Spieß / indirekt' })).toBe('Rind vom Grill')
  })
})

describe('zeit / titelTeile', () => {
  it('formatiert Garzeiten', () => {
    expect(zeit('PT45M')).toBe('45 Min.')
    expect(zeit('PT150M')).toBe('2½ Std.')
    expect(zeit('PT2H')).toBe('2 Std.')
    expect(zeit('PT30M')).toBe('30 Min.')
    expect(zeit('PT1470M')).toBe('über Nacht')
    expect(zeit('quatsch')).toBeNull()
  })
  it('trennt Titel am Gedankenstrich', () => {
    expect(titelTeile('Asado de Tira – Argentinische Rinder-Rippen')).toEqual(['Asado de Tira', 'Argentinische Rinder-Rippen'])
    expect(titelTeile('Adana Kebab')).toEqual(['Adana Kebab', null])
    expect(titelTeile('Suon Nuong – vietnamesische Rippchen')[1]).toBe('Vietnamesische Rippchen')
  })
})

describe('pin', () => {
  const fm = frontmatter(`---
title: "Picanha Churrasco – Brasilianischer Klassiker"
description: "Picanha am Spieß."
kategorie: fleisch
meatType: Picanha
cookingMethod: Spieß / indirekt
land: "Brasilien · Rio Grande do Sul"
difficulty: Einsteiger
totalTime: PT60M
image: "/images/rezepte/picanha.jpg"
imageAI: true
keywords: [Picanha, Churrasco]
---
Text`)
  it('baut Link mit UTM, Grafik-URL und KI-Hinweis', () => {
    const p = pin(fm, 'picanha-churrasco')
    expect(p.pinnwand).toBe('Rind vom Grill')
    expect(p.link).toBe('https://steakakademie.de/rezepte/fleisch/picanha-churrasco?utm_source=pinterest&utm_medium=social&utm_campaign=rezept-pins')
    const bild = new URL(p.bild)
    expect(bild.pathname).toBe('/api/og/pin')
    expect(bild.searchParams.get('title')).toBe('Picanha Churrasco')
    expect(bild.searchParams.get('sub')).toBe('Brasilianischer Klassiker')
    expect(bild.searchParams.get('meta')).toBe('Brasilien · Einsteiger · 1 Std.')
    expect(bild.searchParams.get('ki')).toBe('1')
    expect(p.beschreibung).toContain('Bild KI-generiert.')
    expect(p.beschreibung.length).toBeLessThanOrEqual(500)
    expect(p.titel.length).toBeLessThanOrEqual(100)
  })
  it('ohne Bild oder Pinnwand kein Pin', () => {
    expect(pin({ ...fm, image: undefined }, 'x')).toBeNull()
    expect(pin({ ...fm, kategorie: 'wine-spirits' }, 'x')).toBeNull()
  })
})

describe('reihum', () => {
  it('wechselt die Pinnwände ab', () => {
    const p = (slug, pinnwand) => ({ slug, pinnwand })
    const aus = reihum([p('r1', 'Rind vom Grill'), p('r2', 'Rind vom Grill'), p('f1', 'Fisch vom Grill')]).map((x) => x.slug)
    expect(aus).toEqual(['r1', 'f1', 'r2'])
  })
})
