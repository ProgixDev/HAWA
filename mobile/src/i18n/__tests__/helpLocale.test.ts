import i18n from '../index';
import {fr} from '../locales/fr';
import {getFaqItems, getGuideItems, getCycleTrackingFaqItems, faqCategoryLabel} from '../../utils/supportContent';
import {resetAppLanguageForTests} from '../../state/themePreferences';

// Phase 5 (Help/FAQ) localization — dictionary-level coverage for
// src/i18n/locales/{fr,en}.ts's `help` namespace, and functional coverage
// for supportContent.ts's t()-driven factory functions (getFaqItems,
// getGuideItems, getCycleTrackingFaqItems, faqCategoryLabel).

beforeEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

afterAll(async () => {
  await i18n.changeLanguage('fr');
});

describe('help dictionary — French byte-identical to pre-Phase-5 hardcoded copy', () => {
  it.each([
    ['help.faq.cycle-record-period.question', 'Comment enregistrer mes règles ?'],
    ['help.faq.spiritual-nifas.answer', 'AWA peut présenter la référence juridique retenue pour la durée maximale du nifas, en signalant les divergences entre écoles lorsque le contenu validé le prévoit. L’application ne doit pas imposer un chiffre unique comme vérité absolue.'],
    ['help.faq.journal-what-can-track.subtitleDaughter', 'Symptômes, humeur, sommeil, activité, hydratation, flux menstruel et notes.'],
    ['help.guides.getting-started.title', 'Bien démarrer avec AWA'],
    ['help.categories.spiritual', 'Repères spirituels'],
    ['help.helpSupport.title', 'Aide & support'],
    ['help.helpSupport.modal.bugCategories.display', 'Problème d’affichage'],
    ['help.faqScreen.title', 'Questions fréquentes'],
    ['help.whatsNewScreen.heading', 'AWA continue d’évoluer'],
  ])('%s → %s', (key, expected) => {
    expect(i18n.t(key)).toBe(expected);
  });
});

describe('help dictionary — English coverage', () => {
  const keyPaths = (obj: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' ? keyPaths(v as Record<string, unknown>, path) : [path];
    });

  const allKeys = keyPaths(fr.help, 'help');

  it('covers faq, guides, categories and every screen namespace', () => {
    ['faq', 'guides', 'categories', 'helpSupport', 'faqScreen', 'guidesScreen', 'whatsNewScreen'].forEach(namespace => {
      expect(allKeys.some(key => key.startsWith(`help.${namespace}.`))).toBe(true);
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

describe('getFaqItems / getGuideItems / faqCategoryLabel — language-aware, same ids across languages', () => {
  it('French and English produce the same 52 ids, different text', async () => {
    const frItems = getFaqItems(i18n.t.bind(i18n));
    await i18n.changeLanguage('en');
    const enItems = getFaqItems(i18n.t.bind(i18n));
    await i18n.changeLanguage('fr');

    expect(enItems.map(item => item.id)).toEqual(frItems.map(item => item.id));
    expect(frItems.length).toBeGreaterThan(50);

    const frFirst = frItems.find(item => item.id === 'cycle-record-period')!;
    const enFirst = enItems.find(item => item.id === 'cycle-record-period')!;
    expect(frFirst.question).toBe('Comment enregistrer mes règles ?');
    expect(enFirst.question).toBe('How do I log my period?');
    expect(frFirst.category).toBe(enFirst.category); // internal identifier, never translated
  });

  it('category label is translated for display while the internal category identifier stays French', async () => {
    const items = getFaqItems(i18n.t.bind(i18n));
    const item = items.find(i => i.id === 'spiritual-hijri')!;
    expect(item.category).toBe('Repères spirituels');
    expect(faqCategoryLabel(item.category, i18n.t.bind(i18n))).toBe('Repères spirituels');

    await i18n.changeLanguage('en');
    expect(item.category).toBe('Repères spirituels'); // unchanged identifier
    expect(faqCategoryLabel(item.category, i18n.t.bind(i18n))).toBe('Spiritual markers');
    await i18n.changeLanguage('fr');
  });

  it('the managed-daughter FAQ subset stays limited to cycle + journal override in both languages', async () => {
    const frDaughter = getCycleTrackingFaqItems(i18n.t.bind(i18n));
    expect(frDaughter.every(item => item.objective === 'cycle' || item.id === 'journal-what-can-track')).toBe(true);
    expect(frDaughter.find(item => item.id === 'journal-what-can-track')?.answer).toContain('hydratation');

    await i18n.changeLanguage('en');
    const enDaughter = getCycleTrackingFaqItems(i18n.t.bind(i18n));
    expect(enDaughter.map(item => item.id)).toEqual(frDaughter.map(item => item.id));
    expect(enDaughter.find(item => item.id === 'journal-what-can-track')?.answer).toContain('hydration');
    await i18n.changeLanguage('fr');
  });

  it('getGuideItems returns all 13 guides with language-aware title/text', async () => {
    const frGuides = getGuideItems(i18n.t.bind(i18n));
    expect(frGuides).toHaveLength(13);
    const frGetStarted = frGuides.find(g => g.id === 'getting-started')!;
    expect(frGetStarted.title).toBe('Bien démarrer avec AWA');

    await i18n.changeLanguage('en');
    const enGuides = getGuideItems(i18n.t.bind(i18n));
    expect(enGuides.map(g => g.id)).toEqual(frGuides.map(g => g.id));
    expect(enGuides.find(g => g.id === 'getting-started')?.title).toBe('Getting started with AWA');
    await i18n.changeLanguage('fr');
  });
});
