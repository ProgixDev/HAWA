import {ringTextWidthEm} from '../../components/home/cycleRingLayout';

// Title of the Daughter Mood screen ("Humeur de Maissa"): headlineSmall is 24 sp, which does not fit between the back and the
// save button for a first name of ordinary length, so it wrapped or was cut. For a daughter profile ONLY this screen sets the
// title to 20 sp and fits it to the width the header really has:
//   - one line at 20 sp when it fits (the normal case);
//   - otherwise one line at a smaller size, down to a floor of 16 sp (never an unreadable size);
//   - otherwise two lines at the floor size (a very long name or a narrow phone) — the text is never cut with an ellipsis.
// Widths are estimated from the shared Latin / Cyrillic / Devanagari / hanzi advance model of the cycle ring (Inter), widened
// for the serif title face, and scaled by the system font scale so accessibility font sizes are respected.

export const DAUGHTER_TITLE_BASE_SIZE = 20;
export const DAUGHTER_TITLE_MIN_SIZE = 16;
const SIZE_STEP = 1;
/** The title face (Fraunces) is wider than the Inter advances the model is built on; plus a margin for rounding. */
const TITLE_FACE_FACTOR = 1.16;
/** headlineSmall is 24 / 32: the line height keeps the same 4:3 ratio. */
const LINE_HEIGHT_RATIO = 32 / 24;

export type DaughterTitlePlan = {fontSize: number; lineHeight: number; numberOfLines: 1 | 2};

export function planDaughterTitle(input: {title: string; availableWidth: number; fontScale?: number}): DaughterTitlePlan {
  const {title, availableWidth} = input;
  const fontScale = input.fontScale && input.fontScale > 0 ? input.fontScale : 1;
  const plan = (fontSize: number, numberOfLines: 1 | 2): DaughterTitlePlan => ({fontSize, lineHeight: Math.round(fontSize * LINE_HEIGHT_RATIO), numberOfLines});
  if (!(availableWidth > 0)) {
    return plan(DAUGHTER_TITLE_BASE_SIZE, 1); // not measured yet
  }
  const em = ringTextWidthEm(title) * TITLE_FACE_FACTOR;
  for (let size = DAUGHTER_TITLE_BASE_SIZE; size >= DAUGHTER_TITLE_MIN_SIZE; size -= SIZE_STEP) {
    if (em * size * fontScale <= availableWidth) {
      return plan(size, 1);
    }
  }
  return plan(DAUGHTER_TITLE_MIN_SIZE, 2);
}
