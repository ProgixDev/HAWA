import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import {getAppLanguage, subscribeThemePreferences} from '../state/themePreferences';
import {en} from './locales/en';
import {es} from './locales/es';
import {fr} from './locales/fr';
import {it} from './locales/it';
import {ru} from './locales/ru';
import {de} from './locales/de';
import {zh} from './locales/zh';
import {tr} from './locales/tr';
import {id} from './locales/id';
import {hi} from './locales/hi';
import {sq} from './locales/sq';
import {ja} from './locales/ja';
import {ko} from './locales/ko';
import {ptPT} from './locales/ptPT';
import {ptBR} from './locales/ptBR';
import {ar} from './locales/ar';
import {kab} from './locales/kab';
import {om} from './locales/om';
import {ti} from './locales/ti';
import {rw} from './locales/rw';
import {rn} from './locales/rn';
import {ig} from './locales/ig';
import {yo} from './locales/yo';
import {zu} from './locales/zu';
import {xh} from './locales/xh';
import {sn} from './locales/sn';
import {ln} from './locales/ln';
import {ff} from './locales/ff';
import {enUS} from './locales/enUS';
import {applyLayoutDirectionForLanguage} from './layoutDirection';
import {zhHant} from './locales/zhHant';
import {bn} from './locales/bn';
import {da} from './locales/da';
import {sv} from './locales/sv';
import {nb} from './locales/nb';
import {pl} from './locales/pl';
import {uk} from './locales/uk';
import {cs} from './locales/cs';
import {sk} from './locales/sk';
import {hu} from './locales/hu';
import {ro} from './locales/ro';
import {bg} from './locales/bg';
import {sr} from './locales/sr';
import {hr} from './locales/hr';
import {bs} from './locales/bs';
import {sl} from './locales/sl';
import {ne} from './locales/ne';
import {si} from './locales/si';
import {th} from './locales/th';
import {vi} from './locales/vi';
import {uz} from './locales/uz';
import {az} from './locales/az';
import {ka} from './locales/ka';
import {hy} from './locales/hy';
import {tg} from './locales/tg';
import {ky} from './locales/ky';
import {tk} from './locales/tk';
import {ms} from './locales/ms';
import {so} from './locales/so';
import {sw} from './locales/sw';
import {kk} from './locales/kk';
import {wo} from './locales/wo';
import {ha} from './locales/ha';
import {am} from './locales/am';
import {nl} from './locales/nl';
import {fi} from './locales/fi';
import {el} from './locales/el';
import {fil} from './locales/fil';
import {ta} from './locales/ta';
import {te} from './locales/te';
import {mr} from './locales/mr';
import {gu} from './locales/gu';
import {pa} from './locales/pa';
import {my} from './locales/my';
import {km} from './locales/km';
import {lo} from './locales/lo';
import './pluralRules';

// Centralized localization (i18next + react-i18next) — imported once, as a
// side effect, at app startup (App.tsx), the same "hydrate/initialize before
// any screen mounts" convention every other global store in this app already
// uses. Not a native module: pure JS, no linking, no device-locale
// detection — the active language is entirely driven by AWA's own "Langue de
// l'application" preference (themePreferences.ts's getAppLanguage/
// setAppLanguage).
//
// SYSTEM LANGUAGE (supersedes the paragraph below for first launch): the language in force is the user's manual choice,
// otherwise the phone's language, otherwise English (state/themePreferences.ts). The `lng` below is only i18next's value
// until App.tsx's start-up gate has called initializeAppLanguage() (i18n/appLanguage.ts), which resolves it before the
// first screen renders; `fallbackLng` stays English for any missing translation.
//
// PHASE 7M — English-first default: `lng`/`fallbackLng` are both 'en' now,
// matching themePreferences.ts's DEFAULT_APP_LANGUAGE. A brand-new install
// (or any install with no/invalid persisted value) therefore renders in
// English from this very first synchronous `init()` call — no hydration
// round-trip is needed to reach the correct language for that case, so
// there is no French flash on a fresh English-default launch. An existing
// install with an explicitly persisted 'fr' preference still correctly ends
// up in French once hydrateAppearancePreferences() (App.tsx) resolves and
// the subscribeThemePreferences listener below calls changeLanguage('fr') —
// exactly the same async hydration pattern every other preference in this
// app already uses (theme id, appearance mode, true black).
//
// Language is deliberately app-wide (never profile-scoped — see
// themePreferences.ts's own header comment): this module subscribes to the
// SAME notify() mechanism appearanceMode/trueBlackEnabled already use,
// rather than owning a second "current language" concept. Selecting a new
// language in AppearanceScreen's language sheet (setAppLanguage()) is the
// ONLY way this ever changes — nothing here is derived from the device.
//
// Coverage: only the screens that have been migrated to `useTranslation()`
// so far read from `resources` below — see fr.ts's own header comment for
// exactly what that is (Phase 1) and what still renders in French regardless
// of the selected language (Phase 2+, tracked separately).
i18n.use(initReactI18next).init({
  resources: {
    fr: {translation: fr},
    en: {translation: en},
    // American English is an OVERLAY: only the strings that differ from English (see the fallback chain below).
    'en-US': {translation: enUS},
    es: {translation: es},
    it: {translation: it},
    tr: {translation: tr},
    ru: {translation: ru},
    de: {translation: de},
    zh: {translation: zh},
    // Traditional Chinese is a COMPLETE dictionary (converted from zh and reviewed for Taiwan wording); 'zh' is only its safety net.
    'zh-Hant': {translation: zhHant},
    id: {translation: id},
    hi: {translation: hi},
    sq: {translation: sq},
    ja: {translation: ja},
    ko: {translation: ko},
    'pt-PT': {translation: ptPT},
    // Brazilian Portuguese is an OVERLAY: only the strings that differ from Portugal (see the fallback chain below).
    'pt-BR': {translation: ptBR},
    bn: {translation: bn},
    da: {translation: da},
    sv: {translation: sv},
    nb: {translation: nb},
    pl: {translation: pl},
    uk: {translation: uk},
    cs: {translation: cs},
    sk: {translation: sk},
    hu: {translation: hu},
    ro: {translation: ro},
    bg: {translation: bg},
    sr: {translation: sr},
    hr: {translation: hr},
    bs: {translation: bs},
    sl: {translation: sl},
    ne: {translation: ne},
    si: {translation: si},
    th: {translation: th},
    vi: {translation: vi},
    uz: {translation: uz},
    az: {translation: az},
    ka: {translation: ka},
    hy: {translation: hy},
    tg: {translation: tg},
    ky: {translation: ky},
    tk: {translation: tk},
    ms: {translation: ms},
    so: {translation: so},
    sw: {translation: sw},
    kk: {translation: kk},
    wo: {translation: wo},
    ha: {translation: ha},
    am: {translation: am},
    nl: {translation: nl},
    fi: {translation: fi},
    el: {translation: el},
    fil: {translation: fil},
    ta: {translation: ta},
    te: {translation: te},
    mr: {translation: mr},
    gu: {translation: gu},
    pa: {translation: pa},
    my: {translation: my},
    km: {translation: km},
    lo: {translation: lo},
    // Arabic is a COMPLETE dictionary with the six CLDR plural forms (_zero/_one/_two/_few/_many/_other); English is only its safety net.
    ar: {translation: ar},
    // kab om ti rw rn ig yo zu xh sn ln ff: complete dictionaries (AI-written, native review required); English is their safety net.
    kab: {translation: kab},
    om: {translation: om},
    ti: {translation: ti},
    rw: {translation: rw},
    rn: {translation: rn},
    ig: {translation: ig},
    yo: {translation: yo},
    zu: {translation: zu},
    xh: {translation: xh},
    sn: {translation: sn},
    ln: {translation: ln},
    ff: {translation: ff},
  },
  lng: getAppLanguage(),
  // pt-BR reads key by key: Brazilian overlay → Portugal dictionary → English; en-US: US overlay → English; zh-Hant: Traditional → Simplified → English. Every other language falls back to English only.
  fallbackLng: {'pt-BR': ['pt-PT', 'en'], 'en-US': ['en'], 'zh-Hant': ['zh', 'en'], default: ['en']},
  interpolation: {escapeValue: false}, // React already escapes rendered text
  returnNull: false,
});

subscribeThemePreferences(() => {
  const language = getAppLanguage();
  // Arabic is right-to-left: the layout direction follows every language change (applies at the next start; a prompt asks to reopen AWA).
  applyLayoutDirectionForLanguage(language);
  if (i18n.language !== language) {
    i18n.changeLanguage(language).catch(() => {});
  }
});

export default i18n;
