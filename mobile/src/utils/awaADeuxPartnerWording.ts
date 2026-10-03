// Wording around the partner's name in "AWA à deux". The name is the user's own input
// (awaADeuxPartnerStore); when none is configured the wording stays NEUTRAL ("votre
// partenaire" / "your partner") — a missing name never becomes a made-up person.
//
// partnerLabel/partnerSubject only ever need a translated NEUTRAL fallback (a real name
// is dropped into either language's sentence unchanged, no grammar divergence) — they
// read the live app language via i18n.t(), same non-component pattern as cycleMath.ts's
// averageCycle.* usage, so every call site stays reactive to a runtime language switch
// without needing a `t` parameter threaded through.
//
// queBeforePartner stays PURE FRENCH: French elision ("que" → "qu'" before a vowel) has
// no English equivalent, so English sentences are built from partnerLabel/partnerSubject
// directly instead of reusing this fragment — see each call site's own description key,
// which interpolates a French-only {{quePartner}} alongside a plain {{name}}/{{partner}}
// so each language's template can pick whichever matches its own grammar.
import i18n from '../i18n';

const clean = (name: string | null | undefined) => (name ?? '').trim();

/** In the middle of a sentence: "Amine" / "votre partenaire" ("avec Amine", "Invitez votre partenaire"). */
export const partnerLabel = (name: string | null | undefined): string => clean(name) || i18n.t('awaADeux.neutralPartnerLabel');

/** At the start of a sentence: "Amine" / "Votre partenaire". */
export const partnerSubject = (name: string | null | undefined): string => {
  const value = clean(name);
  return value || i18n.t('awaADeux.neutralPartnerSubject');
};

const STARTS_WITH_VOWEL = /^[aeiouyàâäéèêëîïôöùûüœæ]/i;

/**
 * FRENCH ONLY — "que" in front of the name, elided before a vowel: "que Mohamed",
 * "qu’Amine", "que votre partenaire". (An h is left alone: "que Hamza".)
 */
export const queBeforePartner = (name: string | null | undefined): string => {
  const value = clean(name);
  if (!value) {return `que ${i18n.t('awaADeux.neutralPartnerLabel', {lng: 'fr'})}`;}
  return STARTS_WITH_VOWEL.test(value) ? `qu’${value}` : `que ${value}`;
};
