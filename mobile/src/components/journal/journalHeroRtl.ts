import {I18nManager} from 'react-native';

// The illustrated hero banners of the journal screens (Symptoms, Mood …) put their copy at the START edge of the image, where the artwork leaves
// empty space in left-to-right languages. The artwork is never mirrored, so under a right-to-left layout (Arabic) the start edge is the right side,
// where the woman is. This style moves the copy back to the free LEFT side: alignSelf 'flex-end' is the left edge in RTL, and because React Native swaps
// left/right paddings in RTL, paddingRight is the physical left gap. The text keeps its start (right) alignment inside its box. Returns null in
// left-to-right layouts, so they render exactly as before.
export const journalHeroCopyRtl = (gap: number) => (I18nManager.isRTL ? ({alignSelf: 'flex-end', paddingLeft: 0, paddingRight: gap} as const) : null);
