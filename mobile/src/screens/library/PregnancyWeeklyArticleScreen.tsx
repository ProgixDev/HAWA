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

const ID = 'pregnancy-semaine-par-semaine';

const HERO = require('../../assets/images/library/grossesse_semiane.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icon lists.
const TRIMESTER_ICONS = [
  'numeric-1-circle-outline',
  'numeric-2-circle-outline',
  'numeric-3-circle-outline',
  'calendar-check-outline',
] as const;

const URGENT_SIGN_ICONS = [
  'water-alert-outline',
  'alert-circle-outline',
  'baby-face-outline',
  'head-alert-outline',
  'thermometer-alert',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'GROSSESSE • VUE D’ENSEMBLE',
    title: 'Ta grossesse,\nsemaine par semaine',
    metaDuration: '8 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les grandes étapes du premier au troisième trimestre, pour savoir à quoi t’attendre à chaque période.',
    introSecondary: 'Chaque grossesse suit son propre rythme : ces repères sont généraux et peuvent varier d’une femme à l’autre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le premier trimestre : les fondations',
      'Le deuxième trimestre : plus de confort',
      'Le troisième trimestre : se préparer',
      'Les grands repères par trimestre',
      'Symptômes courants à chaque étape',
      'Quand consulter rapidement',
      'À retenir',
    ],
    body1: 'Le premier trimestre pose les fondations : tous les organes principaux du bébé se forment progressivement. C’est aussi une période où la fatigue et les nausées sont fréquentes, à des degrés très variables selon les femmes.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Ces symptômes, bien que parfois inconfortables, sont un signe que le corps s’adapte activement à la grossesse.',
    body2: 'Le deuxième trimestre est souvent le plus confortable, avec l’apparition des premiers mouvements du bébé.',
    highlightTitle: 'Les premiers mouvements',
    highlightText: 'Ils sont généralement ressentis entre la 18e et la 22e semaine, un peu plus tôt si ce n’est pas ta première grossesse.',
    body3: 'Le troisième trimestre prépare le corps à l’accouchement, avec une prise de poids et une fatigue plus marquées. Des contractions d’entraînement (dites de Braxton Hicks) peuvent aussi apparaître.',
    neutralText: 'Ces contractions sont généralement irrégulières et peu douloureuses ; elles diffèrent des contractions du travail.',
    trimesters: [
      '1er trimestre : formation des organes',
      '2e trimestre : premiers mouvements',
      '3e trimestre : préparation à la naissance',
      'Un suivi médical à chaque étape',
    ],
    commonSymptoms: [
      'Nausées et fatigue, surtout au premier trimestre',
      'Tiraillements abdominaux liés à l’étirement des ligaments',
      'Essoufflement léger en fin de grossesse',
      'Troubles du sommeil en fin de troisième trimestre',
    ],
    consultIntro: 'Certains signes justifient un avis médical rapide, quel que soit le trimestre :',
    urgentSigns: [
      'Saignements, même légers',
      'Douleur abdominale intense',
      'Absence de mouvements ressentis',
      'Maux de tête violents ou troubles de la vue',
      'Fièvre inhabituelle',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Chaque trimestre apporte ses propres changements : les connaître à l’avance aide à mieux vivre chaque étape, sans remplacer le suivi régulier de ta sage-femme ou de ton médecin.',
    shareMessage: 'Ta grossesse, semaine par semaine — AWA',
  },
  en: {
    badge: 'PREGNANCY • OVERVIEW',
    title: 'Your pregnancy,\nweek by week',
    metaDuration: '8 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The key milestones from the first to the third trimester, so you know what to expect at each stage.',
    introSecondary: 'Every pregnancy follows its own rhythm: these benchmarks are general and can vary from woman to woman.',
    contentsTitle: 'In this article',
    topics: [
      'The first trimester: laying the foundations',
      'The second trimester: more comfort',
      'The third trimester: getting ready',
      'Key milestones by trimester',
      'Common symptoms at each stage',
      'When to seek care quickly',
      'Key takeaways',
    ],
    body1: 'The first trimester lays the foundations: all of the baby’s main organs form progressively. It’s also a time when fatigue and nausea are common, to very different degrees depending on the woman.',
    tip1Title: 'Good to know',
    tip1Text: 'These symptoms, although sometimes uncomfortable, are a sign that the body is actively adapting to pregnancy.',
    body2: 'The second trimester is often the most comfortable, with the baby’s first movements appearing.',
    highlightTitle: 'The first movements',
    highlightText: 'These are usually felt between weeks 18 and 22, a little earlier if this isn’t your first pregnancy.',
    body3: 'The third trimester prepares the body for childbirth, with more noticeable weight gain and fatigue. Practice contractions (known as Braxton Hicks) may also appear.',
    neutralText: 'These contractions are usually irregular and not very painful; they differ from labor contractions.',
    trimesters: [
      '1st trimester: organ formation',
      '2nd trimester: first movements',
      '3rd trimester: preparing for birth',
      'Medical follow-up at every stage',
    ],
    commonSymptoms: [
      'Nausea and fatigue, especially in the first trimester',
      'Abdominal twinges linked to ligaments stretching',
      'Mild shortness of breath later in pregnancy',
      'Sleep trouble in late third trimester',
    ],
    consultIntro: 'Certain signs call for prompt medical advice, whatever the trimester:',
    urgentSigns: [
      'Bleeding, even light',
      'Intense abdominal pain',
      'No movement felt',
      'Severe headaches or vision problems',
      'Unusual fever',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Each trimester brings its own changes: knowing them in advance helps you experience each stage better, without replacing regular follow-up with your midwife or doctor.',
    shareMessage: 'Your pregnancy, week by week — AWA',
  },
  es: {
    badge: 'EMBARAZO • VISIÓN GENERAL',
    title: 'Tu embarazo,\nsemana a semana',
    metaDuration: '8 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Las grandes etapas, del primer al tercer trimestre, para que sepas qué esperar en cada periodo.',
    introSecondary: 'Cada embarazo sigue su propio ritmo: estas referencias son generales y pueden variar de una mujer a otra.',
    contentsTitle: 'En este artículo',
    topics: [
      'El primer trimestre: los cimientos',
      'El segundo trimestre: más comodidad',
      'El tercer trimestre: prepararte',
      'Los grandes hitos por trimestre',
      'Síntomas frecuentes en cada etapa',
      'Cuándo consultar rápidamente',
      'Para recordar',
    ],
    body1: 'El primer trimestre sienta las bases: todos los órganos principales del bebé se forman progresivamente. También es un periodo en el que la fatiga y las náuseas son frecuentes, en grados muy variables según cada mujer.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Estos síntomas, aunque a veces incómodos, son una señal de que el cuerpo se está adaptando activamente al embarazo.',
    body2: 'El segundo trimestre suele ser el más cómodo, con la aparición de los primeros movimientos del bebé.',
    highlightTitle: 'Los primeros movimientos',
    highlightText: 'Generalmente se sienten entre la semana 18 y la semana 22, un poco antes si no es tu primer embarazo.',
    body3: 'El tercer trimestre prepara el cuerpo para el parto, con un aumento de peso y una fatiga más marcados. También pueden aparecer contracciones de entrenamiento (llamadas de Braxton Hicks).',
    neutralText: 'Estas contracciones suelen ser irregulares y poco dolorosas; son diferentes de las contracciones del parto.',
    trimesters: [
      '1.er trimestre: formación de los órganos',
      '2.º trimestre: primeros movimientos',
      '3.er trimestre: preparación para el nacimiento',
      'Un seguimiento médico en cada etapa',
    ],
    commonSymptoms: [
      'Náuseas y fatiga, sobre todo en el primer trimestre',
      'Tirones abdominales relacionados con el estiramiento de los ligamentos',
      'Falta de aire leve al final del embarazo',
      'Problemas de sueño al final del tercer trimestre',
    ],
    consultIntro: 'Algunos signos justifican una consulta médica rápida, sea cual sea el trimestre:',
    urgentSigns: [
      'Sangrado, incluso leve',
      'Dolor abdominal intenso',
      'Ausencia de movimientos percibidos',
      'Dolores de cabeza intensos o alteraciones de la vista',
      'Fiebre inusual',
    ],
    tip2Title: 'DATO ÚTIL',
    tip2Text: 'Cada trimestre trae sus propios cambios: conocerlos de antemano ayuda a vivir mejor cada etapa, sin reemplazar el seguimiento regular de tu partera o tu médico.',
    shareMessage: 'Tu embarazo, semana a semana — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PregnancyWeeklyArticleScreen({
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

          <Text style={styles.introSecondary}>
            {content.introSecondary}
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
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.highlightBox}>
            <MaterialDesignIcons
              name="baby-face-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.highlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.highlightText}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <Text style={styles.neutralText}>
              {content.neutralText}
            </Text>
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.daily}>
            {TRIMESTER_ICONS.map((icon, index) => (
              <View key={content.trimesters[index]} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.trimesters[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            5. {content.topics[4]}
          </Text>

          <View style={styles.checkList}>
            {content.commonSymptoms.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          <Text style={styles.body}>
            {content.consultIntro}
          </Text>

          <View style={styles.consultCard}>
            {URGENT_SIGN_ICONS.map((icon, index) => (
              <View key={content.urgentSigns[index]} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.consultText}>{content.urgentSigns[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>7. {content.topics[6]}</Text>

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

      <ReadingControls articleId={ID} durationMinutes={8} scrollRef={scrollRef} />
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
  badgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
    fontWeight: '700',
  },
  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 9.5, color: theme.colors.textMuted},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '600',
  },
  introSecondary: {
    marginTop: 9,
    fontSize: 13.5,
    lineHeight: 20.5,
    color: theme.colors.textMuted,
  },
  contents: {
    marginTop: 20,
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
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 25,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.text},
  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  highlightBox: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  highlightCopy: {flex: 1, marginLeft: 10},
  highlightTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
  highlightText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },
  neutralBox: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  neutralText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  checkText: {flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17},
  consultCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  consultRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultText: {
    flex: 1,
    marginLeft: 10,
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 17,
  },
  });
}
