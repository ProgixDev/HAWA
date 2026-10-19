import fs from 'fs';
import path from 'path';
import {decodePng, type RgbImage} from '../../../testUtils/decodePng';
import {JOURNAL_HERO_INK} from '../journalHeroInk';

// The Journal banners put text on a fixed, LIGHT photograph. These tests pin two things:
//  1. the ink colours reach WCAG AA (4.5:1 for normal text) against the real pixels of each banner's text side,
//     measured at the darkest 1 % of pixels (not just the average), and
//  2. every banner's title / description takes its colour from that ink, never from a themed colour such as
//     `theme.colors.accent` / `textSecondary`, which turn pale lavender in Dark and True Black.

const IMAGES = path.join(__dirname, '..', '..', '..', 'assets', 'images');
const SRC = path.join(__dirname, '..', '..', '..');

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminanceOf = (r: number, g: number, b: number): number => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const hexLuminance = (hex: string): number => luminanceOf(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
const contrast = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Luminance of the darkest 1 % of the pixels in the text side of the banner (x 4–45 %, y 12–88 %, which skips the
// rounded corners). Sampling every 3rd pixel keeps the test fast.
function darkestOnePercent(image: RgbImage): number {
  const values: number[] = [];
  const x0 = Math.floor(image.width * 0.04);
  const x1 = Math.floor(image.width * 0.45);
  const y0 = Math.floor(image.height * 0.12);
  const y1 = Math.floor(image.height * 0.88);
  for (let y = y0; y < y1; y += 3) {
    for (let x = x0; x < x1; x += 3) {
      const i = (y * image.width + x) * 3;
      values.push(luminanceOf(image.data[i], image.data[i + 1], image.data[i + 2]));
    }
  }
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length * 0.01)];
}

const BANNERS = ['mood', 'symptoms', 'intimacy', 'notes', 'sleep'] as const;

describe('Journal hero banners — ink contrast against the real artwork', () => {
  it.each(BANNERS)('%s: title, description and accent ink are AA-readable on the text side of the photo', name => {
    const worst = darkestOnePercent(decodePng(path.join(IMAGES, `${name}-header-woman.png`)));
    expect(contrast(worst, hexLuminance(JOURNAL_HERO_INK.title))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(worst, hexLuminance(JOURNAL_HERO_INK.body))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(worst, hexLuminance(JOURNAL_HERO_INK.accent))).toBeGreaterThanOrEqual(4.5);
  });

  it('the old behaviour (a Dark-mode pale lavender on these photos) fails, so the test can catch it', () => {
    const worst = darkestOnePercent(decodePng(path.join(IMAGES, 'mood-header-woman.png')));
    expect(contrast(worst, hexLuminance('#CFC6F5'))).toBeLessThan(3);
  });
});

describe('Journal hero banners — text takes the fixed ink, never a themed colour', () => {
  // [file, style names of the hero title / description / badge text that sit on the photograph]
  const FILES: Array<[string, string[]]> = [
    ['screens/journal/JournalMoodScreen.tsx', ['heroTitle', 'heroSubtitle']],
    ['screens/journal/JournalSymptomsScreen.tsx', ['heroTitle', 'heroSubtitle']],
    ['screens/journal/JournalIntimacyScreen.tsx', ['heroTitle', 'heroText', 'learnText']],
    ['screens/journal/JournalNoteScreen.tsx', ['heroTitle', 'heroText', 'privateBadgeText']],
    ['screens/journal/JournalActivityScreen.tsx', ['heroTitle', 'heroText']],
    ['screens/pregnancy/PregnancySymptomsScreen.tsx', ['heroTitle', 'heroSubtitle']],
    ['components/postpartum/PostpartumCycleStyleJournalLayout.tsx', ['heroTitle', 'heroText']],
  ];

  it.each(FILES)('%s', (file, styles) => {
    const source = fs.readFileSync(path.join(SRC, file), 'utf8');
    for (const style of styles) {
      const match = new RegExp(`\\n\\s*${style}: \\{([^}]*)\\}`).exec(source);
      expect([style, match !== null]).toEqual([style, true]);
      expect([style, /color: JOURNAL_HERO_INK\.(title|body|accent)/.test(match![1])]).toEqual([style, true]);
    }
  });

  it('the Intimacy "learn more" pill uses a fixed light scrim, not the themed surface (dark in Dark mode)', () => {
    const source = fs.readFileSync(path.join(SRC, 'screens/journal/JournalIntimacyScreen.tsx'), 'utf8');
    const learn = /\n\s*learn: \{([^}]*)\}/.exec(source)![1];
    expect(learn).toContain("backgroundColor: 'rgba(255,255,255,0.88)'");
    expect(learn).not.toContain('theme.colors.surface');
  });
});
