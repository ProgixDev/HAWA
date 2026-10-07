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

const ID = 'firstperiod-premieres-regles';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const TOPIC_IMAGES = [
  require('../../assets/images/first-period-calendar.png'),
  require('../../assets/images/first-period-normal.png'),
  require('../../assets/images/first-period-pad.png'),
  require('../../assets/images/first-period-care.png'),
  require('../../assets/images/first-period-support.png'),
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Tes premières règles :\nà quoi t’attendre',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Ce qui est normal, ce qui rassure, et ce qu’il faut savoir.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Quand arrivent les premières règles ?',
      'Ce qui est normal',
      'Comment ça fonctionne ?',
      'Prendre soin de soi',
      'Parler et se faire soutenir',
    ],
    details: [
      {title: 'Quand arrivent les premières règles ?', text: 'Elles apparaissent le plus souvent entre 10 et 15 ans, environ deux ans après les premiers signes de la puberté.'},
      {title: 'Ce qui est tout à fait normal', text: 'Au début, les cycles peuvent être irréguliers, courts ou longs. Ton corps prend simplement le temps de trouver son rythme.'},
      {title: 'Comprendre comment ça fonctionne', text: 'Les règles durent généralement de 3 à 7 jours. Le flux et la couleur peuvent changer d’un jour à l’autre.'},
      {title: 'Prendre soin de toi', text: 'Change régulièrement de protection, lave-toi doucement et choisis des vêtements confortables pour rester à l’aise.'},
      {title: 'Parler et se faire soutenir', text: 'Tu peux en parler à ta mère, une sœur, une proche, une enseignante ou un professionnel de santé en qui tu as confiance.'},
    ],
    tip1Title: 'Bon à savoir',
    tip1Text: 'Un cycle irrégulier au début est tout à fait normal. Ton corps apprend encore à fonctionner.',
    tip2Title: 'Tu n’es pas seule',
    tip2Text: 'Chaque corps est unique. Prends le temps, sois patiente et n’hésite pas à demander de l’aide à une personne de confiance.',
    shareTitle: 'Premières règles · AWA',
    shareMessage: 'Tes premières règles : à quoi t’attendre · AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'Your first period:\nwhat to expect',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'What’s normal, what’s reassuring, and what you need to know.',
    contentsTitle: 'In this article',
    topics: [
      'When does your first period arrive?',
      'What’s normal',
      'How it works',
      'Taking care of yourself',
      'Talking about it and getting support',
    ],
    details: [
      {title: 'When does your first period arrive?', text: 'It most often arrives between ages 10 and 15, about two years after the first signs of puberty.'},
      {title: 'What’s completely normal', text: 'At first, cycles can be irregular, short, or long. Your body is simply taking its time to find its rhythm.'},
      {title: 'Understanding how it works', text: 'Periods usually last 3 to 7 days. The flow and color can change from one day to the next.'},
      {title: 'Taking care of yourself', text: 'Change your protection regularly, wash gently, and choose comfortable clothing so you feel at ease.'},
      {title: 'Talking about it and getting support', text: 'You can talk to your mother, a sister, someone close to you, a teacher, or a healthcare professional you trust.'},
    ],
    tip1Title: 'Good to know',
    tip1Text: 'An irregular cycle at first is completely normal. Your body is still learning how to find its rhythm.',
    tip2Title: 'You’re not alone',
    tip2Text: 'Every body is unique. Take your time, be patient, and don’t hesitate to ask for help from someone you trust.',
    shareTitle: 'First period · AWA',
    shareMessage: 'Your first period: what to expect · AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: 'Tu primera menstruación:\nqué esperar',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Lo que es normal, lo que tranquiliza y lo que necesitas saber.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Cuándo llega la primera menstruación?',
      'Lo que es normal',
      '¿Cómo funciona?',
      'Cuidar de ti misma',
      'Hablar de ello y sentirte apoyada',
    ],
    details: [
      {title: '¿Cuándo llega la primera menstruación?', text: 'Suele llegar entre los 10 y los 15 años, unos dos años después de los primeros signos de la pubertad.'},
      {title: 'Lo que es completamente normal', text: 'Al principio, los ciclos pueden ser irregulares, cortos o largos. Tu cuerpo simplemente se toma su tiempo para encontrar su ritmo.'},
      {title: 'Entender cómo funciona', text: 'La menstruación suele durar de 3 a 7 días. El flujo y el color pueden cambiar de un día a otro.'},
      {title: 'Cuidar de ti', text: 'Cambia tu protección con regularidad, lávate con suavidad y elige ropa cómoda para sentirte bien.'},
      {title: 'Hablar de ello y sentirte apoyada', text: 'Puedes hablar de ello con tu madre, una hermana, alguien cercano, una profesora o un profesional de la salud en quien confíes.'},
    ],
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Un ciclo irregular al principio es completamente normal. Tu cuerpo todavía está aprendiendo a encontrar su ritmo.',
    tip2Title: 'No estás sola',
    tip2Text: 'Cada cuerpo es único. Tómate tu tiempo, ten paciencia y no dudes en pedir ayuda a una persona de confianza.',
    shareTitle: 'Primera menstruación · AWA',
    shareMessage: 'Tu primera menstruación: qué esperar · AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodArticleScreen({
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
      title: content.shareTitle,
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

            {content.topics.map((topic, index) => (
              <View key={topic} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{topic}</Text>
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

          <View style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[0]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.details[0].title}</Text>
              <Text style={styles.visualText}>{content.details[0].text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <View style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[1]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.details[1].title}</Text>
              <Text style={styles.visualText}>{content.details[1].text}</Text>
            </View>
          </View>

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

          <View style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[2]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.details[2].title}</Text>
              <Text style={styles.visualText}>{content.details[2].text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[3]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.details[3].title}</Text>
              <Text style={styles.visualText}>{content.details[3].text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <View style={styles.visualCard}>
            <Image
              source={TOPIC_IMAGES[4]}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.details[4].title}</Text>
              <Text style={styles.visualText}>{content.details[4].text}</Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip2Title}</Text>
              <Text style={styles.tipText}>
                {content.tip2Text}
              </Text>
            </View>
          </View>
        </View>
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
  });
}
