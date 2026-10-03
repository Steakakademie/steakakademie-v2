/**
 * Wächter — sichtbarer Text einer Quelldatei (03.10.2026)
 *
 * Das Gate „keine Zusage ohne Beleg" sucht Zusage-Muster nur in dem, was ein
 * Besucher lesen kann. Diese Datei liefert genau das: aus TSX/TS die JSX-Texte und
 * Zeichenketten, aus MDX den Fließtext samt Frontmatter-Werten. Kommentare,
 * Importe, Bezeichner, Klassen- und Pfadangaben fallen heraus.
 *
 * Verfahren: Der Quelltext wird Zeichen für Zeichen durch Leerraum ersetzt
 * (Zeilenumbrüche bleiben), danach werden nur die sichtbaren Stücke an ihre
 * ursprüngliche Stelle zurückgeschrieben. Offsets bleiben damit gültig — jede
 * Fundstelle hat ihre echte Zeilennummer —, und ein Satz, den ein <strong> oder
 * ein Zeilenumbruch teilt, steht nach dem Zusammenziehen des Leerraums wieder am
 * Stück: „Jeden <strong>Freitag</strong>" wird zu „Jeden Freitag".
 *
 * `typescript` wird nur hier gebraucht (Gate, nicht tägliche Belegprüfung).
 */

import ts from 'typescript'

/** JSX-Attribute, deren Wert kein Lesetext ist. */
const STUMME_ATTRIBUTE = new Set([
  'className', 'class', 'href', 'src', 'srcSet', 'id', 'key', 'htmlFor', 'rel', 'target',
  'type', 'name', 'role', 'style', 'd', 'viewBox', 'fill', 'stroke', 'sizes', 'loading',
  'method', 'action', 'as', 'variant', 'size', 'slug', 'icon', 'autoComplete', 'inputMode',
])

/** Vergleichsoperatoren: eine Zeichenkette daneben ist ein Bezeichner, kein Lesetext. */
const VERGLEICH = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken,
])

/** Pfade und Adressen: „/vergleich/thermometer-getestet" ist keine Prüfbehauptung. */
const PFAD = /(?<![\p{L}\p{N}])(?:https?:\/\/|\/)[^\s"'`)\]<>]+/gu

/**
 * HTML-Entities im JSX-Text. Ohne Auflösung stünde „gepr&uuml;ft" im Quelltext und
 * kein Muster fände es. Das Zeichen ersetzt die Entity, der Rest wird mit weichen
 * Trennstrichen aufgefüllt — die fallen beim Zusammenziehen weg, die Offsets bleiben.
 */
const ENTITIES = {
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß',
  mdash: '—', ndash: '–', hellip: '…', bdquo: '„', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  laquo: '«', raquo: '»', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
  nbsp: ' ', thinsp: ' ', ensp: ' ', emsp: ' ', shy: '­',
  rarr: '→', larr: '←', euro: '€', deg: '°', times: '×', middot: '·', bull: '•', copy: '©', reg: '®',
}
function loeseEntities (text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[A-Za-z]+);/gi, (ganz, name) => {
    let zeichen
    if (name[0] === '#') {
      const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
      zeichen = code > 0 && code <= 0xffff ? String.fromCharCode(code) : null
    } else zeichen = ENTITIES[name]
    return zeichen == null ? ganz : zeichen + '­'.repeat(ganz.length - zeichen.length)
  })
}

/**
 * Tailwind-Klassen, Schlüssel, Kennungen: nur Kleinbuchstaben, Ziffern und
 * Klassen-Zeichen, mindestens ein Bindestrich oder Doppelpunkt. „text-ink/60
 * text-text-muted" ist kein Lesetext — und „60 … Messer" keine Bestandszahl.
 */
function istKlassenliste (text) {
  const teile = text.trim().split(/\s+/)
  return teile.every((t) => /^[!a-z0-9:/[\]().%#,_*=>&+-]+$/.test(t)) && teile.some((t) => /[-:]/.test(t))
}

function leer (quelle) {
  const out = new Array(quelle.length)
  for (let i = 0; i < quelle.length; i++) out[i] = quelle[i] === '\n' ? '\n' : ' '
  return out
}

function schreibe (out, start, ende, text) {
  // `text` ist höchstens so lang wie der Bereich (Escapes sind aufgelöst) — der
  // Rest bleibt Leerraum. Zeilenumbrüche im Bereich bleiben, wo sie waren.
  const n = Math.min(text.length, ende - start)
  for (let i = 0; i < n; i++) if (out[start + i] !== '\n') out[start + i] = text[i] === '\n' ? ' ' : text[i]
}

function istBezeichner (node) {
  const p = node.parent
  if (!p) return false
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return true
  if (ts.isLiteralTypeNode(p)) return true                                   // 'a' | 'b'
  if (ts.isCaseClause(p)) return true                                        // case 'x':
  if (ts.isBinaryExpression(p) && VERGLEICH.has(p.operatorToken.kind)) return true
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true   // obj['x']
  if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p)) && p.name === node) return true
  if (ts.isCallExpression(p)) {
    const ziel = p.expression
    if (ziel.kind === ts.SyntaxKind.ImportKeyword) return true               // import('x')
    if (ts.isIdentifier(ziel) && ziel.text === 'require') return true
    if (ts.isPropertyAccessExpression(ziel) && ts.isIdentifier(ziel.expression) && ziel.expression.text === 'console') return true
  }
  if (ts.isJsxAttribute(p)) {
    const name = p.name.getText()
    if (STUMME_ATTRIBUTE.has(name) || name.startsWith('data-')) return true
  }
  return false
}

/**
 * TSX/TS/JSX/JS → { text, segmente }. `text` ist so lang wie die Quelle.
 * `segmente`: [start, ende) je sichtbarem Stück, aufsteigend.
 */
export function sichtbarAusCode (quelle, datei = 'datei.tsx') {
  const art = /\.[jt]sx$/.test(datei) ? ts.ScriptKind.TSX : /\.jsx?$/.test(datei) ? ts.ScriptKind.JS : ts.ScriptKind.TS
  const sf = ts.createSourceFile(datei, quelle, ts.ScriptTarget.Latest, true, art)
  const out = leer(quelle)
  const segmente = []
  const nimm = (start, ende, text, zeilenweise = false) => {
    if (!text.trim() || istKlassenliste(text)) return
    schreibe(out, start, ende, text)
    if (!zeilenweise) { segmente.push([start, ende]); return }
    // Mehrzeilige Vorlagen (Prompts, Mailtexte) sind zeilenweise gegliedert: jede
    // Zeile ein eigenes Stück, sonst wäre der „Satz" die halbe Datei.
    let a = start
    for (let i = start; i <= ende; i++) {
      if (i === ende || quelle[i] === '\n') { if (i > a) segmente.push([a, i]); a = i + 1 }
    }
  }
  const besuch = (node) => {
    switch (node.kind) {
      case ts.SyntaxKind.JsxText:
        nimm(node.pos, node.end, loeseEntities(quelle.slice(node.pos, node.end)))
        break
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        if (!istBezeichner(node)) nimm(node.getStart(sf) + 1, node.end - 1, node.text, node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral)
        break
      case ts.SyntaxKind.TemplateHead:
      case ts.SyntaxKind.TemplateMiddle:
      case ts.SyntaxKind.TemplateTail: {
        const start = node.getStart(sf) + 1
        const ende = node.end - (node.kind === ts.SyntaxKind.TemplateTail ? 1 : 2)
        nimm(start, ende, node.text, true)
        break
      }
    }
    ts.forEachChild(node, besuch)
  }
  besuch(sf)
  segmente.sort((a, b) => a[0] - b[0])
  return { text: maskierePfade(out.join('')), segmente }
}

function maskiere (text, regex) {
  return text.replace(regex, (m) => m.replace(/[^\n]/g, ' '))
}

function maskierePfade (text) { return maskiere(text, PFAD) }

/**
 * MDX/Markdown → { text, segmente }. Sichtbar ist alles außer Codeblöcken,
 * Kommentaren, import/export-Zeilen, Link- und Bildzielen und Tag-Attributen,
 * die Pfade tragen. Frontmatter-Werte bleiben (Titel und Beschreibung liest man),
 * YAML-Kommentare im Frontmatter nicht. Segmente sind Zeilen.
 */
export function sichtbarAusMdx (quelle) {
  let text = quelle
  // Frontmatter: „# gegen die Referenz geprüft" ist eine Notiz, kein Seitentext.
  const kopf = /^---\r?\n[\s\S]*?\r?\n---/.exec(text)
  if (kopf) text = maskiere(kopf[0], /^\s*#[^\n]*$/gm) + text.slice(kopf[0].length)
  text = maskiere(text, /^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm)             // Codeblöcke
  text = maskiere(text, /\{\/\*[\s\S]*?\*\/\}/g)                              // {/* … */}
  text = maskiere(text, /<!--[\s\S]*?-->/g)                                   // <!-- … -->
  text = maskiere(text, /^(?:import|export)\s[^\n]*$/gm)                      // ESM-Zeilen
  text = maskiere(text, /\]\([^)\n]*\)/g)                                     // ](ziel)
  text = maskiere(text, /\b(?:href|src|slug|id|className|image|bild)=(?:"[^"\n]*"|'[^'\n]*'|\{[^}\n]*\})/g)
  text = maskiere(text, /<\/?[\p{Lu}a-z][\p{L}\p{N}.]*|\/?>/gu)                // Tag-Namen und Klammern
  text = maskiere(text, /^(?:---|\s*[\p{L}_][\p{L}\p{N}_-]*:(?=\s|$))/gmu)    // Frontmatter-Schlüssel, Trenner
  text = maskierePfade(text)
  // Ein Stück je Zeile: In diesem Bestand ist ein Absatz eine Zeile, ein
  // Listenpunkt eine Zeile, ein Frontmatter-Feld eine Zeile.
  const segmente = []
  const zeile = /[^\n]*\S[^\n]*/g
  for (let m; (m = zeile.exec(text));) segmente.push([m.index, m.index + m[0].length])
  return { text, segmente }
}

export function sichtbarerText (datei, quelle) {
  return /\.mdx?$/.test(datei) ? sichtbarAusMdx(quelle) : sichtbarAusCode(quelle, datei)
}

/**
 * Leerraum zusammenziehen, Offsets merken. `norm[i]` stammt von `text[karte[i]]`.
 * Geschützte Leerzeichen zählen als Leerraum, weiche Trennstriche verschwinden.
 */
export function normalisiere (text) {
  const zeichen = []
  const karte = []
  let luecke = true
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '­') continue
    if (/\s/.test(ch) || ch === ' ' || ch === ' ' || ch === ' ') {
      if (!luecke) { zeichen.push(' '); karte.push(i); luecke = true }
      continue
    }
    zeichen.push(ch); karte.push(i); luecke = false
  }
  return { norm: zeichen.join(''), karte }
}

/** Zeilennummer (1-basiert) eines Offsets in der Quelle. */
export function zeileVon (quelle, offset) {
  let zeile = 1
  for (let i = 0; i < offset && i < quelle.length; i++) if (quelle.charCodeAt(i) === 10) zeile++
  return zeile
}
