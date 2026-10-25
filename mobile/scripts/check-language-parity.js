#!/usr/bin/env node
// Usage: node scripts/check-language-parity.js <langCode>
// Reports key parity and placeholder mismatches between en.ts and <langCode>.ts.
// Exit 0 = clean; exit 1 = errors found.
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const [,, langCode] = process.argv;
if (!langCode) { console.error('Usage: check-language-parity.js <langCode>'); process.exit(2); }

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');

function loadDict(file) {
  const src = fs.readFileSync(file, 'utf8');
  // Transpile TS to JS, then eval the exported object
  const js = ts.transpileModule(src, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
  const mod = {exports: {}};
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', js)(mod, mod.exports, () => ({}));
  const keys = Object.keys(mod.exports);
  if (keys.length === 0) throw new Error(`No exports found in ${file}`);
  return mod.exports[keys[0]];
}

function leaves(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) return leaves(v, p);
    if (Array.isArray(v)) return v.map((item, i) => [`${p}[${i}]`, String(item)]);
    return [[p, String(v)]];
  });
}

const placeholders = s => (s.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).map(p => p.replace(/\s/g, '')).sort().join('|');

let errors = 0;

const enFile = path.join(LOCALES_DIR, 'en.ts');
const xxFile = path.join(LOCALES_DIR, `${langCode}.ts`);

if (!fs.existsSync(enFile)) { console.error(`Missing: ${enFile}`); process.exit(2); }
if (!fs.existsSync(xxFile)) {
  console.error(`Missing: ${xxFile}  (dictionary not created yet)`);
  process.exit(1);
}

const enLeaves = leaves(loadDict(enFile));
const xxLeaves = leaves(loadDict(xxFile));
const enMap = new Map(enLeaves);
const xxMap = new Map(xxLeaves);
const enKeys = new Set(enLeaves.map(([k]) => k));
const xxKeys = new Set(xxLeaves.map(([k]) => k));

const missing = [...enKeys].filter(k => !xxKeys.has(k));
const extra   = [...xxKeys].filter(k => !enKeys.has(k));

if (missing.length) {
  console.error(`\n[MISSING ${missing.length} keys in ${langCode}.ts]`);
  missing.slice(0, 20).forEach(k => console.error(`  - ${k}`));
  if (missing.length > 20) console.error(`  … and ${missing.length - 20} more`);
  errors += missing.length;
}

if (extra.length) {
  console.error(`\n[EXTRA ${extra.length} keys in ${langCode}.ts (not in en.ts)]`);
  extra.slice(0, 20).forEach(k => console.error(`  + ${k}`));
  errors += extra.length;
}

const placeholderErrors = [];
for (const [k, enVal] of enLeaves) {
  const xxVal = xxMap.get(k);
  if (xxVal === undefined) continue;
  const ep = placeholders(enVal);
  const xp = placeholders(xxVal);
  if (ep !== xp) placeholderErrors.push({k, expected: ep || '(none)', got: xp || '(none)'});
}

if (placeholderErrors.length) {
  console.error(`\n[PLACEHOLDER MISMATCH ${placeholderErrors.length}]`);
  placeholderErrors.slice(0, 20).forEach(({k, expected, got}) =>
    console.error(`  ${k}\n    en: ${expected}\n    ${langCode}: ${got}`));
  errors += placeholderErrors.length;
}

// Warn about unchanged strings (English text left as-is in a non-English dictionary)
const unchanged = [];
for (const [k, enVal] of enLeaves) {
  if (enVal.length < 10) continue; // short labels can legitimately match
  if (/^(appearance\.language\.[A-Za-z]+Name)$/.test(k)) continue; // endonyms
  const xxVal = xxMap.get(k);
  if (xxVal === enVal) unchanged.push(k);
}
if (unchanged.length) {
  console.warn(`\n[WARN: ${unchanged.length} strings identical to English — possible untranslated placeholders]`);
  unchanged.slice(0, 10).forEach(k => console.warn(`  ? ${k}`));
  if (unchanged.length > 10) console.warn(`  … and ${unchanged.length - 10} more`);
}

if (errors === 0) {
  console.log(`\n✓ ${langCode}.ts: ${xxKeys.size} keys, 0 parity errors, 0 placeholder mismatches${unchanged.length ? ` (${unchanged.length} unchanged-string warnings)` : ''}`);
} else {
  console.error(`\n✗ ${errors} error(s) found in ${langCode}.ts`);
  process.exit(1);
}
