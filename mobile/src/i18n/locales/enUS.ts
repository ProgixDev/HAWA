// American English ('en-US') dictionary = the English dictionary ('en') with the few strings whose US spelling differs. OVERLAY: i18next falls back
// key by key to 'en' (see i18n/index.ts), so every other string is shared, never duplicated. The same word list (enUsSpelling.ts) is applied to the
// library articles and the pregnancy-week texts. Date, number and weekday formatting use the en-US locale (utils/cycleMath.ts).
export const enUS = {
  security: {
    authCancelledOrUnavailable: "Authentication canceled or unavailable."
  },
  faceIdSetup: {
    authFailedOrCancelled: "Authentication failed or was canceled."
  }
};
