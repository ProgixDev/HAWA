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

const ID = 'hormones-menopause-equilibre';

const HERO = require('../../assets/images/library/rules-hero.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const KEY_HORMONES_ICONS = ['flower-outline', 'moon-waning-crescent', 'radar'] as const;

const SOLUTIONS_ICONS = ['walk', 'leaf', 'pill'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT (PHASE 7L — bilingual editorial content)                          */
/* -------------------------------------------------------------------------- */
// Article identity (ID, images, bookmark/progress keys, JSX structure) is
// untouched; only this object changes per language. The French text below
// is byte-identical to the original — never retyped, only moved into the
// `fr` key — so the app remains fully bilingual rather than having French
// replaced by English.
const CONTENT = {
  fr: {
    badge: 'PÉRIMÉNOPAUSE & MÉNOPAUSE • HORMONES',
    title: 'Les hormones\npendant la ménopause',
    metaDuration: '10 min de lecture',
    metaType: 'Article',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'À l’approche de la ménopause, tes hormones ne s’arrêtent pas brutalement : elles fluctuent, ce qui explique à la fois les changements de cycle et la diversité des symptômes possibles.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les principales hormones concernées',
      'Que se passe-t-il pendant la périménopause ?',
      'Quand les œstrogènes fluctuent',
      'Le rôle de la progestérone',
      'Pourquoi les symptômes peuvent varier',
      'Les symptômes les plus fréquents',
      'Hormones et sommeil',
      'Hormones et humeur',
      'Peut-on mesurer les hormones ?',
      'Comment mieux observer les changements',
      'Quand consulter un professionnel ?',
      'Quelles solutions peuvent être proposées ?',
      'À retenir',
    ],
    section1Body: 'Trois grandes hormones évoluent pendant cette transition, chacune avec un rôle différent :',
    keyHormones: [
      {title: 'Œstrogènes', text: 'Influencent le cycle, la peau, les os, le cœur et une partie de la régulation du sommeil et de l’humeur.'},
      {title: 'Progestérone', text: 'Produite après l’ovulation, elle a un effet plutôt apaisant et prépare le corps à une éventuelle grossesse.'},
      {title: 'FSH et LH', text: 'Pilotées par le cerveau, elles stimulent les ovaires ; leurs niveaux évoluent quand ceux-ci répondent différemment.'},
    ],
    infoCard1Title: 'À noter',
    infoCard1Text: 'Les taux d’hormones ne diminuent pas de façon parfaitement linéaire pendant la périménopause : ils peuvent fluctuer, monter et descendre, avant de se stabiliser à un niveau plus bas après la ménopause.',
    section2Body: 'Les ovaires répondent progressivement de façon moins régulière aux signaux hormonaux envoyés par le cerveau. C’est ce qui rend les cycles irréguliers et explique pourquoi les symptômes peuvent changer d’un mois à l’autre.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il est tout à fait possible d’avoir des symptômes marqués un mois, puis presque aucun le mois suivant. Ce n’est pas anormal : cela reflète simplement les fluctuations hormonales de cette période.',
    section3Body: 'Les variations d’œstrogènes peuvent être associées à plusieurs changements :',
    estrogenSymptoms: [
      'Bouffées de chaleur',
      'Sueurs nocturnes',
      'Sécheresse vaginale',
      'Modifications du cycle',
      'Sensibilité émotionnelle',
      'Changements du sommeil',
    ],
    section3Body2: 'Ces symptômes peuvent avoir plusieurs causes : ils ne sont pas systématiquement liés aux hormones, et leur intensité varie beaucoup d’une personne à l’autre.',
    section4Body: 'La progestérone n’est produite qu’après l’ovulation. Or, pendant la périménopause, l’ovulation elle-même devient plus irrégulière — ce qui rend sa production moins prévisible.',
    section4Body2: 'Cette irrégularité explique en partie les changements observés dans le cycle : durée variable, règles parfois plus ou moins abondantes qu’avant.',
    section5Body: 'Au-delà des fluctuations hormonales, plusieurs facteurs s’ajoutent : la qualité du sommeil, le niveau de stress, le mode de vie, et les différences propres à chaque personne.',
    highlightText: '« Chaque femme vit la transition différemment. »',
    commonSymptoms: [
      'Cycles irréguliers',
      'Bouffées de chaleur',
      'Sueurs nocturnes',
      'Troubles du sommeil',
      'Changements d’humeur',
      'Fatigue',
      'Sécheresse vaginale',
      'Changements de la libido',
      'Difficultés de concentration',
    ],
    section6Caption: 'Cette liste est informative : elle ne constitue pas un diagnostic. Chaque personne vit une combinaison différente de ces changements.',
    section7Body: 'Les sueurs nocturnes peuvent interrompre le sommeil, ce qui entraîne fatigue et difficultés de concentration le lendemain — un enchaînement fréquent pendant cette période.',
    infoCard2Title: 'Astuce pratique',
    infoCard2Text: 'Une chambre fraîche, des vêtements légers et une routine de coucher stable peuvent aider à limiter ces réveils.',
    section8Body: 'Les fluctuations hormonales peuvent coïncider avec des changements d’humeur, sans en être la seule explication : le sommeil, le stress, les changements de vie et les symptômes physiques jouent aussi un rôle.',
    infoCard3Title: 'Pour te rassurer',
    infoCard3Text: 'Se sentir plus émotive pendant cette période ne veut pas dire qu’il y a un problème : c’est une expérience courante, qui peut avoir plusieurs origines à la fois.',
    section9Body: 'Les taux d’hormones peuvent varier considérablement d’un jour à l’autre pendant la périménopause. Un dosage isolé ne donne donc pas toujours une image complète de la situation.',
    infoCard4Title: 'À garder en tête',
    infoCard4Text: 'L’évaluation médicale dépend surtout de ton âge, de tes symptômes et de ton historique de cycles — pas uniquement d’un chiffre isolé.',
    section10Body: 'Noter ce que tu vis mois après mois t’aide à repérer tes propres tendances plutôt qu’à te comparer :',
    trackingItems: [
      'Les dates de ton cycle',
      'Tes symptômes au fil des jours',
      'Ton sommeil',
      'Ton humeur',
      'Tes bouffées de chaleur',
      'Les changements de saignements',
      'Ce qui semble déclencher certains symptômes',
    ],
    tip2Title: 'Petit réflexe utile',
    tip2Text: 'Le suivi de ton cycle dans AWA peut t’aider à repérer tes propres tendances au fil des mois, sans effort particulier.',
    section11Body: 'La plupart de ces situations relèvent d’une consultation de routine, à ton rythme :',
    warningTitle: 'Bon à évoquer avec un professionnel',
    consultSituations: [
      'Des symptômes qui affectent significativement ton quotidien',
      'Des troubles du sommeil persistants',
      'Des bouffées de chaleur très gênantes',
      'Un symptôme nouveau ou inhabituel',
      'Des changements importants dans tes saignements',
      'Des questions sur les options de traitement',
      'Des préoccupations liées à la sécheresse vaginale ou à ta vie sexuelle',
    ],
    infoCard5Title: 'Un cas à part',
    infoCard5Text: 'Des saignements très abondants ou inhabituels méritent, eux, d’être signalés plus rapidement à un professionnel de santé.',
    section12Body: 'Selon la situation, un professionnel peut évoquer différentes pistes :',
    solutions: [
      {title: 'Mesures de mode de vie', text: 'Activité physique, alimentation, gestion du stress et du sommeil.'},
      {title: 'Traitements non hormonaux', text: 'Certaines options peuvent cibler des symptômes précis, selon la situation.'},
      {title: 'Traitements hormonaux', text: 'Discutés avec un médecin lorsque cela correspond à ton profil et à tes besoins.'},
    ],
    section12Caption: 'Ces décisions restent individualisées : elles dépendent de tes antécédents, de tes symptômes, des risques et de tes préférences personnelles.',
    summaryPoints: [
      'Les changements hormonaux font partie intégrante de la transition ménopausique.',
      'Les taux d’hormones peuvent fluctuer fortement pendant la périménopause, sans baisse parfaitement linéaire.',
      'Les symptômes varient beaucoup d’une personne à l’autre, et d’un mois à l’autre.',
      'Observer tes symptômes peut t’aider à mieux repérer tes propres tendances.',
      'Un professionnel de santé peut t’accompagner si les symptômes deviennent difficiles à gérer.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Les hormones pendant la ménopause — AWA',
  },
  en: {
    badge: 'PERIMENOPAUSE & MENOPAUSE • HORMONES',
    title: 'Hormones\nduring menopause',
    metaDuration: '10 min read',
    metaType: 'Article',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'As menopause approaches, your hormones don’t stop abruptly: they fluctuate, which explains both the cycle changes and the variety of possible symptoms.',
    contentsTitle: 'In this article',
    topics: [
      'The main hormones involved',
      'What happens during perimenopause?',
      'When estrogen fluctuates',
      'The role of progesterone',
      'Why symptoms can vary',
      'The most common symptoms',
      'Hormones and sleep',
      'Hormones and mood',
      'Can hormones be measured?',
      'How to better track the changes',
      'When to see a professional?',
      'What solutions might be suggested?',
      'Key takeaways',
    ],
    section1Body: 'Three major hormones change during this transition, each with a different role:',
    keyHormones: [
      {title: 'Estrogen', text: 'Influences the cycle, skin, bones, heart, and partly regulates sleep and mood.'},
      {title: 'Progesterone', text: 'Produced after ovulation, it has a rather calming effect and prepares the body for a possible pregnancy.'},
      {title: 'FSH and LH', text: 'Controlled by the brain, they stimulate the ovaries; their levels change as the ovaries respond differently.'},
    ],
    infoCard1Title: 'Worth noting',
    infoCard1Text: 'Hormone levels don’t decline in a perfectly linear way during perimenopause: they can fluctuate, rise and fall, before settling at a lower level after menopause.',
    section2Body: 'The ovaries gradually respond less regularly to the hormonal signals sent by the brain. This is what makes cycles irregular and explains why symptoms can change from month to month.',
    tip1Title: 'Good to know',
    tip1Text: 'It’s entirely possible to have noticeable symptoms one month, then almost none the next. This isn’t abnormal: it simply reflects the hormonal fluctuations of this period.',
    section3Body: 'Changes in estrogen can be linked to several changes:',
    estrogenSymptoms: [
      'Hot flashes',
      'Night sweats',
      'Vaginal dryness',
      'Cycle changes',
      'Emotional sensitivity',
      'Sleep changes',
    ],
    section3Body2: 'These symptoms can have several causes: they aren’t always linked to hormones, and their intensity varies a lot from person to person.',
    section4Body: 'Progesterone is only produced after ovulation. But during perimenopause, ovulation itself becomes more irregular — which makes its production less predictable.',
    section4Body2: 'This irregularity partly explains the changes seen in the cycle: variable length, periods sometimes heavier or lighter than before.',
    section5Body: 'Beyond hormonal fluctuations, several other factors come into play: sleep quality, stress levels, lifestyle, and differences specific to each person.',
    highlightText: '"Every woman experiences the transition differently."',
    commonSymptoms: [
      'Irregular cycles',
      'Hot flashes',
      'Night sweats',
      'Sleep problems',
      'Mood changes',
      'Fatigue',
      'Vaginal dryness',
      'Changes in libido',
      'Difficulty concentrating',
    ],
    section6Caption: 'This list is for information only: it isn’t a diagnosis. Each person experiences a different combination of these changes.',
    section7Body: 'Night sweats can interrupt sleep, leading to fatigue and difficulty concentrating the next day — a pattern that’s common during this period.',
    infoCard2Title: 'Practical tip',
    infoCard2Text: 'A cool bedroom, lightweight clothing, and a stable bedtime routine can help limit these wake-ups.',
    section8Body: 'Hormonal fluctuations can coincide with mood changes, without being the only explanation: sleep, stress, life changes, and physical symptoms also play a role.',
    infoCard3Title: 'To reassure you',
    infoCard3Text: 'Feeling more emotional during this period doesn’t mean something is wrong: it’s a common experience that can have several causes at once.',
    section9Body: 'Hormone levels can vary considerably from one day to the next during perimenopause. A single test therefore doesn’t always give a complete picture of the situation.',
    infoCard4Title: 'Worth keeping in mind',
    infoCard4Text: 'Medical assessment depends mainly on your age, your symptoms, and your cycle history — not just a single number.',
    section10Body: 'Writing down what you experience month after month helps you spot your own patterns rather than comparing yourself to others:',
    trackingItems: [
      'Your cycle dates',
      'Your symptoms day by day',
      'Your sleep',
      'Your mood',
      'Your hot flashes',
      'Changes in your bleeding',
      'What seems to trigger certain symptoms',
    ],
    tip2Title: 'A helpful habit',
    tip2Text: 'Tracking your cycle in AWA can help you spot your own patterns over the months, with no extra effort.',
    section11Body: 'Most of these situations call for a routine consultation, at your own pace:',
    warningTitle: 'Worth mentioning to a professional',
    consultSituations: [
      'Symptoms that significantly affect your daily life',
      'Persistent sleep problems',
      'Very bothersome hot flashes',
      'A new or unusual symptom',
      'Significant changes in your bleeding',
      'Questions about treatment options',
      'Concerns related to vaginal dryness or your sex life',
    ],
    infoCard5Title: 'A special case',
    infoCard5Text: 'Very heavy or unusual bleeding, on the other hand, should be reported to a healthcare professional more quickly.',
    section12Body: 'Depending on the situation, a professional may suggest different options:',
    solutions: [
      {title: 'Lifestyle measures', text: 'Physical activity, diet, and managing stress and sleep.'},
      {title: 'Non-hormonal treatments', text: 'Certain options can target specific symptoms, depending on the situation.'},
      {title: 'Hormonal treatments', text: 'Discussed with a doctor when it fits your profile and needs.'},
    ],
    section12Caption: 'These decisions remain individual: they depend on your history, your symptoms, the risks, and your personal preferences.',
    summaryPoints: [
      'Hormonal changes are an integral part of the menopause transition.',
      'Hormone levels can fluctuate significantly during perimenopause, without a perfectly linear decline.',
      'Symptoms vary a lot from person to person, and from month to month.',
      'Tracking your symptoms can help you better spot your own patterns.',
      'A healthcare professional can support you if symptoms become difficult to manage.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized medical advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Hormones during menopause — AWA',
  },
  es: {
    badge: 'PERIMENOPAUSIA Y MENOPAUSIA • HORMONAS',
    title: 'Las hormonas\ndurante la menopausia',
    metaDuration: '10 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Al acercarse la menopausia, tus hormonas no se detienen bruscamente: fluctúan, lo que explica tanto los cambios de ciclo como la diversidad de síntomas posibles.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las principales hormonas implicadas',
      '¿Qué ocurre durante la perimenopausia?',
      'Cuando los estrógenos fluctúan',
      'El papel de la progesterona',
      'Por qué los síntomas pueden variar',
      'Los síntomas más frecuentes',
      'Hormonas y sueño',
      'Hormonas y estado de ánimo',
      '¿Se pueden medir las hormonas?',
      'Cómo observar mejor los cambios',
      '¿Cuándo consultar a un profesional?',
      '¿Qué soluciones se pueden proponer?',
      'Para recordar',
    ],
    section1Body: 'Tres grandes hormonas evolucionan durante esta transición, cada una con un papel diferente:',
    keyHormones: [
      {title: 'Estrógenos', text: 'Influyen en el ciclo, la piel, los huesos, el corazón y en parte en la regulación del sueño y del estado de ánimo.'},
      {title: 'Progesterona', text: 'Producida después de la ovulación, tiene un efecto más bien calmante y prepara el cuerpo para un posible embarazo.'},
      {title: 'FSH y LH', text: 'Dirigidas por el cerebro, estimulan los ovarios; sus niveles cambian cuando estos responden de forma diferente.'},
    ],
    infoCard1Title: 'A tener en cuenta',
    infoCard1Text: 'Los niveles de hormonas no disminuyen de forma perfectamente lineal durante la perimenopausia: pueden fluctuar, subir y bajar, antes de estabilizarse en un nivel más bajo después de la menopausia.',
    section2Body: 'Los ovarios responden progresivamente de forma menos regular a las señales hormonales enviadas por el cerebro. Esto es lo que hace que los ciclos sean irregulares y explica por qué los síntomas pueden cambiar de un mes a otro.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Es perfectamente posible tener síntomas marcados un mes y casi ninguno al mes siguiente. Esto no es anormal: simplemente refleja las fluctuaciones hormonales de este periodo.',
    section3Body: 'Las variaciones de estrógenos pueden asociarse a varios cambios:',
    estrogenSymptoms: [
      'Sofocos',
      'Sudores nocturnos',
      'Sequedad vaginal',
      'Modificaciones del ciclo',
      'Sensibilidad emocional',
      'Cambios en el sueño',
    ],
    section3Body2: 'Estos síntomas pueden tener varias causas: no están sistemáticamente relacionados con las hormonas, y su intensidad varía mucho de una persona a otra.',
    section4Body: 'La progesterona solo se produce después de la ovulación. Sin embargo, durante la perimenopausia, la propia ovulación se vuelve más irregular, lo que hace que su producción sea menos previsible.',
    section4Body2: 'Esta irregularidad explica en parte los cambios observados en el ciclo: duración variable, reglas a veces más o menos abundantes que antes.',
    section5Body: 'Más allá de las fluctuaciones hormonales, se añaden varios factores: la calidad del sueño, el nivel de estrés, el estilo de vida y las diferencias propias de cada persona.',
    highlightText: '«Cada mujer vive la transición de forma diferente.»',
    commonSymptoms: [
      'Ciclos irregulares',
      'Sofocos',
      'Sudores nocturnos',
      'Trastornos del sueño',
      'Cambios de humor',
      'Fatiga',
      'Sequedad vaginal',
      'Cambios en la libido',
      'Dificultades de concentración',
    ],
    section6Caption: 'Esta lista es informativa: no constituye un diagnóstico. Cada persona vive una combinación diferente de estos cambios.',
    section7Body: 'Los sudores nocturnos pueden interrumpir el sueño, lo que provoca fatiga y dificultades de concentración al día siguiente — un encadenamiento frecuente durante este periodo.',
    infoCard2Title: 'Consejo práctico',
    infoCard2Text: 'Una habitación fresca, ropa ligera y una rutina de sueño estable pueden ayudar a limitar estos despertares.',
    section8Body: 'Las fluctuaciones hormonales pueden coincidir con cambios de humor, sin ser la única explicación: el sueño, el estrés, los cambios de vida y los síntomas físicos también juegan un papel.',
    infoCard3Title: 'Para tranquilizarte',
    infoCard3Text: 'Sentirte más sensible durante este periodo no significa que haya un problema: es una experiencia frecuente, que puede tener varios orígenes a la vez.',
    section9Body: 'Los niveles de hormonas pueden variar considerablemente de un día a otro durante la perimenopausia. Por eso, un análisis aislado no siempre ofrece una imagen completa de la situación.',
    infoCard4Title: 'A tener en mente',
    infoCard4Text: 'La evaluación médica depende sobre todo de tu edad, de tus síntomas y de tu historial de ciclos — no únicamente de una cifra aislada.',
    section10Body: 'Anotar lo que vives mes a mes te ayuda a detectar tus propias tendencias en lugar de compararte con otras:',
    trackingItems: [
      'Las fechas de tu ciclo',
      'Tus síntomas día a día',
      'Tu sueño',
      'Tu estado de ánimo',
      'Tus sofocos',
      'Los cambios en tu sangrado',
      'Lo que parece desencadenar ciertos síntomas',
    ],
    tip2Title: 'Un pequeño hábito útil',
    tip2Text: 'El seguimiento de tu ciclo en AWA puede ayudarte a detectar tus propias tendencias con el paso de los meses, sin esfuerzo particular.',
    section11Body: 'La mayoría de estas situaciones corresponden a una consulta de rutina, a tu ritmo:',
    warningTitle: 'Bueno para comentar con un profesional',
    consultSituations: [
      'Síntomas que afectan significativamente tu día a día',
      'Trastornos del sueño persistentes',
      'Sofocos muy molestos',
      'Un síntoma nuevo o inusual',
      'Cambios importantes en tu sangrado',
      'Preguntas sobre las opciones de tratamiento',
      'Preocupaciones relacionadas con la sequedad vaginal o tu vida sexual',
    ],
    infoCard5Title: 'Un caso aparte',
    infoCard5Text: 'Un sangrado muy abundante o inusual, en cambio, merece ser comunicado más rápidamente a un profesional de la salud.',
    section12Body: 'Según la situación, un profesional puede plantear diferentes opciones:',
    solutions: [
      {title: 'Medidas de estilo de vida', text: 'Actividad física, alimentación, gestión del estrés y del sueño.'},
      {title: 'Tratamientos no hormonales', text: 'Algunas opciones pueden dirigirse a síntomas concretos, según la situación.'},
      {title: 'Tratamientos hormonales', text: 'Se discuten con un médico cuando se ajustan a tu perfil y a tus necesidades.'},
    ],
    section12Caption: 'Estas decisiones siguen siendo individualizadas: dependen de tus antecedentes, de tus síntomas, de los riesgos y de tus preferencias personales.',
    summaryPoints: [
      'Los cambios hormonales forman parte integral de la transición menopáusica.',
      'Los niveles de hormonas pueden fluctuar fuertemente durante la perimenopausia, sin una disminución perfectamente lineal.',
      'Los síntomas varían mucho de una persona a otra, y de un mes a otro.',
      'Observar tus síntomas puede ayudarte a detectar mejor tus propias tendencias.',
      'Un profesional de la salud puede acompañarte si los síntomas se vuelven difíciles de gestionar.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye un asesoramiento médico personalizado. En caso de duda, pide consejo a un profesional de la salud.',
    shareMessage: 'Las hormonas durante la menopausia — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MenopauseHormonesArticleScreen({
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

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
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                hitSlop={8}
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
                hitSlop={8}
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.section1Body}
          </Text>

          <View style={styles.normalGrid}>
            {content.keyHormones.map((item, index) => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={KEY_HORMONES_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard1Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard1Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body}
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

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.checkList}>
            {content.estrogenSymptoms.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

          <Text style={styles.body}>
            {content.section4Body2}
          </Text>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <View style={styles.highlight}>
            <Text style={styles.highlightText}>
              {content.highlightText}
            </Text>
          </View>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          <View style={styles.checkList}>
            {content.commonSymptoms.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.caption}>
            {content.section6Caption}
          </Text>

          {/* ================================================================= */}
          {/* SECTION 7                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>7. {content.topics[6]}</Text>

          <Text style={styles.body}>
            {content.section7Body}
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="weather-night"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard2Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard2Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 8                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>8. {content.topics[7]}</Text>

          <Text style={styles.body}>
            {content.section8Body}
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard3Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard3Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 9                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>9. {content.topics[8]}</Text>

          <Text style={styles.body}>
            {content.section9Body}
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="test-tube"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard4Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard4Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 10                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>10. {content.topics[9]}</Text>

          <Text style={styles.body}>
            {content.section10Body}
          </Text>

          <View style={styles.comfortCard}>
            {content.trackingItems.map((item, index) => (
              <View
                key={item}
                style={[
                  styles.trackingRow,
                  index < content.trackingItems.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <MaterialDesignIcons
                  name="pencil-outline"
                  size={16}
                  color={theme.colors.primary}
                />

                <Text style={styles.trackingText}>{item}</Text>
              </View>
            ))}
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

          {/* ================================================================= */}
          {/* SECTION 11                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>11. {content.topics[10]}</Text>

          <Text style={styles.body}>
            {content.section11Body}
          </Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="calendar-account-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={[styles.warningTitle, styles.warningTitleNeutral]}>
                {content.warningTitle}
              </Text>
            </View>

            {content.consultSituations.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="check"
                    size={16}
                    color={theme.colors.success}
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard5Title}</Text>
              <Text style={styles.infoText}>
                {content.infoCard5Text}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 12                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            12. {content.topics[11]}
          </Text>

          <Text style={styles.body}>
            {content.section12Body}
          </Text>

          <View style={styles.normalGrid}>
            {content.solutions.map((item, index) => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={SOLUTIONS_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.caption}>
            {content.section12Caption}
          </Text>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>13. {content.topics[12]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
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

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

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
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.textSecondary},
  caption: {marginTop: 10, fontSize: 11, lineHeight: 16, color: theme.colors.textMuted, fontStyle: 'italic'},

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
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  normalGrid: {marginTop: 13, gap: 9},
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
  normalTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: theme.colors.textSecondary},

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkRow: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingRight: 6,
  },
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16},

  highlight: {
    marginTop: 15,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  highlightText: {
    fontFamily: 'serif',
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 12,
  },
  trackingText: {flex: 1, fontSize: 12.5, lineHeight: 17, color: theme.colors.textSecondary},

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: theme.colors.textSecondary, fontWeight: '800'},
  warningTitleNeutral: {color: theme.colors.text},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},

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
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: theme.colors.textMuted},
  });
}
