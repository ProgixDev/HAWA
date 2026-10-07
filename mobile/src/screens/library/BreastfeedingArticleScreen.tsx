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

const ID = 'breastfeeding-debuter-allaitement';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons/numbers stay language-neutral; only TEXT moves into the       */
/* bilingual CONTENT object below, keyed by index to stay aligned with these. */
/* -------------------------------------------------------------------------- */

const STARTING_STEPS_META = [
  {icon: 'baby-face-outline', number: '01'},
  {icon: 'clock-outline', number: '02'},
  {icon: 'repeat', number: '03'},
  {icon: 'chart-line', number: '04'},
] as const;

const SIGNALS_META = [
  {icon: 'clock-outline'},
  {icon: 'baby-face-outline'},
  {icon: 'water-outline'},
] as const;

const LATCH_POINTS_META = [
  {icon: 'account-child-outline'},
  {icon: 'gesture-tap'},
  {icon: 'heart-outline'},
  {icon: 'check-circle-outline'},
] as const;

const SUPPORT_OPTIONS_META = [
  {icon: 'account-heart-outline'},
  {icon: 'doctor'},
  {icon: 'human-male-board-poll'},
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    shareMessage: 'Débuter l’allaitement en confiance — AWA',
    badge: 'POST-PARTUM • ALLAITEMENT',
    title: 'Débuter l’allaitement\nen confiance',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les premiers jours d’allaitement sont une période d’apprentissage pour le bébé comme pour la mère. Mise au sein, rythme, position et observation permettent progressivement de trouver un fonctionnement confortable.',
    contentsTitle: 'Dans cet article',
    contentsSubtitle: 'Les essentiels pour commencer',
    tocItems: [
      'Les premières étapes',
      'Les signaux à observer',
      'Une bonne prise du sein',
      'Quand demander de l’aide',
      'À retenir',
    ],
    h2Step1: '1. Les premières étapes',
    body1: 'Le démarrage de l’allaitement se construit progressivement. Les premières heures puis les premiers jours permettent au bébé et à sa mère d’apprendre ensemble.',
    timelineTitle: 'Le démarrage, étape par étape',
    timelineSubtitle: 'Un repère simple, sans pression',
    startingSteps: [
      {title: 'Après la naissance', text: 'Le contact peau à peau et une première mise au sein peuvent favoriser le démarrage.'},
      {title: 'Les premières heures', text: 'Le bébé peut téter fréquemment. Il est normal que le rythme varie.'},
      {title: 'Les premiers jours', text: 'Les tétées deviennent progressivement un repère pour le bébé et la mère.'},
      {title: 'Installation progressive', text: 'La lactation s’adapte progressivement aux besoins du bébé.'},
    ],
    h2Step2: '2. Les signaux à observer',
    body2: 'Plutôt que de se concentrer uniquement sur l’horloge, il peut être utile d’observer les signes d’éveil, les tétées et l’évolution des couches.',
    signals: [
      {title: 'Un rythme fréquent', text: 'Un nouveau-né peut demander souvent le sein, parfois 8 à 12 fois par 24 heures.'},
      {title: 'Les signes d’éveil', text: 'Le bébé peut bouger, ouvrir la bouche ou chercher le sein lorsqu’il commence à avoir faim.'},
      {title: 'Les couches', text: 'L’évolution des couches mouillées et des selles fait partie des éléments observés au quotidien.'},
    ],
    h2Step3: '3. Une bonne prise du sein',
    body3: 'Une position confortable et une prise efficace peuvent faciliter la tétée. Si la douleur est importante ou persistante, un professionnel peut vérifier la position et la prise du sein.',
    latchTitle: 'Les 4 repères de confort',
    latchSubtitle: 'Une vérification simple pendant la tétée',
    latchCenterTitle: 'Bébé + sein',
    latchCenterSubtitle: 'Position confortable',
    latchPoints: [
      {title: 'Bébé bien positionné', text: 'Le bébé est proche du corps et sa tête reste dans un axe confortable.'},
      {title: 'Bouche grande ouverte', text: 'Attendre une ouverture suffisante avant de proposer le sein.'},
      {title: 'Prise confortable', text: 'Une prise efficace ne devrait pas provoquer une douleur importante ou persistante.'},
      {title: 'Succion régulière', text: 'Des mouvements de succion et de déglutition peuvent être observés pendant la tétée.'},
    ],
    h2Step4: '4. Quand demander de l’aide ?',
    body4: 'Il n’est pas nécessaire d’attendre que les difficultés deviennent importantes. Une personne formée peut aider à vérifier la position, la prise du sein ou les besoins du bébé.',
    supportOptions: [
      {title: 'Sage-femme', text: 'Peut accompagner les premières mises au sein.'},
      {title: 'Professionnel de santé', text: 'Peut vérifier la santé du bébé et de la mère.'},
      {title: 'Consultante en lactation', text: 'Peut aider lorsque la mise au sein ou la prise du sein pose difficulté.'},
    ],
    infoTitle: 'Chaque allaitement est différent',
    infoText: 'Les premières journées peuvent être très variables. Le rythme des tétées et la quantité de lait peuvent évoluer progressivement. Si quelque chose t’inquiète, demande conseil à un professionnel de santé.',
    h2Summary: 'À retenir',
    summaryItems: [
      'Les premières tétées sont une période d’apprentissage pour le bébé et la mère.',
      'Un nouveau-né peut demander fréquemment le sein.',
      'Une position confortable et une bonne prise du sein sont importantes.',
      'L’observation des signes du bébé est plus utile qu’une recherche de rythme parfaitement fixe.',
      'Une sage-femme ou une consultante en lactation peut accompagner les premières difficultés.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas l’accompagnement personnalisé d’un professionnel de santé.',
  },
  en: {
    shareMessage: 'Starting breastfeeding with confidence — AWA',
    badge: 'POSTPARTUM • BREASTFEEDING',
    title: 'Starting breastfeeding\nwith confidence',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The first days of breastfeeding are a learning period for both baby and mother. Latching, rhythm, positioning, and observation gradually help you find what feels comfortable.',
    contentsTitle: 'In this article',
    contentsSubtitle: 'The essentials to get started',
    tocItems: [
      'The first steps',
      'Signs to watch for',
      'A good latch',
      'When to ask for help',
      'Key takeaways',
    ],
    h2Step1: '1. The first steps',
    body1: 'Breastfeeding gets established gradually. The first hours, then the first days, give baby and mother time to learn together.',
    timelineTitle: 'Getting started, step by step',
    timelineSubtitle: 'A simple guide, with no pressure',
    startingSteps: [
      {title: 'After birth', text: 'Skin-to-skin contact and an early latch can help breastfeeding get off to a good start.'},
      {title: 'The first hours', text: 'Baby may feed frequently. It’s normal for the rhythm to vary.'},
      {title: 'The first days', text: 'Feeds gradually become a shared rhythm for baby and mother.'},
      {title: 'Settling into a rhythm', text: 'Milk supply gradually adjusts to baby’s needs.'},
    ],
    h2Step2: '2. Signs to watch for',
    body2: 'Rather than focusing only on the clock, it can help to watch baby’s waking signs, feeds, and diaper patterns.',
    signals: [
      {title: 'A frequent rhythm', text: 'A newborn may ask to feed often, sometimes 8 to 12 times over 24 hours.'},
      {title: 'Waking signs', text: 'Baby may move, open their mouth, or root for the breast when starting to feel hungry.'},
      {title: 'Diapers', text: 'The number of wet and dirty diapers is one of the things to keep an eye on day to day.'},
    ],
    h2Step3: '3. A good latch',
    body3: 'A comfortable position and an effective latch can make feeds easier. If pain is significant or persistent, a healthcare professional can check positioning and latch.',
    latchTitle: 'The 4 comfort markers',
    latchSubtitle: 'A simple check during feeds',
    latchCenterTitle: 'Baby + breast',
    latchCenterSubtitle: 'Comfortable position',
    latchPoints: [
      {title: 'Baby well positioned', text: 'Baby is held close to the body, with their head in a comfortable alignment.'},
      {title: 'Mouth wide open', text: 'Wait for a wide-enough mouth opening before offering the breast.'},
      {title: 'Comfortable latch', text: 'An effective latch shouldn’t cause significant or persistent pain.'},
      {title: 'Regular suckling', text: 'Suckling and swallowing movements can be observed during the feed.'},
    ],
    h2Step4: '4. When to ask for help?',
    body4: 'There’s no need to wait until difficulties become serious. A trained professional can help check positioning, latch, or baby’s needs.',
    supportOptions: [
      {title: 'Midwife', text: 'Can support you through the first latches.'},
      {title: 'Healthcare professional', text: 'Can check on the health of baby and mother.'},
      {title: 'Lactation consultant', text: 'Can help when latching proves difficult.'},
    ],
    infoTitle: 'Every breastfeeding journey is different',
    infoText: 'The first days can vary a great deal. The rhythm of feeds and the amount of milk may change gradually over time. If something worries you, ask a healthcare professional for advice.',
    h2Summary: 'Key takeaways',
    summaryItems: [
      'The first feeds are a learning period for baby and mother.',
      'A newborn may ask to feed frequently.',
      'A comfortable position and a good latch matter.',
      'Watching baby’s cues is more useful than aiming for a perfectly fixed schedule.',
      'A midwife or lactation consultant can help you through early difficulties.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized guidance from a healthcare professional.',
  },
  es: {
    shareMessage: 'Empezar la lactancia con confianza — AWA',
    badge: 'POSPARTO • LACTANCIA',
    title: 'Empezar la lactancia\ncon confianza',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Los primeros días de lactancia son un periodo de aprendizaje tanto para el bebé como para la madre. El agarre al pecho, el ritmo, la posición y la observación permiten encontrar progresivamente una forma de funcionar cómoda.',
    contentsTitle: 'En este artículo',
    contentsSubtitle: 'Lo esencial para empezar',
    tocItems: [
      'Las primeras etapas',
      'Las señales a observar',
      'Un buen agarre al pecho',
      'Cuándo pedir ayuda',
      'Para recordar',
    ],
    h2Step1: '1. Las primeras etapas',
    body1: 'El inicio de la lactancia se construye progresivamente. Las primeras horas y después los primeros días permiten al bebé y a su madre aprender juntos.',
    timelineTitle: 'El inicio, paso a paso',
    timelineSubtitle: 'Una referencia sencilla, sin presión',
    startingSteps: [
      {title: 'Después del nacimiento', text: 'El contacto piel con piel y un primer agarre al pecho pueden favorecer el inicio.'},
      {title: 'Las primeras horas', text: 'El bebé puede mamar con frecuencia. Es normal que el ritmo varíe.'},
      {title: 'Los primeros días', text: 'Las tomas se convierten progresivamente en una referencia para el bebé y la madre.'},
      {title: 'Instauración progresiva', text: 'La lactancia se adapta progresivamente a las necesidades del bebé.'},
    ],
    h2Step2: '2. Las señales a observar',
    body2: 'En lugar de centrarte únicamente en el reloj, puede ser útil observar las señales de que el bebé está despierto, las tomas y la evolución de los pañales.',
    signals: [
      {title: 'Un ritmo frecuente', text: 'Un recién nacido puede pedir el pecho a menudo, a veces de 8 a 12 veces en 24 horas.'},
      {title: 'Las señales de hambre', text: 'El bebé puede moverse, abrir la boca o buscar el pecho cuando empieza a tener hambre.'},
      {title: 'Los pañales', text: 'La evolución de los pañales mojados y las deposiciones forma parte de lo que se observa en el día a día.'},
    ],
    h2Step3: '3. Un buen agarre al pecho',
    body3: 'Una posición cómoda y un agarre eficaz pueden facilitar la toma. Si el dolor es importante o persistente, un profesional puede comprobar la posición y el agarre al pecho.',
    latchTitle: 'Los 4 indicadores de comodidad',
    latchSubtitle: 'Una comprobación sencilla durante la toma',
    latchCenterTitle: 'Bebé + pecho',
    latchCenterSubtitle: 'Posición cómoda',
    latchPoints: [
      {title: 'Bebé bien colocado', text: 'El bebé está cerca del cuerpo y su cabeza se mantiene en un eje cómodo.'},
      {title: 'Boca bien abierta', text: 'Espera a que la boca esté lo bastante abierta antes de ofrecer el pecho.'},
      {title: 'Agarre cómodo', text: 'Un agarre eficaz no debería provocar un dolor importante o persistente.'},
      {title: 'Succión regular', text: 'Durante la toma pueden observarse movimientos de succión y deglución.'},
    ],
    h2Step4: '4. ¿Cuándo pedir ayuda?',
    body4: 'No es necesario esperar a que las dificultades se vuelvan importantes. Una persona formada puede ayudar a comprobar la posición, el agarre al pecho o las necesidades del bebé.',
    supportOptions: [
      {title: 'Partera', text: 'Puede acompañarte en los primeros agarres al pecho.'},
      {title: 'Profesional de la salud', text: 'Puede comprobar la salud del bebé y de la madre.'},
      {title: 'Consultora de lactancia', text: 'Puede ayudar cuando el agarre al pecho resulta difícil.'},
    ],
    infoTitle: 'Cada lactancia es diferente',
    infoText: 'Los primeros días pueden ser muy variables. El ritmo de las tomas y la cantidad de leche pueden evolucionar progresivamente. Si algo te preocupa, pide consejo a un profesional de la salud.',
    h2Summary: 'Para recordar',
    summaryItems: [
      'Las primeras tomas son un periodo de aprendizaje para el bebé y la madre.',
      'Un recién nacido puede pedir el pecho con frecuencia.',
      'Una posición cómoda y un buen agarre al pecho son importantes.',
      'Observar las señales del bebé es más útil que buscar un ritmo perfectamente fijo.',
      'Una partera o una consultora de lactancia puede acompañarte en las primeras dificultades.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye el acompañamiento personalizado de un profesional de la salud.',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                       */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                      */
/* -------------------------------------------------------------------------- */

export default function BreastfeedingArticleScreen({
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
        onScroll={event => {
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          );
        }}
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
        {/* ---------------------------------------------------------------- */}
        {/* HERO                                                             */}
        {/* ---------------------------------------------------------------- */}

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
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

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
                ]}>
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

        {/* ---------------------------------------------------------------- */}
        {/* ARTICLE                                                          */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.article}>
          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* Metadata */}
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

          {/* Introduction */}
          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.contents}>
            <View style={styles.contentsHeader}>
              <View style={styles.contentsIcon}>
                <MaterialDesignIcons
                  name="format-list-bulleted"
                  size={19}
                  color={theme.colors.primary}
                />
              </View>

              <View>
                <Text style={styles.contentsTitle}>
                  {content.contentsTitle}
                </Text>

                <Text style={styles.contentsSubtitle}>
                  {content.contentsSubtitle}
                </Text>
              </View>
            </View>

            {content.tocItems.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <View style={styles.contentNumberCircle}>
                    <Text style={styles.contentNumber}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Step1}
          </Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          {/* MODERN TIMELINE */}
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <View style={styles.timelineHeaderIcon}>
                <MaterialDesignIcons
                  name="timeline-clock-outline"
                  size={23}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.timelineHeaderCopy}>
                <Text style={styles.timelineTitle}>
                  {content.timelineTitle}
                </Text>

                <Text style={styles.timelineSubtitle}>
                  {content.timelineSubtitle}
                </Text>
              </View>
            </View>

            {content.startingSteps.map((step, index) => {
              const meta = STARTING_STEPS_META[index];

              return (
                <View
                  key={meta.number}
                  style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineNode}>
                      <Text style={styles.timelineNumber}>
                        {meta.number}
                      </Text>
                    </View>

                    {index < content.startingSteps.length - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={styles.timelineStepTitle}>
                        {step.title}
                      </Text>

                      <MaterialDesignIcons
                        name={meta.icon as never}
                        size={19}
                        color={theme.colors.primary}
                      />
                    </View>

                    <Text style={styles.timelineText}>
                      {step.text}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Step2}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.signalGrid}>
            {content.signals.map((item, index) => {
              const meta = SIGNALS_META[index];

              return (
                <View
                  key={item.title}
                  style={[
                    styles.signalCard,
                    index === 0 && styles.signalCardLarge,
                  ]}>
                  <View style={styles.signalIcon}>
                    <MaterialDesignIcons
                      name={meta.icon as never}
                      size={21}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.signalTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.signalText}>
                    {item.text}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 3                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Step3}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          {/* LATCH SCHEMA */}
          <View style={styles.latchCard}>
            <View style={styles.latchHeader}>
              <View style={styles.latchBadge}>
                <MaterialDesignIcons
                  name="heart-pulse"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.latchHeaderCopy}>
                <Text style={styles.latchTitle}>
                  {content.latchTitle}
                </Text>

                <Text style={styles.latchSubtitle}>
                  {content.latchSubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.latchCenter}>
              <View style={styles.latchCircleOuter}>
                <View style={styles.latchCircleInner}>
                  <MaterialDesignIcons
                    name="baby-face-outline"
                    size={35}
                    color={theme.colors.primary}
                  />
                </View>
              </View>

              <View style={styles.latchCenterText}>
                <Text style={styles.latchCenterTitle}>
                  {content.latchCenterTitle}
                </Text>

                <Text style={styles.latchCenterSubtitle}>
                  {content.latchCenterSubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.latchPoints}>
              {content.latchPoints.map((item, index) => {
                const meta = LATCH_POINTS_META[index];

                return (
                  <View
                    key={item.title}
                    style={styles.latchPoint}>
                    <View style={styles.latchPointNumber}>
                      <Text style={styles.latchPointNumberText}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.latchPointIcon}>
                      <MaterialDesignIcons
                        name={meta.icon as never}
                        size={19}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={styles.latchPointCopy}>
                      <Text style={styles.latchPointTitle}>
                        {item.title}
                      </Text>

                      <Text style={styles.latchPointText}>
                        {item.text}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 4                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Step4}
          </Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

          <View style={styles.supportCard}>
            {content.supportOptions.map((item, index) => {
              const meta = SUPPORT_OPTIONS_META[index];

              return (
                <React.Fragment key={item.title}>
                  <View style={styles.supportRow}>
                    <View style={styles.supportIcon}>
                      <MaterialDesignIcons
                        name={meta.icon as never}
                        size={21}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={styles.supportCopy}>
                      <Text style={styles.supportTitle}>
                        {item.title}
                      </Text>

                      <Text style={styles.supportText}>
                        {item.text}
                      </Text>
                    </View>
                  </View>

                  {index < content.supportOptions.length - 1 ? (
                    <View style={styles.supportSeparator} />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* IMPORTANT NOTE                                                    */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={21}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                {content.infoTitle}
              </Text>

              <Text style={styles.infoText}>
                {content.infoText}
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SUMMARY                                                           */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Summary}
          </Text>

          <View style={styles.summaryCard}>
            {content.summaryItems.map(item => (
              <View
                key={item}
                style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={19}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* DISCLAIMER */}
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

      {/* -------------------------------------------------------------------- */}
      {/* READING CONTROLS                                                     */}
      {/* -------------------------------------------------------------------- */}

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
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  /* ---------------------------------------------------------------------- */
  /* HERO                                                                   */
  /* ---------------------------------------------------------------------- */

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
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.72,
  },

  /* ---------------------------------------------------------------------- */
  /* ARTICLE                                                                */
  /* ---------------------------------------------------------------------- */

  article: {
    marginTop: -15,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
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

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  /* ---------------------------------------------------------------------- */
  /* CONTENTS                                                               */
  /* ---------------------------------------------------------------------- */

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  contentsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginRight: 10,
  },

  contentsTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentsSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  contentRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumberCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginRight: 9,
  },

  contentNumber: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.3,
    lineHeight: 17,
    color: theme.colors.text,
  },

  /* ---------------------------------------------------------------------- */
  /* HEADINGS                                                               */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /* MODERN TIMELINE                                                        */
  /* ---------------------------------------------------------------------- */

  timelineCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  timelineHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  timelineHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  timelineTitle: {
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  timelineSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 91,
  },

  timelineLeft: {
    width: 46,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 35,
    height: 35,
    marginTop: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },

  timelineNumber: {
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '900',
  },

  timelineLine: {
    position: 'absolute',
    top: 49,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 10,
    paddingLeft: 7,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timelineStepTitle: {
    flex: 1,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  timelineText: {
    marginTop: 4,
    paddingRight: 5,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SIGNAL GRID                                                            */
  /* ---------------------------------------------------------------------- */

  signalGrid: {
    marginTop: 14,
    gap: 9,
  },

  signalCard: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  signalCardLarge: {
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderColor: theme.colors.border,
  },

  signalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  signalTitle: {
    marginTop: 9,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  signalText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* LATCH SCHEMA                                                           */
  /* ---------------------------------------------------------------------- */

  latchCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  latchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  latchBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  latchHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  latchTitle: {
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  latchCenter: {
    marginTop: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  latchCircleOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  latchCircleInner: {
    width: 59,
    height: 59,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },

  latchCenterText: {
    alignItems: 'center',
    marginTop: 9,
  },

  latchCenterTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchCenterSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  latchPoints: {
    marginTop: 13,
  },

  latchPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  latchPointNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  latchPointNumberText: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: '900',
  },

  latchPointIcon: {
    width: 32,
    height: 32,
    marginLeft: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  latchPointCopy: {
    flex: 1,
    marginLeft: 9,
  },

  latchPointTitle: {
    fontSize: 11.8,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchPointText: {
    marginTop: 2,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SUPPORT                                                                */
  /* ---------------------------------------------------------------------- */

  supportCard: {
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },

  supportIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  supportCopy: {
    flex: 1,
    marginLeft: 10,
  },

  supportTitle: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
  },

  supportText: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  supportSeparator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },

  /* ---------------------------------------------------------------------- */
  /* INFO BOX                                                               */
  /* ---------------------------------------------------------------------- */

  infoBox: {
    marginTop: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  infoCopy: {
    flex: 1,
    marginLeft: 10,
  },

  infoTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SUMMARY                                                                */
  /* ---------------------------------------------------------------------- */

  summaryCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
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

  /* ---------------------------------------------------------------------- */
  /* DISCLAIMER                                                             */
  /* ---------------------------------------------------------------------- */

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
