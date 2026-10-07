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

const ID = 'lossphysical-recuperation-physique';

const HERO = require('../../assets/images/library/spm-water.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons stay language-neutral — only TEXT moves into the bilingual   */
/* CONTENT object below, keyed by index to stay aligned with these icons.    */
/* -------------------------------------------------------------------------- */

const PHYSICAL_SIGNS_ICONS = ['water-outline', 'pulse', 'clock-outline'] as const;

const COMFORT_TIPS_ICONS = [
  'bed-outline',
  'cup-water',
  'account-heart-outline',
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L — bilingual editorial content. Article identity (ID,   */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badge: 'APRÈS UNE FAUSSE COUCHE • RÉCUPÉRATION',
    title: 'La récupération physique après \nune fausse couche',
    metaDuration: '7 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu informatif',
    intro: 'Ton corps a besoin de temps pour retrouver son équilibre. Voici ce qui peut t’aider à mieux comprendre cette étape, en douceur.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce qu’une fausse couche ?',
      'Ce qui peut se passer physiquement',
      'Le retour du cycle',
      'Un suivi médical rassurant',
      'Quand consulter',
      'À retenir',
    ],
    section1Body1: 'Une fausse couche correspond à l’arrêt spontané d’une grossesse, le plus souvent avant la 12e à 14e semaine. On estime qu’une grossesse confirmée sur six à sept se termine ainsi, le plus souvent tôt dans la grossesse.',
    section1Body2: 'Ce n’est ni rare, ni le signe d’un problème de fertilité future. Dans la grande majorité des cas, elle est liée à des facteurs indépendants de la volonté, comme une anomalie chromosomique survenue par hasard lors du développement.',
    infoCard1Title: 'À retenir',
    infoCard1Text: 'Une fausse couche n’est causée par rien que tu aies fait ou pas fait. Tu n’es pas responsable de ce qui est arrivé.',
    section2Body: 'L’expérience varie beaucoup d’une personne à l’autre. Voici les manifestations les plus courantes :',
    physicalSigns: [
      {title: 'Des saignements', text: 'Leur intensité et leur durée peuvent varier selon chaque situation, puis diminuent progressivement.'},
      {title: 'Des crampes', text: 'Des douleurs proches de crampes menstruelles, parfois plus marquées, peuvent accompagner cette étape.'},
      {title: 'Une durée variable', text: 'La récupération physique s’étale généralement sur quelques jours à quelques semaines.'},
    ],
    section3Body: 'Le corps met généralement quelques semaines à retrouver un équilibre hormonal après une fausse couche. Un cycle peut revenir dès 4 à 6 semaines, mais chaque parcours est différent.',
    comfortTips: [
      {title: 'Accorde-toi du repos', text: 'Ton corps a besoin de temps pour retrouver son équilibre, sans obligation de résultat.'},
      {title: 'Reste bien hydratée', text: 'Une bonne hydratation accompagne naturellement la récupération.'},
      {title: 'Écoute ton corps', text: 'Chaque parcours est différent : avance à ton propre rythme, sans te comparer.'},
    ],
    section4Body: 'Un suivi médical de contrôle permet de vérifier que tout est rentré dans l’ordre, en toute sérénité. Ce rendez-vous est aussi l’occasion de poser toutes tes questions.',
    infoCard2Title: 'Ce que ce rendez-vous peut inclure',
    infoCard2Text: 'Une discussion sur ce que tu as vécu, un examen si nécessaire, et un espace pour répondre à tes questions sur la suite.',
    section5Body: 'Si l’un de ces signes apparaît, il est important de contacter un professionnel de santé sans attendre.',
    warningTitle: 'Signes qui méritent un avis médical',
    warningSigns: [
      'De la fièvre ou un état général qui se dégrade',
      'Des saignements très abondants (protection à changer en moins d’une heure)',
      'Des douleurs intenses qui ne s’améliorent pas',
      'Une odeur inhabituelle',
    ],
    tipTitle: 'Bon à savoir',
    tipText: 'Prendre soin de ton corps ne veut pas dire tout contrôler : c’est surtout t’accorder le temps dont tu as besoin.',
    summaryPoints: [
      'Une fausse couche n’est causée par rien que tu aies fait ou pas fait.',
      'Le corps met généralement quelques semaines à retrouver son équilibre hormonal.',
      'Un cycle peut revenir dès 4 à 6 semaines, mais chaque parcours est différent.',
      'Un contrôle médical permet de vérifier que tout évolue normalement, en toute sérénité.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis ou un examen médical. En cas de doute ou de symptôme préoccupant, demande conseil à un professionnel de santé.',
    shareMessage: 'La récupération physique après une fausse couche — AWA',
  },
  en: {
    badge: 'AFTER A MISCARRIAGE • RECOVERY',
    title: 'Physical recovery after \na miscarriage',
    metaDuration: '7 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Informational content',
    intro: 'Your body needs time to find its balance again. Here’s what can help you better understand this stage, gently.',
    contentsTitle: 'In this article',
    topics: [
      'What is a miscarriage?',
      'What can happen physically',
      'The return of your cycle',
      'A reassuring medical check-up',
      'When to seek medical care',
      'Key takeaways',
    ],
    section1Body1: 'A miscarriage is the spontaneous end of a pregnancy, most often before the 12th to 14th week. It’s estimated that one in six to seven confirmed pregnancies ends this way, most often early in the pregnancy.',
    section1Body2: 'It isn’t rare, nor is it a sign of a future fertility problem. In the vast majority of cases, it’s linked to factors beyond anyone’s control, such as a chromosomal anomaly that occurred by chance during development.',
    infoCard1Title: 'Key takeaway',
    infoCard1Text: 'A miscarriage isn’t caused by anything you did or didn’t do. You aren’t responsible for what happened.',
    section2Body: 'Every experience is different from one person to another. Here are the most common signs:',
    physicalSigns: [
      {title: 'Bleeding', text: 'Its intensity and duration can vary depending on the situation, then gradually decrease.'},
      {title: 'Cramping', text: 'Pain similar to menstrual cramps, sometimes more intense, can accompany this stage.'},
      {title: 'A variable duration', text: 'Physical recovery usually spans a few days to a few weeks.'},
    ],
    section3Body: 'Your body generally takes a few weeks to regain hormonal balance after a miscarriage. A cycle can return as early as 4 to 6 weeks, but every journey is different.',
    comfortTips: [
      {title: 'Allow yourself to rest', text: 'Your body needs time to find its balance again, with no pressure to achieve a particular outcome.'},
      {title: 'Stay well hydrated', text: 'Good hydration naturally supports recovery.'},
      {title: 'Listen to your body', text: 'Every journey is different: move at your own pace, without comparing yourself to others.'},
    ],
    section4Body: 'A medical check-up helps confirm that everything is progressing normally, with complete peace of mind. This appointment is also a chance to ask all your questions.',
    infoCard2Title: 'What this appointment can include',
    infoCard2Text: 'A conversation about what you’ve been through, an exam if needed, and space to answer your questions about what comes next.',
    section5Body: 'If any of these signs appear, it’s important to contact a healthcare professional right away.',
    warningTitle: 'Signs that call for medical advice',
    warningSigns: [
      'Fever or a worsening general condition',
      'Very heavy bleeding (needing to change your protection in less than an hour)',
      'Intense pain that doesn’t improve',
      'An unusual odor',
    ],
    tipTitle: 'Good to know',
    tipText: 'Taking care of your body doesn’t mean controlling everything: it mainly means giving yourself the time you need.',
    summaryPoints: [
      'A miscarriage isn’t caused by anything you did or didn’t do.',
      'Your body generally takes a few weeks to regain hormonal balance.',
      'A cycle can return as early as 4 to 6 weeks, but every journey is different.',
      'A medical check-up lets you confirm that everything is progressing normally, with complete peace of mind.',
    ],
    disclaimerText: 'Informational content. This article does not replace medical advice or examination. If in doubt or experiencing concerning symptoms, seek advice from a healthcare professional.',
    shareMessage: 'Physical recovery after a miscarriage — AWA',
  },
  es: {
    badge: 'DESPUÉS DE UNA PÉRDIDA DEL EMBARAZO • RECUPERACIÓN',
    title: 'La recuperación física después de \nuna pérdida del embarazo',
    metaDuration: '7 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido informativo',
    intro: 'Tu cuerpo necesita tiempo para recuperar su equilibrio. Esto es lo que puede ayudarte a entender mejor esta etapa, con suavidad.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es una pérdida del embarazo?',
      'Lo que puede ocurrir físicamente',
      'El regreso del ciclo',
      'Un seguimiento médico tranquilizador',
      'Cuándo consultar',
      'Para recordar',
    ],
    section1Body1: 'Una pérdida del embarazo corresponde a la interrupción espontánea de un embarazo, casi siempre antes de la semana 12 a 14. Se estima que entre una de cada seis y una de cada siete embarazos confirmados termina así, casi siempre pronto en el embarazo.',
    section1Body2: 'No es algo raro, ni es señal de un problema de fertilidad futura. En la gran mayoría de los casos, está relacionada con factores ajenos a la voluntad, como una anomalía cromosómica ocurrida por azar durante el desarrollo.',
    infoCard1Title: 'Para recordar',
    infoCard1Text: 'Una pérdida del embarazo no está causada por nada que hayas hecho o dejado de hacer. No eres responsable de lo que ha ocurrido.',
    section2Body: 'La experiencia varía mucho de una persona a otra. Estas son las manifestaciones más frecuentes:',
    physicalSigns: [
      {title: 'Sangrado', text: 'Su intensidad y su duración pueden variar según cada situación, y luego disminuyen progresivamente.'},
      {title: 'Cólicos', text: 'Dolores parecidos a cólicos menstruales, a veces más marcados, pueden acompañar esta etapa.'},
      {title: 'Una duración variable', text: 'La recuperación física se extiende generalmente entre unos días y unas semanas.'},
    ],
    section3Body: 'El cuerpo tarda generalmente unas semanas en recuperar el equilibrio hormonal después de una pérdida del embarazo. Un ciclo puede volver ya a partir de las 4 a 6 semanas, pero cada recorrido es diferente.',
    comfortTips: [
      {title: 'Concédete descanso', text: 'Tu cuerpo necesita tiempo para recuperar su equilibrio, sin obligación de resultado.'},
      {title: 'Mantente bien hidratada', text: 'Una buena hidratación acompaña naturalmente la recuperación.'},
      {title: 'Escucha tu cuerpo', text: 'Cada recorrido es diferente: avanza a tu propio ritmo, sin compararte.'},
    ],
    section4Body: 'Un seguimiento médico de control permite verificar que todo ha vuelto a la normalidad, con total tranquilidad. Esta cita es también la ocasión de hacer todas tus preguntas.',
    infoCard2Title: 'Lo que esta cita puede incluir',
    infoCard2Text: 'Una conversación sobre lo que has vivido, un examen si es necesario, y un espacio para responder a tus preguntas sobre lo que sigue.',
    section5Body: 'Si aparece alguna de estas señales, es importante contactar con un profesional de la salud sin esperar.',
    warningTitle: 'Señales que merecen un aviso médico',
    warningSigns: [
      'Fiebre o un estado general que empeora',
      'Sangrado muy abundante (necesidad de cambiar de protección en menos de una hora)',
      'Dolores intensos que no mejoran',
      'Un olor inusual',
    ],
    tipTitle: 'DATO ÚTIL',
    tipText: 'Cuidar tu cuerpo no significa controlarlo todo: significa sobre todo concederte el tiempo que necesitas.',
    summaryPoints: [
      'Una pérdida del embarazo no está causada por nada que hayas hecho o dejado de hacer.',
      'El cuerpo tarda generalmente unas semanas en recuperar su equilibrio hormonal.',
      'Un ciclo puede volver ya a partir de las 4 a 6 semanas, pero cada recorrido es diferente.',
      'Un control médico permite verificar que todo evoluciona con normalidad, con total tranquilidad.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye un aviso o un examen médico. En caso de duda o de síntoma preocupante, pide consejo a un profesional de la salud.',
    shareMessage: 'La recuperación física después de una pérdida del embarazo — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MiscarriagePhysicalRecoveryArticleScreen({
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

          <Text style={styles.body}>{content.section1Body1}</Text>

          <Text style={styles.body}>{content.section1Body2}</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard1Title}</Text>
              <Text style={styles.infoText}>{content.infoCard1Text}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          <View style={styles.normalGrid}>
            {content.physicalSigns.map((item, index) => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={PHYSICAL_SIGNS_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.section3Body}</Text>

          <View style={styles.comfortCard}>
            {content.comfortTips.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.comfortTips.length - 1 && styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={COMFORT_TIPS_ICONS[index] as never}
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
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>{content.section4Body}</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="stethoscope"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoCard2Title}</Text>
              <Text style={styles.infoText}>{content.infoCard2Text}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>{content.section5Body}</Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <Text style={styles.warningTitle}>{content.warningTitle}</Text>
            </View>

            {content.warningSigns.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
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

          <Text style={styles.h2}>{content.topics[5]}</Text>

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

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
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

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
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
