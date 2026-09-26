// French wording around the partner's name in "AWA à deux". The name is the user's own
// input (awaADeuxPartnerStore); when none is configured the wording stays NEUTRAL
// ("votre partenaire") — a missing name never becomes a made-up person.
//
// Only the few forms that need care are here (elision, capital letter at the start of a
// sentence); screens build their sentences from these two building blocks.

const NEUTRAL = 'votre partenaire';

const clean = (name: string | null | undefined) => (name ?? '').trim();

/** In the middle of a sentence: "Amine" / "votre partenaire" ("avec Amine", "Invitez votre partenaire"). */
export const partnerLabel = (name: string | null | undefined): string => clean(name) || NEUTRAL;

/** At the start of a sentence: "Amine" / "Votre partenaire". */
export const partnerSubject = (name: string | null | undefined): string => {
  const value = clean(name);
  return value || 'Votre partenaire';
};

const STARTS_WITH_VOWEL = /^[aeiouyàâäéèêëîïôöùûüœæ]/i;

/**
 * "que" in front of the name, elided before a vowel: "que Mohamed", "qu’Amine",
 * "que votre partenaire". (An h is left alone: "que Hamza".)
 */
export const queBeforePartner = (name: string | null | undefined): string => {
  const value = clean(name);
  if (!value) {return `que ${NEUTRAL}`;}
  return STARTS_WITH_VOWEL.test(value) ? `qu’${value}` : `que ${value}`;
};
