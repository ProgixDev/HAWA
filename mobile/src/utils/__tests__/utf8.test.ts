import {decodeUtf8} from '../utf8';

// decodeUtf8 replaces `new TextDecoder().decode()` (absent from Hermes): it must
// give exactly the same string for valid AND invalid input.
const encode = (text: string) => new Uint8Array(Buffer.from(text, 'utf8'));
const reference = (bytes: Uint8Array) => new TextDecoder('utf-8').decode(bytes);

describe('decodeUtf8', () => {
  it.each([
    ['ascii', 'hello {"answer":"yes"}'],
    ['French accents', 'Règles, température, énergie — « fatiguée » œ ’ €'],
    ['Arabic', 'متابعة الدورة الشهرية — اليوم ١٢'],
    ['emoji / surrogate pairs', 'Humeur 😊 famille 👩‍👧 !'],
    ['CJK / Hebrew', '日本語 עברית'],
    ['empty', ''],
  ])('%s round-trips and matches TextDecoder', (_name, text) => {
    const bytes = encode(text);
    expect(decodeUtf8(bytes)).toBe(text);
    expect(decodeUtf8(bytes)).toBe(reference(bytes));
  });

  it('a large payload (multiple internal chunks) decodes intact', () => {
    const text = 'اليوم شعرت بتعب 😊 é'.repeat(3000);
    expect(decodeUtf8(encode(text))).toBe(text);
  });

  it('drops a leading BOM like TextDecoder', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x61]);
    expect(decodeUtf8(bytes)).toBe('a');
    expect(decodeUtf8(bytes)).toBe(reference(bytes));
  });

  it.each([
    ['lone continuation byte', [0x61, 0x80, 0x62]],
    ['truncated 2-byte sequence', [0x61, 0xc3]],
    ['truncated 4-byte sequence', [0xf0, 0x9f, 0x98]],
    ['overlong encoding', [0xc0, 0xaf]],
    ['encoded surrogate', [0xed, 0xa0, 0x80]],
    ['beyond U+10FFFF', [0xf4, 0x90, 0x80, 0x80]],
    ['invalid lead byte', [0xff, 0x61]],
    ['interrupted sequence', [0xe2, 0x82, 0x61]],
  ])('%s -> same U+FFFD replacement as TextDecoder', (_name, raw) => {
    const bytes = new Uint8Array(raw);
    expect(decodeUtf8(bytes)).toBe(reference(bytes));
  });

  it('agrees with TextDecoder on 2000 deterministic pseudo-random byte strings', () => {
    let seed = 123456789;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed;
    };
    for (let round = 0; round < 2000; round += 1) {
      const length = next() % 24;
      const raw = Array.from({length}, () => {
        const pick = next() % 8;
        // Bias towards multi-byte structure so the interesting paths are hit.
        if (pick < 3) {return next() % 128;}
        if (pick < 6) {return 0x80 + (next() % 0x80);}
        return [0xc2, 0xe0, 0xed, 0xf0, 0xf4, 0xff][next() % 6];
      });
      const bytes = new Uint8Array(raw);
      const expected = reference(bytes);
      expect(decodeUtf8(bytes)).toBe(expected);
    }
  });
});
