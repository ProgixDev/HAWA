import * as Sentry from '@sentry/react-native';

import {loadCrashReportsChoice, setCrashReportsChoice} from '../state/crashReportsPreferences';

// Crash reporting (Sentry) — the ONLY file that configures it. AWA handles health and intimate data (CLAUDE.md §6), so everything here
// is privacy-first: nothing that could carry what the person typed, where she is or who she is is ever collected.
//
// Nothing starts without her agreement: `initSentry()` only starts the SDK when the stored choice is 'granted' (see
// state/crashReportsPreferences.ts), and turning the choice off stops it. Until she has answered, no SDK runs and no report exists.
//
// The DSN is a public identifier, not a secret (it only lets the app send events to the project): AWA Mobile, EU region
// (…ingest.de.sentry.io). With an empty DSN nothing starts. It also does nothing in development (`__DEV__`).
export const SENTRY_DSN = 'https://ff5941884bd2dfa46b9cf5dbe605ea92@o4512407456710656.ingest.de.sentry.io/4512407517331536';

// Breadcrumb categories that can hold journal text, taps on private screens, screen names or locations. Dropped entirely.
//  - console / ui.click / ui.input / navigation: may contain typed text or the names of private screens (as asked);
//  - touch / ui.tap: the same taps under another name;
//  - xhr / fetch / http: request URLs — the map and place-search requests carry coordinates (location data).
const DROPPED_BREADCRUMB_CATEGORIES = new Set(['console', 'ui.click', 'ui.input', 'navigation', 'touch', 'ui.tap', 'xhr', 'fetch', 'http']);

let started = false;

/** Called once at launch: starts the SDK only if the person agreed. A failed read of the choice counts as "not agreed". */
export async function initSentry(): Promise<void> {
  if (started || !SENTRY_DSN || __DEV__) {return;}
  if ((await loadCrashReportsChoice()) !== 'granted') {return;}
  startSentry();
}

/** Records her answer and applies it right away: 'granted' starts the SDK, 'declined' stops it (nothing is sent after that). */
export async function setCrashReportsEnabled(enabled: boolean): Promise<void> {
  await setCrashReportsChoice(enabled ? 'granted' : 'declined');
  if (enabled) {
    startSentry();
  } else if (started) {
    started = false;
    await Sentry.close();
  }
}

function startSentry(): void {
  if (started || !SENTRY_DSN || __DEV__) {return;}
  started = true;

  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    enableAutoPerformanceTracing: false,
    // No breadcrumbs at all. `beforeBreadcrumb` below only sees JavaScript ones; the native layer adds its own (battery level, app
    // foreground/background, network, system events…), so each automatic source is switched off and the buffer is kept empty.
    maxBreadcrumbs: 0,
    enableNetworkBreadcrumbs: false,
    enableNetworkEventBreadcrumbs: false,
    enableActivityLifecycleBreadcrumbs: false,
    enableAppLifecycleBreadcrumbs: false,
    enableSystemEventBreadcrumbs: false,
    enableAppComponentBreadcrumbs: false,
    enableUserInteractionBreadcrumbs: false,
    beforeBreadcrumb: breadcrumb => (breadcrumb.category && DROPPED_BREADCRUMB_CATEGORIES.has(breadcrumb.category) ? null : breadcrumb),
    beforeSend: event => {
      delete event.user;
      delete event.request;
      return event;
    },
  });
}
