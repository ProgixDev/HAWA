import {BackHandler, I18nManager} from 'react-native';

// LAYOUT DIRECTION
//
// Arabic ('ar') is AWA's only right-to-left language; the other 62 are left-to-right. React Native decides the layout direction of the WHOLE
// app (flex rows, left/right and margin/padding swaps, navigation headers and swipe-back gestures) from I18nManager, and it persists the
// two flags natively (allowRTL / forceRTL); they are read when the app process starts, so a change only takes effect at the NEXT cold start.
//
// Rule applied for every language, at start-up and at every language change (applyLayoutDirectionForLanguage):
//   - right-to-left language: allowRTL(true) + forceRTL(true)  (a phone in English still gets an Arabic-direction AWA);
//   - left-to-right language: allowRTL(false) + forceRTL(false) (an Arabic-language phone still gets a left-to-right AWA in French, English …).
// Direction is never forced permanently: it always follows the language in force. When the direction already running differs from the one
// the language needs, `layoutDirectionRestartNeeded()` is true and a localized prompt (LayoutDirectionRestartPrompt) asks the user to close and
// reopen AWA — the language itself is already saved, so reopening applies both. No restart loop is possible: the prompt only appears while
// the running direction and the wanted direction differ, and the flags are written once per change.

const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ar']);

/** True for a language written right-to-left (Arabic). Accepts regional tags ('ar-SA'). */
export function isRtlLanguage(language: string | null | undefined): boolean {
  return RTL_LANGUAGES.has(String(language ?? '').toLowerCase().split(/[-_]/)[0]);
}

type Listener = () => void;
const listeners = new Set<Listener>();
let restartNeeded = false;
let restartTarget: string | null = null;

export const layoutDirectionRestartNeeded = (): boolean => restartNeeded;
/** The language whose direction is waiting for a restart (for the prompt's wording), or null. */
export const layoutDirectionRestartTarget = (): string | null => restartTarget;
export function subscribeLayoutDirection(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Writes the native direction flags for `language` and reports whether the direction running now still differs (a restart is then needed). */
export function applyLayoutDirectionForLanguage(language: string | null | undefined): boolean {
  const wantRtl = isRtlLanguage(language);
  try {
    I18nManager.allowRTL(wantRtl);
    I18nManager.forceRTL(wantRtl);
  } catch {
    // keep the direction React Native already has
  }
  const running = Boolean(I18nManager.isRTL);
  const needed = running !== wantRtl;
  if (needed !== restartNeeded || (needed && restartTarget !== (language ?? null))) {
    restartNeeded = needed;
    restartTarget = needed ? (language ?? null) : null;
    listeners.forEach(listener => listener());
  }
  return needed;
}

/** Closes the app so the next launch starts in the saved language's direction (Android: the process exits; the user reopens AWA). */
export function closeAppForLayoutDirection(): void {
  try {
    BackHandler.exitApp();
  } catch {
    // nothing else to do: the prompt stays and the user can close AWA manually
  }
}

/** Wording of the restart prompt. It lives here (not in the 63 dictionaries) because it must be readable BEFORE the new direction exists: Arabic when the
 * target is Arabic, English otherwise (the direction change away from Arabic is the only other case). */
export const LAYOUT_RESTART_COPY = {
  ar: {
    title: 'أعيدي فتح AWA',
    message: 'تم حفظ اللغة. لتطبيق اتجاه الشاشة الجديد، أغلقي التطبيق ثم افتحيه من جديد.',
    action: 'إغلاق التطبيق',
    later: 'لاحقًا',
  },
  en: {
    title: 'Reopen AWA',
    message: 'Your language is saved. To apply the new screen direction, close AWA and open it again.',
    action: 'Close AWA',
    later: 'Later',
  },
} as const;

/** The pre-Arabic helper: puts both flags back to React Native's defaults (allowRTL true, no forced direction). Kept for callers that predate the
 * per-language rule above. */
export function restoreDefaultLayoutDirection(): void {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(false);
  } catch {
    // keep the direction React Native already has
  }
}
