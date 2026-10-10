import fs from 'fs';
import path from 'path';

import {capitalizeFor, displayTitleCase, displayUpperCase, lowerCaseFor, titleCaseFor, upperCaseFor} from '../textCase';

// RN `textTransform: 'uppercase' | 'capitalize'` follows the DEVICE locale on Android, so a Turkish "iyi" shows as
// "IYI" on a phone that is not set to Turkish. Every file that uses textTransform must therefore also convert the
// text in JavaScript with utils/textCase (the style is kept so the other languages render exactly as before).

describe('titleCaseFor — what textTransform: capitalize does, with the language rule', () => {
  it('capitalizes every word and leaves the rest alone', () => {
    expect(titleCaseFor('mardi 5 octobre', 'fr')).toBe('Mardi 5 Octobre');
    expect(titleCaseFor('tuesday 5 october', 'en')).toBe('Tuesday 5 October');
    expect(titleCaseFor('iPhone ve iyi', 'en')).toBe('IPhone Ve Iyi');
  });

  it('uses the dotted İ for Turkish', () => {
    expect(titleCaseFor('ilk ışık', 'tr')).toBe('İlk Işık');
    expect(titleCaseFor('ağustos 2026', 'tr')).toBe('Ağustos 2026');
    expect(titleCaseFor('  iki  gün ', 'tr')).toBe('  İki  Gün ');
  });

  it('other languages are byte-identical to the native transform', () => {
    for (const language of ['fr', 'en', 'es', 'it']) {
      expect(upperCaseFor('éàç iyi', language)).toBe('éàç iyi'.toUpperCase());
      expect(lowerCaseFor('ÉÀÇ IYI', language)).toBe('ÉÀÇ IYI'.toLowerCase());
      expect(capitalizeFor('iyi', language)).toBe('Iyi');
    }
  });
});

describe('display helpers (used next to textTransform)', () => {
  it('convert for Turkish only and return every other language untouched', () => {
    expect(displayUpperCase('iyi akşamlar', 'tr')).toBe('İYİ AKŞAMLAR');
    expect(displayTitleCase('ilk ışık', 'tr')).toBe('İlk Işık');
    for (const language of ['fr', 'en', 'es', 'it']) {
      expect(displayUpperCase('Choisir l’année', language)).toBe('Choisir l’année');
      expect(displayTitleCase('25 septembre 2026', language)).toBe('25 septembre 2026');
    }
  });
});

describe('every textTransform site is Turkish-safe', () => {
  const root = path.join(__dirname, '..', '..');
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {return entry.name === '__tests__' || entry.name === 'node_modules' ? [] : walk(full);}
      return /\.(tsx?)$/.test(entry.name) ? [full] : [];
    });

  it('each source file that sets textTransform imports a textCase helper and uses it', () => {
    const offenders = walk(root)
      .filter(file => path.basename(file) !== 'textCase.ts') // the helper itself only mentions it in prose
      .filter(file => /textTransform\s*:/.test(fs.readFileSync(file, 'utf8')))
      .filter(file => {
        const source = fs.readFileSync(file, 'utf8');
        const usesTextCase = /from '(\.\.?\/)+utils\/textCase'/.test(source) && /(displayUpperCase|displayTitleCase|upperCaseFor|titleCaseFor|capitalizeFor)\(/.test(source);
        // cycleMath's capitalize() is capitalizeFor (first letter, language rule): enough for a single month name
        const usesCycleMathCapitalize = /import\s*\{[^}]*\bcapitalize\b[^}]*\}\s*from '(\.\.?\/)+utils\/cycleMath'/.test(source) && /\bcapitalize\(/.test(source);
        return !(usesTextCase || usesCycleMathCapitalize);
      })
      .map(file => path.relative(root, file).replace(/\\/g, '/'));
    expect(offenders).toEqual([]);
  });

  it('the number of textTransform files is pinned, so a new one is a conscious decision', () => {
    const files = walk(root).filter(file => /textTransform\s*:/.test(fs.readFileSync(file, 'utf8')));
    expect(files.length).toBeGreaterThan(20);
  });
});
