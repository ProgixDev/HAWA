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
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';

const ID = 'hormonaltreatments-panorama';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below. These arrays are kept aligned by index with
// CONTENT.<lang>.methods / CONTENT.<lang>.criteria.
const METHOD_ICONS = [
  'pill',
  'bandage',
  'circle-outline',
  'needle',
  'record-circle-outline',
] as const;

const CRITERIA_ICONS = [
  'calendar-clock-outline',
  'heart-pulse',
  'baby-face-outline',
  'shield-check-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'TRAITEMENTS HORMONAUX',
    title: 'Panorama des traitements hormonaux contraceptifs',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pilule, patch, anneau, implant, stérilet hormonal : ce qui les distingue et comment réfléchir à la méthode qui correspond le mieux à ton quotidien.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Un principe d’action commun',
      'Les différentes méthodes',
      'Comment orienter son choix',
      'À retenir',
    ],
    body1: 'Les méthodes hormonales utilisent des hormones pour prévenir une grossesse. Selon la méthode, elles peuvent principalement empêcher l’ovulation, épaissir la glaire cervicale et modifier l’environnement de l’utérus.',
    diagramTitle: 'Comment agit la contraception hormonale ?',
    diagramSubtitle: 'Plusieurs mécanismes peuvent participer à la protection.',
    step1Title: 'Ovulation',
    step1Text: 'Certaines méthodes empêchent ou inhibent la libération de l’ovule.',
    step2Title: 'Glaire cervicale',
    step2Text: 'La glaire peut devenir plus épaisse, ce qui rend le passage des spermatozoïdes plus difficile.',
    step3Title: 'Protection contraceptive',
    step3Text: 'L’association de ces mécanismes contribue à réduire le risque de grossesse.',
    body2: 'Toutes les méthodes ne demandent pas le même niveau d’implication. Le principal point de différence est la fréquence à laquelle tu dois penser à ta contraception.',
    comparisonTitle: 'Comparer les méthodes',
    comparisonSubtitle: 'Du geste quotidien à la protection longue durée',
    scaleDaily: 'Quotidien',
    scaleWeekly: 'Hebdomadaire',
    scaleLongTerm: 'Longue durée',
    methods: [
      {
        title: 'Pilule',
        frequency: 'Chaque jour',
        duration: 'À prendre régulièrement',
        profile: 'Idéale si tu veux gérer toi-même ta contraception',
      },
      {
        title: 'Patch',
        frequency: 'Chaque semaine',
        duration: '3 semaines sur 4',
        profile: 'Pratique si tu préfères éviter une prise quotidienne',
      },
      {
        title: 'Anneau vaginal',
        frequency: 'Toutes les 3 semaines',
        duration: 'Avec une semaine de pause',
        profile: 'Une option discrète avec peu de gestes au quotidien',
      },
      {
        title: 'Implant',
        frequency: 'Plusieurs années',
        duration: 'Sans prise quotidienne',
        profile: 'Adapté si tu souhaites une contraception longue durée',
      },
      {
        title: 'Stérilet hormonal',
        frequency: 'Plusieurs années',
        duration: 'Placé par un professionnel',
        profile: 'Une solution longue durée nécessitant très peu d’entretien',
      },
    ],
    highlightTitle: 'Le point commun à retenir',
    highlightText: 'Plus une méthode réduit les gestes à effectuer au quotidien, moins tu as besoin d’y penser régulièrement. Cela peut être intéressant si tu sais que tu risques d’oublier une prise ou un changement.',
    body3: 'Il n’existe pas une méthode idéale pour tout le monde. Le meilleur choix dépend de ton quotidien, de tes préférences, de ta tolérance et de tes projets.',
    criteria: [
      {
        title: 'Ton quotidien',
        text: 'Certaines méthodes demandent une action quotidienne, tandis que d’autres fonctionnent pendant plusieurs semaines ou années.',
      },
      {
        title: 'Ta tolérance',
        text: 'Les effets ressentis peuvent varier selon la méthode. Une discussion avec un professionnel permet d’évaluer ce qui te convient.',
      },
      {
        title: 'Tes projets',
        text: 'Si tu souhaites une grossesse prochainement ou plus tard, la durée et la réversibilité de la méthode peuvent guider ton choix.',
      },
      {
        title: 'Tes priorités',
        text: 'Discrétion, simplicité, absence de prise quotidienne ou durée prolongée : tes priorités comptent dans la décision.',
      },
    ],
    choiceDiagramTitle: 'Une petite question pour t’orienter',
    questionText: '« Est-ce que je préfère penser à ma contraception tous les jours, toutes les semaines, ou seulement quelques fois par an ? »',
    choiceOption1Title: 'Souvent',
    choiceOption1Text: 'Pilule ou méthode nécessitant un suivi régulier',
    choiceOption2Title: 'Moins souvent',
    choiceOption2Text: 'Patch ou anneau selon le rythme choisi',
    choiceOption3Title: 'Très rarement',
    choiceOption3Text: 'Implant ou stérilet hormonal longue durée',
    alertTitle: 'À noter',
    alertText: 'Le choix d’une contraception hormonale doit tenir compte de ta situation personnelle et médicale. Un professionnel de santé peut t’aider à comparer les bénéfices, les risques, contre-indications et effets indésirables possibles.',
    summaryTitle: 'L’essentiel',
    summarySubtitle: 'Les points importants à garder en tête',
    summaryRow1: 'Les méthodes hormonales utilisent différentes combinaisons d’hormones et différents rythmes d’utilisation.',
    summaryRow2: 'Pilule, patch et anneau demandent une implication régulière, tandis que l’implant et le stérilet hormonal sont des méthodes longue durée.',
    summaryRow3: 'Le choix doit être adapté à ton quotidien, tes préférences, ta tolérance et tes projets.',
    summaryRow4: 'Aucune méthode n’est universellement « meilleure » : elle doit surtout être compatible avec tes besoins et ta situation.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Prendre le temps de comparer les méthodes avec un professionnel de santé permet de choisir une contraception que tu peux utiliser sereinement et régulièrement.',
    shareMessage: 'Panorama des traitements hormonaux contraceptifs — AWA',
  },
  en: {
    badge: 'HORMONAL TREATMENTS',
    title: 'Overview of hormonal contraceptive treatments',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Pill, patch, ring, implant, hormonal IUD: what sets them apart and how to think about the method that best fits your daily life.',
    contentsTitle: 'In this article',
    topics: [
      'A shared mechanism of action',
      'The different methods',
      'How to guide your choice',
      'Key takeaways',
    ],
    body1: 'Hormonal methods use hormones to prevent pregnancy. Depending on the method, they can mainly prevent ovulation, thicken cervical mucus, and change the uterine environment.',
    diagramTitle: 'How does hormonal contraception work?',
    diagramSubtitle: 'Several mechanisms may contribute to protection.',
    step1Title: 'Ovulation',
    step1Text: 'Some methods prevent or inhibit the release of the egg.',
    step2Title: 'Cervical mucus',
    step2Text: 'The mucus may become thicker, which makes it harder for sperm to get through.',
    step3Title: 'Contraceptive protection',
    step3Text: 'The combination of these mechanisms helps reduce the risk of pregnancy.',
    body2: 'Not all methods call for the same level of involvement. The main difference is how often you need to think about your contraception.',
    comparisonTitle: 'Comparing the methods',
    comparisonSubtitle: 'From a daily action to long-term protection',
    scaleDaily: 'Daily',
    scaleWeekly: 'Weekly',
    scaleLongTerm: 'Long-term',
    methods: [
      {
        title: 'Pill',
        frequency: 'Every day',
        duration: 'Taken regularly',
        profile: 'Ideal if you want to manage your own contraception',
      },
      {
        title: 'Patch',
        frequency: 'Every week',
        duration: '3 weeks out of 4',
        profile: 'Convenient if you’d rather avoid a daily routine',
      },
      {
        title: 'Vaginal ring',
        frequency: 'Every 3 weeks',
        duration: 'With a one-week break',
        profile: 'A discreet option with few day-to-day actions',
      },
      {
        title: 'Implant',
        frequency: 'Several years',
        duration: 'No daily routine',
        profile: 'Suited if you want long-term contraception',
      },
      {
        title: 'Hormonal IUD',
        frequency: 'Several years',
        duration: 'Placed by a professional',
        profile: 'A long-term solution that needs very little upkeep',
      },
    ],
    highlightTitle: 'The key thing to remember',
    highlightText: 'The fewer day-to-day actions a method requires, the less often you need to think about it. This can be worth considering if you know you’re likely to forget a dose or a change.',
    body3: 'There isn’t one ideal method for everyone. The best choice depends on your daily life, your preferences, your tolerance, and your plans.',
    criteria: [
      {
        title: 'Your daily life',
        text: 'Some methods call for a daily action, while others work for several weeks or years.',
      },
      {
        title: 'Your tolerance',
        text: 'How a method feels can vary from person to person. Talking with a healthcare professional can help you work out what suits you.',
      },
      {
        title: 'Your plans',
        text: 'If you’re hoping for a pregnancy soon or later on, the method’s duration and reversibility can help guide your choice.',
      },
      {
        title: 'Your priorities',
        text: 'Discretion, simplicity, no daily routine, or long-lasting protection: your priorities matter in this decision.',
      },
    ],
    choiceDiagramTitle: 'A quick question to help you decide',
    questionText: '“Would I rather think about my contraception every day, every week, or only a few times a year?”',
    choiceOption1Title: 'Often',
    choiceOption1Text: 'Pill or a method that needs regular attention',
    choiceOption2Title: 'Less often',
    choiceOption2Text: 'Patch or ring, depending on the rhythm you choose',
    choiceOption3Title: 'Very rarely',
    choiceOption3Text: 'Implant or long-term hormonal IUD',
    alertTitle: 'Worth noting',
    alertText: 'Choosing a hormonal contraceptive should take your personal and medical situation into account. A healthcare professional can help you compare the benefits, risks, contraindications, and possible side effects.',
    summaryTitle: 'The essentials',
    summarySubtitle: 'The key points to keep in mind',
    summaryRow1: 'Hormonal methods use different hormone combinations and different schedules of use.',
    summaryRow2: 'The pill, patch, and ring call for ongoing involvement, while the implant and hormonal IUD are long-term methods.',
    summaryRow3: 'The choice should fit your daily life, your preferences, your tolerance, and your plans.',
    summaryRow4: 'No method is universally “best” — it mainly needs to be compatible with your needs and your situation.',
    tip1Title: 'Good to know',
    tip1Text: 'Taking the time to compare methods with a healthcare professional helps you choose a contraception you can use calmly and consistently.',
    shareMessage: 'Overview of hormonal contraceptive treatments — AWA',
  },
  es: {
    badge: 'TRATAMIENTOS HORMONALES',
    title: 'Panorama de los tratamientos hormonales anticonceptivos',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Píldora, parche, anillo, implante, DIU hormonal: qué los diferencia y cómo reflexionar sobre el método que mejor se ajusta a tu día a día.',
    contentsTitle: 'En este artículo',
    topics: [
      'Un principio de acción común',
      'Los distintos métodos',
      'Cómo orientar tu elección',
      'Lo esencial',
    ],
    body1: 'Los métodos hormonales utilizan hormonas para prevenir un embarazo. Según el método, pueden principalmente impedir la ovulación, espesar el moco cervical y modificar el entorno del útero.',
    diagramTitle: '¿Cómo actúa la anticoncepción hormonal?',
    diagramSubtitle: 'Varios mecanismos pueden contribuir a la protección.',
    step1Title: 'Ovulación',
    step1Text: 'Algunos métodos impiden o inhiben la liberación del óvulo.',
    step2Title: 'Moco cervical',
    step2Text: 'El moco puede volverse más espeso, lo que dificulta el paso de los espermatozoides.',
    step3Title: 'Protección anticonceptiva',
    step3Text: 'La combinación de estos mecanismos contribuye a reducir el riesgo de embarazo.',
    body2: 'No todos los métodos requieren el mismo nivel de implicación. El principal punto de diferencia es la frecuencia con la que debes pensar en tu anticoncepción.',
    comparisonTitle: 'Comparar los métodos',
    comparisonSubtitle: 'Del gesto diario a la protección de larga duración',
    scaleDaily: 'Diario',
    scaleWeekly: 'Semanal',
    scaleLongTerm: 'Larga duración',
    methods: [
      {
        title: 'Píldora',
        frequency: 'Cada día',
        duration: 'Hay que tomarla regularmente',
        profile: 'Ideal si quieres gestionar tú misma tu anticoncepción',
      },
      {
        title: 'Parche',
        frequency: 'Cada semana',
        duration: '3 semanas de cada 4',
        profile: 'Práctico si prefieres evitar una toma diaria',
      },
      {
        title: 'Anillo vaginal',
        frequency: 'Cada 3 semanas',
        duration: 'Con una semana de descanso',
        profile: 'Una opción discreta con pocos gestos en el día a día',
      },
      {
        title: 'Implante',
        frequency: 'Varios años',
        duration: 'Sin toma diaria',
        profile: 'Adecuado si deseas una anticoncepción de larga duración',
      },
      {
        title: 'DIU hormonal',
        frequency: 'Varios años',
        duration: 'Colocado por un profesional',
        profile: 'Una solución de larga duración que requiere muy poco mantenimiento',
      },
    ],
    highlightTitle: 'El punto en común que hay que recordar',
    highlightText: 'Cuantos menos gestos diarios requiera un método, menos necesitas pensar en él regularmente. Esto puede ser interesante si sabes que corres el riesgo de olvidar una toma o un cambio.',
    body3: 'No existe un método ideal para todo el mundo. La mejor elección depende de tu día a día, tus preferencias, tu tolerancia y tus planes.',
    criteria: [
      {
        title: 'Tu día a día',
        text: 'Algunos métodos requieren una acción diaria, mientras que otros funcionan durante varias semanas o años.',
      },
      {
        title: 'Tu tolerancia',
        text: 'Los efectos percibidos pueden variar según el método. Hablar con un profesional permite evaluar lo que te conviene.',
      },
      {
        title: 'Tus planes',
        text: 'Si deseas un embarazo próximamente o más adelante, la duración y la reversibilidad del método pueden orientar tu elección.',
      },
      {
        title: 'Tus prioridades',
        text: 'Discreción, sencillez, ausencia de toma diaria o duración prolongada: tus prioridades cuentan en la decisión.',
      },
    ],
    choiceDiagramTitle: 'Una pequeña pregunta para orientarte',
    questionText: '«¿Prefiero pensar en mi anticoncepción todos los días, todas las semanas, o solo algunas veces al año?»',
    choiceOption1Title: 'A menudo',
    choiceOption1Text: 'Píldora o método que requiere un seguimiento regular',
    choiceOption2Title: 'Con menos frecuencia',
    choiceOption2Text: 'Parche o anillo según el ritmo elegido',
    choiceOption3Title: 'Muy raramente',
    choiceOption3Text: 'Implante o DIU hormonal de larga duración',
    alertTitle: 'A tener en cuenta',
    alertText: 'La elección de una anticoncepción hormonal debe tener en cuenta tu situación personal y médica. Un profesional de la salud puede ayudarte a comparar los beneficios, los riesgos, las contraindicaciones y los posibles efectos indeseados.',
    summaryTitle: 'Lo esencial',
    summarySubtitle: 'Los puntos importantes que hay que tener en cuenta',
    summaryRow1: 'Los métodos hormonales utilizan distintas combinaciones de hormonas y distintos ritmos de uso.',
    summaryRow2: 'La píldora, el parche y el anillo requieren una implicación regular, mientras que el implante y el DIU hormonal son métodos de larga duración.',
    summaryRow3: 'La elección debe adaptarse a tu día a día, tus preferencias, tu tolerancia y tus planes.',
    summaryRow4: 'Ningún método es universalmente «mejor»: sobre todo debe ser compatible con tus necesidades y tu situación.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Tomarte el tiempo de comparar los métodos con un profesional de la salud te permite elegir una anticoncepción que puedas usar con tranquilidad y de forma regular.',
    shareMessage: 'Panorama de los tratamientos hormonales anticonceptivos — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function HormonalTreatmentsPanoramaArticleScreen({
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

          {/* SECTION 1 */}
          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <View style={styles.actionDiagram}>
            <View style={styles.diagramHeader}>
              <View style={styles.diagramHeaderIcon}>
                <MaterialDesignIcons
                  name="shield-check-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.diagramHeaderCopy}>
                <Text style={styles.diagramTitle}>
                  {content.diagramTitle}
                </Text>

                <Text style={styles.diagramSubtitle}>
                  {content.diagramSubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.diagramLine} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>

              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>{content.step1Title}</Text>

                <Text style={styles.stepText}>
                  {content.step1Text}
                </Text>
              </View>
            </View>

            <View style={styles.diagramConnector} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>

              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>{content.step2Title}</Text>

                <Text style={styles.stepText}>
                  {content.step2Text}
                </Text>
              </View>
            </View>

            <View style={styles.diagramConnector} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>

              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>{content.step3Title}</Text>

                <Text style={styles.stepText}>
                  {content.step3Text}
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <View>
                <Text style={styles.comparisonTitle}>
                  {content.comparisonTitle}
                </Text>

                <Text style={styles.comparisonSubtitle}>
                  {content.comparisonSubtitle}
                </Text>
              </View>

              <View style={styles.comparisonIcon}>
                <MaterialDesignIcons
                  name="scale-balance"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>
            </View>

            <View style={styles.frequencyScale}>
              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <Text style={styles.scaleText}>{content.scaleDaily}</Text>
              </View>

              <View style={styles.scaleLine} />

              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <Text style={styles.scaleText}>{content.scaleWeekly}</Text>
              </View>

              <View style={styles.scaleLine} />

              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <Text style={styles.scaleText}>{content.scaleLongTerm}</Text>
              </View>
            </View>

            <View style={styles.methodList}>
              {content.methods.map((method, index) => (
                <View
                  key={method.title}
                  style={[
                    styles.methodCard,
                    index === content.methods.length - 1 &&
                      styles.methodCardLast,
                  ]}>
                  <View style={styles.methodIcon}>
                    <MaterialDesignIcons
                      name={METHOD_ICONS[index] as never}
                      size={23}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.methodMain}>
                    <View style={styles.methodTitleRow}>
                      <Text style={styles.methodTitle}>{method.title}</Text>

                      <View style={styles.frequencyBadge}>
                        <Text style={styles.frequencyBadgeText}>
                          {method.frequency}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.methodDuration}>
                      {method.duration}
                    </Text>

                    <Text style={styles.methodProfile}>
                      {method.profile}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.highlightBox}>
            <View style={styles.highlightIcon}>
              <MaterialDesignIcons
                name="clock-check-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.highlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.highlightText}
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <View style={styles.criteriaGrid}>
            {content.criteria.map((criterion, index) => (
              <View key={criterion.title} style={styles.criteriaCard}>
                <View style={styles.criteriaIcon}>
                  <MaterialDesignIcons
                    name={CRITERIA_ICONS[index] as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.criteriaTitle}>{criterion.title}</Text>

                <Text style={styles.criteriaText}>{criterion.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.choiceDiagram}>
            <View style={styles.choiceDiagramHeader}>
              <MaterialDesignIcons
                name="compass-outline"
                size={23}
                color={theme.colors.primary}
              />

              <Text style={styles.choiceDiagramTitle}>
                {content.choiceDiagramTitle}
              </Text>
            </View>

            <Text style={styles.questionText}>
              {content.questionText}
            </Text>

            <View style={styles.choiceOptions}>
              <View style={styles.choiceOption}>
                <Text style={styles.choiceOptionTitle}>
                  {content.choiceOption1Title}
                </Text>
                <Text style={styles.choiceOptionText}>
                  {content.choiceOption1Text}
                </Text>
              </View>

              <View style={styles.choiceOption}>
                <Text style={styles.choiceOptionTitle}>
                  {content.choiceOption2Title}
                </Text>
                <Text style={styles.choiceOptionText}>
                  {content.choiceOption2Text}
                </Text>
              </View>

              <View style={styles.choiceOption}>
                <Text style={styles.choiceOptionTitle}>
                  {content.choiceOption3Title}
                </Text>
                <Text style={styles.choiceOptionText}>
                  {content.choiceOption3Text}
                </Text>
              </View>
            </View>
          </View>

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

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <MaterialDesignIcons
                  name="check-decagram-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.summaryHeaderCopy}>
                <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>

                <Text style={styles.summarySubtitle}>
                  {content.summarySubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryRow1}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryRow2}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryRow3}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryRow4}
              </Text>
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
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

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
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 23,
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
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
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
    width: 24,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 26,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  /*
   * ACTION DIAGRAM
   */

  actionDiagram: {
    marginTop: 15,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  diagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  diagramHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  diagramHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },

  diagramTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.text,
    fontWeight: '800',
  },

  diagramSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  diagramLine: {
    height: 1,
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: theme.colors.border,
  },

  diagramStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepNumber: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },

  stepNumberText: {
    color: onPrimaryTextColor(theme),
    fontSize: 12,
    fontWeight: '800',
  },

  stepCopy: {
    flex: 1,
    marginLeft: 10,
  },

  stepTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  stepText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  diagramConnector: {
    width: 1,
    height: 17,
    marginLeft: 14,
    backgroundColor: theme.colors.border,
  },

  /*
   * COMPARISON
   */

  comparisonCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  comparisonTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  comparisonSubtitle: {
    marginTop: 3,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  comparisonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  frequencyScale: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  scalePoint: {
    alignItems: 'center',
  },

  scaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  scaleText: {
    marginTop: 5,
    fontSize: 8.5,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },

  scaleLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 7,
    marginBottom: 14,
    backgroundColor: theme.colors.border,
  },

  methodList: {
    marginTop: 16,
  },

  methodCard: {
    flexDirection: 'row',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  methodCardLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },

  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  methodMain: {
    flex: 1,
    marginLeft: 11,
  },

  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  methodTitle: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  frequencyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
  },

  frequencyBadgeText: {
    fontSize: 8.5,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  methodDuration: {
    marginTop: 4,
    fontSize: 10.5,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  methodProfile: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  highlightBox: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  highlightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 10,
  },

  highlightTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  highlightText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /*
   * CHOICE CRITERIA
   */

  criteriaGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  criteriaCard: {
    width: '48.5%',
    minHeight: 165,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  criteriaIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  criteriaTitle: {
    marginTop: 9,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  criteriaText: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  /*
   * CHOICE DIAGRAM
   */

  choiceDiagram: {
    marginTop: 14,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  choiceDiagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  choiceDiagramTitle: {
    flex: 1,
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  questionText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  choiceOptions: {
    marginTop: 12,
    gap: 8,
  },

  choiceOption: {
    padding: 11,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  choiceOptionTitle: {
    fontSize: 11.5,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  choiceOptionText: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textMuted,
  },

  /*
   * ALERT
   */

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /*
   * SUMMARY
   */

  summaryCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  summaryHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  summaryTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summarySubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  summaryDivider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: theme.colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },

  summaryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /*
   * TIP
   */

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
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
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  });
}
