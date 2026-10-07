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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'lochia-comprendre-lochies';

const HERO = require('../../assets/images/library/featured-pain.png');

/* -------------------------------------------------------------------------- */
/* DATA — language-neutral (icons/numbers only; text lives in CONTENT below) */
/* -------------------------------------------------------------------------- */

const EVOLUTION_META = [
  {number: '01', icon: 'numeric-1-circle-outline'},
  {number: '02', icon: 'numeric-2-circle-outline'},
  {number: '03', icon: 'numeric-3-circle-outline'},
] as const;

const NORMAL_META = [
  {icon: 'water-outline'},
  {icon: 'palette-outline'},
  {icon: 'clock-outline'},
] as const;

const COMFORT_META = [
  {icon: 'hand-wash-outline'},
  {icon: 'calendar-check-outline'},
  {icon: 'sleep-outline'},
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badgeText: 'POST-PARTUM • LOCHIES',
    title: 'Comprendre les lochies après \nla naissance',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu informatif',
    intro:
      'Après l’accouchement, les lochies correspondent aux pertes vaginales liées au processus naturel de récupération de l’utérus. Leur couleur et leur quantité évoluent progressivement au fil des jours et des semaines.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Que sont les lochies ?',
      'Comment évoluent-elles ?',
      'Ce qui peut être normal',
      'Conseils de confort',
      'Quand consulter ?',
      'À retenir',
    ],
    section1Heading: '1. Que sont les lochies ?',
    section1Body1:
      'Les lochies sont des pertes vaginales qui apparaissent après l’accouchement. Elles correspondent notamment à l’élimination progressive de sang, de sécrétions et de tissus provenant de l’utérus pendant sa récupération.',
    section1Body2:
      'Elles sont différentes des règles habituelles. Leur présence est attendue pendant la période post-partum et elles diminuent généralement progressivement.',
    infoTitle: 'À retenir',
    infoText:
      'Les lochies ne signifient pas que les règles ont déjà repris. Le retour des règles est un phénomène différent qui survient plus tard.',
    section2Heading: '2. Comment évoluent les lochies ?',
    section2Body:
      'Leur aspect change généralement au cours des premières semaines. La couleur devient progressivement plus claire et la quantité tend à diminuer.',
    evolutionTitle: 'Une évolution progressive',
    evolutionSubtitle: 'Les étapes peuvent varier selon chaque personne',
    evolution: [
      {
        label: 'Rouge vif',
        period: 'Les premiers jours',
        text: 'Les pertes sont généralement rouges et peuvent être plus abondantes au début.',
      },
      {
        label: 'Rosé / brunâtre',
        period: 'Après quelques jours',
        text: 'La couleur devient progressivement plus claire et peut tirer vers le rose ou le brun.',
      },
      {
        label: 'Blanc-jaunâtre',
        period: 'Au fil des semaines',
        text: 'Les pertes deviennent généralement plus claires, jaunâtres ou blanchâtres avant de diminuer.',
      },
    ],
    section3Heading: '3. Ce qui peut être normal',
    section3Body:
      'L’évolution des lochies n’est pas exactement identique pour tout le monde. Certains changements peuvent accompagner naturellement la récupération après la naissance.',
    normalPoints: [
      {
        title: 'Une quantité variable',
        text: 'L’abondance peut changer au cours des premiers jours puis diminuer progressivement.',
      },
      {
        title: 'Une couleur qui évolue',
        text: 'Les lochies passent généralement du rouge vers des teintes plus claires au fil du temps.',
      },
      {
        title: 'Une durée variable',
        text: 'Elles peuvent persister plusieurs semaines et leur évolution diffère selon chaque personne.',
      },
    ],
    section4Heading: '4. Conseils de confort et de suivi',
    section4Body:
      'Pendant cette période, un suivi simple peut t’aider à observer l’évolution de ton corps sans chercher à comparer ton expérience à celle d’une autre personne.',
    comfortTips: [
      {
        title: 'Hygiène douce',
        text: 'Privilégie une toilette douce et régulière sans produits irritants.',
      },
      {
        title: 'Observe l’évolution',
        text: 'Tu peux noter la couleur, la quantité et l’évolution des pertes si cela t’aide à suivre ton rétablissement.',
      },
      {
        title: 'Accorde-toi du repos',
        text: 'La période post-partum demande du temps. Écoute ton corps et respecte tes besoins de récupération.',
      },
    ],
    section5Heading: '5. Lochies ou retour des règles ?',
    section5Body:
      'Les lochies apparaissent dans les suites de l’accouchement et diminuent progressivement. Le retour des règles correspond, lui, à la reprise du cycle menstruel après cette période.',
    compareLochiaTitle: 'Lochies',
    compareLochiaText:
      'Pertes liées à la récupération de l’utérus après la naissance.',
    compareReturnTitle: 'Retour des règles',
    compareReturnText:
      'Reprise du cycle menstruel, à un moment variable selon chaque personne.',
    section6Heading: '6. Quand consulter ?',
    section6Body:
      'Si l’évolution te semble inhabituelle ou si ton état général se dégrade, il est important de demander conseil à un professionnel de santé.',
    warningTitle: 'Signes qui méritent un avis médical',
    warningSigns: [
      'Une odeur forte ou inhabituelle',
      'De la fièvre ou un état général qui se dégrade',
      'Un flux qui devient soudainement beaucoup plus abondant',
      'Des douleurs importantes, persistantes ou inhabituelles',
      'Un symptôme nouveau qui t’inquiète',
    ],
    tipTitle: 'Bon à savoir',
    tipText:
      'Les lochies évoluent généralement progressivement : elles peuvent être rouges au début, puis devenir plus claires avant de diminuer. Chaque récupération est cependant individuelle.',
    summaryHeading: 'À retenir',
    summaryPoints: [
      'Les lochies sont des pertes normales après l’accouchement.',
      'Elles évoluent généralement en couleur et en quantité au fil des semaines.',
      'Leur durée et leur évolution peuvent varier selon chaque personne.',
      'Une odeur inhabituelle, de la fièvre, des douleurs importantes ou un saignement soudainement très abondant nécessitent un avis médical.',
    ],
    disclaimerText:
      'Contenu informatif. Cet article ne remplace pas un avis ou un examen médical. En cas de doute ou de symptôme préoccupant, demande conseil à un professionnel de santé.',
    shareMessage: 'Comprendre les lochies après la naissance — AWA',
  },
  en: {
    badgeText: 'POSTPARTUM • LOCHIA',
    title: 'Understanding lochia\nafter birth',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Informational content',
    intro:
      'After giving birth, lochia refers to the vaginal discharge linked to the natural process of uterine recovery. Its color and amount gradually change over the days and weeks that follow.',
    contentsTitle: 'In this article',
    topics: [
      'What is lochia?',
      'How does it change over time?',
      'What can be normal',
      'Comfort tips',
      'When to seek medical advice?',
      'Key takeaways',
    ],
    section1Heading: '1. What is lochia?',
    section1Body1:
      'Lochia is vaginal discharge that appears after giving birth. It mainly consists of the gradual elimination of blood, secretions, and tissue from the uterus as it recovers.',
    section1Body2:
      'It’s different from a regular period. It’s expected during the postpartum period and generally decreases progressively.',
    infoTitle: 'Key takeaways',
    infoText:
      'Lochia doesn’t mean your period has already returned. The return of your period is a separate event that happens later.',
    section2Heading: '2. How does lochia change over time?',
    section2Body:
      'Its appearance usually changes over the first few weeks. The color gradually becomes lighter and the amount tends to decrease.',
    evolutionTitle: 'A gradual progression',
    evolutionSubtitle: 'The stages can vary from person to person',
    evolution: [
      {
        label: 'Bright red',
        period: 'The first days',
        text: 'Discharge is usually red and can be heavier at the start.',
      },
      {
        label: 'Pink / brownish',
        period: 'After a few days',
        text: 'The color gradually becomes lighter and may shift toward pink or brown.',
      },
      {
        label: 'Whitish-yellow',
        period: 'Over the following weeks',
        text: 'Discharge usually becomes lighter, yellowish or whitish, before tapering off.',
      },
    ],
    section3Heading: '3. What can be normal',
    section3Body:
      'How lochia evolves isn’t exactly the same for everyone. Certain changes can naturally accompany recovery after birth.',
    normalPoints: [
      {
        title: 'A varying amount',
        text: 'The amount can change over the first few days and then gradually decrease.',
      },
      {
        title: 'A color that changes',
        text: 'Lochia usually moves from red toward lighter shades over time.',
      },
      {
        title: 'A varying duration',
        text: 'It can persist for several weeks, and how it evolves differs from person to person.',
      },
    ],
    section4Heading: '4. Comfort and tracking tips',
    section4Body:
      'During this period, simple tracking can help you observe how your body is changing without comparing your experience to someone else’s.',
    comfortTips: [
      {
        title: 'Gentle hygiene',
        text: 'Favor gentle, regular washing without irritating products.',
      },
      {
        title: 'Watch how it evolves',
        text: 'You can note the color, amount, and progression of the discharge if that helps you track your recovery.',
      },
      {
        title: 'Allow yourself rest',
        text: 'The postpartum period takes time. Listen to your body and respect your need to recover.',
      },
    ],
    section5Heading: '5. Lochia or the return of your period?',
    section5Body:
      'Lochia appears in the days following birth and gradually decreases. The return of your period, on the other hand, corresponds to the resumption of your menstrual cycle after this period.',
    compareLochiaTitle: 'Lochia',
    compareLochiaText: 'Discharge linked to uterine recovery after birth.',
    compareReturnTitle: 'Return of your period',
    compareReturnText:
      'Resumption of the menstrual cycle, at a time that varies from person to person.',
    section6Heading: '6. When to seek medical advice?',
    section6Body:
      'If the progression seems unusual to you, or if your overall condition is getting worse, it’s important to seek advice from a healthcare professional.',
    warningTitle: 'Signs that call for medical advice',
    warningSigns: [
      'A strong or unusual odor',
      'Fever or a worsening general condition',
      'A flow that suddenly becomes much heavier',
      'Significant, persistent, or unusual pain',
      'A new symptom that worries you',
    ],
    tipTitle: 'Good to know',
    tipText:
      'Lochia usually evolves gradually: it can be red at first, then become lighter before tapering off. However, every recovery is individual.',
    summaryHeading: 'Key takeaways',
    summaryPoints: [
      'Lochia is normal discharge after childbirth.',
      'It usually changes in color and amount over the weeks.',
      'Its duration and progression can vary from person to person.',
      'An unusual odor, fever, significant pain, or a sudden, very heavy bleed require medical advice.',
    ],
    disclaimerText:
      'Informational content. This article does not replace medical advice or an examination. If in doubt or if you notice a concerning symptom, seek advice from a healthcare professional.',
    shareMessage: 'Understanding lochia after birth — AWA',
  },
  es: {
    badgeText: 'POSPARTO • LOQUIOS',
    title: 'Entender los loquios después \ndel parto',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido informativo',
    intro:
      'Después del parto, los loquios son las pérdidas vaginales relacionadas con el proceso natural de recuperación del útero. Su color y su cantidad evolucionan progresivamente a lo largo de los días y las semanas.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué son los loquios?',
      '¿Cómo evolucionan?',
      'Lo que puede ser normal',
      'Consejos de confort',
      '¿Cuándo consultar?',
      'Para recordar',
    ],
    section1Heading: '1. ¿Qué son los loquios?',
    section1Body1:
      'Los loquios son pérdidas vaginales que aparecen después del parto. Corresponden principalmente a la eliminación progresiva de sangre, secreciones y tejidos procedentes del útero durante su recuperación.',
    section1Body2:
      'Son diferentes de las reglas habituales. Su presencia es esperada durante el periodo posparto y generalmente disminuyen progresivamente.',
    infoTitle: 'Para recordar',
    infoText:
      'Los loquios no significan que la regla ya haya vuelto. El regreso de la regla es un fenómeno diferente que ocurre más tarde.',
    section2Heading: '2. ¿Cómo evolucionan los loquios?',
    section2Body:
      'Su aspecto suele cambiar durante las primeras semanas. El color se vuelve progresivamente más claro y la cantidad tiende a disminuir.',
    evolutionTitle: 'Una evolución progresiva',
    evolutionSubtitle: 'Las etapas pueden variar según cada persona',
    evolution: [
      {
        label: 'Rojo vivo',
        period: 'Los primeros días',
        text: 'Las pérdidas suelen ser rojas y pueden ser más abundantes al principio.',
      },
      {
        label: 'Rosado / parduzco',
        period: 'Después de unos días',
        text: 'El color se vuelve progresivamente más claro y puede tender hacia el rosa o el marrón.',
      },
      {
        label: 'Blanco amarillento',
        period: 'A lo largo de las semanas',
        text: 'Las pérdidas suelen volverse más claras, amarillentas o blanquecinas antes de disminuir.',
      },
    ],
    section3Heading: '3. Lo que puede ser normal',
    section3Body:
      'La evolución de los loquios no es exactamente igual para todo el mundo. Algunos cambios pueden acompañar naturalmente la recuperación después del parto.',
    normalPoints: [
      {
        title: 'Una cantidad variable',
        text: 'La abundancia puede cambiar durante los primeros días y luego disminuir progresivamente.',
      },
      {
        title: 'Un color que evoluciona',
        text: 'Los loquios suelen pasar del rojo a tonos más claros con el paso del tiempo.',
      },
      {
        title: 'Una duración variable',
        text: 'Pueden persistir varias semanas y su evolución difiere según cada persona.',
      },
    ],
    section4Heading: '4. Consejos de confort y de seguimiento',
    section4Body:
      'Durante este periodo, un seguimiento sencillo puede ayudarte a observar la evolución de tu cuerpo sin buscar comparar tu experiencia con la de otra persona.',
    comfortTips: [
      {
        title: 'Higiene suave',
        text: 'Prioriza un aseo suave y regular sin productos irritantes.',
      },
      {
        title: 'Observa la evolución',
        text: 'Puedes anotar el color, la cantidad y la evolución de las pérdidas si eso te ayuda a hacer un seguimiento de tu recuperación.',
      },
      {
        title: 'Concédete descanso',
        text: 'El periodo posparto requiere tiempo. Escucha tu cuerpo y respeta tus necesidades de recuperación.',
      },
    ],
    section5Heading: '5. ¿Loquios o regreso de la regla?',
    section5Body:
      'Los loquios aparecen tras el parto y disminuyen progresivamente. El regreso de la regla, por su parte, corresponde a la reanudación del ciclo menstrual después de este periodo.',
    compareLochiaTitle: 'Loquios',
    compareLochiaText:
      'Pérdidas relacionadas con la recuperación del útero después del parto.',
    compareReturnTitle: 'Regreso de la regla',
    compareReturnText:
      'Reanudación del ciclo menstrual, en un momento variable según cada persona.',
    section6Heading: '6. ¿Cuándo consultar?',
    section6Body:
      'Si la evolución te parece inusual o si tu estado general empeora, es importante pedir consejo a un profesional de la salud.',
    warningTitle: 'Señales que merecen un aviso médico',
    warningSigns: [
      'Un olor fuerte o inusual',
      'Fiebre o un estado general que empeora',
      'Un flujo que de repente se vuelve mucho más abundante',
      'Dolores importantes, persistentes o inusuales',
      'Un síntoma nuevo que te preocupa',
    ],
    tipTitle: 'DATO ÚTIL',
    tipText:
      'Los loquios suelen evolucionar progresivamente: pueden ser rojos al principio, y luego volverse más claros antes de disminuir. Sin embargo, cada recuperación es individual.',
    summaryHeading: 'Para recordar',
    summaryPoints: [
      'Los loquios son pérdidas normales después del parto.',
      'Suelen evolucionar en color y en cantidad a lo largo de las semanas.',
      'Su duración y su evolución pueden variar según cada persona.',
      'Un olor inusual, fiebre, dolores importantes o un sangrado repentinamente muy abundante requieren un aviso médico.',
    ],
    disclaimerText:
      'Contenido informativo. Este artículo no sustituye un aviso o un examen médico. En caso de duda o de síntoma preocupante, pide consejo a un profesional de la salud.',
    shareMessage: 'Entender los loquios después del parto — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function LochiaArticleScreen({
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

  /* ------------------------------------------------------------------------ */
  /* BOOKMARK                                                                 */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* SHARE                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
        ]}
      >

        {/* ================================================================== */}
        {/* HERO                                                               */}
        {/* ================================================================== */}

        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(
                  insets.top,
                  true,
                ),
              },
            ]}
          >

            {/* BACK */}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}
            >
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            {/* ACTIONS */}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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
                ]}
              >
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

          </View>
        </View>

        {/* ================================================================== */}
        {/* ARTICLE                                                            */}
        {/* ================================================================== */}

        <View style={styles.article}>

          {/* ---------------------------------------------------------------- */}
          {/* BADGE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badgeText}
            </Text>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* TITLE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* METADATA                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['book-open-page-variant-outline', content.metaType],
              ['chart-bar', content.metaLevel],
              ['shield-check-outline', content.metaValidated],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* INTRO                                                            */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}
              >
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.section1Heading}
          </Text>

          <Text style={styles.body}>
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                {content.infoTitle}
              </Text>

              <Text style={styles.infoText}>
                {content.infoText}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.section2Heading}
          </Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          {/* EVOLUTION TIMELINE */}

          <View style={styles.evolutionCard}>

            <View style={styles.evolutionHeader}>
              <View style={styles.evolutionHeaderIcon}>
                <MaterialDesignIcons
                  name="timeline-clock-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.evolutionHeaderCopy}>
                <Text style={styles.evolutionTitle}>
                  {content.evolutionTitle}
                </Text>

                <Text style={styles.evolutionSubtitle}>
                  {content.evolutionSubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.timeline}>
              {content.evolution.map((item, index) => {
                const meta = EVOLUTION_META[index];
                const isLast =
                  index === content.evolution.length - 1;

                return (
                  <View
                    key={meta.number}
                    style={styles.timelineItem}
                  >

                    <View style={styles.timelineLeft}>
                      <View style={styles.timelineNode}>
                        <Text style={styles.timelineNumber}>
                          {meta.number}
                        </Text>
                      </View>

                      {!isLast ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>

                    <View style={styles.timelineContent}>

                      <View style={styles.timelineTitleRow}>
                        <MaterialDesignIcons
                          name={meta.icon as never}
                          size={18}
                          color={theme.colors.primary}
                        />

                        <Text style={styles.timelineTitle}>
                          {item.label}
                        </Text>
                      </View>

                      <Text style={styles.timelinePeriod}>
                        {item.period}
                      </Text>

                      <Text style={styles.timelineText}>
                        {item.text}
                      </Text>

                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.section3Heading}
          </Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.normalGrid}>
            {content.normalPoints.map((item, index) => {
              const meta = NORMAL_META[index];

              return (
                <View
                  key={item.title}
                  style={styles.normalCard}
                >
                  <View style={styles.normalIcon}>
                    <MaterialDesignIcons
                      name={meta.icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.normalTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.normalText}>
                    {item.text}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.section4Heading}
          </Text>

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

          <View style={styles.comfortCard}>
            {content.comfortTips.map((item, index) => {
              const meta = COMFORT_META[index];

              return (
                <View
                  key={item.title}
                  style={[
                    styles.comfortRow,
                    index < content.comfortTips.length - 1 &&
                      styles.comfortRowBorder,
                  ]}
                >
                  <View style={styles.comfortIcon}>
                    <MaterialDesignIcons
                      name={meta.icon as never}
                      size={19}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.comfortCopy}>
                    <Text style={styles.comfortTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.comfortText}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* DIFFERENCE LOCHIES / RULES                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.section5Heading}
          </Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <View style={styles.compareCard}>

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="water-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>
                {content.compareLochiaTitle}
              </Text>

              <Text style={styles.compareText}>
                {content.compareLochiaText}
              </Text>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="calendar-month-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>
                {content.compareReturnTitle}
              </Text>

              <Text style={styles.compareText}>
                {content.compareReturnText}
              </Text>
            </View>

          </View>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.section6Heading}
          </Text>

          <Text style={styles.body}>
            {content.section6Body}
          </Text>

          <View style={styles.warningCard}>

            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <Text style={styles.warningTitle}>
                {content.warningTitle}
              </Text>
            </View>

            {content.warningSigns.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* TIP                                                                 */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.tipText}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                            */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.summaryHeading}
          </Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View
                key={item}
                style={styles.summaryRow}
              >
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                         */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* READING CONTROLS                                                     */}
      {/* ==================================================================== */}

      <ReadingControls
        articleId={ID}
        durationMinutes={6}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* ========================================================================== */
/* STYLES                                                                      */
/* ========================================================================== */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ------------------------------------------------------------------------ */
  /* SCREEN                                                                   */
  /* ------------------------------------------------------------------------ */

  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  /* ------------------------------------------------------------------------ */
  /* HERO                                                                     */
  /* ------------------------------------------------------------------------ */

  heroWrap: {
    height: 245,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  hero: {
    width: '100%',
    height: '100%',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },

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

  pressed: {
    opacity: 0.74,
  },

  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                  */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* METADATA                                                                 */
  /* ------------------------------------------------------------------------ */

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* INTRO                                                                    */
  /* ------------------------------------------------------------------------ */

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  /* ------------------------------------------------------------------------ */
  /* CONTENTS                                                                 */
  /* ------------------------------------------------------------------------ */

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 25,
    color: theme.colors.primary,
    fontSize: 11.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.3,
    lineHeight: 17,
    color: theme.colors.text,
  },

  /* ------------------------------------------------------------------------ */
  /* HEADINGS & theme.colors.textSecondary                                                          */
  /* ------------------------------------------------------------------------ */

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* INFO CARD                                                                */
  /* ------------------------------------------------------------------------ */

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoCopy: {
    flex: 1,
    marginLeft: 9,
  },

  infoTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* EVOLUTION                                                                */
  /* ------------------------------------------------------------------------ */

  evolutionCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  evolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  evolutionHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  evolutionHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  evolutionTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  evolutionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },

  timeline: {
    marginTop: 5,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 91,
  },

  timelineLeft: {
    width: 43,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 32,
    height: 32,
    marginTop: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },

  timelineNumber: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  timelineLine: {
    position: 'absolute',
    top: 46,
    bottom: 0,
    width: 1.5,
    backgroundColor: theme.colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 13,
    paddingLeft: 9,
    paddingBottom: 12,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  timelineTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
    fontWeight: '800',
  },

  timelinePeriod: {
    marginTop: 2,
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  timelineText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* NORMAL GRID                                                              */
  /* ------------------------------------------------------------------------ */

  normalGrid: {
    marginTop: 13,
    gap: 9,
  },

  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  normalTitle: {
    marginTop: 8,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  normalText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* COMFORT                                                                  */
  /* ------------------------------------------------------------------------ */

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  comfortRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
  },

  comfortRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  comfortCopy: {
    flex: 1,
    marginLeft: 10,
  },

  comfortTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  comfortText: {
    marginTop: 3,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* COMPARISON                                                               */
  /* ------------------------------------------------------------------------ */

  compareCard: {
    marginTop: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  compareColumn: {
    flex: 1,
  },

  compareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  compareTitle: {
    marginTop: 8,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  compareText: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  compareDivider: {
    width: 1,
    marginHorizontal: 12,
    backgroundColor: theme.colors.border,
  },

  /* ------------------------------------------------------------------------ */
  /* WARNING                                                                  */
  /* ------------------------------------------------------------------------ */

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  warningTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },

  warningBullet: {
    width: 20,
    alignItems: 'flex-start',
  },

  warningText: {
    flex: 1,
    marginLeft: 5,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },

  /* ------------------------------------------------------------------------ */
  /* TIP                                                                      */
  /* ------------------------------------------------------------------------ */

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                  */
  /* ------------------------------------------------------------------------ */

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  summaryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* DISCLAIMER                                                               */
  /* ------------------------------------------------------------------------ */

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: theme.colors.textMuted,
  },
  });
}
