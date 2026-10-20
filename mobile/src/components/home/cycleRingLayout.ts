// Layout of the three texts in the centre of the cycle ring (CycleProgressRing): the caption ("Jour du cycle"), the day
// number and the phase name. Pure geometry — no React, no i18n.
//
// The centre is a disc only 82 dp wide (at the default 116 dp ring), and a disc is narrow near its top and bottom: a
// caption that is fine across the middle sticks out of the circle one line higher. So the sizes are not fixed numbers —
// they are the largest ones for which every line of text, laid out as a block centred in the disc, stays inside it:
//
//   caption (small)   "Jour du cycle"
//   number  (large)   "8"
//   phase   (small)   "Phase" / "folliculaire"  — wrapped on two lines when one line cannot fit
//
// Widths come from the advance widths of the shipped Inter face (see ADVANCE below), not from a flat per-letter guess:
// a flat average was up to 15 % short on narrow words ("window", "du") and 30 % long on others ("fertile").

// em advance widths of Inter SemiBold (android/app/src/main/assets/fonts), measured from the font file. The caption is
// Inter Medium, about 2 % narrower: using the SemiBold widths for both keeps a small safety margin.
const ADVANCE: Record<string, number> = {};
const put = (chars: string, widths: number[]): void => {
  Array.from(chars).forEach((char, index) => {
    ADVANCE[char] = widths[index];
  });
};
put('abcdefghijklmnopqrstuvwxyz', [
  0.574, 0.624, 0.583, 0.624, 0.591, 0.389, 0.625, 0.612, 0.262, 0.262, 0.569, 0.262, 0.9, 0.612, 0.609, 0.624, 0.624, 0.397,
  0.549, 0.353, 0.612, 0.587, 0.839, 0.569, 0.588, 0.566,
]);
put('ABCDEFGHIJKLMNOPQRSTUVWXYZ', [
  0.728, 0.659, 0.737, 0.722, 0.605, 0.588, 0.749, 0.746, 0.277, 0.58, 0.703, 0.565, 0.922, 0.759, 0.769, 0.645, 0.773, 0.652,
  0.65, 0.66, 0.736, 0.728, 1.02, 0.72, 0.713, 0.652,
]);
put('абвгдежзийклмнопрстуфхцчшщъыьэюяё', [
  0.574, 0.604, 0.573, 0.447, 0.645, 0.591, 0.846, 0.511, 0.612, 0.612, 0.569, 0.594, 0.798, 0.61, 0.609, 0.605, 0.624, 0.583,
  0.495, 0.588, 0.747, 0.569, 0.636, 0.593, 0.847, 0.871, 0.667, 0.783, 0.579, 0.583, 0.859, 0.57, 0.591,
]);
put('АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯЁ', [
  0.728, 0.646, 0.659, 0.581, 0.852, 0.605, 1.032, 0.636, 0.759, 0.759, 0.703, 0.749, 0.922, 0.746, 0.769, 0.746, 0.645, 0.737,
  0.66, 0.672, 0.833, 0.72, 0.751, 0.705, 0.979, 1.002, 0.826, 0.907, 0.658, 0.737, 1.033, 0.652, 0.605,
]);
put(" -'’ßıİ.,", [0.252, 0.465, 0.326, 0.294, 0.644, 0.262, 0.277, 0.319, 0.319]);

const DIGIT_EM = 0.65; // widest Fraunces digit
const FALLBACK_EM = 0.62;
const FULL_WIDTH_EM = 1; // hanzi and other full-width glyphs (drawn by the system font)

// Devanagari (Hindi) is drawn by the system font (Noto Sans Devanagari), and a word there is shaped: the virama joins two
// consonants into one conjunct glyph (the second one takes little room), vowel signs are narrow, and marks above / below a letter
// take none. Three advances, fitted by least squares to the advance widths of every distinct word of the Hindi dictionary shaped in
// Noto Sans Devanagari Bold (unbiased on average; a single word still varies by about +/- 20 %, which DEVANAGARI_WIDTH_SAFETY covers).
const isDevanagariZeroWidth = (code: number): boolean =>
  (code >= 0x0900 && code <= 0x0902) || code === 0x093c || code === 0x094d || (code >= 0x0951 && code <= 0x0954);
const isDevanagariSign = (code: number): boolean =>
  code === 0x0903 || code === 0x093a || code === 0x093b || (code >= 0x093e && code <= 0x094c) || code === 0x094e || code === 0x094f ||
  (code >= 0x0955 && code <= 0x0957) || code === 0x0962 || code === 0x0963;
const DEVANAGARI_LETTER_EM = 0.646;
const DEVANAGARI_AFTER_VIRAMA_EM = 0.276;
const DEVANAGARI_SIGN_EM = 0.219;
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const VIRAMA = 0x094d;

const advanceOf = (char: string, previous = ''): number => {
  const known = ADVANCE[char];
  if (known !== undefined) {return known;}
  const code = char.codePointAt(0) ?? 0;
  if (code >= 0x0900 && code <= 0x097f) {
    if (isDevanagariZeroWidth(code)) {return 0;}
    if (isDevanagariSign(code)) {return DEVANAGARI_SIGN_EM;}
    return previous.codePointAt(0) === VIRAMA ? DEVANAGARI_AFTER_VIRAMA_EM : DEVANAGARI_LETTER_EM;
  }
  if (code >= 0x0300 && code <= 0x036f) {return 0;} // combining accent: no advance of its own
  if (code >= 0x2e80) {return FULL_WIDTH_EM;}
  return FALLBACK_EM;
};

/** Width of `text` in em: accents are folded onto their base letter (the advance is the same). */
export function ringTextWidthEm(text: string): number {
  return Array.from(text.normalize('NFD')).reduce((sum, char, index, chars) => sum + advanceOf(char, index > 0 ? chars[index - 1] : ''), 0);
}

// --- geometry -----------------------------------------------------------------------------------------------------------

/** The centre disc is this share of the ring (the same 82 / 116 the ring draws it with). */
export const RING_CENTER_RATIO = 82 / 116;
const DESIGN_DISC = 82;
/** Clear space kept between any text box and the edge of the disc, at the 82 dp design size. */
const EDGE_MARGIN = 3;
/** Widths are widened by this much before they are compared with the disc (kerning, rounding, weight differences). */
const WIDTH_SAFETY = 1.04;
/** Devanagari widths are less predictable from letters alone (conjuncts, system-font differences): a wider margin. */
const DEVANAGARI_WIDTH_SAFETY = 1.12;
const GAP = 1;
const NUMBER_SIZES = [24, 23, 22, 21, 20];
const TEXT_MAX = 10;
const TEXT_PREFERRED_MIN = 8;
const TEXT_MIN = 7;
const TEXT_STEP = 0.25;
const NUMBER_DIGITS = 3; // a late irregular cycle can pass day 99

/** Devanagari needs more room above and below the line than Latin / Cyrillic: 1.5 x the size instead of 1.2 x. */
const TEXT_LINE_FACTOR = 1.2;
const TEXT_LINE_FACTOR_DEVANAGARI = 1.5;
/** Japanese (kana present) is set on a taller line than Latin: 1.4 x the size, matching the typography layer's Japanese floor. */
const TEXT_LINE_FACTOR_JAPANESE = 1.4;
const JAPANESE_KANA_RE = /[\u3040-\u30FF]/;
const lineHeightOfText = (fontSize: number, factor: number = TEXT_LINE_FACTOR): number => Math.ceil(fontSize * factor * 2) / 2;
const lineHeightOfNumber = (fontSize: number): number => Math.ceil(fontSize * 1.1 * 2) / 2;

type Box = {halfWidth: number; top: number; bottom: number};

/** How far the farthest corner of the closest-to-the-edge box is from the disc edge; negative when a box sticks out. */
const clearance = (boxes: readonly Box[], radius: number): number =>
  Math.min(...boxes.map(box => radius - Math.hypot(box.halfWidth, Math.max(Math.abs(box.top), Math.abs(box.bottom)))));

const insideDisc = (boxes: readonly Box[], radius: number): boolean => clearance(boxes, radius) >= 0;

/** One-line option first, then every two-line split at a space, narrowest widest-line first. */
function lineOptions(label: string): string[][] {
  const words = label.split(/\s+/).filter(Boolean);
  const options: string[][] = [[words.join(' ')]];
  const splits: Array<{lines: string[]; widest: number}> = [];
  for (let index = 1; index < words.length; index += 1) {
    const lines = [words.slice(0, index).join(' '), words.slice(index).join(' ')];
    splits.push({lines, widest: Math.max(...lines.map(ringTextWidthEm))});
  }
  splits.sort((a, b) => a.widest - b.widest);
  return options.concat(splits.map(split => split.lines));
}

export type RingTextPlan = {
  caption: {fontSize: number; lineHeight: number};
  number: {fontSize: number; lineHeight: number};
  phase: {fontSize: number; lineHeight: number};
  /** Lines the phase block reserves (1 or 2), so the number does not move from one phase to the next. */
  phaseReservedLines: 1 | 2;
  /** Space between the three blocks. */
  gap: number;
  /** Line height of the small texts as a multiple of their size (taller for Devanagari). */
  textLineFactor: number;
  /** For each phase name given to the planner, the lines it is written on. */
  phaseLines: Record<string, string[]>;
};

type Candidate = {numberSize: number; textSize: number; reserved: 1 | 2; lines: Record<string, string[]>};

type StackInput = {
  textSize: number;
  /** Line height of the small texts as a multiple of their size. */
  lineFactor: number;
  numberSize: number;
  gap: number;
  /** Lines the phase block reserves; the stack is centred as if all of them were used. */
  reserved: number;
  /** Width of the caption in dp. */
  captionWidth: number;
  /** Width in dp of each line of the phase name actually drawn. */
  phaseWidths: readonly number[];
};

/** Boxes of the caption, the number and the phase lines, measured from the disc centre (the stack is centred on it). */
function stackBoxes(input: StackInput): Box[] {
  const textLine = lineHeightOfText(input.textSize, input.lineFactor);
  const numberLine = lineHeightOfNumber(input.numberSize);
  const total = textLine + input.gap + numberLine + input.gap + input.reserved * textLine;
  const top = -total / 2;
  const numberTop = top + textLine + input.gap;
  const phaseTop = numberTop + numberLine + input.gap;
  return [
    {halfWidth: input.captionWidth / 2, top, bottom: top + textLine},
    {halfWidth: (NUMBER_DIGITS * DIGIT_EM * input.numberSize) / 2, top: numberTop, bottom: numberTop + numberLine},
    ...input.phaseWidths.map((width, index) => ({
      halfWidth: width / 2,
      top: phaseTop + index * textLine,
      bottom: phaseTop + (index + 1) * textLine,
    })),
  ];
}

/**
 * The text sizes and line breaks for a ring of `size` dp. `phaseLabels` is every phase name the ring can show in the
 * current language: the sizes are chosen for the worst of them, so the caption and the number keep the same size (and
 * the same place) whichever phase is displayed. The number stays between 20 and 24 and the small texts between 7 and 10
 * (scaled with the ring), the number giving way first only as far as is needed to keep the small texts at 8 or more.
 */
export function planCycleRingText(input: {size: number; caption: string; phaseLabels: readonly string[]}): RingTextPlan {
  const disc = Math.round(input.size * RING_CENTER_RATIO);
  const unit = disc / DESIGN_DISC;
  const radius = disc / 2 - EDGE_MARGIN * unit;
  const gap = GAP * unit;
  const captionEm = ringTextWidthEm(input.caption);
  const labels = Array.from(new Set(input.phaseLabels.filter(Boolean)));
  const devanagari = [input.caption, ...labels].some(text => DEVANAGARI_RE.test(text));
  const japanese = !devanagari && [input.caption, ...labels].some(text => JAPANESE_KANA_RE.test(text));
  const lineFactor = devanagari ? TEXT_LINE_FACTOR_DEVANAGARI : japanese ? TEXT_LINE_FACTOR_JAPANESE : TEXT_LINE_FACTOR;
  const widthSafety = devanagari ? DEVANAGARI_WIDTH_SAFETY : WIDTH_SAFETY;

  const attempt = (numberSize: number, textSize: number, reserved: 1 | 2): Candidate | null => {
    const captionWidth = captionEm * textSize * widthSafety;
    const lines: Record<string, string[]> = {};
    if (labels.length === 0) {
      return insideDisc(stackBoxes({textSize, lineFactor, numberSize, gap, reserved, captionWidth, phaseWidths: []}), radius)
        ? {numberSize, textSize, reserved, lines}
        : null;
    }
    for (const label of labels) {
      // Among the breaks that fit, the one that sits farthest from the edge: a name that only just squeezes onto one line
      // reads better wrapped on two (fewer lines win a tie).
      let best: {option: string[]; room: number} | null = null;
      for (const option of lineOptions(label)) {
        if (option.length > reserved) {continue;}
        const room = clearance(
          stackBoxes({
            textSize,
            lineFactor,
            numberSize,
            gap,
            reserved,
            captionWidth,
            phaseWidths: option.map(line => ringTextWidthEm(line) * textSize * widthSafety),
          }),
          radius,
        );
        if (room >= 0 && (!best || room > best.room + 0.5)) {best = {option, room};}
      }
      if (!best) {return null;}
      lines[label] = best.option;
    }
    return {numberSize, textSize, reserved, lines};
  };

  const largestText = (numberSize: number): Candidate | null => {
    for (let textSize = TEXT_MAX * unit; textSize >= TEXT_MIN * unit - 1e-9; textSize -= TEXT_STEP) {
      const rounded = Math.floor(textSize / TEXT_STEP) * TEXT_STEP;
      const found = attempt(numberSize, rounded, 1) ?? attempt(numberSize, rounded, 2);
      if (found) {return found;}
    }
    return null;
  };

  let chosen: Candidate | null = null;
  for (const [index, nominal] of NUMBER_SIZES.entries()) {
    const found = largestText(Math.floor(nominal * unit * 4) / 4);
    chosen = found ?? chosen;
    if (found && (found.textSize >= TEXT_PREFERRED_MIN * unit - 1e-9 || index === NUMBER_SIZES.length - 1)) {break;}
  }
  // Nothing fits even at the smallest sizes (an unforeseen, very long name): the most compact layout there is.
  const result: Candidate = chosen ?? {
    numberSize: Math.floor(NUMBER_SIZES[NUMBER_SIZES.length - 1] * unit * 4) / 4,
    textSize: TEXT_MIN * unit,
    reserved: 2,
    lines: Object.fromEntries(labels.map(label => [label, lineOptions(label).find(option => option.length <= 2) ?? [label]])),
  };

  return {
    caption: {fontSize: result.textSize, lineHeight: lineHeightOfText(result.textSize, lineFactor)},
    number: {fontSize: result.numberSize, lineHeight: lineHeightOfNumber(result.numberSize)},
    phase: {fontSize: result.textSize, lineHeight: lineHeightOfText(result.textSize, lineFactor)},
    phaseReservedLines: result.reserved,
    gap,
    textLineFactor: lineFactor,
    phaseLines: result.lines,
  };
}

/**
 * Where the plan puts each text, for a given real width of every line (`widthOf` — a test measures them in the font
 * file): half-widths and top / bottom edges from the disc centre. `phaseLabel` null draws no phase block.
 */
export function ringTextBoxes(
  plan: RingTextPlan,
  captionWidth: number,
  phase: {label: string; lineWidths: readonly number[]} | null,
): Box[] {
  return stackBoxes({
    textSize: plan.caption.fontSize,
    lineFactor: plan.textLineFactor,
    numberSize: plan.number.fontSize,
    gap: plan.gap,
    reserved: phase ? plan.phaseReservedLines : 0,
    captionWidth,
    phaseWidths: phase ? phase.lineWidths : [],
  });
}

export type RingTextBox = Box;
