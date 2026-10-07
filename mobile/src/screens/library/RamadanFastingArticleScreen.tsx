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

const ID = 'ramadan-jeune-et-regles';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

const ART = {
  tracking: require('../../assets/images/library/featured-tracking-hero.png'),
};

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const SPIRITUAL_ACT_ICONS = [
  'hands-pray',
  'heart-outline',
  'headphones',
  'book-open-variant',
  'hand-heart-outline',
  'pot-steam-outline',
  'weather-night',
  'calendar-check-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'RAMADAN',
    title: 'Le jeûne pendant\nle Ramadan',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Conseils pratiques et repères éducatifs pour vivre le mois de Ramadan en période de règles, avec sérénité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pendant les règles, le jeûne suspendu',
      'Vivre la spiritualité autrement',
      'Noter ses jours pour le rattrapage',
      'À retenir',
    ],
    section1Body1: 'Pendant les règles, le jeûne n’est pas requis : cette période place la femme dans un état où plusieurs actes d’adoration, dont le jeûne, sont temporairement suspendus. Cette suspension est reconnue comme une facilité, et non comme une interdiction ou une sanction.',
    section1Body2: 'Suspendre le jeûne pendant les règles ne signifie pas s’éloigner de sa pratique religieuse. Il est simplement mis en pause pour une durée limitée, puis repris normalement dès la fin des règles, sans qu’aucun acte de foi ne soit perdu. Les jours non jeûnés seront rattrapés plus tard (qadaa), en dehors du Ramadan.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Cette pause peut aussi être vécue comme un moment différent du mois, où la spiritualité continue de s’exprimer autrement, sans jeûne.',
    note1Title: 'À noter',
    note1Text: 'Cette situation ne doit pas être vécue avec culpabilité : elle fait partie du cycle naturel du corps et est prise en compte par la tradition religieuse elle-même.',
    section2Body: 'Ne pas jeûner ne signifie pas être coupée du mois de Ramadan. De nombreuses formes de spiritualité restent accessibles et permettent de continuer à vivre pleinement cette période.',
    spiritualActs: [
      'Dhikr (évocation de Dieu)',
      'Du’a (invocations)',
      'Écoute de contenus religieux',
      'Lecture de contenus éducatifs',
      'Charité et gestes de bienveillance',
      'Aider à préparer l’iftar',
      'Temps de réflexion personnelle',
      'Maintenir une routine spirituelle',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Ces gestes, même simples, permettent de rester pleinement connectée à l’esprit du mois, quelle que soit la situation.',
    section3Body: 'Garder une trace des jours de règles pendant le Ramadan facilite ensuite le calcul du nombre de jours à rattraper (qadaa), et évite d’avoir à s’en souvenir de mémoire une fois le mois terminé.',
    trackingTips: [
      'Noter la date de chaque jour non jeûné au fur et à mesure',
      'Utiliser un calendrier, une application ou un carnet dédié',
      'Faire un point rapide en fin de mois pour vérifier le total',
    ],
    visualTitle: 'Un suivi simplifié',
    visualText: 'AWA peut t’aider à suivre ton cycle au fil du Ramadan, pour retrouver facilement ces informations plus tard.',
    note2Title: 'À noter',
    note2Text: 'Les modalités exactes du rattrapage (délai, situations particulières comme la grossesse ou l’allaitement) peuvent varier selon les écoles juridiques. Pour toute situation spécifique ou complexe, l’avis d’un savant qualifié reste la référence.',
    tip3Title: 'Bon à savoir',
    tip3Text: 'Le jeûne suspendu pendant les règles est une facilité reconnue, non une rupture avec sa pratique religieuse. Vivre cette période autrement, garder une trace de ses jours, et demander conseil en cas de doute permettent de traverser le Ramadan avec sérénité.',
    shareMessage: 'Le jeûne pendant le Ramadan — AWA',
  },
  en: {
    badge: 'RAMADAN',
    title: 'Fasting during\nRamadan',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Practical tips and educational pointers for living through the month of Ramadan while on your period, with serenity.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'Fasting suspended during your period',
      'Experiencing spirituality differently',
      'Keeping track of days for make-up fasting',
      'Key takeaways',
    ],
    section1Body1: 'During your period, fasting is not required: this time places a woman in a state in which several acts of worship, including fasting, are temporarily suspended. This suspension is recognized as a relief, not as a prohibition or a punishment.',
    section1Body2: 'Suspending the fast during your period does not mean stepping away from your religious practice. It is simply paused for a limited time, then resumed normally once your period ends, without any act of faith being lost. The days not fasted will be made up later (qadaa), outside of Ramadan.',
    tip1Title: 'Good to know',
    tip1Text: 'This pause can also be experienced as a different kind of time within the month, where spirituality continues to express itself in other ways, without fasting.',
    note1Title: 'Please note',
    note1Text: 'This situation should not be experienced with guilt: it is part of the body’s natural cycle and is accounted for by religious tradition itself.',
    section2Body: 'Not fasting does not mean being cut off from the month of Ramadan. Many forms of spirituality remain accessible and allow you to continue fully experiencing this time.',
    spiritualActs: [
      'Dhikr (remembrance of God)',
      'Du’a (supplications)',
      'Listening to religious content',
      'Reading educational content',
      'Charity and acts of kindness',
      'Helping prepare iftar',
      'Time for personal reflection',
      'Maintaining a spiritual routine',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'These small gestures, even simple ones, help you stay fully connected to the spirit of the month, whatever your situation.',
    section3Body: 'Keeping track of your period days during Ramadan makes it easier afterward to calculate the number of days to make up (qadaa), and avoids having to rely on memory once the month is over.',
    trackingTips: [
      'Note the date of each day not fasted as you go',
      'Use a calendar, an app, or a dedicated notebook',
      'Do a quick check at the end of the month to verify the total',
    ],
    visualTitle: 'Simplified tracking',
    visualText: 'AWA can help you track your cycle throughout Ramadan, so you can easily find this information again later.',
    note2Title: 'Please note',
    note2Text: 'The exact terms of making up missed days (timing, special situations such as pregnancy or breastfeeding) can vary according to the school of jurisprudence. For any specific or complex situation, the opinion of a qualified scholar remains the reference.',
    tip3Title: 'Good to know',
    tip3Text: 'Fasting suspended during your period is a recognized relief, not a break from your religious practice. Living through this time differently, keeping track of your days, and asking for guidance when in doubt all help you get through Ramadan with serenity.',
    shareMessage: 'Fasting during Ramadan — AWA',
  },
  es: {
    badge: 'RAMADÁN',
    title: 'El ayuno durante\nel Ramadán',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Consejos prácticos y referencias educativas para vivir el mes de Ramadán durante la menstruación, con serenidad.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'Durante la menstruación, el ayuno suspendido',
      'Vivir la espiritualidad de otra manera',
      'Anotar tus días para la recuperación',
      'Para recordar',
    ],
    section1Body1: 'Durante la menstruación, el ayuno no es obligatorio: este periodo sitúa a la mujer en un estado en el que varios actos de adoración, entre ellos el ayuno, quedan temporalmente suspendidos. Esta suspensión se reconoce como una facilidad, y no como una prohibición o una sanción.',
    section1Body2: 'Suspender el ayuno durante la menstruación no significa alejarse de la propia práctica religiosa. Simplemente se pone en pausa durante un tiempo limitado, y luego se reanuda con normalidad en cuanto termina la menstruación, sin que se pierda ningún acto de fe. Los días no ayunados se recuperarán más tarde (qadaa), fuera del Ramadán.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Esta pausa también puede vivirse como un momento diferente del mes, en el que la espiritualidad sigue expresándose de otra manera, sin ayuno.',
    note1Title: 'Para tener en cuenta',
    note1Text: 'Esta situación no debe vivirse con culpa: forma parte del ciclo natural del cuerpo y está contemplada por la propia tradición religiosa.',
    section2Body: 'No ayunar no significa estar desconectada del mes de Ramadán. Muchas formas de espiritualidad siguen siendo accesibles y permiten seguir viviendo plenamente este periodo.',
    spiritualActs: [
      'Dhikr (evocación de Dios)',
      'Dua (invocaciones)',
      'Escuchar contenidos religiosos',
      'Leer contenidos educativos',
      'Caridad y gestos de bondad',
      'Ayudar a preparar el iftar',
      'Tiempo de reflexión personal',
      'Mantener una rutina espiritual',
    ],
    tip2Title: 'Bueno saberlo',
    tip2Text: 'Estos gestos, aunque sean sencillos, permiten seguir plenamente conectada con el espíritu del mes, sea cual sea la situación.',
    section3Body: 'Llevar un registro de los días de menstruación durante el Ramadán facilita después el cálculo del número de días por recuperar (qadaa), y evita tener que recordarlo de memoria una vez terminado el mes.',
    trackingTips: [
      'Anotar la fecha de cada día no ayunado a medida que avanza',
      'Usar un calendario, una aplicación o un cuaderno dedicado',
      'Hacer un repaso rápido a final de mes para comprobar el total',
    ],
    visualTitle: 'Un seguimiento simplificado',
    visualText: 'AWA puede ayudarte a seguir tu ciclo a lo largo del Ramadán, para encontrar fácilmente esta información más tarde.',
    note2Title: 'Para tener en cuenta',
    note2Text: 'Las modalidades exactas de la recuperación (plazo, situaciones particulares como el embarazo o la lactancia) pueden variar según las escuelas jurídicas. Para cualquier situación específica o compleja, la opinión de un erudito cualificado sigue siendo la referencia.',
    tip3Title: 'Bueno saberlo',
    tip3Text: 'El ayuno suspendido durante la menstruación es una facilidad reconocida, no una ruptura con la propia práctica religiosa. Vivir este periodo de otra manera, llevar un registro de tus días y pedir consejo en caso de duda permiten atravesar el Ramadán con serenidad.',
    shareMessage: 'El ayuno durante el Ramadán — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function RamadanFastingArticleScreen({
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

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.disclaimerTitle}</Text>
              <Text style={styles.tipText}>{content.disclaimerText}</Text>
            </View>
          </View>

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
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
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

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.note1Title}</Text>
              <Text style={styles.tipText}>
                {content.note1Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          <View style={styles.daily}>
            {SPIRITUAL_ACT_ICONS.map((icon, index) => (
              <View key={content.spiritualActs[index]} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.spiritualActs[index]}</Text>
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.checkList}>
            {content.trackingTips.map(item => (
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

          <View style={styles.visualCard}>
            <Image
              source={ART.tracking}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.visualTitle}</Text>

              <Text style={styles.visualText}>
                {content.visualText}
              </Text>
            </View>
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.note2Title}</Text>
              <Text style={styles.tipText}>
                {content.note2Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip3Title}</Text>
              <Text style={styles.tipText}>
                {content.tip3Text}
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
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary},
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
  visualText: {marginTop: 4, color: theme.colors.textMuted, fontSize: 11, lineHeight: 16},
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
    marginBottom: 9,
  },
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
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
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textMuted},
  });
}
