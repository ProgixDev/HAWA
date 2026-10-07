import i18n from '../index';
import {en} from '../locales/en';
import {es} from '../locales/es';
import {fr} from '../locales/fr';
import {partnerLabel, queBeforePartner} from '../../utils/awaADeuxPartnerWording';

// Spanish localization readiness — PART 3: pure-data structural coverage of
// the es.ts dictionary against fr.ts/en.ts (no React render, just the
// plain TS module objects — same "import the locale object directly"
// technique already used throughout src/i18n/__tests__), plus the two
// AWA Together ("AWA à deux" / "AWA Together" / "AWA Pareja") strings that
// were just fixed to drop their French-only {{quePartner}} grammar-helper
// dependency in Spanish.

type AnyRecord = Record<string, unknown>;

function leafPaths(obj: AnyRecord, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return leafPaths(value as AnyRecord, path);
    }
    return [path];
  });
}

function leafValue(obj: AnyRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => (acc as AnyRecord | undefined)?.[segment], obj);
}

function jsType(value: unknown): string {
  return Array.isArray(value) ? 'array' : typeof value;
}

const frPaths = leafPaths(fr as AnyRecord);
const enPaths = leafPaths(en as AnyRecord);
const esPaths = leafPaths(es as AnyRecord);
const frPathSet = new Set(frPaths);
const enPathSet = new Set(enPaths);
const esPathSet = new Set(esPaths);

describe('TEST — Spanish dictionary leaf-key parity with fr/en (cases 16-18)', () => {
  it('16. es has exactly 6080 leaf keys, matching fr and en 1:1 (no missing, no extra)', () => {
    // Grown from the original 6064 across several localization fix passes
    // (dataPrivacy.*, profile.managedProfiles.swipeDeleteLabel,
    // profile.editAvatarAccessibility/editAnonymousAvatarAccessibility,
    // pregnancyEvent.form.deleting/deleteModalCloseAccessibility for the
    // AWA-styled delete confirmation modal) — always added identically to
    // all 3 languages, which is exactly what the checks below verify.
    expect(esPaths.length).toBe(6084);
    expect(frPaths.length).toBe(6084);
    expect(enPaths.length).toBe(6084);

    const missingFromEsVsFr = frPaths.filter(p => !esPathSet.has(p));
    const extraInEsVsFr = esPaths.filter(p => !frPathSet.has(p));
    expect(missingFromEsVsFr).toEqual([]);
    expect(extraInEsVsFr).toEqual([]);

    const missingFromEsVsEn = enPaths.filter(p => !esPathSet.has(p));
    const extraInEsVsEn = esPaths.filter(p => !enPathSet.has(p));
    expect(missingFromEsVsEn).toEqual([]);
    expect(extraInEsVsEn).toEqual([]);
  });

  it('17. no Spanish keys are missing relative to fr or en', () => {
    expect(frPaths.filter(p => !esPathSet.has(p))).toEqual([]);
    expect(enPaths.filter(p => !esPathSet.has(p))).toEqual([]);
  });

  it('18. no extra Spanish keys exist beyond what fr and en define', () => {
    expect(esPaths.filter(p => !frPathSet.has(p))).toEqual([]);
    expect(esPaths.filter(p => !enPathSet.has(p))).toEqual([]);
  });
});

describe('TEST — no leaf-value type mismatches between fr/en/es (case 19)', () => {
  it('every shared leaf path has the same JS type (string/number/array) in fr, en and es', () => {
    const mismatches: string[] = [];
    frPaths.forEach(path => {
      const frType = jsType(leafValue(fr as AnyRecord, path));
      const enType = jsType(leafValue(en as AnyRecord, path));
      const esType = jsType(leafValue(es as AnyRecord, path));
      if (frType !== esType || enType !== esType) {
        mismatches.push(`${path}: fr=${frType} en=${enType} es=${esType}`);
      }
    });
    expect(mismatches).toEqual([]);
  });
});

describe('TEST — Spanish interpolation-variable compatibility (case 20)', () => {
  const INTERPOLATION_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

  function varsOf(value: unknown): Set<string> {
    if (typeof value !== 'string') {
      return new Set();
    }
    const vars = new Set<string>();
    let match: RegExpExecArray | null;
    INTERPOLATION_RE.lastIndex = 0;
    while ((match = INTERPOLATION_RE.exec(value))) {
      vars.add(match[1]);
    }
    return vars;
  }

  // KNOWN, INTENTIONAL exception — do NOT treat these as defects. French
  // legitimately uses {{quePartner}} here (queBeforePartner — French elision
  // grammar with no English/Spanish equivalent, see
  // src/utils/awaADeuxPartnerWording.ts's header comment); Spanish and
  // English both legitimately use {{name}} instead. This allowlist exists so
  // the general subset rule below doesn't misfire on these two keys, while
  // still catching a future regression (see the dedicated assertions below).
  const KNOWN_FRENCH_ONLY_QUE_PARTNER_KEYS = new Set(['awaADeux.partnerView.titleWithName', 'awaADeux.pending.statusDescription']);

  it.each(frPaths)('%s — Spanish interpolation variables are known/compatible, not a stray regression', path => {
    const frVars = varsOf(leafValue(fr as AnyRecord, path));
    const enVars = varsOf(leafValue(en as AnyRecord, path));
    const esVars = varsOf(leafValue(es as AnyRecord, path));

    if (KNOWN_FRENCH_ONLY_QUE_PARTNER_KEYS.has(path)) {
      // The documented divergence must still hold exactly as described...
      expect(frVars.has('quePartner')).toBe(true);
      expect(enVars.has('quePartner')).toBe(false);
      // ...and must never regress back to {{quePartner}} in Spanish.
      expect(esVars.has('quePartner')).toBe(false);
      expect(esVars.has('name')).toBe(true);
      expect(esVars).toEqual(enVars);
      return;
    }

    // General rule for every other key: Spanish must never introduce an
    // interpolation variable that isn't already known to be supplied by a
    // real caller — using fr's and en's own (already-shipped, already
    // exercised) variable usage at this exact key as the ground truth of
    // "known to be supplied by some caller".
    const known = new Set([...frVars, ...enVars]);
    const unknownInEs = [...esVars].filter(v => !known.has(v));
    expect(unknownInEs).toEqual([]);
  });
});

describe('TEST — AWA Together (AWA à deux / AWA Together / AWA Pareja) Spanish regression (cases 21-25)', () => {
  const NAMES = ['Amine', 'Elena', 'Inès', 'Moussa'];

  beforeEach(async () => {
    await i18n.changeLanguage('es');
  });

  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it.each(NAMES)(
    'titleWithName for partner "%s" reads natural Spanish, no French leakage, no unresolved tokens (21-24)',
    name => {
      // Exact real call site: AwaADeuxPartnerViewScreen.tsx builds its title
      // from BOTH {{quePartner}} (French-only) and {{name}} so each
      // language's template can pick whichever matches its own grammar.
      const rendered = i18n.t('awaADeux.partnerView.titleWithName', {
        quePartner: queBeforePartner(name),
        name: partnerLabel(name),
      }) as string;

      // es.ts's current real template is 'Lo que ve\n{{name}}'.
      expect(rendered).toBe(`Lo que ve\n${name}`);
      expect(rendered).not.toMatch(/qu['’]/);
      expect(rendered).not.toContain('votre partenaire');
      expect(rendered).not.toContain('{{quePartner}}');
      expect(rendered).not.toContain('{{name}}');
    },
  );

  it.each(NAMES)('pending.statusDescription for partner "%s" reads natural Spanish, no French leakage, no unresolved tokens (21-24)', name => {
    // Exact real call site: AwaADeuxPendingScreen.tsx.
    const label = partnerLabel(name);
    const rendered = i18n.t('awaADeux.pending.statusDescription', {
      quePartner: queBeforePartner(name),
      name: label,
    }) as string;

    // es.ts's current real template is 'Te avisaremos en cuanto {{name}} acepte tu invitación.'.
    expect(rendered).toBe(`Te avisaremos en cuanto ${name} acepte tu invitación.`);
    expect(rendered).not.toMatch(/qu['’]/);
    expect(rendered).not.toContain('votre partenaire');
    expect(rendered).not.toContain('{{quePartner}}');
    expect(rendered).not.toContain('{{name}}');
  });

  it('25. no partner name configured: both keys fall back to natural, neutral Spanish ("pareja"), never French', () => {
    const neutralTitle = i18n.t('awaADeux.partnerView.titleNeutral') as string;
    expect(neutralTitle).toBe('Lo que tu\npareja ve');
    expect(neutralTitle).toContain('pareja');
    expect(neutralTitle).not.toContain('partenaire');

    // partnerLabel(null) is the real fallback AwaADeuxPendingScreen.tsx
    // passes as `label`/`{{name}}` when no partner name is configured.
    const label = partnerLabel(null);
    expect(label).toBe('tu pareja');

    const rendered = i18n.t('awaADeux.pending.statusDescription', {
      quePartner: queBeforePartner(null),
      name: label,
    }) as string;

    expect(rendered).toBe('Te avisaremos en cuanto tu pareja acepte tu invitación.');
    expect(rendered).toContain('pareja');
    expect(rendered).not.toContain('votre partenaire');
    expect(rendered).not.toContain('{{quePartner}}');
    expect(rendered).not.toContain('{{name}}');
  });

  it('preserves established product-name wording per language (fr: "AWA à deux", en: "AWA Together", es: its own established wording)', () => {
    expect(i18n.t('awaADeux.intro.discoverAccessibility', {lng: 'fr'})).toBe('Découvrir AWA à deux');
    expect(i18n.t('awaADeux.intro.discoverAccessibility', {lng: 'en'})).toBe('Discover AWA Together');

    const esWording = i18n.t('awaADeux.intro.discoverAccessibility', {lng: 'es'}) as string;
    expect(esWording).not.toContain('à deux');
    expect(esWording).not.toContain('Together');
    expect(esWording).toContain('Pareja'); // the wording already established in es.ts
  });
});
