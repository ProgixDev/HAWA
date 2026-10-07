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

const ID = 'firstperiod-gerer-quotidien';

const HERO = require('../../assets/images/library/rules-hero.png');

// Icons/images stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these icons.
const DAILY_ICONS = ['school-outline', 'run', 'power-sleep'] as const;

const RELATED_META = [
  {
    image: require('../../assets/images/library/featured-flow.png'),
    articleId: 'firstperiod-choisir-protection',
  },
  {
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
  {
    image: require('../../assets/images/library/regular-cycle-hero.png'),
    articleId: 'firstperiod-cycle-irregulier',
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
    title: 'Comment gérer ses\npremières règles au quotidien ?',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Avec quelques petites habitudes, les premières règles s’intègrent facilement à ton quotidien, à l’école comme en dehors.',
    contentsTitle: 'Dans cet article',
    topics: [
      'S’organiser au quotidien',
      'Préparer une trousse de secours',
      'Si les règles arrivent de façon inattendue',
    ],
    body1: 'École, sport, sommeil : les règles n’empêchent pas de continuer tes activités habituelles. Il suffit d’adapter quelques habitudes pour rester à l’aise tout au long de la journée.',
    dailyTips: [
      'École ou activités : garde une protection dans ton sac',
      'Sport : le sport reste possible, adapte simplement ton rythme',
      'Sommeil : une protection de nuit adaptée suffit',
    ],
    body2: 'Une petite trousse avec une ou deux protections, une culotte de rechange et des lingettes peut se glisser facilement dans un sac d’école ou de sport. Elle permet de rester tranquille en toute circonstance.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Garder toujours une protection avec toi évite le stress d’être prise au dépourvu.',
    body3: 'Cela arrive souvent, surtout au début. Une infirmière scolaire, une enseignante ou une amie a presque toujours de quoi dépanner. Un vêtement noué autour de la taille peut aussi suffire en attendant de trouver une protection.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {
        title: 'Quelle protection choisir pour mes premières règles ?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'Gérer les douleurs menstruelles',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'Mes premières règles sont irrégulières : est-ce normal ?',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'Comment gérer ses premières règles au quotidien ? — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'How to manage your\nfirst period day to day?',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'With a few small habits, your first period fits easily into your daily life, at school and beyond.',
    contentsTitle: 'In this article',
    topics: [
      'Getting organized day to day',
      'Putting together a small emergency kit',
      'If your period arrives unexpectedly',
    ],
    body1: 'School, sports, sleep: your period doesn’t stop you from continuing your usual activities. You just need to adjust a few habits to stay comfortable throughout the day.',
    dailyTips: [
      'School or activities: keep a pad or tampon in your bag',
      'Sports: you can still play sports, just adjust your pace',
      'Sleep: a suitable overnight pad is enough',
    ],
    body2: 'A small kit with one or two pads or tampons, a spare pair of underwear, and some wipes can easily fit into a school or sports bag. It helps you feel at ease no matter what happens.',
    tip1Title: 'Good to know',
    tip1Text: 'Always keeping a pad or tampon with you avoids the stress of being caught off guard.',
    body3: 'This happens often, especially at first. A school nurse, a teacher, or a friend almost always has something that can help. Tying a piece of clothing around your waist can also work while you find a pad or tampon.',
    relatedTitle: '♥  You might also like',
    related: [
      {
        title: 'Which pad or tampon should I choose for my first period?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'Managing period pain',
        meta: '7 min  ·  Guide',
      },
      {
        title: 'My first periods are irregular: is that normal?',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'How to manage your first period day to day? — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: '¿Cómo gestionar tu primera\nmenstruación en el día a día?',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Con algunos pequeños hábitos, la primera menstruación se integra fácilmente en tu día a día, tanto en la escuela como fuera de ella.',
    contentsTitle: 'En este artículo',
    topics: [
      'Organizarte en el día a día',
      'Preparar un pequeño kit de emergencia',
      'Si la menstruación llega de forma inesperada',
    ],
    body1: 'Escuela, deporte, sueño: la menstruación no te impide seguir con tus actividades habituales. Basta con adaptar algunos hábitos para sentirte cómoda durante todo el día.',
    dailyTips: [
      'Escuela o actividades: lleva una protección en tu mochila',
      'Deporte: hacer deporte sigue siendo posible, solo adapta tu ritmo',
      'Sueño: una protección nocturna adecuada es suficiente',
    ],
    body2: 'Un pequeño kit con una o dos protecciones, una braga de recambio y toallitas cabe fácilmente en una mochila escolar o deportiva. Te permite estar tranquila en cualquier circunstancia.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Llevar siempre una protección contigo evita el estrés de que te pille desprevenida.',
    body3: 'Esto ocurre a menudo, sobre todo al principio. Una enfermera escolar, una profesora o una amiga casi siempre tienen algo que puede ayudarte. Una prenda anudada alrededor de la cintura también puede servir mientras encuentras una protección.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {
        title: '¿Qué protección elegir para mi primera menstruación?',
        meta: '6 min  ·  Guía',
      },
      {
        title: 'Gestionar los dolores menstruales',
        meta: '7 min  ·  Guía',
      },
      {
        title: 'Mi primera menstruación es irregular: ¿es normal?',
        meta: '5 min  ·  Guía',
      },
    ],
    shareMessage: '¿Cómo gestionar tu primera menstruación en el día a día? — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodDailyLifeArticleScreen({
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

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <View style={styles.daily}>
            {DAILY_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons name={icon as never} color={theme.colors.primary} size={25} />
                <Text style={styles.dailyText}>{content.dailyTips[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

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

          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>
        </View>

        <View style={styles.relatedHeader}>
          <Text style={styles.relatedTitle}>{content.relatedTitle}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {RELATED_META.map((item, index) => (
            <Pressable
              key={item.articleId}
              onPress={() =>
                navigation.push('ArticleReader', {articleId: item.articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={item.image}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <Text numberOfLines={3} style={styles.relatedCardTitle}>
                  {content.related[index].title}
                </Text>
                <Text style={styles.relatedMeta}>{content.related[index].meta}</Text>
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
    lineHeight: 32,
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
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
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
