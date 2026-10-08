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

const ID = 'prayerduringmenstruation-la-priere-suspendue';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const WORSHIP_ICONS = [
  'hands-pray',
  'heart-outline',
  'hand-heart-outline',
  'account-heart-outline',
  'book-open-variant',
  'headphones',
  'weather-night',
  'emoticon-happy-outline',
] as const;

// PHASE 7L.2 — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
//
// RELIGIOUS CONTENT — this article is fiqh-adjacent (the suspended prayer
// during menstruation). The English translation preserves every hedge
// ("généralement", "peuvent faire l'objet d'avis différents selon les
// écoles juridiques") and scholarly-referral exactly, states no ruling
// more strongly than the French, and never attributes a position to a
// specific madhhab that the French itself does not attribute.
const CONTENT = {
  fr: {
    badge: 'PRIÈRE PENDANT LES RÈGLES',
    title: 'La prière pendant\nles règles',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi la prière rituelle est suspendue durant cette période, et comment vivre ce moment avec sérénité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'La prière suspendue pendant les règles',
      'Pas de rattrapage, contrairement au jeûne',
      'Les autres formes d’adoration restent possibles',
      'À retenir',
    ],
    section1Body1: 'Pendant les règles, l’obligation de la prière (salat) est suspendue : la femme n’est pas tenue de prier durant cette période. Cette suspension fait partie intégrante de la pratique religieuse elle-même, reconnue de longue date par la tradition.',
    section1Body2: 'Cette suspension ne signifie en rien un éloignement de la foi ou un relâchement dans la pratique religieuse. Il s’agit d’une dispense reconnue, à vivre sans culpabilité : elle fait partie du cadre naturel de la vie spirituelle d’une femme.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Cette période peut être abordée avec sérénité : elle ne remet en cause ni la valeur de la foi, ni la régularité de la pratique religieuse.',
    section1Body3: 'Si les règles commencent pendant que la prière est en cours, celle-ci est interrompue : elle n’a pas besoin d’être terminée ni rattrapée. À l’inverse, lorsque les règles se terminent, la prière reprend normalement après le ghusl (grande ablution), qui marque le retour à l’état de pureté rituelle.',
    section2Body1: 'Contrairement au jeûne du Ramadan, dont les jours manqués pendant les règles sont rattrapés plus tard (qadaa), les prières manquées pour cette même raison ne sont généralement pas rattrapées après. Cette différence s’explique par la nature même de ces deux actes d’adoration : la prière est un acte quotidien répété plusieurs fois par jour, tandis que le jeûne est annuel et concentré sur un mois précis.',
    section2Body2: 'Cette distinction peut surprendre lorsqu’on découvre le fiqh pour la première fois. Elle ne signifie pas que la prière compte moins : suivre la dispense telle qu’elle est prescrite fait, en soi, pleinement partie de la pratique religieuse.',
    section3Body: 'Ne pas prier pendant les règles ne signifie pas être coupée de sa spiritualité. De nombreuses formes d’adoration et d’engagement religieux restent accessibles durant cette période.',
    worshipActs: [
      'Dhikr (évocation de Dieu)',
      'Du’a (invocations)',
      'Charité',
      'Aider les autres',
      'Apprentissage religieux',
      'Écoute de contenus religieux',
      'Réflexion et gratitude',
      'Gestes de bienveillance',
    ],
    noteTitle: 'À noter',
    noteText: 'Certaines pratiques, comme la récitation ou la manipulation directe du Coran, peuvent faire l’objet d’avis différents selon les écoles juridiques. Se référer à l’avis suivi habituellement, ou demander conseil à un savant qualifié, aide à clarifier ces cas.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'La prière suspendue pendant les règles est une dispense reconnue, à vivre sans culpabilité. De nombreuses formes de spiritualité restent accessibles durant cette période, et l’avis d’un savant qualifié reste la référence pour toute question précise.',
    shareMessage: 'La prière pendant les règles — AWA',
  },
  en: {
    badge: 'PRAYER DURING MENSTRUATION',
    title: 'Prayer during\nmenstruation',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why ritual prayer is suspended during this time, and how to experience this period with serenity.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'The suspended prayer during menstruation',
      'No making up missed prayers, unlike fasting',
      'Other forms of worship remain possible',
      'Key takeaways',
    ],
    section1Body1: 'During menstruation, the obligation of prayer (salat) is suspended: a woman is not required to pray during this period. This suspension is an integral part of religious practice itself, long recognized by tradition.',
    section1Body2: 'This suspension in no way means a distancing from faith or a lapse in religious practice. It is a recognized exemption, to be experienced without guilt: it is part of the natural framework of a woman’s spiritual life.',
    tip1Title: 'Good to know',
    tip1Text: 'This time can be approached with serenity: it calls into question neither the value of one’s faith nor the regularity of one’s religious practice.',
    section1Body3: 'If menstruation begins while prayer is in progress, it is interrupted: it does not need to be finished or made up. Conversely, when menstruation ends, prayer resumes normally after the ghusl (major ablution), which marks the return to the state of ritual purity.',
    section2Body1: 'Unlike the Ramadan fast, whose missed days during menstruation are made up later (qadaa), prayers missed for this same reason are generally not made up afterward. This difference is explained by the very nature of these two acts of worship: prayer is a daily act repeated several times a day, while fasting is annual and concentrated on a specific month.',
    section2Body2: 'This distinction can be surprising when first discovering fiqh. It does not mean that prayer counts for less: following the exemption as it is prescribed is, in itself, fully part of religious practice.',
    section3Body: 'Not praying during menstruation does not mean being cut off from one’s spirituality. Many forms of worship and religious engagement remain accessible during this time.',
    worshipActs: [
      'Dhikr (remembrance of God)',
      'Du’a (supplications)',
      'Charity',
      'Helping others',
      'Religious learning',
      'Listening to religious content',
      'Reflection and gratitude',
      'Acts of kindness',
    ],
    noteTitle: 'Please note',
    noteText: 'Some practices, such as reciting or directly handling the Quran, may be subject to differing opinions depending on the school of jurisprudence. Referring to the opinion you usually follow, or seeking advice from a qualified scholar, helps clarify these cases.',
    tip2Title: 'Good to know',
    tip2Text: 'The suspended prayer during menstruation is a recognized exemption, to be experienced without guilt. Many forms of spirituality remain accessible during this time, and the advice of a qualified scholar remains the reference for any specific question.',
    shareMessage: 'Prayer during menstruation — AWA',
  },
  es: {
    badge: 'ORACIÓN DURANTE LA MENSTRUACIÓN',
    title: 'La oración durante\nla menstruación',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué la oración ritual queda suspendida durante este periodo, y cómo vivirlo con serenidad.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'La oración suspendida durante la menstruación',
      'Sin recuperación, a diferencia del ayuno',
      'Otras formas de adoración siguen siendo posibles',
      'Para recordar',
    ],
    section1Body1: 'Durante la menstruación, la obligación de la oración (salat) queda suspendida: la mujer no está obligada a rezar durante este periodo. Esta suspensión forma parte integral de la propia práctica religiosa, reconocida desde hace mucho tiempo por la tradición.',
    section1Body2: 'Esta suspensión no supone en absoluto un alejamiento de la fe ni un relajamiento en la práctica religiosa. Se trata de una dispensa reconocida, que se vive sin culpa: forma parte del marco natural de la vida espiritual de una mujer.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Este periodo puede vivirse con serenidad: no pone en duda ni el valor de la fe ni la regularidad de la práctica religiosa.',
    section1Body3: 'Si la menstruación comienza mientras la oración está en curso, esta se interrumpe: no es necesario terminarla ni recuperarla. A la inversa, cuando la menstruación termina, la oración se reanuda con normalidad después del gusl (ablución mayor), que marca el regreso al estado de pureza ritual.',
    section2Body1: 'A diferencia del ayuno del Ramadán, cuyos días no realizados durante la menstruación se recuperan más tarde (qadaa), las oraciones no realizadas por este mismo motivo generalmente no se recuperan después. Esta diferencia se explica por la propia naturaleza de estos dos actos de adoración: la oración es un acto diario que se repite varias veces al día, mientras que el ayuno es anual y se concentra en un mes concreto.',
    section2Body2: 'Esta distinción puede sorprender cuando se descubre el fiqh por primera vez. No significa que la oración cuente menos: seguir la dispensa tal y como está prescrita forma, en sí misma, plenamente parte de la práctica religiosa.',
    section3Body: 'No rezar durante la menstruación no significa estar desconectada de la propia espiritualidad. Muchas formas de adoración y de compromiso religioso siguen siendo accesibles durante este periodo.',
    worshipActs: [
      'Dhikr (evocación de Dios)',
      'Dua (invocaciones)',
      'Caridad',
      'Ayudar a los demás',
      'Aprendizaje religioso',
      'Escuchar contenidos religiosos',
      'Reflexión y gratitud',
      'Gestos de bondad',
    ],
    noteTitle: 'Para tener en cuenta',
    noteText: 'Algunas prácticas, como la recitación o la manipulación directa del Corán, pueden ser objeto de opiniones distintas según las escuelas jurídicas. Referirse a la opinión que se suele seguir, o pedir consejo a un erudito cualificado, ayuda a aclarar estos casos.',
    tip2Title: 'Bueno saberlo',
    tip2Text: 'La oración suspendida durante la menstruación es una dispensa reconocida, que se vive sin culpa. Muchas formas de espiritualidad siguen siendo accesibles durante este periodo, y la opinión de un erudito cualificado sigue siendo la referencia para cualquier pregunta concreta.',
    shareMessage: 'La oración durante la menstruación — AWA',
  },
  it: {
    badge: 'PREGHIERA DURANTE LE MESTRUAZIONI',
    title: 'La preghiera durante\nle mestruazioni',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché la preghiera rituale è sospesa in questo periodo e come viverlo con serenità.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'La preghiera sospesa durante le mestruazioni',
      'Le preghiere perse non si recuperano, a differenza del digiuno',
      'Altre forme di culto restano possibili',
      'Punti chiave',
    ],
    section1Body1: 'Durante le mestruazioni l’obbligo della preghiera (salat) è sospeso: una donna non è tenuta a pregare in questo periodo. Questa sospensione fa parte della pratica religiosa stessa, da lungo tempo riconosciuta dalla tradizione.',
    section1Body2: 'Questa sospensione non significa in alcun modo un allontanamento dalla fede né una mancanza nella pratica religiosa. È un’esenzione riconosciuta, da vivere senza senso di colpa: fa parte del quadro naturale della vita spirituale di una donna.',
    tip1Title: 'Da sapere',
    tip1Text: 'Questo periodo si può vivere con serenità: non mette in discussione né il valore della propria fede né la regolarità della propria pratica religiosa.',
    section1Body3: 'Se le mestruazioni iniziano mentre la preghiera è in corso, questa viene interrotta: non occorre terminarla né recuperarla. Al contrario, quando le mestruazioni finiscono, la preghiera riprende normalmente dopo il ghusl (abluzione maggiore), che segna il ritorno allo stato di purezza rituale.',
    section2Body1: 'A differenza del digiuno di Ramadan, i cui giorni persi durante le mestruazioni vengono recuperati in seguito (qadaa), le preghiere perse per lo stesso motivo in genere non si recuperano. Questa differenza si spiega con la natura stessa dei due atti di culto: la preghiera è un atto quotidiano ripetuto più volte al giorno, mentre il digiuno è annuale e concentrato in un mese preciso.',
    section2Body2: 'Questa distinzione può sorprendere quando si scopre per la prima volta il fiqh. Non significa che la preghiera valga di meno: seguire l’esenzione così come è prescritta fa pienamente parte, di per sé, della pratica religiosa.',
    section3Body: 'Non pregare durante le mestruazioni non significa essere tagliate fuori dalla propria spiritualità. Molte forme di culto e di impegno religioso restano accessibili in questo periodo.',
    worshipActs: [
      'Dhikr (ricordo di Dio)',
      'Du’a (suppliche)',
      'Carità',
      'Aiutare gli altri',
      'Studio religioso',
      'Ascolto di contenuti religiosi',
      'Riflessione e gratitudine',
      'Gesti di gentilezza',
    ],
    noteTitle: 'Attenzione',
    noteText: 'Alcune pratiche, come recitare o toccare direttamente il Corano, possono essere oggetto di pareri diversi a seconda della scuola giuridica. Fare riferimento al parere che segui abitualmente, o chiedere consiglio a uno studioso qualificato, aiuta a chiarire questi casi.',
    tip2Title: 'Da sapere',
    tip2Text: 'La preghiera sospesa durante le mestruazioni è un’esenzione riconosciuta, da vivere senza senso di colpa. Molte forme di spiritualità restano accessibili in questo periodo, e il consiglio di uno studioso qualificato resta il riferimento per qualsiasi questione specifica.',
    shareMessage: 'La preghiera durante le mestruazioni — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PrayerDuringMenstruationArticleScreen({
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
        {/* HERO */}
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

        {/* ARTICLE */}
        <View style={styles.article}>
          {/* CATEGORY */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* METADATA */}
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

          {/* INTRODUCTION */}
          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* DISCLAIMER */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.disclaimerTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.disclaimerText}
              </Text>
            </View>
          </View>

          {/* TABLE OF CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
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

          {/* SECTION 1 */}
          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          {/* TIP */}
          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tip1Title}
              </Text>

              <Text style={styles.tipText}>
                {content.tip1Text}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            {content.section1Body3}
          </Text>

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body1}
          </Text>

          <Text style={styles.body}>
            {content.section2Body2}
          </Text>

          {/* SECTION 3 */}
          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          {/* WORSHIP GRID */}
          <View style={styles.daily}>
            {content.worshipActs.map((label, index) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={WORSHIP_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* ONLY NECESSARY "À NOTER" */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.noteTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.noteText}
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>
            4. {content.topics[3]}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tip2Title}
              </Text>

              <Text style={styles.tipText}>
                {content.tip2Text}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* READING CONTROLS */}
      <ReadingControls
        articleId={ID}
        durationMinutes={6}
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

  /* HERO */
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

  /* ARTICLE */
  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },

  /* BADGE */
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

  /* TITLE */
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.text,
    fontWeight: '700',
  },

  /* METADATA */
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

  /* INTRO */
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '500',
  },

  /* ALERT */
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* TABLE OF CONTENTS */
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

  /* SECTION TITLES */
  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  /* BODY */
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  /* WORSHIP GRID */
  daily: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

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

  /* TIP */
  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: theme.colors.textMuted,
  },
  });
}