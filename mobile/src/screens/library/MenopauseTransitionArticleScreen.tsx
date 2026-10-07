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

const ID = 'menopause-comprendre-la-transition';

const HERO = require('../../assets/images/library/spm-sleep.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const DAILY_HABIT_ICONS = [
  'bowl-mix-outline',
  'shoe-sneaker',
  'weather-night',
  'meditation',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PÉRIMÉNOPAUSE & MÉNOPAUSE',
    title: 'Comprendre la transition ménopausique',
    metaDuration: '10 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro:
      'Ce qui change progressivement, des années avant l’arrêt des règles, et comment aborder cette étape avec plus de clarté.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Périménopause et ménopause : les définitions',
      'Des cycles de plus en plus irréguliers',
      'Sommeil et humeur',
      'Vie intime et sécheresse vaginale',
      'Poids et métabolisme',
      'Idées reçues sur la ménopause',
      'Symptômes normaux et signaux à surveiller',
      'Conseils pratiques au quotidien',
      'À retenir',
    ],
    h1: '1. Périménopause et ménopause : les définitions',
    body1a:
      'La périménopause désigne la période de transition hormonale qui précède la ménopause : elle peut débuter plusieurs années avant, généralement à partir de la quarantaine, avec des niveaux d’œstrogènes qui fluctuent de façon irrégulière.',
    body1b:
      'La ménopause, elle, est un moment précis : elle est confirmée après 12 mois consécutifs sans règles, en l’absence d’autre cause. En France, elle survient en moyenne autour de 51 ans, mais cet âge varie naturellement d’une femme à l’autre.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'Chaque femme vit cette transition différemment, en durée comme en intensité des symptômes. En parler ouvertement aide à mieux l’anticiper.',
    h2: '2. Des cycles de plus en plus irréguliers',
    body2:
      'L’un des premiers signes de la périménopause est souvent un changement dans le rythme des cycles : ils peuvent devenir plus courts, plus longs, plus espacés, ou avec un flux différent d’un mois à l’autre.',
    alert1Title: 'À noter',
    alert1Text:
      'Des saignements très abondants, très rapprochés, ou survenant après un an sans règles justifient un avis médical, car ils ne sont pas considérés comme un signe habituel de la transition.',
    h3: '3. Sommeil et humeur',
    body3a:
      'La baisse et les fluctuations d’œstrogènes et de progestérone peuvent perturber le sommeil (endormissement, réveils nocturnes) et s’accompagner d’une irritabilité, d’une anxiété ou de sautes d’humeur inhabituelles.',
    body3b:
      'Ces changements ont une explication biologique réelle : ils ne traduisent ni un manque de volonté, ni un problème psychologique isolé.',
    h4: '4. Vie intime et sécheresse vaginale',
    body4:
      'La baisse d’œstrogènes peut entraîner une sécheresse vaginale, parfois source d’inconfort ou de douleurs pendant les rapports. Le désir peut aussi évoluer, à la hausse comme à la baisse, selon les femmes.',
    tip2Title: 'Bon à savoir',
    tip2Text:
      'Des solutions simples existent (lubrifiants, hydratants vaginaux, traitements locaux) : en parler à un professionnel de santé permet de trouver une réponse adaptée, sans tabou.',
    h5: '5. Poids et métabolisme',
    body5:
      'Le métabolisme peut ralentir légèrement pendant cette période, et la répartition des graisses a tendance à se déplacer vers l’abdomen. Ces changements sont courants et ne dépendent pas uniquement de la volonté.',
    h6: '6. Idées reçues sur la ménopause',
    myths: [
      'La ménopause « arrive d’un coup » — en réalité, elle est précédée de plusieurs années de transition (périménopause)',
      'Tous les symptômes sont sévères pour tout le monde — leur intensité varie énormément d’une femme à l’autre',
      'Rien ne peut être fait — de nombreuses solutions, hormonales ou non, existent pour soulager les symptômes gênants',
      'La vie intime s’arrête — elle évolue, mais reste tout à fait possible et épanouissante avec les bons ajustements',
    ],
    h7: '7. Symptômes normaux et signaux à surveiller',
    body7:
      'La grande majorité des changements décrits ici sont des manifestations normales de la transition. Certains signes méritent en revanche une consultation plus rapide.',
    alert2Title: 'Consulter si',
    alert2Text:
      'Saignements après la ménopause confirmée, douleurs pelviennes inhabituelles, symptômes qui perturbent fortement le quotidien, ou tout doute persistant.',
    h8: '8. Conseils pratiques au quotidien',
    dailyHabits: [
      'Une alimentation riche en calcium et fibres',
      'Une activité physique régulière',
      'Une routine de sommeil stable',
      'Des moments de détente au quotidien',
    ],
    h9: '9. À retenir',
    tip3Title: 'Bon à savoir',
    tip3Text:
      'La périménopause et la ménopause sont des étapes naturelles, pas une maladie. De nombreuses solutions existent pour traverser cette transition avec plus de confort : un professionnel de santé reste la meilleure ressource pour les adapter à ta situation.',
    shareMessage: 'Comprendre la transition ménopausique — AWA',
  },
  en: {
    badge: 'PERIMENOPAUSE & MENOPAUSE',
    title: 'Understanding the menopause transition',
    metaDuration: '10 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro:
      'What changes gradually, years before periods stop, and how to approach this stage with more clarity.',
    contentsTitle: 'In this article',
    topics: [
      'Perimenopause and menopause: definitions',
      'Increasingly irregular cycles',
      'Sleep and mood',
      'Intimacy and vaginal dryness',
      'Weight and metabolism',
      'Common myths about menopause',
      'Normal symptoms and signs to watch for',
      'Practical everyday tips',
      'Key takeaways',
    ],
    h1: '1. Perimenopause and menopause: definitions',
    body1a:
      'Perimenopause refers to the hormonal transition period that precedes menopause: it can begin several years earlier, generally from your forties onward, with estrogen levels fluctuating irregularly.',
    body1b:
      'Menopause, on the other hand, is a specific point in time: it is confirmed after 12 consecutive months without a period, with no other cause. In France, it occurs on average around age 51, though this age naturally varies from woman to woman.',
    tip1Title: 'Good to know',
    tip1Text:
      'Every woman experiences this transition differently, both in duration and in the intensity of symptoms. Talking about it openly helps you anticipate it better.',
    h2: '2. Increasingly irregular cycles',
    body2:
      'One of the first signs of perimenopause is often a change in cycle rhythm: cycles may become shorter, longer, more spaced out, or have a different flow from one month to the next.',
    alert1Title: 'Please note',
    alert1Text:
      'Very heavy bleeding, bleeding that occurs very close together, or bleeding that happens after a year without a period calls for medical advice, as these are not considered typical signs of the transition.',
    h3: '3. Sleep and mood',
    body3a:
      'The decline and fluctuations in estrogen and progesterone can disrupt sleep (falling asleep, waking during the night) and may be accompanied by irritability, anxiety, or unusual mood swings.',
    body3b:
      'These changes have a real biological explanation: they reflect neither a lack of willpower nor an isolated psychological problem.',
    h4: '4. Intimacy and vaginal dryness',
    body4:
      'The decline in estrogen can lead to vaginal dryness, sometimes causing discomfort or pain during intercourse. Desire can also change, either increasing or decreasing, depending on the woman.',
    tip2Title: 'Good to know',
    tip2Text:
      'Simple solutions exist (lubricants, vaginal moisturizers, local treatments): talking to a healthcare professional can help you find the right solution, without taboo.',
    h5: '5. Weight and metabolism',
    body5:
      'Metabolism can slow down slightly during this period, and fat distribution tends to shift toward the abdomen. These changes are common and do not depend solely on willpower.',
    h6: '6. Common myths about menopause',
    myths: [
      'Menopause "happens all at once" — in reality, it is preceded by several years of transition (perimenopause)',
      'All symptoms are severe for everyone — their intensity varies enormously from woman to woman',
      'Nothing can be done — many solutions, hormonal or not, exist to relieve bothersome symptoms',
      'Intimate life comes to an end — it changes, but remains entirely possible and fulfilling with the right adjustments',
    ],
    h7: '7. Normal symptoms and signs to watch for',
    body7:
      'The vast majority of the changes described here are normal manifestations of the transition. However, certain signs warrant prompt medical attention.',
    alert2Title: 'See a doctor if',
    alert2Text:
      'Bleeding after confirmed menopause, unusual pelvic pain, symptoms that significantly disrupt daily life, or any persistent doubt.',
    h8: '8. Practical everyday tips',
    dailyHabits: [
      'A diet rich in calcium and fiber',
      'Regular physical activity',
      'A stable sleep routine',
      'Daily moments of relaxation',
    ],
    h9: '9. Key takeaways',
    tip3Title: 'Good to know',
    tip3Text:
      'Perimenopause and menopause are natural stages, not an illness. Many solutions exist to help you go through this transition more comfortably: a healthcare professional remains the best resource to adapt them to your situation.',
    shareMessage: 'Understanding the menopause transition — AWA',
  },
  es: {
    badge: 'PERIMENOPAUSIA Y MENOPAUSIA',
    title: 'Entender la transición menopáusica',
    metaDuration: '10 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro:
      'Lo que cambia progresivamente, años antes de que cesen las reglas, y cómo abordar esta etapa con más claridad.',
    contentsTitle: 'En este artículo',
    topics: [
      'Perimenopausia y menopausia: las definiciones',
      'Ciclos cada vez más irregulares',
      'Sueño y estado de ánimo',
      'Vida íntima y sequedad vaginal',
      'Peso y metabolismo',
      'Ideas falsas sobre la menopausia',
      'Síntomas normales y señales a vigilar',
      'Consejos prácticos para el día a día',
      'Para recordar',
    ],
    h1: '1. Perimenopausia y menopausia: las definiciones',
    body1a:
      'La perimenopausia designa el periodo de transición hormonal que precede a la menopausia: puede empezar varios años antes, generalmente a partir de los cuarenta, con niveles de estrógenos que fluctúan de forma irregular.',
    body1b:
      'La menopausia, por su parte, es un momento preciso: se confirma después de 12 meses consecutivos sin regla, en ausencia de otra causa. En Francia, ocurre de media alrededor de los 51 años, aunque esta edad varía naturalmente de una mujer a otra.',
    tip1Title: 'DATO ÚTIL',
    tip1Text:
      'Cada mujer vive esta transición de forma diferente, tanto en duración como en intensidad de los síntomas. Hablar de ello abiertamente ayuda a anticiparla mejor.',
    h2: '2. Ciclos cada vez más irregulares',
    body2:
      'Una de las primeras señales de la perimenopausia suele ser un cambio en el ritmo de los ciclos: pueden volverse más cortos, más largos, más espaciados, o con un flujo diferente de un mes a otro.',
    alert1Title: 'A tener en cuenta',
    alert1Text:
      'Un sangrado muy abundante, muy seguido, o que ocurre después de un año sin regla, justifica un aviso médico, ya que no se consideran señales habituales de la transición.',
    h3: '3. Sueño y estado de ánimo',
    body3a:
      'La disminución y las fluctuaciones de estrógenos y progesterona pueden alterar el sueño (dificultad para dormirse, despertares nocturnos) y acompañarse de irritabilidad, ansiedad o cambios de humor inusuales.',
    body3b:
      'Estos cambios tienen una explicación biológica real: no reflejan ni una falta de voluntad ni un problema psicológico aislado.',
    h4: '4. Vida íntima y sequedad vaginal',
    body4:
      'La disminución de estrógenos puede provocar sequedad vaginal, a veces fuente de incomodidad o dolor durante las relaciones. El deseo también puede evolucionar, al alza o a la baja, según la mujer.',
    tip2Title: 'DATO ÚTIL',
    tip2Text:
      'Existen soluciones sencillas (lubricantes, hidratantes vaginales, tratamientos locales): hablarlo con un profesional de la salud permite encontrar una respuesta adecuada, sin tabúes.',
    h5: '5. Peso y metabolismo',
    body5:
      'El metabolismo puede ralentizarse ligeramente durante este periodo, y la distribución de la grasa tiende a desplazarse hacia el abdomen. Estos cambios son frecuentes y no dependen únicamente de la voluntad.',
    h6: '6. Ideas falsas sobre la menopausia',
    myths: [
      'La menopausia «llega de golpe» — en realidad, está precedida de varios años de transición (perimenopausia)',
      'Todos los síntomas son graves para todo el mundo — su intensidad varía enormemente de una mujer a otra',
      'No se puede hacer nada — existen numerosas soluciones, hormonales o no, para aliviar los síntomas molestos',
      'La vida íntima se detiene — evoluciona, pero sigue siendo totalmente posible y satisfactoria con los ajustes adecuados',
    ],
    h7: '7. Síntomas normales y señales a vigilar',
    body7:
      'La gran mayoría de los cambios descritos aquí son manifestaciones normales de la transición. Sin embargo, algunas señales merecen una consulta más rápida.',
    alert2Title: 'Consultar si',
    alert2Text:
      'Sangrado después de una menopausia confirmada, dolor pélvico inusual, síntomas que alteran fuertemente el día a día, o cualquier duda persistente.',
    h8: '8. Consejos prácticos para el día a día',
    dailyHabits: [
      'Una alimentación rica en calcio y fibra',
      'Una actividad física regular',
      'Una rutina de sueño estable',
      'Momentos de relajación en el día a día',
    ],
    h9: '9. Para recordar',
    tip3Title: 'DATO ÚTIL',
    tip3Text:
      'La perimenopausia y la menopausia son etapas naturales, no una enfermedad. Existen numerosas soluciones para atravesar esta transición con más comodidad: un profesional de la salud sigue siendo el mejor recurso para adaptarlas a tu situación.',
    shareMessage: 'Entender la transición menopáusica — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MenopauseTransitionArticleScreen({
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

          <Text style={styles.h2}>
            {content.h1}
          </Text>

          <Text style={styles.body}>
            {content.body1a}
          </Text>

          <Text style={styles.body}>
            {content.body1b}
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

          <Text style={styles.h2}>{content.h2}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alert1Title}</Text>
              <Text style={styles.tipText}>
                {content.alert1Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>{content.h3}</Text>

          <Text style={styles.body}>
            {content.body3a}
          </Text>

          <Text style={styles.body}>
            {content.body3b}
          </Text>

          <Text style={styles.h2}>{content.h4}</Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

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

          <Text style={styles.h2}>{content.h5}</Text>

          <Text style={styles.body}>
            {content.body5}
          </Text>

          <Text style={styles.h2}>{content.h6}</Text>

          <View style={styles.checkList}>
            {content.myths.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            {content.h7}
          </Text>

          <Text style={styles.body}>
            {content.body7}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alert2Title}</Text>
              <Text style={styles.tipText}>
                {content.alert2Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>{content.h8}</Text>

          <View style={styles.daily}>
            {DAILY_HABIT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.dailyHabits[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>{content.h9}</Text>

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

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
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
    color: theme.colors.textSecondary,
    fontWeight: '500',
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
  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
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
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  });
}
