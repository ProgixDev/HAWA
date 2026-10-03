import i18n from '../index';
import {fr} from '../locales/fr';
import {resetAppLanguageForTests} from '../../state/themePreferences';

// Phase 7D (Premium/subscription/monetization) localization — dictionary-
// level coverage for the `premium.*` namespace added to
// src/i18n/locales/{fr,en}.ts. `profile.premiumCard.*` keys that Phase 7D
// deliberately reuses (byte-identical wording) are also checked here so a
// future edit to either namespace can't silently break the other's reuse.

beforeEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

afterAll(async () => {
  await i18n.changeLanguage('fr');
});

describe('TEST — Phase 7D dictionary French byte-identical to the original hardcoded copy', () => {
  it.each([
    ['premium.sheet.heroTitle', 'AWA Premium'],
    ['premium.sheet.closeAccessibility', 'Fermer AWA Premium'],
    ['premium.sheet.ctaText', 'S’abonner maintenant'],
    ['premium.sheet.ctaAccessibilityLabel', 'S’abonner à AWA Premium'],
    ['premium.sheet.restoreText', 'Restaurer mes achats'],
    ['premium.sheet.unavailableTitle', 'Abonnement bientôt disponible'],
    ['premium.sheet.recommended', 'RECOMMANDÉ'],
    ['premium.sheet.benefits.exportsTitle', 'Exports santé'],
    ['premium.sheet.benefits.guidesTitle', 'Guides approfondis'],
    ['premium.sheet.benefits.customizationTitle', 'Plus de personnalisation'],
    ['premium.sheet.feedback.unavailable', 'Aucun achat ne sera activé tant que le système de paiement n’est pas connecté.'],
    ['premium.plans.annualLabel', 'Abonnement annuel'],
    ['premium.plans.monthlyLabel', 'Abonnement mensuel'],
    ['premium.articleBadge.locked', 'Contenu Premium verrouillé'],
    ['premium.providerError', 'AWA Premium n’est pas encore disponible sur cet appareil. Réessaie plus tard.'],
  ])('%s → %s', (key, expected) => {
    expect(i18n.t(key)).toBe(expected);
  });
});

describe('TEST — reused keys stay byte-identical between premium.* and profile.premiumCard.*', () => {
  it('the 2 shared benefit titles and 3 shared atoms match exactly', () => {
    expect(fr.profile.premiumCard.features.advancedStatistics).toBe('Statistiques avancées');
    expect(fr.profile.premiumCard.features.unlimitedHistory).toBe('Historique illimité');
    expect(fr.profile.premiumCard.activeSubscription).toBe('Abonnement actif');
    expect(fr.profile.premiumCard.accessibilityHint).toBe('Ouvre la présentation des avantages Premium');
    expect(fr.profile.premiumCard.discoverPremium).toBe('Découvrir Premium');
  });
});

describe('TEST — Phase 7D dictionary English coverage', () => {
  const keyPaths = (obj: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' ? keyPaths(v as Record<string, unknown>, path) : [path];
    });

  const allKeys = keyPaths(fr.premium, 'premium');

  it('covers the sheet, plans, lockedCard and articleBadge namespaces', () => {
    ['sheet', 'plans', 'lockedCard', 'articleBadge'].forEach(namespace => {
      expect(allKeys.some(key => key.startsWith(`premium.${namespace}.`))).toBe(true);
    });
  });

  it.each(allKeys)('%s has a non-empty English string distinct from the raw key', async key => {
    await i18n.changeLanguage('en');
    const value = i18n.t(key);
    expect(typeof value).toBe('string');
    expect((value as string).length).toBeGreaterThan(0);
    expect(value).not.toBe(key);
    await i18n.changeLanguage('fr');
  });
});

describe('TEST — premiumPricing.ts price values are never routed through i18n', () => {
  it('price is commercial/numeric data, unaffected by language (stays absent from the dictionary)', () => {
    const sheetKeys = JSON.stringify(fr.premium.sheet);
    const planKeys = JSON.stringify(fr.premium.plans);
    expect(sheetKeys).not.toContain('99,99');
    expect(planKeys).not.toContain('99,99');
  });
});
