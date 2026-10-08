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

const ID = 'pain-gerer-douleurs';

const HERO = require('../../assets/images/library/pain-hero.png');

// Images/icons stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these assets.
const SOL_IMAGES = [
  require('../../assets/images/library/pain-heat.png'),
  require('../../assets/images/library/pain-movement.png'),
  require('../../assets/images/library/pain-food.png'),
  require('../../assets/images/library/pain-water.png'),
  require('../../assets/images/library/pain-massage.png'),
] as const;

const DAILY_ICONS = [
  'weather-sunny',
  'food-apple-outline',
  'sleep',
  'calendar-heart',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'DOULEURS',
    title: 'Gérer les douleurs\nmenstruelles',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Chaleur, mouvement doux, alimentation : des gestes qui soulagent vraiment.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre les douleurs menstruelles',
      'Les solutions naturelles efficaces',
      'Quand faut-il consulter ?',
      'Conseils pratiques au quotidien',
    ],
    section1Text: 'Les crampes viennent des contractions utérines qui aident à évacuer la muqueuse. Elles sont dues aux prostaglandines. Chaque corps réagit différemment.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Les douleurs peuvent varier d’un cycle à l’autre et ne sont pas toujours identiques.',
    solutions: [
      {title: 'Chaleur', text: 'Une bouillotte sur le bas-ventre peut détendre les muscles.'},
      {title: 'Mouvement doux', text: 'Yoga, étirements et marche légère soulagent les tensions.'},
      {title: 'Alimentation', text: 'Magnésium, oméga-3 et aliments anti-inflammatoires.'},
      {title: 'Hydratation', text: 'Boire suffisamment aide à limiter les ballonnements.'},
      {title: 'Massage', text: 'Un massage circulaire du bas-ventre détend.'},
    ],
    section3Text: 'Si les douleurs t’empêchent de vivre normalement chaque mois malgré ces solutions, il est important d’en parler à un professionnel de santé.',
    alertTitle: 'Consulter si',
    alertText: 'Douleurs très intenses, saignements importants, fatigue extrême ou symptômes anormaux.',
    dailyTips: [
      'Échauffe doucement ton corps au réveil',
      'Privilégie une alimentation équilibrée',
      'Prends le temps de respirer et te détendre',
      'Suis ton cycle pour mieux comprendre tes douleurs',
    ],
    shareMessage: 'Gérer les douleurs menstruelles — AWA',
  },
  en: {
    badge: 'PAIN',
    title: 'Managing period\npain',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Heat, gentle movement, diet: habits that really bring relief.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding period pain',
      'Effective natural solutions',
      'When should you see a doctor?',
      'Practical everyday tips',
    ],
    section1Text: 'Cramps come from uterine contractions that help shed the uterine lining. They’re caused by prostaglandins. Every body reacts differently.',
    tip1Title: 'Good to know',
    tip1Text: 'Pain can vary from one cycle to the next and isn’t always the same.',
    solutions: [
      {title: 'Heat', text: 'A hot water bottle on your lower abdomen can relax the muscles.'},
      {title: 'Gentle movement', text: 'Yoga, stretching, and light walking relieve tension.'},
      {title: 'Diet', text: 'Magnesium, omega-3s, and anti-inflammatory foods.'},
      {title: 'Hydration', text: 'Drinking enough water helps limit bloating.'},
      {title: 'Massage', text: 'A circular massage on your lower abdomen helps you relax.'},
    ],
    section3Text: 'If the pain keeps you from living normally every month despite these solutions, it’s important to talk to a healthcare professional.',
    alertTitle: 'See a doctor if',
    alertText: 'Very intense pain, heavy bleeding, extreme fatigue, or abnormal symptoms.',
    dailyTips: [
      'Gently warm up your body when you wake up',
      'Favor a balanced diet',
      'Take time to breathe and relax',
      'Track your cycle to better understand your pain',
    ],
    shareMessage: 'Managing period pain — AWA',
  },
  es: {
    badge: 'DOLORES',
    title: 'Manejar los dolores\nmenstruales',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Calor, movimiento suave, alimentación: gestos que realmente alivian.',
    contentsTitle: 'En este artículo',
    topics: [
      'Entender los dolores menstruales',
      'Soluciones naturales eficaces',
      '¿Cuándo hay que consultar?',
      'Consejos prácticos para el día a día',
    ],
    section1Text: 'Los cólicos provienen de las contracciones uterinas que ayudan a expulsar el revestimiento uterino. Se deben a las prostaglandinas. Cada cuerpo reacciona de forma diferente.',
    tip1Title: 'Dato útil',
    tip1Text: 'Los dolores pueden variar de un ciclo a otro y no son siempre iguales.',
    solutions: [
      {title: 'Calor', text: 'Una bolsa de agua caliente en la parte baja del abdomen puede relajar los músculos.'},
      {title: 'Movimiento suave', text: 'El yoga, los estiramientos y caminar suavemente alivian las tensiones.'},
      {title: 'Alimentación', text: 'Magnesio, omega-3 y alimentos antiinflamatorios.'},
      {title: 'Hidratación', text: 'Beber suficiente agua ayuda a limitar la hinchazón.'},
      {title: 'Masaje', text: 'Un masaje circular en la parte baja del abdomen ayuda a relajar.'},
    ],
    section3Text: 'Si los dolores te impiden llevar una vida normal cada mes a pesar de estas soluciones, es importante hablar de ello con un profesional de la salud.',
    alertTitle: 'Consulta si',
    alertText: 'Dolores muy intensos, sangrado abundante, fatiga extrema o síntomas anormales.',
    dailyTips: [
      'Calienta suavemente tu cuerpo al despertar',
      'Opta por una alimentación equilibrada',
      'Tómate tiempo para respirar y relajarte',
      'Haz seguimiento de tu ciclo para entender mejor tus dolores',
    ],
    shareMessage: 'Manejar los dolores menstruales — AWA',
  },
  it: {
    badge: 'DOLORE',
    title: 'Gestire il dolore\nmestruale',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Calore, movimento dolce, alimentazione: abitudini che portano davvero sollievo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Capire il dolore mestruale',
      'Rimedi naturali efficaci',
      'Quando rivolgersi al medico?',
      'Consigli pratici per ogni giorno',
    ],
    section1Text: 'I crampi derivano dalle contrazioni dell’utero che aiutano a eliminare il rivestimento uterino. Sono causati dalle prostaglandine. Ogni corpo reagisce in modo diverso.',
    tip1Title: 'Da sapere',
    tip1Text: 'Il dolore può variare da un ciclo all’altro e non è sempre uguale.',
    solutions: [
      {
        title: 'Calore',
        text: 'Una borsa dell’acqua calda sul basso ventre può rilassare i muscoli.',
      },
      {
        title: 'Movimento dolce',
        text: 'Yoga, stretching e camminate leggere alleviano la tensione.',
      },
      {
        title: 'Alimentazione',
        text: 'Magnesio, omega-3 e alimenti antinfiammatori.',
      },
      {
        title: 'Idratazione',
        text: 'Bere abbastanza acqua aiuta a limitare il gonfiore.',
      },
      {
        title: 'Massaggio',
        text: 'Un massaggio circolare sul basso ventre ti aiuta a rilassarti.',
      },
    ],
    section3Text: 'Se, nonostante questi rimedi, il dolore ti impedisce ogni mese di vivere normalmente, è importante parlarne con un operatore sanitario.',
    alertTitle: 'Rivolgiti a un medico se',
    alertText: 'Dolore molto intenso, sanguinamento abbondante, stanchezza estrema o sintomi anomali.',
    dailyTips: [
      'Scalda dolcemente il corpo al risveglio',
      'Privilegia un’alimentazione equilibrata',
      'Prenditi del tempo per respirare e rilassarti',
      'Monitora il tuo ciclo per capire meglio il tuo dolore',
    ],
    shareMessage: 'Gestire il dolore mestruale — AWA',
  },
} as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function PeriodPainArticleScreen({
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
        ]}>
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
                accessibilityLabel={t('library.screen.addBookmark')}
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

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              [
                'book-open-page-variant-outline',
                content.metaType,
              ],
              ['chart-bar', content.metaLevel],
              [
                'shield-check-outline',
                content.metaValidated,
              ],
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

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
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

          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.section1Text}
          </Text>

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

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.solutions}>
            {content.solutions.map(({title, text}, index) => (
              <View
                key={title}
                style={styles.solution}>
                <Image
                  source={SOL_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.solImage}
                />

                <Text style={styles.solTitle}>
                  {title}
                </Text>

                <Text style={styles.solText}>
                  {text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.section3Text}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.alertTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.alertText}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            4. {content.topics[3]}
          </Text>

          <View style={styles.daily}>
            {content.dailyTips.map((text, index) => (
              <View
                key={text}
                style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={DAILY_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>
                  {text}
                </Text>
              </View>
            ))}
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
    fontSize: 25,
    lineHeight: 32,
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
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
    fontWeight: '600',
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
    minHeight: 38,
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
    fontSize: 13,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 22,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 14.5,
    lineHeight: 22,
    color: theme.colors.text,
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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

  solutions: {
    gap: 8,
    paddingTop: 13,
    paddingBottom: 3,
  },

  solution: {
    width: 132,
    minHeight: 215,
    padding: 9,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  solImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },

  solTitle: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  solText: {
    marginTop: 6,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

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
    backgroundColor: theme.colors.primarySoft,
  },

  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  });
}