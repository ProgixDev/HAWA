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

const ID = 'basaltemp-suivre-temperature';

const HERO = require('../../assets/images/library/featured-spm.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const MEASURING_ICONS = ['thermometer', 'clock-outline', 'pencil-outline'] as const;

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'FERTILITÉ • TEMPÉRATURE BASALE',
    title: 'Suivre sa\ntempérature basale',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Une méthode simple pour confirmer, après coup, que l’ovulation a bien eu lieu.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que la température basale ?',
      'Quand et comment la mesurer',
      'Repérer la hausse après l’ovulation',
      'Ce qui peut fausser une mesure',
      'Les limites de cette méthode',
      'Quand en parler à un professionnel',
      'À retenir',
    ],
    section1Body: 'La température basale est la température de ton corps au repos complet, avant toute activité. Elle varie très légèrement au fil du cycle, sous l’influence de tes hormones.',
    section2Body: 'Elle se mesure chaque matin, avant de te lever, toujours à la même heure et avec le même thermomètre.',
    measuringTips: [
      {title: 'Le même thermomètre', text: 'Utilise toujours le même thermomètre, idéalement basal (plus précis au dixième de degré).'},
      {title: 'La même heure', text: 'Mesure à heure fixe, avant de te lever, après au moins 3 heures de sommeil ininterrompu.'},
      {title: 'Noter aussitôt', text: 'Note la valeur immédiatement, avant même de te lever ou de parler.'},
    ],
    section3Body: 'La température basale augmente légèrement (0,2 à 0,5 °C) juste après l’ovulation, sous l’effet de la progestérone, et reste plus haute jusqu’aux règles suivantes.',
    curveTitle: 'À quoi ressemble la courbe',
    curveText: 'Plus basse en première partie de cycle, elle monte d’un cran après l’ovulation et s’y maintient — un profil qui ne devient lisible qu’après plusieurs jours de relevés.',
    disruptingFactors: [
      'Une nuit de sommeil courte ou agitée',
      'Un réveil à une heure inhabituelle',
      'De la fièvre ou une maladie',
      'De l’alcool la veille au soir',
      'Un décalage horaire récent',
    ],
    section5Body: 'Ce n’est pas une méthode prédictive mais confirmative : elle t’aide à mieux connaître ton propre cycle, une fois l’ovulation déjà passée — pas à l’anticiper.',
    section5Caption: 'La observer seule sur un ou deux cycles ne suffit généralement pas : le profil se dessine avec la répétition.',
    warningTitle: 'Bon à évoquer avec un professionnel',
    consultSituations: [
      'Aucune hausse de température ne se dessine sur plusieurs cycles complets',
      'Les températures restent très irrégulières malgré une mesure rigoureuse',
      'Tu as des questions sur ta fertilité que ce suivi seul ne peut pas résoudre',
    ],
    tipTitle: 'Bon à savoir',
    tipText: 'Associer la température basale à l’observation de ta glaire cervicale ou à des tests d’ovulation donne une image plus complète de ton cycle.',
    summaryPoints: [
      'La température basale augmente légèrement (0,2 à 0,5 °C) juste après l’ovulation, sous l’effet de la progestérone.',
      'Elle se mesure chaque matin, avant de se lever, toujours à la même heure et avec le même thermomètre.',
      'Ce n’est pas une méthode prédictive mais confirmative : elle t’aide à mieux connaître ton propre cycle.',
      'La combiner à d’autres signes (glaire cervicale, tests d’ovulation) donne une vision plus complète.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Suivre sa température basale — AWA',
  },
  en: {
    badge: 'FERTILITY • BASAL BODY TEMPERATURE',
    title: 'Tracking your\nbasal body temperature',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'A simple method to confirm, after the fact, that ovulation has occurred.',
    contentsTitle: 'In this article',
    topics: [
      'What is basal body temperature?',
      'When and how to measure it',
      'Spotting the rise after ovulation',
      'What can skew a reading',
      'The limits of this method',
      'When to talk to a professional',
      'Key takeaways',
    ],
    section1Body: 'Basal body temperature is the temperature of your body at complete rest, before any activity. It varies very slightly over the course of the cycle, under the influence of your hormones.',
    section2Body: 'It’s measured every morning, before you get up, always at the same time and with the same thermometer.',
    measuringTips: [
      {title: 'The same thermometer', text: 'Always use the same thermometer, ideally a basal one (more precise, to a tenth of a degree).'},
      {title: 'The same time', text: 'Measure at a fixed time, before getting up, after at least 3 hours of uninterrupted sleep.'},
      {title: 'Write it down right away', text: 'Write down the reading immediately, before even getting up or speaking.'},
    ],
    section3Body: 'Basal body temperature rises slightly (0.2 to 0.5°C) just after ovulation, under the effect of progesterone, and stays higher until your next period.',
    curveTitle: 'What the chart looks like',
    curveText: 'Lower in the first part of the cycle, it steps up after ovulation and stays there — a pattern that only becomes clear after several days of readings.',
    disruptingFactors: [
      'A short or restless night’s sleep',
      'Waking up at an unusual time',
      'Fever or illness',
      'Alcohol the night before',
      'Recent jet lag',
    ],
    section5Body: 'This isn’t a predictive method but a confirmative one: it helps you better understand your own cycle, once ovulation has already happened — not to anticipate it.',
    section5Caption: 'Observing it alone over one or two cycles usually isn’t enough: the pattern emerges with repetition.',
    warningTitle: 'Worth mentioning to a professional',
    consultSituations: [
      'No temperature rise appears over several complete cycles',
      'Temperatures stay very irregular despite careful measurement',
      'You have questions about your fertility that this tracking alone can’t answer',
    ],
    tipTitle: 'Good to know',
    tipText: 'Combining basal body temperature with observing your cervical mucus or ovulation tests gives a more complete picture of your cycle.',
    summaryPoints: [
      'Basal body temperature rises slightly (0.2 to 0.5°C) right after ovulation, under the effect of progesterone.',
      'It’s measured every morning, before getting up, always at the same time and with the same thermometer.',
      'This isn’t a predictive method but a confirmative one: it helps you better understand your own cycle.',
      'Combining it with other signs (cervical mucus, ovulation tests) gives a more complete picture.',
    ],
    disclaimerText: 'Informational content. This article doesn’t replace personalized medical advice. If in doubt, ask a healthcare professional for guidance.',
    shareMessage: 'Tracking basal body temperature — AWA',
  },
  es: {
    badge: 'FERTILIDAD • TEMPERATURA BASAL',
    title: 'Seguir tu\ntemperatura basal',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Un método sencillo para confirmar, a posteriori, que la ovulación realmente ocurrió.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la temperatura basal?',
      'Cuándo y cómo medirla',
      'Detectar la subida después de la ovulación',
      'Qué puede alterar una medición',
      'Los límites de este método',
      'Cuándo hablarlo con un profesional',
      'Para recordar',
    ],
    section1Body: 'La temperatura basal es la temperatura de tu cuerpo en reposo completo, antes de cualquier actividad. Varía muy ligeramente a lo largo del ciclo, bajo la influencia de tus hormonas.',
    section2Body: 'Se mide cada mañana, antes de levantarte, siempre a la misma hora y con el mismo termómetro.',
    measuringTips: [
      {title: 'El mismo termómetro', text: 'Usa siempre el mismo termómetro, idealmente uno basal (más preciso, a la décima de grado).'},
      {title: 'La misma hora', text: 'Mide a una hora fija, antes de levantarte, después de al menos 3 horas de sueño ininterrumpido.'},
      {title: 'Anotar de inmediato', text: 'Anota el valor de inmediato, incluso antes de levantarte o de hablar.'},
    ],
    section3Body: 'La temperatura basal aumenta ligeramente (de 0,2 a 0,5 °C) justo después de la ovulación, por efecto de la progesterona, y permanece más alta hasta la siguiente regla.',
    curveTitle: 'A qué se parece la curva',
    curveText: 'Más baja en la primera parte del ciclo, sube un escalón después de la ovulación y se mantiene ahí: un perfil que solo se vuelve claro después de varios días de registros.',
    disruptingFactors: [
      'Una noche de sueño corta o agitada',
      'Despertarte a una hora inusual',
      'Fiebre o enfermedad',
      'Alcohol la noche anterior',
      'Un desfase horario reciente',
    ],
    section5Body: 'No es un método predictivo, sino confirmativo: te ayuda a conocer mejor tu propio ciclo, una vez que la ovulación ya ha pasado, no a anticiparla.',
    section5Caption: 'Observarla sola durante uno o dos ciclos generalmente no basta: el perfil se define con la repetición.',
    warningTitle: 'Bueno comentarlo con un profesional',
    consultSituations: [
      'No se observa ninguna subida de temperatura en varios ciclos completos',
      'Las temperaturas se mantienen muy irregulares a pesar de una medición rigurosa',
      'Tienes preguntas sobre tu fertilidad que este seguimiento por sí solo no puede resolver',
    ],
    tipTitle: 'Dato útil',
    tipText: 'Combinar la temperatura basal con la observación de tu moco cervical o con pruebas de ovulación te da una imagen más completa de tu ciclo.',
    summaryPoints: [
      'La temperatura basal aumenta ligeramente (de 0,2 a 0,5 °C) justo después de la ovulación, por efecto de la progesterona.',
      'Se mide cada mañana, antes de levantarte, siempre a la misma hora y con el mismo termómetro.',
      'No es un método predictivo, sino confirmativo: te ayuda a conocer mejor tu propio ciclo.',
      'Combinarla con otras señales (moco cervical, pruebas de ovulación) da una visión más completa.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye una opinión médica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Seguir tu temperatura basal — AWA',
  },
  it: {
    badge: 'FERTILITÀ • TEMPERATURA BASALE',
    title: 'Monitorare la tua\ntemperatura basale',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Un metodo semplice per confermare, a posteriori, che l’ovulazione è avvenuta.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è la temperatura basale?',
      'Quando e come misurarla',
      'Riconoscere l’aumento dopo l’ovulazione',
      'Cosa può alterare una misurazione',
      'I limiti di questo metodo',
      'Quando parlarne con un professionista',
      'Punti chiave',
    ],
    section1Body: 'La temperatura basale è la temperatura del tuo corpo a riposo completo, prima di qualsiasi attività. Varia molto lievemente nel corso del ciclo, sotto l’influenza dei tuoi ormoni.',
    section2Body: 'Si misura ogni mattina, prima di alzarti, sempre alla stessa ora e con lo stesso termometro.',
    measuringTips: [
      {
        title: 'Lo stesso termometro',
        text: 'Usa sempre lo stesso termometro, idealmente uno basale (più preciso, al decimo di grado).',
      },
      {
        title: 'Alla stessa ora',
        text: 'Misura a un’ora fissa, prima di alzarti, dopo almeno 3 ore di sonno ininterrotto.',
      },
      {
        title: 'Annotala subito',
        text: 'Annota subito la misurazione, prima ancora di alzarti o di parlare.',
      },
    ],
    section3Body: 'La temperatura basale aumenta leggermente (da 0,2 a 0,5°C) subito dopo l’ovulazione, per effetto del progesterone, e resta più alta fino al periodo mestruale successivo.',
    curveTitle: 'Che aspetto ha il grafico',
    curveText: 'Più bassa nella prima parte del ciclo, sale a gradino dopo l’ovulazione e vi rimane — un andamento che diventa chiaro solo dopo diversi giorni di misurazioni.',
    disruptingFactors: [
      'Una notte di sonno breve o agitata',
      'Svegliarsi a un’ora insolita',
      'Febbre o malattia',
      'Alcol la sera prima',
      'Jet lag recente',
    ],
    section5Body: 'Non è un metodo predittivo ma di conferma: ti aiuta a capire meglio il tuo ciclo, quando l’ovulazione è già avvenuta — non ad anticiparla.',
    section5Caption: 'Osservarla da sola per uno o due cicli di solito non basta: l’andamento emerge con la ripetizione.',
    warningTitle: 'Da riferire a un professionista',
    consultSituations: [
      'Non compare alcun aumento della temperatura nel corso di diversi cicli completi',
      'Le temperature restano molto irregolari nonostante misurazioni accurate',
      'Hai domande sulla tua fertilità a cui questo monitoraggio da solo non può rispondere',
    ],
    tipTitle: 'Da sapere',
    tipText: 'Combinare la temperatura basale con l’osservazione del muco cervicale o con i test di ovulazione offre un quadro più completo del tuo ciclo.',
    summaryPoints: [
      'La temperatura basale aumenta leggermente (da 0,2 a 0,5°C) subito dopo l’ovulazione, per effetto del progesterone.',
      'Si misura ogni mattina, prima di alzarsi, sempre alla stessa ora e con lo stesso termometro.',
      'Non è un metodo predittivo ma di conferma: ti aiuta a capire meglio il tuo ciclo.',
      'Combinarla con altri segni (muco cervicale, test di ovulazione) offre un quadro più completo.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico personalizzato. In caso di dubbi, chiedi consiglio a un professionista sanitario.',
    shareMessage: 'Monitorare la temperatura basale — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function BasalTemperatureArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
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

          <Text style={styles.title}>{content.title}</Text>

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

          <Text style={styles.intro}>{content.intro}</Text>

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

          <Text style={styles.body}>{content.section1Body}</Text>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          <View style={styles.comfortCard}>
            {content.measuringTips.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.measuringTips.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={MEASURING_ICONS[index] as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <Text style={styles.comfortTitle}>{item.title}</Text>
                  <Text style={styles.comfortText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.section3Body}</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="chart-line"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.curveTitle}</Text>
              <Text style={styles.infoText}>{content.curveText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.checkList}>
            {content.disruptingFactors.map(item => (
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

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>{content.section5Body}</Text>

          <Text style={styles.caption}>{content.section5Caption}</Text>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

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

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tipTitle}</Text>
              <Text style={styles.tipText}>{content.tipText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>{content.topics[6]}</Text>

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

            <Text style={styles.disclaimerText}>{content.disclaimerText}</Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
    color: theme.colors.text,
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
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.text},
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

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  comfortCopy: {flex: 1, marginLeft: 10},
  comfortTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  comfortText: {marginTop: 3, fontSize: 10.8, lineHeight: 16, color: theme.colors.textSecondary},

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6},
  checkText: {flex: 1, color: theme.colors.text, fontSize: 12.5, lineHeight: 17},

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: theme.colors.textSecondary, fontWeight: '800'},
  warningTitleNeutral: {color: theme.colors.text},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 5, color: theme.colors.text, fontSize: 11.5, lineHeight: 17},

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
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.text},

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
