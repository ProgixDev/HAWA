import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import {
  getBottomPadding,
  getTopPadding,
  READING_CONTROLS_SPACE,
} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

const ID = 'firstperiod-cycle-irregulier';

const HERO = require('../../assets/images/library/regular-cycle-hero.png');

// Images/ids stay language-neutral — only TEXT (title/meta) moves into the
// bilingual CONTENT object below, keyed by index to stay aligned with these.
const RELATED_IMAGES = [
  require('../../assets/images/library/regular-cycle-hero.png'),
  require('../../assets/images/library/cycle-phases-hero.png'),
  require('../../assets/images/library/popular-flower.png'),
] as const;

const RELATED_IDS = [
  'cycle-comprendre-ton-cycle',
  'firstperiod-premieres-regles',
  'firstperiod-questions-frequentes',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Mes premières règles sont\nirrégulières : est-ce normal ?',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Oui, c’est tout à fait normal. Voici pourquoi le cycle met du temps à se stabiliser, et quand il est utile d’en parler.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi le cycle est irrégulier au début',
      'Combien de temps pour se stabiliser',
      'Quand consulter',
    ],
    body1: 'Les hormones qui régulent le cycle mettent du temps à trouver leur équilibre. Il est donc fréquent que les cycles soient plus courts, plus longs, ou espacés de façon inégale pendant les premières années.',
    body2: 'Le cycle peut mettre un à deux ans, parfois un peu plus, avant de devenir plus régulier. Ce temps d’adaptation varie beaucoup d’une personne à l’autre, sans que cela pose problème.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Un cycle irrégulier au début n’est jamais considéré comme un retard : le corps prend simplement le temps qu’il lui faut.',
    body3: 'Dans la grande majorité des cas, il n’y a rien d’inquiétant à observer. Un avis médical reste toutefois utile si les règles sont absentes pendant plusieurs mois après leur apparition, ou en cas de doute persistant.',
    alertTitle: 'Consulter si',
    alertText: 'Absence de règles pendant plusieurs mois, douleurs très intenses, ou saignements très abondants.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Cycle régulier ou irrégulier : quelles différences ?', meta: '5 min  ·  Guide'},
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
      {title: 'Questions fréquentes sur les premières règles', meta: '4 min  ·  FAQ'},
    ],
    shareMessage: 'Mes premières règles sont irrégulières : est-ce normal ? — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'My first period is\nirregular: is that normal?',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Yes, that’s completely normal. Here’s why the cycle takes time to settle down, and when it’s worth talking about it.',
    contentsTitle: 'In this article',
    topics: [
      'Why the cycle is irregular at first',
      'How long it takes to settle down',
      'When to see a doctor',
    ],
    body1: 'The hormones that regulate the cycle take time to find their balance. It’s therefore common for cycles to be shorter, longer, or spaced unevenly during the first few years.',
    body2: 'The cycle can take one to two years, sometimes a bit more, to become more regular. This adjustment period varies a lot from person to person, without it being a problem.',
    tip1Title: 'Good to know',
    tip1Text: 'An irregular cycle at first is never considered a delay: your body is simply taking the time it needs.',
    body3: 'In the vast majority of cases, there’s nothing to worry about. That said, it’s a good idea to see a doctor if your period is absent for several months after it first appears, or if you have ongoing doubts.',
    alertTitle: 'See a doctor if',
    alertText: 'No period for several months, very intense pain, or very heavy bleeding.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Regular or irregular cycle: what’s the difference?', meta: '5 min  ·  Guide'},
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
      {title: 'Frequently asked questions about your first period', meta: '4 min  ·  FAQ'},
    ],
    shareMessage: 'My first period is irregular: is that normal? — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: 'Mi primera menstruación es\nirregular: ¿es normal?',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Sí, es completamente normal. Aquí te explicamos por qué el ciclo tarda en estabilizarse, y cuándo conviene hablar de ello.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué el ciclo es irregular al principio',
      'Cuánto tiempo tarda en estabilizarse',
      'Cuándo consultar',
    ],
    body1: 'Las hormonas que regulan el ciclo tardan en encontrar su equilibrio. Por eso es frecuente que los ciclos sean más cortos, más largos o estén espaciados de forma desigual durante los primeros años.',
    body2: 'El ciclo puede tardar de uno a dos años, a veces un poco más, en volverse más regular. Este tiempo de adaptación varía mucho de una persona a otra, sin que eso suponga un problema.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Un ciclo irregular al principio nunca se considera un retraso: el cuerpo simplemente se toma el tiempo que necesita.',
    body3: 'En la gran mayoría de los casos, no hay nada preocupante que observar. Aun así, conviene pedir una opinión médica si la menstruación está ausente durante varios meses después de su aparición, o si persisten las dudas.',
    alertTitle: 'Consulta si',
    alertText: 'Ausencia de menstruación durante varios meses, dolores muy intensos o sangrados muy abundantes.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Ciclo regular o irregular: ¿qué diferencias hay?', meta: '5 min  ·  Guía'},
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
      {title: 'Preguntas frecuentes sobre la primera menstruación', meta: '4 min  ·  FAQ'},
    ],
    shareMessage: 'Mi primera menstruación es irregular: ¿es normal? — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodIrregularArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = i18n.language === 'fr' ? 'fr' : i18n.language === 'es' ? 'es' : 'en';
  const content = CONTENT[lang];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (mounted) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBookmark = () => {
    setSaved(toggleBookmark(ID));
  };

  const handleShare = () => {
    Share.share({
      message: content.shareMessage,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      <ScrollView
        ref={scrollRef}
        onScroll={event =>
          saveScrollPosition(ID, event.nativeEvent.contentOffset.y)
        }
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {paddingTop: getTopPadding(insets.top, true)},
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('library.screen.addBookmark')}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['book-open-page-variant-outline', content.metaType],
              ['chart-bar', content.metaLevel],
              ['shield-check-outline', content.metaValidated],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? <View style={styles.metaDivider} /> : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{item}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <Image
            source={require('../../assets/images/library/regular-cycle-causes.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <Image
            source={require('../../assets/images/library/regular-cycle-balance.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>
              <Text style={styles.tipText}>
                {content.tip1Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <Image
            source={require('../../assets/images/library/regular-cycle-consult.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>
              <Text style={styles.tipText}>
                {content.alertText}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.relatedHeader}>
          <Text style={styles.relatedTitle}>{content.relatedTitle}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {content.related.map((item, index) => (
            <Pressable
              key={item.title}
              onPress={() =>
                navigation.push('ArticleReader', {
                  articleId: RELATED_IDS[index],
                })
              }
              style={styles.relatedCard}>
              <Image
                source={RELATED_IMAGES[index]}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <Text numberOfLines={3} style={styles.relatedCardTitle}>
                  {item.title}
                </Text>
                <Text style={styles.relatedMeta}>{item.meta}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 30},
  heroWrap: {height: 245, backgroundColor: theme.colors.surfaceSecondary},
  hero: {width: '100%', height: '100%'},
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {flexDirection: 'row', gap: 8},
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {opacity: 0.74},
  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  badgeText: {fontSize: 11, color: theme.colors.primary, fontWeight: '800'},
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.text,
    fontWeight: '700',
  },
  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 10, color: theme.colors.textMuted},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '500',
  },
  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 24, color: theme.colors.primary, fontSize: 12, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.5, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.text},
  wideImage: {
    width: '100%',
    height: 120,
    marginTop: 14,
    borderRadius: 12,
  },
  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  relatedHeader: {
    marginTop: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedTitle: {color: theme.colors.text, fontSize: 16, fontWeight: '800'},
  relatedRow: {gap: 10, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 5},
  relatedCard: {
    width: 230,
    height: 105,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...theme.shadow,
  },
  relatedImage: {width: 80, height: '100%'},
  relatedCopy: {flex: 1, padding: 12},
  relatedCardTitle: {color: theme.colors.text, fontSize: 11.5, lineHeight: 15, fontWeight: '800'},
  relatedMeta: {marginTop: 9, color: theme.colors.textMuted, fontSize: 9.5},
  });
}
