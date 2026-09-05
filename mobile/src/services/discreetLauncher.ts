import {NativeModules} from 'react-native';

// Thin JS bridge to the native DiscreetLauncherModule (Android-only) — see
// android/app/src/main/java/com/hawa/DiscreetLauncherModule.kt. No JS-side
// state/cache is kept: the real source of truth is Android's own
// PackageManager component-enabled state, always read fresh, so this can
// never drift from what the OS actually has enabled. Changing identity here
// only ever affects the launcher icon/name — it never touches app data,
// encryption, or any AWA store.
export type LauncherIdentity = 'awa' | 'discreet';

type DiscreetLauncherNativeModule = {
  getCurrentIdentity(): Promise<LauncherIdentity>;
  setIdentity(identity: LauncherIdentity): Promise<null>;
};

const nativeModule = NativeModules.DiscreetLauncher as DiscreetLauncherNativeModule | undefined;

export const isDiscreetLauncherSupported = (): boolean => Boolean(nativeModule);

// Matches DiscreetLauncherModule.kt's ERROR_SECURITY_EXCEPTION constant — the
// one case the UI must treat differently from a generic failure: some OEM
// PackageManager forks (real evidence found on a Huawei/EMUI device — see
// TODO.md §1.19) can reject setComponentEnabledSetting for reasons outside
// this app's control. This is capability/error-driven (derived from what the
// native call actually threw), never a hardcoded manufacturer check.
const SECURITY_EXCEPTION_CODE = 'DISCREET_LAUNCHER_SECURITY_EXCEPTION';

/** True only when the native call failed with the specific
 * SecurityException path — i.e. the OS/OEM itself refused the component
 * toggle, not a code bug (missing component, bad identity value, etc.). */
export const isLauncherSwitchBlockedByDevice = (error: unknown): boolean =>
  (error as {code?: string} | undefined)?.code === SECURITY_EXCEPTION_CODE;

// RN surfaces a rejected native Promise as an Error-like object carrying
// `code`/`message` (and sometimes `userInfo`) from the native side's
// promise.reject(code, message, throwable) call — see
// DiscreetLauncherModule.kt. Logged in __DEV__ only, never shown in
// production UI (the screen always shows its own generic, non-technical
// error copy regardless of this log).
const logNativeErrorInDev = (context: string, error: unknown): void => {
  if (!__DEV__) {return;}
  const native = error as {code?: string; message?: string} | undefined;
  console.warn(`[discreetLauncher] ${context} failed — code=${native?.code ?? 'unknown'} message=${native?.message ?? String(error)}`);
};

/** Real current launcher identity — defaults to 'awa' if the native module
 * is unavailable (e.g. iOS, where this Android-only feature doesn't exist)
 * or the read otherwise fails, since 'awa' is what every install ships
 * enabled by default. */
export async function getLauncherIdentity(): Promise<LauncherIdentity> {
  if (!nativeModule) {return 'awa';}
  try {
    return await nativeModule.getCurrentIdentity();
  } catch (error) {
    logNativeErrorInDev('getCurrentIdentity', error);
    return 'awa';
  }
}

/** Switches which launcher alias is enabled. Throws on failure (missing
 * native module, or a PackageManager error) so the caller can show an
 * honest error and must NOT optimistically update its own UI as if the
 * switch succeeded. */
export async function setLauncherIdentity(identity: LauncherIdentity): Promise<void> {
  if (!nativeModule) {
    throw new Error('DiscreetLauncher native module unavailable on this platform.');
  }
  try {
    await nativeModule.setIdentity(identity);
  } catch (error) {
    logNativeErrorInDev(`setIdentity(${identity})`, error);
    throw error;
  }
}
