import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDER_KEY = '@hawa/home/quick-actions-order';

export async function loadQuickActionsOrder(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(ORDER_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

export const saveQuickActionsOrder = (order: string[]): void => {
  AsyncStorage.setItem(ORDER_KEY, JSON.stringify(order)).catch(() => {});
};

/**
 * Quick actions that belong to the "Repères spirituels" feature set — the
 * SAME set the onboarding/Settings toggle enables ("Calendrier hijri,
 * prières, jeûne, état de pureté…", see SpiritualPreferencesScreen). Every
 * objective dashboard builds the same three keys, so ONE list here (applied
 * inside QuickActionsGrid) replaces the per-dashboard copies.
 */
export const SPIRITUAL_QUICK_ACTION_KEYS: readonly string[] = ['prayer-times', 'hijri-calendar', 'qadaa'];

/** Items that may be shown for the current spiritual-markers preference.
 * Pure filter — never mutates or persists anything. */
export function filterQuickActionsForSpiritualMarkers<T extends {key: string}>(
  items: readonly T[],
  spiritualMarkersEnabled: boolean,
): T[] {
  return spiritualMarkersEnabled
    ? [...items]
    : items.filter(item => !SPIRITUAL_QUICK_ACTION_KEYS.includes(item.key));
}

/**
 * Full (visible + currently hidden) ordering: a persisted order is honoured
 * only when it is a permutation of `allKeys` (same rule as before this
 * helper existed); otherwise the default order is used.
 */
export function resolveQuickActionsOrder(saved: readonly string[] | null | undefined, allKeys: readonly string[]): string[] {
  if (!saved) {return [...allKeys];}
  const isPermutation =
    saved.length === allKeys.length &&
    new Set(saved).size === saved.length &&
    saved.every(key => allKeys.includes(key));
  return isPermutation ? [...saved] : [...allKeys];
}

/**
 * Applies a reordering of the VISIBLE keys back onto the full order: visible
 * keys are re-laid into the slots visible keys already occupied, hidden keys
 * (spiritual actions while markers are OFF) stay exactly where they were, so
 * turning the markers back ON restores the user's arrangement.
 */
export function applyVisibleOrderToFullOrder(
  fullOrder: readonly string[],
  nextVisibleOrder: readonly string[],
): string[] {
  const visible = new Set(nextVisibleOrder);
  let cursor = 0;
  return fullOrder.map(key => (visible.has(key) ? nextVisibleOrder[cursor++] : key));
}
