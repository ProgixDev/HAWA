import i18n from '../index';
import {fr} from '../locales/fr';
import {resetAppLanguageForTests} from '../../state/themePreferences';

// Phase 7B (first-run / onboarding / authentication / anonymous mode)
// localization — dictionary-level coverage for the `onboarding`, `auth` and
// `anonymous` namespaces added to src/i18n/locales/{fr,en}.ts, plus the
// `common.yes`/`common.no`/`common.dateToCheck` additions reused across them.

beforeEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

afterAll(async () => {
  await i18n.changeLanguage('fr');
});

describe('TEST 1 — Phase 7B dictionary French byte-identical to the original hardcoded copy', () => {
  it.each([
    ['onboarding.splash.logoLabel', 'Logo AWA'],
    ['onboarding.welcome.title', 'Bienvenue'],
    ['onboarding.welcome.alreadyHaveAccount', 'J’ai déjà un compte'],
    ['onboarding.name.title', 'Comment souhaites-tu\nqu’AWA t’appelle ?'],
    ['onboarding.name.previewGreeting', 'As-salamu ‘alaykum, {{name}} ✨'],
    ['onboarding.spiritual.featureHijri', 'Calendrier hijri'],
    ['onboarding.summary.heroTitle', 'Tout est prêt'],
    ['onboarding.summary.rows.notProvidedFem', 'Non renseignée'],
    ['onboarding.summary.rows.notProvidedMasc', 'Non renseigné'],
    ['auth.shared.tabLogin', 'Connexion'],
    ['auth.shared.tabRegister', 'Créer un compte'],
    ['auth.login.forgotPassword', 'Mot de passe oublié ?'],
    ['auth.registration.title', 'Créer votre compte'],
    ['auth.registration.toggleVisibilityLabel', '{{action}} : {{label}}'],
    ['auth.forgotPassword.emailRequiredError', 'Entre ton adresse e-mail.'],
    ['auth.forgotPassword.emailInvalidError', 'Entre une adresse e-mail valide.'],
    ['anonymous.mode.headerTitle', 'Mode anonyme'],
    ['anonymous.limitations.activate', 'Activer le mode anonyme'],
    ['anonymous.creating.step1', 'Préparation de ton espace'],
    ['anonymous.success.title', 'Mode anonyme activé'],
    ['anonymous.avatarStyles.hijab', 'Avatar avec hijab'],
    ['common.yes', 'Oui'],
    ['common.no', 'Non'],
    ['common.dateToCheck', 'Date à vérifier'],
  ])('%s → %s', (key, expected) => {
    expect(i18n.t(key)).toBe(expected);
  });
});

describe('TEST 2 — Phase 7B dictionary English coverage', () => {
  const keyPaths = (obj: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' ? keyPaths(v as Record<string, unknown>, path) : [path];
    });

  const onboardingKeys = keyPaths(fr.onboarding, 'onboarding');
  const authKeys = keyPaths(fr.auth, 'auth');
  const anonymousKeys = keyPaths(fr.anonymous, 'anonymous');
  const allKeys = [...onboardingKeys, ...authKeys, ...anonymousKeys];

  it('covers every Phase 7B screen namespace', () => {
    ['splash', 'welcome', 'name', 'spiritual', 'summary'].forEach(namespace => {
      expect(onboardingKeys.some(key => key.startsWith(`onboarding.${namespace}.`))).toBe(true);
    });
    ['shared', 'login', 'registration', 'forgotPassword'].forEach(namespace => {
      expect(authKeys.some(key => key.startsWith(`auth.${namespace}.`))).toBe(true);
    });
    ['mode', 'limitations', 'creating', 'success', 'avatar', 'avatarStyles'].forEach(namespace => {
      expect(anonymousKeys.some(key => key.startsWith(`anonymous.${namespace}.`))).toBe(true);
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

describe('TEST 3 — objective labels are reused, never recreated', () => {
  it('onboarding.summary never defines its own copy of the 8 objective labels', () => {
    const summaryKeys = JSON.stringify(fr.onboarding.summary);
    expect(summaryKeys).not.toContain('Essayer de concevoir');
    expect(summaryKeys).not.toContain('Suivre mon cycle');
  });
});
