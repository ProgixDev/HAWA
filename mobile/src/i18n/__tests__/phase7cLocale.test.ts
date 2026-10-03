import i18n from '../index';
import {fr} from '../locales/fr';
import {resetAppLanguageForTests} from '../../state/themePreferences';

// Phase 7C (App Lock / PIN setup-confirm-management / biometrics-Face ID /
// PrivateAccess / SecuritySetup) localization — dictionary-level coverage for
// the `security`, `biometrics`, `appLock`, `pinSetup`, `pinConfirm`,
// `pinManagement`, `pinKeypad`, `faceIdSetup`, `privateAccess` and
// `securitySetup` namespaces. These are deliberately separate from the
// pre-existing `privateSectionAuth`/`privateIntimacy*` namespaces, which
// belong to a different security system (the "Vie intime" private section).

beforeEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

afterAll(async () => {
  await i18n.changeLanguage('fr');
});

describe('TEST — Phase 7C dictionary French byte-identical to the original hardcoded copy', () => {
  it.each([
    ['appLock.title', 'Ton espace est protégé'],
    ['appLock.biometricPromptTitle', 'Déverrouiller AWA'],
    ['security.incorrectCode', 'Code incorrect. Réessaie.'],
    ['security.codesDontMatch', 'Les codes ne correspondent pas. Recommence.'],
    ['biometrics.faceId', 'Face ID'],
    ['biometrics.useFingerprint', 'Utiliser l’empreinte digitale'],
    ['pinSetup.createTitle', 'Crée ton code PIN'],
    ['pinSetup.footerNote', 'Ton code reste protégé dans le stockage sécurisé de cet appareil.'],
    ['pinConfirm.title', 'Confirme ton code PIN'],
    ['pinManagement.title', 'Code PIN'],
    ['pinManagement.protectionEnabled', 'Protection activée'],
    ['pinKeypad.deleteLastDigit', 'Effacer le dernier chiffre'],
    ['faceIdSetup.secureVerificationTitle', 'Vérification sécurisée'],
    ['privateAccess.title', 'Espace privé'],
    ['privateAccess.purposeMiscarriagePersonalNotes', 'Tes notes personnelles sont protégées.'],
    ['securitySetup.heroTitle', 'Protège ton espace'],
    ['securitySetup.pinDescription', 'Verrouille AWA à l’ouverture avec un code personnel.'],
  ])('%s → %s', (key, expected) => {
    expect(i18n.t(key)).toBe(expected);
  });

  it('pluralizes securitySetup.statusActiveCount correctly in French', () => {
    expect(i18n.t('securitySetup.statusActiveCount', {count: 1})).toBe('1 protection activée');
    expect(i18n.t('securitySetup.statusActiveCount', {count: 3})).toBe('3 protections activées');
  });
});

describe('TEST — Phase 7C dictionary English coverage', () => {
  const keyPaths = (obj: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' ? keyPaths(v as Record<string, unknown>, path) : [path];
    });

  const namespaces = ['security', 'biometrics', 'appLock', 'pinSetup', 'pinConfirm', 'pinManagement', 'pinKeypad', 'faceIdSetup', 'privateAccess', 'securitySetup'] as const;
  const allKeys = namespaces.flatMap(namespace => keyPaths((fr as Record<string, unknown>)[namespace] as Record<string, unknown>, namespace));

  it('covers every Phase 7C namespace', () => {
    namespaces.forEach(namespace => {
      expect(allKeys.some(key => key.startsWith(`${namespace}.`))).toBe(true);
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

describe('TEST — Phase 7C namespaces never duplicate the private-section (Vie intime) dictionary', () => {
  it('privateAccess/appLock/pinSetup never redefine privateSectionAuth’s own keys', () => {
    const phase7cKeys = JSON.stringify({...fr.privateAccess, ...fr.appLock, ...fr.pinSetup});
    // privateSectionAuth uses a 6-digit PIN with its own distinct copy voice
    // ("Espace privé AWA") — Phase 7C's PrivateAccess screen has a similar
    // but textually different title ("Espace privé") confirmed intentionally
    // separate, not reused, per the architecture audit.
    expect(phase7cKeys).not.toContain('Espace privé AWA');
  });
});
