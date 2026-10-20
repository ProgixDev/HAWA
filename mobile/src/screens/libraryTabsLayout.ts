// Sizing of the category tabs of the Library screen (Tout · Médical · Religieux · À la une).
//
// The tabs are a segmented control: equal-width segments and a sliding indicator. Equal widths used to be a fixed share of the
// strip (a quarter each), so a label wider than its quarter ("Religieux" in French, the longer words of the other languages,
// larger font scales) wrapped onto a second line. Every tab now gets the same width, the larger of
//   - an equal share of the strip, and
//   - the natural single-line width of the widest tab (icon + label + padding, measured on screen),
// and when the tabs together are wider than the strip, the strip scrolls horizontally instead of wrapping or cutting a label.

/** Padding (3 each side) plus the 1 dp border (each side) of the strip: the width the tabs really have. */
export const LIBRARY_TABS_CHROME = 8;
/** Safety added to a measured width: text measured on one pass can come out a fraction of a dp short on another. */
export const LIBRARY_TAB_MEASURE_BUFFER = 2;

export type LibraryTabsPlan = {
  /** Width of every tab, in dp; null until the strip has been measured (the tabs then share the strip with flex). */
  itemWidth: number | null;
  /** Width of all the tabs together. */
  contentWidth: number | null;
  /** True when the tabs do not fit the strip: it scrolls horizontally. */
  scrollable: boolean;
  /** Width available to the tabs inside the strip. */
  innerWidth: number;
};

export function planLibraryTabs(input: {containerWidth: number; naturalWidths: readonly number[]; count: number}): LibraryTabsPlan {
  const {containerWidth, naturalWidths, count} = input;
  if (!(containerWidth > 0) || count <= 0) {
    return {itemWidth: null, contentWidth: null, scrollable: false, innerWidth: 0};
  }
  const innerWidth = Math.max(0, containerWidth - LIBRARY_TABS_CHROME);
  const share = innerWidth / count;
  const widest = naturalWidths.reduce((max, width) => (Number.isFinite(width) && width > max ? width : max), 0);
  const itemWidth = Math.max(share, widest > 0 ? Math.ceil(widest) + LIBRARY_TAB_MEASURE_BUFFER : 0);
  const contentWidth = itemWidth * count;
  return {itemWidth, contentWidth, scrollable: contentWidth > innerWidth + 0.5, innerWidth};
}

/** Where to scroll the strip so the active tab is fully visible (centred when it can be); 0 when nothing needs to scroll. */
export function libraryTabScrollOffset(input: {index: number; itemWidth: number; innerWidth: number; contentWidth: number}): number {
  const {index, itemWidth, innerWidth, contentWidth} = input;
  const maxOffset = Math.max(0, contentWidth - innerWidth);
  const centred = index * itemWidth - (innerWidth - itemWidth) / 2;
  return Math.min(maxOffset, Math.max(0, centred));
}
