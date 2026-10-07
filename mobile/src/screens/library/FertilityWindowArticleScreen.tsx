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

const ID = 'fertility-fenetre-fertile';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const TRACKING_ICONS = [
  'calendar-month-outline',
  'water-outline',
  'thermometer',
  'test-tube',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'FENÊTRE FERTILE',
    title: 'La fenêtre fertile,\ncomment ça marche',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi les jours autour de l’ovulation comptent le plus pour concevoir.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que la fenêtre fertile ?',
      'Pourquoi ces jours comptent le plus',
      'Comment repérer sa fenêtre fertile',
      'À retenir',
    ],
    section1Body: 'La fenêtre fertile désigne la période du cycle pendant laquelle une grossesse est possible. Elle s’étend sur environ 6 jours : les 5 jours précédant l’ovulation, plus le jour de l’ovulation lui-même.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Chaque cycle est différent : la fenêtre fertile ne tombe pas forcément au même jour du calendrier d’un mois à l’autre.',
    section2Body1: 'Les spermatozoïdes peuvent survivre jusqu’à 5 jours dans les voies génitales, ce qui élargit la période de conception possible. L’ovule, lui, ne reste fécondable qu’environ 24 heures après sa libération.',
    section2Body2: 'Par exemple, un rapport survenu 3 jours avant l’ovulation peut aboutir à une conception, alors qu’un rapport le lendemain de l’ovulation arrive souvent trop tard.',
    section3Intro: 'Plusieurs signaux, observés ensemble, aident à mieux cerner cette période :',
    trackingSigns: [
      'Suivre la longueur de ton cycle',
      'Observer ta glaire cervicale',
      'Mesurer ta température basale',
      'Utiliser des tests d’ovulation (LH)',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Multiplier les repères (cycle, glaire, température) donne une vision plus fiable de ta fenêtre fertile qu’un seul indice isolé.',
    shareMessage: 'La fenêtre fertile, comment ça marche — AWA',
  },
  en: {
    badge: 'FERTILE WINDOW',
    title: 'The fertile window:\nhow it works',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why the days around ovulation matter most for conceiving.',
    contentsTitle: 'In this article',
    topics: [
      'What is the fertile window?',
      'Why these days matter most',
      'How to identify your fertile window',
      'Key takeaways',
    ],
    section1Body: 'The fertile window refers to the period in your cycle during which pregnancy is possible. It spans about 6 days: the 5 days before ovulation, plus the day of ovulation itself.',
    tip1Title: 'Good to know',
    tip1Text: 'Every cycle is different: the fertile window doesn’t necessarily fall on the same calendar day from one month to the next.',
    section2Body1: 'Sperm can survive for up to 5 days in the reproductive tract, which widens the period during which conception is possible. The egg, meanwhile, remains fertilizable for only about 24 hours after it’s released.',
    section2Body2: 'For example, intercourse that happens 3 days before ovulation can lead to conception, while intercourse the day after ovulation often comes too late.',
    section3Intro: 'Several signs, observed together, help you better pinpoint this period:',
    trackingSigns: [
      'Tracking your cycle length',
      'Observing your cervical mucus',
      'Measuring your basal body temperature',
      'Using ovulation (LH) tests',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Combining several signs (cycle, mucus, temperature) gives a more reliable picture of your fertile window than any single sign on its own.',
    shareMessage: 'The fertile window: how it works — AWA',
  },
  es: {
    badge: 'VENTANA FÉRTIL',
    title: 'La ventana fértil,\ncómo funciona',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué los días alrededor de la ovulación son los que más importan para concebir.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la ventana fértil?',
      'Por qué estos días importan más',
      'Cómo identificar tu ventana fértil',
      'Para recordar',
    ],
    section1Body: 'La ventana fértil designa el periodo del ciclo durante el cual un embarazo es posible. Se extiende a lo largo de unos 6 días: los 5 días previos a la ovulación, más el día de la ovulación en sí.',
    tip1Title: 'Dato útil',
    tip1Text: 'Cada ciclo es diferente: la ventana fértil no cae necesariamente en el mismo día del calendario de un mes a otro.',
    section2Body1: 'Los espermatozoides pueden sobrevivir hasta 5 días en las vías genitales, lo que amplía el periodo de concepción posible. El óvulo, en cambio, solo permanece fecundable durante unas 24 horas tras su liberación.',
    section2Body2: 'Por ejemplo, una relación sexual 3 días antes de la ovulación puede derivar en una concepción, mientras que una relación al día siguiente de la ovulación suele llegar demasiado tarde.',
    section3Intro: 'Varias señales, observadas en conjunto, ayudan a identificar mejor este periodo:',
    trackingSigns: [
      'Seguir la duración de tu ciclo',
      'Observar tu moco cervical',
      'Medir tu temperatura basal',
      'Usar pruebas de ovulación (LH)',
    ],
    tip2Title: 'Dato útil',
    tip2Text: 'Combinar varios indicios (ciclo, moco, temperatura) da una visión más fiable de tu ventana fértil que una sola señal aislada.',
    shareMessage: 'La ventana fértil, cómo funciona — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FertilityWindowArticleScreen({
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
            {content.section1Body}
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

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.section2Body1}
          </Text>

          <Text style={styles.body}>
            {content.section2Body2}
          </Text>

          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.section3Intro}
          </Text>

          <View style={styles.daily}>
            {TRACKING_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.trackingSigns[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

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

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
