import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import i18n from '../../../i18n';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../../state/themePreferences';
import UnderstandCycleArticleScreen from '../UnderstandCycleArticleScreen';

// The legacy "Comprendre ton cycle menstruel" article had its text hard-coded in French for every language. It now
// has a Russian block; French stays the original text and still what en/es/it/tr show (nothing about them changed).

const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const props = {navigation: {goBack: jest.fn(), navigate: jest.fn()}, route: {params: {}}} as unknown as React.ComponentProps<
  typeof UnderstandCycleArticleScreen
>;

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string =>
  renderer.root
    .findAllByType(Text)
    .map(node => [node.props.children].flat(Infinity).filter(child => typeof child === 'string' || typeof child === 'number').join(''))
    .join('\n');

async function render(language: AwaAppLanguage): Promise<string> {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <UnderstandCycleArticleScreen {...props} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  const text = textsOf(renderer);
  act(() => renderer.unmount());
  return text;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Understand-your-cycle article language', () => {
  it('Russian shows the complete Russian article (title, 4 stats, 4 phases, reasons, tips) and no French', async () => {
    const text = await render('ru');
    for (const expected of [
      'Как устроен менструальный цикл',
      'Основные этапы вашего цикла — простыми словами.',
      'Средняя длительность',
      'от 21 до 35 дней',
      'ФАЗЫ ЦИКЛА',
      'Месячные',
      'Фолликулярная фаза',
      'Овуляция',
      'Лютеиновая фаза',
      'Полезно знать',
      'Лучше понимать своё тело',
      'Совет для самочувствия',
    ]) {
      expect(text).toContain(expected);
    }
    expect(text).not.toMatch(/Comprendre|phases du cycle|règles|Conseil bien-être/i);
  });

  it('French keeps the original text, byte for byte where it was hard-coded', async () => {
    const text = await render('fr');
    for (const expected of [
      'Comprendre ton cycle menstruel',
      'Les grandes étapes de ton cycle, expliquées simplement.',
      'PHASES DU CYCLE',
      'Les 4 grandes phases',
      'Phase folliculaire',
      'Conseil bien-être',
    ]) {
      expect(text.replace(/\s+/g, ' ')).toContain(expected);
    }
    expect(text).not.toMatch(/[А-Яа-яЁё]/);
  });

  it('German shows the complete German article and no French or Russian', async () => {
    const text = await render('de');
    for (const expected of [
      'So funktioniert dein Menstruationszyklus',
      'Die wichtigsten Phasen deines Zyklus – einfach erklärt.',
      'Durchschnittliche Dauer',
      'ZYKLUSPHASEN',
      'Follikelphase',
      'Lutealphase',
      'Gut zu wissen',
      'Tipp fürs Wohlbefinden',
    ]) {
      expect(text.replace(/\s+/g, ' ')).toContain(expected);
    }
    expect(text).not.toMatch(/Comprendre|phases du cycle|règles|Conseil bien-être|[А-Яа-яЁё]/i);
  });

  it('English, Spanish, Italian and Turkish are unchanged: the article body is still the French original', async () => {
    // The reading controls under the article ("Start reading", "6 min read") are app chrome and were already
    // localized through t(); only the article body is compared.
    const body = (text: string) => text.slice(0, text.indexOf('au fil des jours.') + 'au fil des jours.'.length);
    const french = body(await render('fr'));
    expect(french).toContain('Conseil bien-être');
    for (const language of ['en', 'es', 'it', 'tr'] as AwaAppLanguage[]) {
      expect(body(await render(language))).toBe(french);
    }
  });
});
