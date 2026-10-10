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

const ID = 'conceptiontips-hygiene-de-vie';

const HERO = require('../../assets/images/library/spm-yoga.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const SUPPORTIVE_HABITS_ICONS = [
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
    badge: 'MODE DE VIE',
    title: 'Mode de vie et\nparcours de conception',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Des habitudes simples qui peuvent accompagner ton parcours, sans pression.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Ce qui peut soutenir la fertilité',
      'Le stress, un facteur à ne pas négliger',
      'Ce qu’il vaut mieux limiter',
      'À retenir',
    ],
    body1: 'Certaines habitudes de vie simples peuvent accompagner un parcours de conception, sans garantir de résultat à elles seules.',
    supportiveHabits: [
      'Une alimentation équilibrée',
      'Une activité physique modérée',
      'Un sommeil de qualité',
      'Des moments de détente',
    ],
    body2: 'Le stress chronique peut influencer l’équilibre hormonal et, chez certaines femmes, la régularité du cycle. Se préserver des moments de calme fait pleinement partie du parcours.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Vouloir « tout bien faire » peut lui-même devenir une source de stress : viser des habitudes globalement saines suffit, sans perfectionnisme.',
    toLimit: [
      'Le tabac, qui peut affecter la fertilité des deux partenaires',
      'Une consommation excessive d’alcool',
      'Un entraînement sportif intense et prolongé, qui peut à l’inverse freiner la fertilité',
      'Le sucre raffiné en excès, qui peut perturber l’équilibre hormonal',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Des habitudes globalement équilibrées, sans excès ni perfectionnisme, sont le meilleur accompagnement au quotidien.',
    shareMessage: 'Mode de vie et parcours de conception — AWA',
  },
  en: {
    badge: 'LIFESTYLE',
    title: 'Lifestyle habits and\nyour conception journey',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Simple habits that can support your journey — no pressure.',
    contentsTitle: 'In this article',
    topics: [
      'What can support fertility',
      'Stress, a factor not to overlook',
      'What’s best to limit',
      'Key takeaway',
    ],
    body1: 'Some simple lifestyle habits can support a conception journey, though they can’t guarantee a result on their own.',
    supportiveHabits: [
      'A balanced diet',
      'Moderate physical activity',
      'Quality sleep',
      'Moments of relaxation',
    ],
    body2: 'Chronic stress can affect hormonal balance and, in some women, cycle regularity. Giving yourself moments of calm is fully part of the journey.',
    tip1Title: 'Good to know',
    tip1Text: 'Wanting to “do everything right” can itself become a source of stress: aiming for generally healthy habits is enough, without perfectionism.',
    toLimit: [
      'Smoking, which may affect fertility in both partners',
      'Excessive alcohol consumption',
      'Intense, prolonged athletic training, which may conversely slow fertility',
      'Excess refined sugar, which may disrupt hormonal balance',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Generally balanced habits, without excess or perfectionism, are the best everyday support.',
    shareMessage: 'Lifestyle habits and conception journey — AWA',
  },
  es: {
    badge: 'ESTILO DE VIDA',
    title: 'Estilo de vida y\ntu camino hacia la concepción',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Hábitos sencillos que pueden acompañar tu camino, sin presión.',
    contentsTitle: 'En este artículo',
    topics: [
      'Lo que puede favorecer la fertilidad',
      'El estrés, un factor que no hay que descuidar',
      'Lo que es mejor limitar',
      'Para recordar',
    ],
    body1: 'Algunos hábitos de vida sencillos pueden acompañar un camino hacia la concepción, aunque no garantizan un resultado por sí solos.',
    supportiveHabits: [
      'Una alimentación equilibrada',
      'Una actividad física moderada',
      'Un sueño de calidad',
      'Momentos de relajación',
    ],
    body2: 'El estrés crónico puede influir en el equilibrio hormonal y, en algunas mujeres, en la regularidad del ciclo. Reservarte momentos de calma forma plenamente parte del camino.',
    tip1Title: 'Dato útil',
    tip1Text: 'Querer «hacerlo todo bien» puede convertirse en sí mismo en una fuente de estrés: basta con apuntar a hábitos globalmente saludables, sin perfeccionismo.',
    toLimit: [
      'El tabaco, que puede afectar la fertilidad de ambos miembros de la pareja',
      'Un consumo excesivo de alcohol',
      'Un entrenamiento deportivo intenso y prolongado, que por el contrario puede frenar la fertilidad',
      'El azúcar refinado en exceso, que puede alterar el equilibrio hormonal',
    ],
    tip2Title: 'Dato útil',
    tip2Text: 'Unos hábitos globalmente equilibrados, sin excesos ni perfeccionismo, son el mejor acompañamiento en el día a día.',
    shareMessage: 'Estilo de vida y camino hacia la concepción — AWA',
  },
  it: {
    badge: 'STILE DI VITA',
    title: 'Abitudini di vita e\nil tuo percorso verso il concepimento',
    metaDuration: '5 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Semplici abitudini che possono sostenere il tuo percorso, senza alcuna pressione.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Cosa può sostenere la fertilità',
      'Lo stress, un fattore da non trascurare',
      'Cosa è meglio limitare',
      'Il punto chiave',
    ],
    body1: 'Alcune semplici abitudini di vita possono sostenere un percorso verso il concepimento, anche se da sole non possono garantire un risultato.',
    supportiveHabits: [
      'Un’alimentazione equilibrata',
      'Un’attività fisica moderata',
      'Un sonno di qualità',
      'Momenti di relax',
    ],
    body2: 'Lo stress cronico può influire sull’equilibrio ormonale e, in alcune donne, sulla regolarità del ciclo. Concederti momenti di calma fa pienamente parte del percorso.',
    tip1Title: 'Da sapere',
    tip1Text: 'Voler «fare tutto bene» può diventare a sua volta una fonte di stress: basta puntare ad abitudini sane in generale, senza perfezionismo.',
    toLimit: [
      'Il fumo, che può influire sulla fertilità di entrambi i partner',
      'Il consumo eccessivo di alcol',
      'Un allenamento sportivo intenso e prolungato, che al contrario può rallentare la fertilità',
      'L’eccesso di zuccheri raffinati, che può alterare l’equilibrio ormonale',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'Abitudini nel complesso equilibrate, senza eccessi né perfezionismo, sono il miglior sostegno quotidiano.',
    shareMessage: 'Abitudini di vita e percorso verso il concepimento — AWA',
  },
  tr: {
    badge: 'YAŞAM TARZI',
    title: 'Yaşam alışkanlıkları ve\nhamile kalma yolculuğun',
    metaDuration: '5 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Yolculuğuna destek olabilecek basit alışkanlıklar — hiçbir baskı olmadan.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Doğurganlığı neler destekleyebilir',
      'Stres, göz ardı edilmemesi gereken bir etken',
      'Neleri sınırlamak daha iyi',
      'Önemli nokta',
    ],
    body1: 'Bazı basit yaşam alışkanlıkları hamile kalma yolculuğuna destek olabilir, ancak tek başlarına bir sonucu garanti edemez.',
    supportiveHabits: [
      'Dengeli beslenme',
      'Ölçülü fiziksel aktivite',
      'Kaliteli uyku',
      'Rahatlama anları',
    ],
    body2: 'Kronik stres hormonal dengeyi ve bazı kadınlarda döngü düzenini etkileyebilir. Kendine sakin anlar tanımak yolculuğun tam da bir parçasıdır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: '“Her şeyi doğru yapmak” istemek de başlı başına bir stres kaynağı olabilir: genel olarak sağlıklı alışkanlıkları hedeflemek yeterlidir, mükemmeliyetçiliğe gerek yok.',
    toLimit: [
      'Her iki partnerde de doğurganlığı etkileyebilen sigara',
      'Aşırı alkol tüketimi',
      'Doğurganlığı tam tersine yavaşlatabilen yoğun ve uzun süreli sporcu antrenmanı',
      'Hormonal dengeyi bozabilen aşırı rafine şeker',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Aşırıya kaçmayan ve mükemmeliyetçilikten uzak, genel olarak dengeli alışkanlıklar günlük hayatta en iyi destektir.',
    shareMessage: 'Yaşam alışkanlıkları ve hamile kalma yolculuğu — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ConceptionLifestyleArticleScreen({
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

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <View style={styles.daily}>
            {content.supportiveHabits.map((label, index) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={SUPPORTIVE_HABITS_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.body2}
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <View style={styles.checkList}>
            {content.toLimit.map(item => (
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

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

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
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
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
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  });
}
