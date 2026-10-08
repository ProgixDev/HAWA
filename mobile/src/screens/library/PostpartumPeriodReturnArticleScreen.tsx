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
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'postpartum-retour-de-couches-freemium';

const HERO = require('../../assets/images/library/featured-cycle.png');

/* -------------------------------------------------------------------------- */
/* DATA — language-neutral (icons/numbers only; text lives in CONTENT below) */
/* -------------------------------------------------------------------------- */

const CYCLE_STAGES_META = [
  {number: '01', icon: 'baby-face-outline'},
  {number: '02', icon: 'clock-outline'},
  {number: '03', icon: 'baby-bottle-outline'},
  {number: '04', icon: 'calendar-month-outline'},
  {number: '05', icon: 'chart-timeline-variant'},
] as const;

const OBSERVATIONS_META = [
  {icon: 'calendar-outline'},
  {icon: 'clock-outline'},
  {icon: 'water-outline'},
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
    badge: 'FREEMIUM • POST-PARTUM',
    title: 'Le retour de couches,\nà quoi s’attendre',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    intro: 'Après l’accouchement, le retour des règles peut prendre un certain temps. Le délai varie notamment selon l’allaitement et chaque personne peut vivre cette période différemment.',
    shareMessage: 'Le retour de couches, à quoi s’attendre — AWA',
    h2_1: '1. Qu’est-ce que le retour de couches ?',
    body1: 'Le « retour de couches » désigne le retour des règles après l’accouchement. Le cycle menstruel ne reprend pas forcément immédiatement son rythme habituel.',
    highlightTitle: 'À retenir',
    highlightText: 'Il n’existe pas une date unique valable pour toutes les personnes.',
    h2_2: '2. Quand les règles peuvent-elles revenir ?',
    body2: 'Le délai dépend notamment de l’allaitement. Sans allaitement, le retour peut généralement survenir autour de 6 à 8 semaines. Avec un allaitement exclusif, il peut être retardé de plusieurs mois.',
    simpleInfoTitle1: 'Sans allaitement',
    simpleInfoText1: 'En général autour de 6 à 8 semaines.',
    simpleInfoTitle2: 'Avec allaitement exclusif',
    simpleInfoText2: 'Le retour peut être retardé de plusieurs mois.',
    h2_3: '3. Le schéma du retour du cycle',
    body3: 'Le retour du cycle se fait progressivement après l’accouchement. L’allaitement peut influencer le moment où les règles réapparaissent.',
    schemaTitle: 'Retour progressif du cycle',
    schemaSubtitle: 'Un repère général, étape par étape',
    cycleStages: [
      {title: 'Après l’accouchement', text: 'Le cycle menstruel s’interrompt temporairement après la naissance.'},
      {title: 'Période post-partum', text: 'Le corps récupère progressivement et le rythme hormonal évolue.'},
      {title: 'Allaitement', text: 'L’allaitement peut retarder le retour des règles, mais son effet varie selon chaque personne.'},
      {title: 'Retour des règles', text: 'Les premières règles peuvent revenir après quelques semaines ou plusieurs mois.'},
      {title: 'Premiers cycles', text: 'Les cycles peuvent être irréguliers avant de retrouver progressivement leur rythme habituel.'},
    ],
    schemaNoteText: 'Il n’existe pas de calendrier identique pour tout le monde. Le moment du retour des règles peut varier selon la personne, notamment en fonction de l’allaitement.',
    h2_4: '4. Les premiers cycles',
    body4: 'Lorsque les règles reviennent, les premiers cycles peuvent être différents de ceux d’avant la grossesse. Ils peuvent notamment être irréguliers au début.',
    card1Title: 'Rythme variable',
    card1Text: 'Le cycle peut mettre du temps à retrouver un rythme familier.',
    card2Title: 'Flux différent',
    card2Text: 'Le flux peut être différent de celui observé avant la grossesse.',
    h2_5: '5. Que peux-tu observer ?',
    body5: 'Un suivi simple permet de mieux observer l’évolution du cycle au fil du temps.',
    observations: [
      {title: 'Les dates', text: 'Note le premier jour des règles.'},
      {title: 'Le rythme', text: 'Observe progressivement l’intervalle entre les cycles.'},
      {title: 'Le flux', text: 'Observe simplement les changements par rapport à ton habitude.'},
    ],
    h2_6: '6. Quand demander conseil ?',
    body6: 'Si quelque chose te semble inhabituel, persistant ou préoccupant, demande conseil à un professionnel de santé.',
    warningSigns: [
      'Des saignements qui te semblent inhabituels',
      'Une douleur importante ou persistante',
      'De la fièvre ou un malaise important',
      'Un symptôme nouveau qui t’inquiète',
    ],
    summaryTitle: 'À retenir',
    summaryPoints: [
      'Le retour de couches correspond au retour des règles après l’accouchement.',
      'L’allaitement peut retarder le retour des règles.',
      'Les premiers cycles peuvent être irréguliers.',
      'Noter les dates peut aider à suivre l’évolution du cycle.',
    ],
    disclaimerText: 'Contenu informatif. Les délais peuvent varier selon chaque situation et ne remplacent pas un avis médical.',
  },
  en: {
    badge: 'FREEMIUM • POSTPARTUM',
    title: 'Return of periods after birth,\nwhat to expect',
    metaDuration: '5 min read',
    metaType: 'Guide',
    intro: 'After giving birth, the return of your period can take some time. The timing varies depending on breastfeeding, among other things, and each person may experience this period differently.',
    shareMessage: 'Return of periods after birth, what to expect — AWA',
    h2_1: '1. What is the return of periods after birth?',
    body1: 'The “return of periods” refers to your period coming back after giving birth. The menstrual cycle doesn’t necessarily return to its usual rhythm right away.',
    highlightTitle: 'Key point',
    highlightText: 'There’s no single timeline that applies to everyone.',
    h2_2: '2. When can your period come back?',
    body2: 'The timing largely depends on breastfeeding. Without breastfeeding, your period can generally return around 6 to 8 weeks. With exclusive breastfeeding, it may be delayed by several months.',
    simpleInfoTitle1: 'Without breastfeeding',
    simpleInfoText1: 'Generally around 6 to 8 weeks.',
    simpleInfoTitle2: 'With exclusive breastfeeding',
    simpleInfoText2: 'The return can be delayed by several months.',
    h2_3: '3. The pattern of the cycle’s return',
    body3: 'The cycle returns gradually after giving birth. Breastfeeding can influence when your period reappears.',
    schemaTitle: 'Gradual return of the cycle',
    schemaSubtitle: 'A general guide, step by step',
    cycleStages: [
      {title: 'After giving birth', text: 'The menstrual cycle pauses temporarily after birth.'},
      {title: 'Postpartum period', text: 'The body recovers gradually and hormone levels shift.'},
      {title: 'Breastfeeding', text: 'Breastfeeding may delay the return of your period, but its effect varies from person to person.'},
      {title: 'Return of periods', text: 'Your first period may return after a few weeks or several months.'},
      {title: 'First cycles', text: 'Cycles may be irregular before gradually settling back into their usual rhythm.'},
    ],
    schemaNoteText: 'There’s no identical timeline for everyone. When your period returns can vary from person to person, particularly depending on breastfeeding.',
    h2_4: '4. The first cycles',
    body4: 'When your period returns, the first cycles may differ from those before pregnancy. In particular, they may be irregular at first.',
    card1Title: 'Variable rhythm',
    card1Text: 'The cycle may take time to settle back into a familiar rhythm.',
    card2Title: 'Different flow',
    card2Text: 'The flow may be different from what you observed before pregnancy.',
    h2_5: '5. What can you observe?',
    body5: 'Simple tracking helps you better observe how your cycle evolves over time.',
    observations: [
      {title: 'Dates', text: 'Note the first day of your period.'},
      {title: 'Rhythm', text: 'Gradually observe the interval between cycles.'},
      {title: 'Flow', text: 'Simply observe any changes compared to what’s usual for you.'},
    ],
    h2_6: '6. When should you seek advice?',
    body6: 'If something seems unusual, persistent, or concerning, seek advice from a healthcare professional.',
    warningSigns: [
      'Bleeding that seems unusual to you',
      'Significant or persistent pain',
      'Fever or significant discomfort',
      'Any new symptom that worries you',
    ],
    summaryTitle: 'Key takeaways',
    summaryPoints: [
      'The return of periods after birth refers to your period coming back after giving birth.',
      'Breastfeeding may delay the return of your period.',
      'The first cycles may be irregular.',
      'Noting the dates can help you track how your cycle evolves.',
    ],
    disclaimerText: 'Informational content. Timelines may vary depending on each situation and do not replace medical advice.',
  },
  es: {
    badge: 'FREEMIUM • POSPARTO',
    title: 'El regreso de la regla tras el parto,\nqué esperar',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    intro: 'Después del parto, el regreso de la regla puede tardar un tiempo. El plazo varía sobre todo según la lactancia, y cada persona puede vivir este periodo de forma diferente.',
    shareMessage: 'El regreso de la regla tras el parto, qué esperar — AWA',
    h2_1: '1. ¿Qué es el regreso de la regla tras el parto?',
    body1: 'El «regreso de la regla» designa el regreso de las reglas después del parto. El ciclo menstrual no retoma necesariamente de inmediato su ritmo habitual.',
    highlightTitle: 'Para recordar',
    highlightText: 'No existe una fecha única válida para todas las personas.',
    h2_2: '2. ¿Cuándo pueden volver las reglas?',
    body2: 'El plazo depende sobre todo de la lactancia. Sin lactancia, el regreso puede producirse generalmente entre las 6 y las 8 semanas. Con lactancia exclusiva, puede retrasarse varios meses.',
    simpleInfoTitle1: 'Sin lactancia',
    simpleInfoText1: 'Generalmente entre las 6 y las 8 semanas.',
    simpleInfoTitle2: 'Con lactancia exclusiva',
    simpleInfoText2: 'El regreso puede retrasarse varios meses.',
    h2_3: '3. El esquema del regreso del ciclo',
    body3: 'El regreso del ciclo se produce progresivamente después del parto. La lactancia puede influir en el momento en que reaparecen las reglas.',
    schemaTitle: 'Regreso progresivo del ciclo',
    schemaSubtitle: 'Una referencia general, paso a paso',
    cycleStages: [
      {title: 'Después del parto', text: 'El ciclo menstrual se interrumpe temporalmente después del nacimiento.'},
      {title: 'Periodo posparto', text: 'El cuerpo se recupera progresivamente y el ritmo hormonal evoluciona.'},
      {title: 'Lactancia', text: 'La lactancia puede retrasar el regreso de las reglas, pero su efecto varía según cada persona.'},
      {title: 'Regreso de las reglas', text: 'Las primeras reglas pueden volver después de algunas semanas o varios meses.'},
      {title: 'Primeros ciclos', text: 'Los ciclos pueden ser irregulares antes de recuperar progresivamente su ritmo habitual.'},
    ],
    schemaNoteText: 'No existe un calendario idéntico para todo el mundo. El momento del regreso de las reglas puede variar según la persona, especialmente en función de la lactancia.',
    h2_4: '4. Los primeros ciclos',
    body4: 'Cuando vuelven las reglas, los primeros ciclos pueden ser diferentes a los de antes del embarazo. En particular, pueden ser irregulares al principio.',
    card1Title: 'Ritmo variable',
    card1Text: 'El ciclo puede tardar en recuperar un ritmo familiar.',
    card2Title: 'Flujo diferente',
    card2Text: 'El flujo puede ser diferente del observado antes del embarazo.',
    h2_5: '5. ¿Qué puedes observar?',
    body5: 'Un seguimiento simple permite observar mejor la evolución del ciclo a lo largo del tiempo.',
    observations: [
      {title: 'Las fechas', text: 'Anota el primer día de las reglas.'},
      {title: 'El ritmo', text: 'Observa progresivamente el intervalo entre ciclos.'},
      {title: 'El flujo', text: 'Observa simplemente los cambios respecto a lo que es habitual para ti.'},
    ],
    h2_6: '6. ¿Cuándo pedir consejo?',
    body6: 'Si algo te parece inusual, persistente o preocupante, pide consejo a un profesional de la salud.',
    warningSigns: [
      'Un sangrado que te parezca inusual',
      'Un dolor importante o persistente',
      'Fiebre o un malestar importante',
      'Un síntoma nuevo que te preocupe',
    ],
    summaryTitle: 'Para recordar',
    summaryPoints: [
      'El regreso de la regla corresponde al regreso de las reglas después del parto.',
      'La lactancia puede retrasar el regreso de las reglas.',
      'Los primeros ciclos pueden ser irregulares.',
      'Anotar las fechas puede ayudar a seguir la evolución del ciclo.',
    ],
    disclaimerText: 'Contenido informativo. Los plazos pueden variar según cada situación y no sustituyen una opinión médica.',
  },
  it: {
    badge: 'FREEMIUM • POST-PARTUM',
    title: 'Il ritorno del ciclo dopo il parto,\ncosa aspettarsi',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    intro: 'Dopo il parto, il ritorno del periodo mestruale può richiedere del tempo. I tempi variano, tra l’altro, in base all’allattamento, e ogni persona può vivere questa fase in modo diverso.',
    shareMessage: 'Il ritorno del ciclo dopo il parto, cosa aspettarsi — AWA',
    h2_1: '1. Cos’è il ritorno del ciclo dopo il parto?',
    body1: 'Il «ritorno del ciclo» indica la ricomparsa del periodo mestruale dopo il parto. Il ciclo mestruale non riprende necessariamente subito il suo ritmo abituale.',
    highlightTitle: 'Punto chiave',
    highlightText: 'Non esiste una tempistica unica valida per tutte.',
    h2_2: '2. Quando può tornare il periodo mestruale?',
    body2: 'I tempi dipendono in gran parte dall’allattamento. Senza allattamento, il periodo mestruale può in genere tornare intorno alle 6-8 settimane. Con l’allattamento esclusivo, può essere ritardato di diversi mesi.',
    simpleInfoTitle1: 'Senza allattamento',
    simpleInfoText1: 'In genere intorno alle 6-8 settimane.',
    simpleInfoTitle2: 'Con allattamento esclusivo',
    simpleInfoText2: 'Il ritorno può essere ritardato di diversi mesi.',
    h2_3: '3. Come ritorna il ciclo',
    body3: 'Il ciclo ritorna gradualmente dopo il parto. L’allattamento può influire sul momento in cui il periodo mestruale ricompare.',
    schemaTitle: 'Ritorno graduale del ciclo',
    schemaSubtitle: 'Una guida generale, passo dopo passo',
    cycleStages: [
      {
        title: 'Dopo il parto',
        text: 'Il ciclo mestruale si interrompe temporaneamente dopo il parto.',
      },
      {
        title: 'Periodo post-partum',
        text: 'Il corpo si riprende gradualmente e i livelli ormonali cambiano.',
      },
      {
        title: 'Allattamento',
        text: 'L’allattamento può ritardare il ritorno del periodo mestruale, ma il suo effetto varia da persona a persona.',
      },
      {
        title: 'Ritorno del ciclo',
        text: 'Il primo periodo mestruale può tornare dopo alcune settimane o diversi mesi.',
      },
      {
        title: 'Primi cicli',
        text: 'I cicli possono essere irregolari prima di ritrovare gradualmente il loro ritmo abituale.',
      },
    ],
    schemaNoteText: 'Non esiste una tempistica identica per tutte. Il momento in cui il periodo mestruale ritorna può variare da persona a persona, in particolare in base all’allattamento.',
    h2_4: '4. I primi cicli',
    body4: 'Quando il periodo mestruale ritorna, i primi cicli possono essere diversi da quelli precedenti alla gravidanza. In particolare, all’inizio possono essere irregolari.',
    card1Title: 'Ritmo variabile',
    card1Text: 'Il ciclo può impiegare del tempo per ritrovare un ritmo familiare.',
    card2Title: 'Flusso diverso',
    card2Text: 'Il flusso può essere diverso da quello che osservavi prima della gravidanza.',
    h2_5: '5. Cosa puoi osservare?',
    body5: 'Un monitoraggio semplice ti aiuta a osservare meglio come evolve il tuo ciclo nel tempo.',
    observations: [
      {
        title: 'Date',
        text: 'Annota il primo giorno del periodo mestruale.',
      },
      {
        title: 'Ritmo',
        text: 'Osserva gradualmente l’intervallo tra i cicli.',
      },
      {
        title: 'Flusso',
        text: 'Osserva semplicemente eventuali cambiamenti rispetto a ciò che è abituale per te.',
      },
    ],
    h2_6: '6. Quando chiedere un parere?',
    body6: 'Se qualcosa ti sembra insolito, persistente o preoccupante, chiedi un parere a un operatore sanitario.',
    warningSigns: [
      'Sanguinamento che ti sembra insolito',
      'Dolore intenso o persistente',
      'Febbre o disagio importante',
      'Qualsiasi nuovo sintomo che ti preoccupa',
    ],
    summaryTitle: 'Punti essenziali',
    summaryPoints: [
      'Il ritorno del ciclo dopo il parto indica la ricomparsa del periodo mestruale dopo il parto.',
      'L’allattamento può ritardare il ritorno del periodo mestruale.',
      'I primi cicli possono essere irregolari.',
      'Annotare le date può aiutarti a seguire l’evoluzione del tuo ciclo.',
    ],
    disclaimerText: 'Contenuto informativo. I tempi possono variare in base a ogni situazione e non sostituiscono il parere medico.',
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

export default function PostpartumPeriodReturnFreemiumArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
  const content = CONTENT[lang];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [saved, setSaved] = useState(false);

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
      // Share cancelled or unavailable.
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
              {content.badge}
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
            <View style={styles.metaItem}>
              <MaterialDesignIcons
                name="clock-outline"
                size={16}
                color={theme.colors.textMuted}
              />

              <Text style={styles.meta}>
                {content.metaDuration}
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <MaterialDesignIcons
                name="book-open-page-variant-outline"
                size={16}
                color={theme.colors.textMuted}
              />

              <Text style={styles.meta}>
                {content.metaType}
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* INTRODUCTION                                                     */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.h2_1}
          </Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="information-outline"
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

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.h2_2}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.simpleInfo}>

            <View style={styles.simpleInfoRow}>
              <MaterialDesignIcons
                name="calendar-clock-outline"
                size={23}
                color={theme.colors.primary}
              />

              <View style={styles.simpleInfoCopy}>
                <Text style={styles.simpleInfoTitle}>
                  {content.simpleInfoTitle1}
                </Text>

                <Text style={styles.simpleInfoText}>
                  {content.simpleInfoText1}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.simpleInfoRow}>
              <MaterialDesignIcons
                name="baby-bottle-outline"
                size={23}
                color={theme.colors.primary}
              />

              <View style={styles.simpleInfoCopy}>
                <Text style={styles.simpleInfoTitle}>
                  {content.simpleInfoTitle2}
                </Text>

                <Text style={styles.simpleInfoText}>
                  {content.simpleInfoText2}
                </Text>
              </View>
            </View>

          </View>

          {/* ================================================================= */}
          {/* SECTION 3 — SCHEMA                                                */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.h2_3}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          {/* TIMELINE CARD */}

          <View style={styles.schemaCard}>

            {/* HEADER */}

            <View style={styles.schemaHeader}>
              <View style={styles.schemaHeaderIcon}>
                <MaterialDesignIcons
                  name="chart-timeline-variant"
                  size={23}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.schemaHeaderCopy}>
                <Text style={styles.schemaTitle}>
                  {content.schemaTitle}
                </Text>

                <Text style={styles.schemaSubtitle}>
                  {content.schemaSubtitle}
                </Text>
              </View>
            </View>

            {/* TIMELINE */}

            <View style={styles.timeline}>
              {CYCLE_STAGES_META.map((meta, index) => {
                const isLast =
                  index === CYCLE_STAGES_META.length - 1;
                const stage = content.cycleStages[index];

                return (
                  <View
                    key={meta.number}
                    style={styles.timelineItem}
                  >

                    {/* TIMELINE LEFT */}

                    <View style={styles.timelineLeft}>

                      <View style={styles.timelineNode}>
                        <Text style={styles.timelineNumber}>
                          {meta.number}
                        </Text>
                      </View>

                      {!isLast && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>

                    {/* TIMELINE CONTENT */}

                    <View style={styles.timelineContent}>

                      <View style={styles.timelineTitleRow}>
                        <MaterialDesignIcons
                          name={meta.icon as never}
                          size={17}
                          color={theme.colors.primary}
                        />

                        <Text style={styles.timelineTitle}>
                          {stage.title}
                        </Text>
                      </View>

                      <Text style={styles.timelineText}>
                        {stage.text}
                      </Text>

                    </View>
                  </View>
                );
              })}
            </View>

            {/* NOTE */}

            <View style={styles.schemaNote}>
              <MaterialDesignIcons
                name="information-outline"
                size={18}
                color={theme.colors.primary}
              />

              <Text style={styles.schemaNoteText}>
                {content.schemaNoteText}
              </Text>
            </View>

          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.h2_4}
          </Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

          <View style={styles.cards}>

            <View style={styles.smallCard}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons
                  name="calendar-alert-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.cardTitle}>
                {content.card1Title}
              </Text>

              <Text style={styles.cardText}>
                {content.card1Text}
              </Text>
            </View>

            <View style={styles.smallCard}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons
                  name="water-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.cardTitle}>
                {content.card2Title}
              </Text>

              <Text style={styles.cardText}>
                {content.card2Text}
              </Text>
            </View>

          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.h2_5}
          </Text>

          <Text style={styles.body}>
            {content.body5}
          </Text>

          <View style={styles.observationCard}>
            {OBSERVATIONS_META.map((meta, index) => {
              const observation = content.observations[index];

              return (
                <View
                  key={observation.title}
                  style={styles.observationRow}
                >
                  <View style={styles.observationIcon}>
                    <MaterialDesignIcons
                      name={meta.icon as never}
                      size={19}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.observationCopy}>
                    <Text style={styles.observationTitle}>
                      {observation.title}
                    </Text>

                    <Text style={styles.observationText}>
                      {observation.text}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.h2_6}
          </Text>

          <Text style={styles.body}>
            {content.body6}
          </Text>

          <View style={styles.warningCard}>
            {content.warningSigns.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            {content.summaryTitle}
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

      {/* ==================================================================== */}
      {/* READING CONTROLS                                                     */}
      {/* ==================================================================== */}

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
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
    height: 235,
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
    opacity: 0.7,
  },

  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                  */
  /* ------------------------------------------------------------------------ */

  article: {
    marginTop: -15,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 33,
    color: theme.colors.text,
    fontWeight: '700',
  },

  /* ------------------------------------------------------------------------ */
  /* METADATA                                                                 */
  /* ------------------------------------------------------------------------ */

  metas: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 18,
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
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  /* ------------------------------------------------------------------------ */
  /* HEADINGS & BODY                                                          */
  /* ------------------------------------------------------------------------ */

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 26,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* HIGHLIGHT                                                                */
  /* ------------------------------------------------------------------------ */

  highlight: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 9,
  },

  highlightTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  highlightText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* SIMPLE INFO                                                              */
  /* ------------------------------------------------------------------------ */

  simpleInfo: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  simpleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  simpleInfoCopy: {
    flex: 1,
    marginLeft: 10,
  },

  simpleInfoTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  simpleInfoText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  separator: {
    height: 1,
    marginVertical: 13,
    backgroundColor: theme.colors.border,
  },

  /* ------------------------------------------------------------------------ */
  /* CYCLE SCHEMA                                                             */
  /* ------------------------------------------------------------------------ */

  schemaCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  schemaHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  schemaHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  schemaTitle: {
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  schemaSubtitle: {
    marginTop: 3,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* TIMELINE                                                                 */
  /* ------------------------------------------------------------------------ */

  timeline: {
    marginTop: 8,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 88,
  },

  timelineLeft: {
    width: 44,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 34,
    height: 34,
    marginTop: 14,
    borderRadius: 17,
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
    fontWeight: '800',
  },

  timelineLine: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    width: 1.5,
    backgroundColor: theme.colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 13,
    paddingLeft: 10,
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

  timelineText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* SCHEMA NOTE                                                              */
  /* ------------------------------------------------------------------------ */

  schemaNote: {
    marginTop: 8,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 11,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  schemaNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* SMALL CARDS                                                              */
  /* ------------------------------------------------------------------------ */

  cards: {
    marginTop: 13,
    flexDirection: 'row',
    gap: 9,
  },

  smallCard: {
    flex: 1,
    minHeight: 135,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  cardTitle: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
  },

  cardText: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* OBSERVATION CARD                                                         */
  /* ------------------------------------------------------------------------ */

  observationCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  observationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  observationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  observationCopy: {
    flex: 1,
    marginLeft: 9,
  },

  observationTitle: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
  },

  observationText: {
    marginTop: 2,
    fontSize: 10.7,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* WARNING CARD                                                             */
  /* ------------------------------------------------------------------------ */

  warningCard: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginBottom: 9,
  },

  warningText: {
    flex: 1,
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
    marginBottom: 9,
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
