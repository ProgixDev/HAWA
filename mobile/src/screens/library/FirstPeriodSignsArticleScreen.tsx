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

const ID = 'firstperiod-premiers-signes';

const HERO = require('../../assets/images/library/spm-hero.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const SIGNS_IMAGES = [
  require('../../assets/images/library/spm-yoga.png'),
  require('../../assets/images/library/flow-texture-mucus.png'),
  require('../../assets/images/library/pain-massage.png'),
  require('../../assets/images/library/spm-woman.png'),
  require('../../assets/images/library/regular-cycle-heartbeat.png'),
] as const;

const RELATED_IMAGES = [
  {
    image: require('../../assets/images/library/popular-flower.png'),
    articleId: 'firstperiod-premieres-regles',
  },
  {
    image: require('../../assets/images/library/flow-colors-hero.png'),
    articleId: 'firstperiod-comment-savoir',
  },
  {
    image: require('../../assets/images/library/cycle-phases-hero.png'),
    articleId: 'cycle-phases-expliquees',
  },
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Les premiers signes\navant les règles',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Ton corps envoie souvent des indices avant l’arrivée des toutes premières règles. Les reconnaître aide à ne pas être surprise.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Des changements progressifs',
      'Les signes à observer',
      'Ce que cela signifie',
    ],
    body1: 'Dans les mois qui précèdent les premières règles, le corps change doucement : la silhouette évolue, la pilosité apparaît par endroits, la transpiration change. Ce sont les effets normaux de la puberté, qui prépare le corps en douceur.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Ces changements n’arrivent pas tous en même temps ni au même rythme d’une personne à l’autre : c’est normal.',
    signs: [
      {title: 'Changements corporels', text: 'Le corps évolue progressivement : silhouette, pilosité, transpiration.'},
      {title: 'Pertes vaginales', text: 'De légères pertes blanchâtres apparaissent souvent quelques mois avant.'},
      {title: 'Douleurs ou tiraillements', text: 'De petites tensions dans le bas-ventre peuvent se faire sentir.'},
      {title: 'Changements d’humeur', text: 'Il est courant de se sentir plus sensible ou irritable que d’habitude.'},
      {title: 'Sensibilité des seins', text: 'Une légère sensibilité ou un gonflement peuvent apparaître.'},
    ],
    body2: 'Ces signes annoncent généralement l’arrivée des premières règles dans les mois qui suivent, sans qu’on puisse prédire une date exacte. Garder une protection à portée de main devient alors une bonne habitude.',
    alertTitle: 'À noter',
    alertText: 'Ces signes restent des repères généraux, jamais une prédiction précise. Chaque corps suit son propre rythme.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
      {title: 'Comment savoir si mes premières règles arrivent ?', meta: '5 min  ·  Guide'},
      {title: 'Les différentes phases du cycle', meta: '5 min  ·  Article'},
    ],
    shareMessage: 'Les premiers signes avant les règles — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'Early signs\nof your first period',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Your body often gives hints before your very first period arrives. Recognizing them can help you feel less surprised.',
    contentsTitle: 'In this article',
    topics: [
      'Gradual changes',
      'Signs to watch for',
      'What it means',
    ],
    body1: 'In the months before your first period, your body changes gently: your shape evolves, body hair starts appearing in new places, and sweating changes too. These are normal effects of puberty, gently preparing your body.',
    tip1Title: 'Good to know',
    tip1Text: 'These changes don’t all happen at the same time, or at the same pace, for everyone — that’s completely normal.',
    signs: [
      {title: 'Body changes', text: 'Your body changes gradually: your shape, body hair, and sweating can all shift.'},
      {title: 'Vaginal discharge', text: 'Light, whitish discharge often appears a few months before your first period.'},
      {title: 'Aches or twinges', text: 'You may feel slight tension or twinges in your lower belly.'},
      {title: 'Mood changes', text: 'It’s common to feel more sensitive or irritable than usual.'},
      {title: 'Breast tenderness', text: 'You may notice slight tenderness or swelling.'},
    ],
    body2: 'These signs usually mean your first period will arrive in the following months, though it’s impossible to predict an exact date. Keeping protection close at hand becomes a good habit at this point.',
    alertTitle: 'Please note',
    alertText: 'These signs are general guides, never a precise prediction. Every body follows its own pace.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
      {title: 'How do I know if my first period is coming?', meta: '5 min  ·  Guide'},
      {title: 'The different phases of the cycle', meta: '5 min  ·  Article'},
    ],
    shareMessage: 'Early signs before your first period — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: 'Las primeras señales\nantes de la menstruación',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Tu cuerpo suele enviar señales antes de la llegada de tu primera menstruación. Reconocerlas te ayuda a no sentirte sorprendida.',
    contentsTitle: 'En este artículo',
    topics: [
      'Cambios progresivos',
      'Las señales que debes observar',
      'Qué significa todo esto',
    ],
    body1: 'En los meses previos a la primera menstruación, el cuerpo cambia poco a poco: la silueta evoluciona, aparece vello en algunas zonas y la transpiración cambia. Son los efectos normales de la pubertad, que prepara el cuerpo con suavidad.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Estos cambios no ocurren todos al mismo tiempo ni al mismo ritmo en cada persona: es normal.',
    signs: [
      {title: 'Cambios corporales', text: 'El cuerpo evoluciona poco a poco: silueta, vello, transpiración.'},
      {title: 'Secreción vaginal', text: 'Suele aparecer una ligera secreción blanquecina unos meses antes.'},
      {title: 'Dolores o tirones', text: 'Pueden sentirse pequeñas tensiones en la parte baja del vientre.'},
      {title: 'Cambios de humor', text: 'Es habitual sentirse más sensible o irritable de lo normal.'},
      {title: 'Sensibilidad en el pecho', text: 'Puede aparecer una ligera sensibilidad o hinchazón.'},
    ],
    body2: 'Estas señales suelen anunciar la llegada de la primera menstruación en los meses siguientes, aunque no se pueda predecir una fecha exacta. Tener protección a mano se convierte entonces en un buen hábito.',
    alertTitle: 'Ten en cuenta',
    alertText: 'Estas señales son solo indicios generales, nunca una predicción exacta. Cada cuerpo sigue su propio ritmo.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
      {title: '¿Cómo saber si se acerca mi primera menstruación?', meta: '5 min  ·  Guía'},
      {title: 'Las distintas fases del ciclo', meta: '5 min  ·  Artículo'},
    ],
    shareMessage: 'Las primeras señales antes de la menstruación — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodSignsArticleScreen({
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

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.body1}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>
              <Text style={styles.tipText}>{content.tip1Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          {content.signs.map((item, index) => (
            <View key={item.title} style={styles.visualCard}>
              <Image source={SIGNS_IMAGES[index]} resizeMode="cover" style={styles.visualImage} />

              <View style={styles.visualCopy}>
                <Text style={styles.visualTitle}>{item.title}</Text>
                <Text style={styles.visualText}>{item.text}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.body2}</Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>
              <Text style={styles.tipText}>{content.alertText}</Text>
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
                navigation.push('ArticleReader', {articleId: RELATED_IMAGES[index].articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={RELATED_IMAGES[index].image}
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
  visualCard: {
    marginTop: 15,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualTitle: {color: theme.colors.text, fontSize: 13, lineHeight: 17, fontWeight: '800'},
  visualText: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16},
  relatedHeader: {
    marginTop: 8,
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
