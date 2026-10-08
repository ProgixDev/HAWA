import fs from 'fs';
import path from 'path';

// PHASE (Spanish localization) — structural completeness audit.
//
// A Spanish `CONTENT.es` block was added to all 72 "reachable" Library
// article screens (every entry in ArticleReaderScreen.tsx's
// BESPOKE_ARTICLE_SCREENS dispatch table), and each one's language selector
// was widened from the old 2-way `fr ? 'fr' : 'en'` to the new 3-way
// `fr ? 'fr' : es ? 'es' : 'en'`. UnderstandCycleArticleScreen.tsx is
// confirmed dead code (unreferenced by ArticleReaderScreen.tsx) and was
// intentionally left untouched.
//
// This file proves that state can never silently regress:
//   ITEM 1 — the reachable-article set is discovered the SAME way the app
//            itself discovers it (by parsing the real BESPOKE_ARTICLE_SCREENS
//            dispatch table in ArticleReaderScreen.tsx, not by globbing the
//            directory — globbing would also catch the intentionally-dead
//            file). TOTAL / REACHABLE / DEAD are computed from that
//            discovery, every reachable file is asserted to have non-empty
//            fr/en/es CONTENT blocks and the 3-way selector line, and
//            SPANISH-MISSING REACHABLE must be exactly 0.
//   ITEM 4 — residual French/English leftovers inside CONTENT.es (structural
//            word-scan, zero hits today).
//   ITEM 5 — tú-register regression scan (usted/ustedes/vos/vosotros/
//            vosotras) inside CONTENT.es (zero hits today).

const LIB_DIR = path.resolve(__dirname, '..');
const READER_SOURCE = fs.readFileSync(
  path.join(LIB_DIR, 'ArticleReaderScreen.tsx'),
  'utf8',
);

// ---------------------------------------------------------------------------
// Discover the reachable-article set the SAME way ArticleReaderScreen.tsx
// does: parse its actual BESPOKE_ARTICLE_SCREENS object literal (the real
// dispatch table `BESPOKE_ARTICLE_SCREENS[articleId]` the component itself
// indexes into), rather than hardcoding a list or globbing the directory.
// ---------------------------------------------------------------------------
function discoverBespokeMapEntries(): Array<{articleId: string; component: string}> {
  const startIdx = READER_SOURCE.indexOf('const BESPOKE_ARTICLE_SCREENS');
  expect(startIdx).toBeGreaterThan(-1);
  // The map's entries are `'id': ComponentName,` lines; none of them can
  // legitimately contain the literal `\n};` that closes the object, so the
  // first occurrence after the declaration start is the map's real end.
  const endIdx = READER_SOURCE.indexOf('\n};', startIdx);
  expect(endIdx).toBeGreaterThan(startIdx);
  const mapBody = READER_SOURCE.slice(startIdx, endIdx);
  const entries = [...mapBody.matchAll(/'([^']+)':\s*([A-Za-z0-9_]+),/g)].map(
    match => ({articleId: match[1], component: match[2]}),
  );
  return entries;
}

const bespokeEntries = discoverBespokeMapEntries();
const reachableFiles = new Set(bespokeEntries.map(entry => `${entry.component}.tsx`));

const allArticleScreenFiles = fs
  .readdirSync(LIB_DIR)
  .filter(name => /ArticleScreen\.tsx$/.test(name));

const deadFiles = allArticleScreenFiles.filter(file => !reachableFiles.has(file));
const reachableFileList = allArticleScreenFiles.filter(file => reachableFiles.has(file));

// ---------------------------------------------------------------------------
// CONTENT = {fr: {...}, en: {...}, es: {...}} as const; block extraction.
// Phase7LEditorialLocalization.test.tsx extracts a single named block with a
// regex anchored on `\} as const;` immediately following it (true when that
// key is last). Now that `es` was appended after `en`, `en` is no longer
// last, so instead of anchoring each block on the literal that happens to
// follow it, we locate all four fixed markers that every one of these
// uniformly-structured files contains (`  fr: {`, `  en: {`, `  es: {`,
// `} as const;`) and slice between consecutive markers — simpler than a
// bespoke regex per key and robust regardless of which key is last.
// ---------------------------------------------------------------------------
type ContentSplit = {
  frIdx: number;
  enIdx: number;
  esIdx: number;
  endIdx: number;
  fr: string;
  en: string;
  es: string;
};

function splitContent(source: string): ContentSplit | null {
  const frIdx = source.indexOf('\n  fr: {');
  const enIdx = source.indexOf('\n  en: {');
  const esIdx = source.indexOf('\n  es: {');
  // Italian was appended after `es`: the Spanish block now ends where `it` begins.
  const itIdx = source.indexOf('\n  it: {');
  const endIdx = source.indexOf('} as const;');
  if (frIdx === -1 || enIdx === -1 || esIdx === -1 || endIdx === -1) {
    return null;
  }
  if (!(frIdx < enIdx && enIdx < esIdx && esIdx < endIdx)) {
    return null;
  }
  if (itIdx !== -1 && !(esIdx < itIdx && itIdx < endIdx)) {
    return null;
  }
  const esEndIdx = itIdx !== -1 ? itIdx : endIdx;
  return {
    frIdx,
    enIdx,
    esIdx,
    endIdx,
    fr: source.slice(frIdx, enIdx),
    en: source.slice(enIdx, esIdx),
    es: source.slice(esIdx, esEndIdx),
  };
}

// The fr/es/it opt-ins (English for anything else) now live in the shared resolver.
const SELECTOR_RE = /resolveEditorialLanguage\(i18n\.language\)/;

describe('ITEM 1 — reachable-article discovery matches the real ArticleReaderScreen.tsx registry', () => {
  it('the dispatch table parses to exactly 72 reachable entries (sanity on the discovery mechanism itself)', () => {
    expect(bespokeEntries.length).toBe(72);
    expect(reachableFiles.size).toBe(72);
  });

  it('every file the registry claims is reachable actually exists on disk', () => {
    const missing = [...reachableFiles].filter(
      file => !fs.existsSync(path.join(LIB_DIR, file)),
    );
    expect(missing).toEqual([]);
  });

  it('TOTAL ARTICLE SCREEN FILES / REACHABLE / DEAD reconcile exactly', () => {
    console.log(
      `TOTAL ARTICLE SCREEN FILES=${allArticleScreenFiles.length} REACHABLE=${reachableFileList.length} DEAD=${deadFiles.length}`,
    );
    expect(allArticleScreenFiles.length).toBe(73);
    expect(reachableFileList.length).toBe(72);
    expect(reachableFileList.length + deadFiles.length).toBe(allArticleScreenFiles.length);
  });

  it('DEAD is exactly today\'s known dead file — phrased so a FUTURE new dead file is also caught and reported', () => {
    // toEqual on the full (sorted) array — not toContain/toHaveLength — so
    // that if a future change makes some OTHER file unreachable (removed
    // from the dispatch table but not deleted), this assertion fails and
    // prints the full new dead-file list, not just a count.
    expect(deadFiles.slice().sort()).toEqual(['UnderstandCycleArticleScreen.tsx']);
  });

  it('every reachable file has non-empty fr/en/es CONTENT blocks — SPANISH-MISSING REACHABLE must be 0', () => {
    const frMissing: string[] = [];
    const enMissing: string[] = [];
    const esMissing: string[] = [];
    const unparseable: string[] = [];

    for (const file of reachableFileList) {
      const source = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      expect(source).toMatch(/const CONTENT = \{/);
      const split = splitContent(source);
      if (!split) {
        unparseable.push(file);
        continue;
      }
      // Each slice still carries its own opening marker (`\n  fr: {`) plus
      // whatever editorial copy follows, so a genuinely-empty/missing
      // section is far shorter than a real one; 40 chars is comfortably
      // below the shortest real block and comfortably above the marker's
      // own length (~10 chars).
      if (split.fr.trim().length < 40) frMissing.push(file);
      if (split.en.trim().length < 40) enMissing.push(file);
      if (split.es.trim().length < 40) esMissing.push(file);
    }

    console.log(
      `FR CONTENT=${reachableFileList.length - frMissing.length} EN CONTENT=${reachableFileList.length - enMissing.length} ES CONTENT=${reachableFileList.length - esMissing.length}`,
    );

    expect(unparseable).toEqual([]);
    expect(frMissing).toEqual([]);
    expect(enMissing).toEqual([]);
    // THE assertion that must fail on a future regression: a newly-added
    // reachable article without a Spanish block shows up here by name.
    expect(esMissing).toEqual([]);
    expect(esMissing.length).toBe(0);
  });

  it('every reachable file uses the shared editorial language selector (catches a revert to a hardcoded fr/en or fr/es/en ternary)', () => {
    const offenders: string[] = [];
    for (const file of reachableFileList) {
      const source = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      if (!SELECTOR_RE.test(source)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the intentionally-dead file is confirmed NOT wired into the reader (still excluded on purpose)', () => {
    expect(READER_SOURCE.includes('UnderstandCycleArticleScreen')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Word-boundary helper that works correctly with accented Latin letters.
// JS's `\b` is ASCII-only (`\w` = [A-Za-z0-9_]), so `\bêtre\b` never matches
// because the character immediately beside the boundary (`ê`) is *also*
// classified as a "non-word" character — no transition ever happens, and the
// assertion silently never fires. A custom boundary built on an explicit
// Latin-1-supplement letter range (covers French/Spanish accented letters)
// is used instead so these scans are not silently inert.
// ---------------------------------------------------------------------------
const LETTER_CLASS = 'A-Za-zÀ-ÖØ-öø-ÿ';

function wordAppears(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![${LETTER_CLASS}])${escaped}(?![${LETTER_CLASS}])`, 'i');
  return re.test(text);
}

describe('ITEM 4 — Spanish residual-language audit (CONTENT.es must not contain French/English leftovers)', () => {
  // Distinctive function-words chosen to avoid false positives against
  // Spanish/French lookalikes (explicitly excluding tu/la/es/un per the task
  // — those are valid, common Spanish words too).
  const FRENCH_TELLS = ['vous', 'votre', 'être', 'avec', 'dans', 'pour', 'très', 'après'];
  const ENGLISH_TELLS = ['the', 'and', 'your', 'with', 'during'];

  it('zero French-tell hits inside any reachable article\'s CONTENT.es block', () => {
    const offenders: Record<string, string[]> = {};
    for (const file of reachableFileList) {
      const source = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      const split = splitContent(source);
      if (!split) continue;
      const found = FRENCH_TELLS.filter(word => wordAppears(split.es, word));
      if (found.length) offenders[file] = found;
    }
    // No known legitimate exceptions were found when this was run against
    // the current repo state (see report) — if one is ever found (e.g. a
    // quoted French source title inside a citation), it must be
    // investigated and documented here, never silently deleted.
    expect(offenders).toEqual({});
  });

  it('zero English-tell hits inside any reachable article\'s CONTENT.es block', () => {
    const offenders: Record<string, string[]> = {};
    for (const file of reachableFileList) {
      const source = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      const split = splitContent(source);
      if (!split) continue;
      const found = ENGLISH_TELLS.filter(word => wordAppears(split.es, word));
      if (found.length) offenders[file] = found;
    }
    expect(offenders).toEqual({});
  });
});

describe('ITEM 5 — tú-register regression audit (CONTENT.es must stay informal "tú", never usted/vosotros)', () => {
  const TU_REGISTER_TELLS = ['usted', 'ustedes', 'vos', 'vosotros', 'vosotras'];

  it('zero usted/ustedes/vos/vosotros/vosotras hits inside any reachable article\'s CONTENT.es block', () => {
    const offenders: Record<string, string[]> = {};
    for (const file of reachableFileList) {
      const source = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      const split = splitContent(source);
      if (!split) continue;
      const found = TU_REGISTER_TELLS.filter(word => wordAppears(split.es, word));
      if (found.length) offenders[file] = found;
    }
    // No hits were found when this was run against the current repo state
    // (see report). If a future hit appears inside a legitimately-quoted
    // source/citation, it must be read in context and reported rather than
    // blindly stripped.
    expect(offenders).toEqual({});
  });
});
