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
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';

const ID = 'firstperiod-choisir-protection';

const HERO = require('../../assets/images/library/featured-flow.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const OPTION_IMAGES = [
  require('../../assets/images/first-period-pad.png'),
  require('../../assets/images/flux7.png'),
  require('../../assets/images/flux6.png'),
] as const;

const RELATED_IMAGES = [
  {
    image: require('../../assets/images/library/rules-hero.png'),
    articleId: 'flow-comprendre-flux',
  },
  {
    image: require('../../assets/images/library/rules-hero.png'),
    articleId: 'firstperiod-gerer-quotidien',
  },
  {
    image: CYCLE_PHASES_HERO,
    articleId: 'firstperiod-premieres-regles',
  },
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Quelle protection choisir\npour mes premières règles ?',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Il existe plusieurs façons de se protéger pendant les règles. Aucune n’est meilleure qu’une autre : le confort personnel guide le choix.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les différentes protections',
      'Comment choisir selon son confort',
      'Comment changer sa protection',
    ],
    body1: 'Pour les premières règles, la serviette hygiénique est généralement la protection la plus simple à utiliser, car elle se place directement dans la culotte. Les culottes menstruelles et les tampons sont d’autres options, à essayer plus tard si l’on s’en sent l’envie.',
    options: [
      {
        title: 'Serviettes hygiéniques',
        text: 'Faciles à utiliser, elles se placent dans la culotte et se changent régulièrement.',
      },
      {
        title: 'Culottes menstruelles',
        text: 'Une culotte absorbante et lavable, confortable pour un usage quotidien.',
      },
      {
        title: 'Tampons',
        text: 'S’insèrent à l’intérieur ; leur usage se choisit avec le temps et à son rythme.',
      },
    ],
    body2: 'Il n’y a pas de bonne ou de mauvaise protection : chacune convient différemment selon le corps, les habitudes et le niveau d’aisance de chacune. Les tampons, par exemple, s’insèrent à l’intérieur et demandent un peu plus de familiarité avec son corps — rien n’oblige à les utiliser dès les premières règles.',
    tipTitle: 'Bon à savoir',
    tipText: 'Tester différentes protections au fil du temps permet de trouver celle qui convient le mieux, sans pression.',
    body3: 'Une protection se change en moyenne toutes les 4 à 6 heures, davantage les jours de flux plus abondant. La changer régulièrement permet de rester à l’aise et de préserver l’hygiène intime.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Comprendre ton flux menstruel', meta: '7 min  ·  Guide'},
      {title: 'Comment gérer ses premières règles au quotidien ?', meta: '5 min  ·  Guide'},
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
    ],
    shareMessage: 'Quelle protection choisir pour mes premières règles ? — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'Which protection should I choose\nfor my first period?',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'There are several ways to protect yourself during your period. None is better than another — personal comfort is what guides the choice.',
    contentsTitle: 'In this article',
    topics: [
      'The different types of protection',
      'How to choose based on your comfort',
      'How to change your protection',
    ],
    body1: 'For your first period, a pad is usually the simplest protection to use, since it goes directly into your underwear. Period underwear and tampons are other options you can try later, whenever you feel like it.',
    options: [
      {
        title: 'Pads',
        text: 'Easy to use, they go in your underwear and are changed regularly.',
      },
      {
        title: 'Period underwear',
        text: 'Absorbent, washable underwear that’s comfortable for everyday use.',
      },
      {
        title: 'Tampons',
        text: 'Inserted inside the body; whether and when to use them is up to you, at your own pace.',
      },
    ],
    body2: 'There’s no right or wrong protection: each one suits different bodies, habits, and comfort levels. Tampons, for example, are inserted inside the body and call for a bit more familiarity with it — nothing says you have to use them from your very first period.',
    tipTitle: 'Good to know',
    tipText: 'Trying different types of protection over time helps you find the one that suits you best, with no pressure.',
    body3: 'On average, protection should be changed every 4 to 6 hours, more often on heavier-flow days. Changing it regularly helps you stay comfortable and keep up good intimate hygiene.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Understanding your menstrual flow', meta: '7 min  ·  Guide'},
      {title: 'How to manage your first period day to day?', meta: '5 min  ·  Guide'},
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
    ],
    shareMessage: 'Which protection should I choose for my first period? — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: '¿Qué protección elegir para\nmi primera menstruación?',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Existen varias formas de protegerte durante la menstruación. Ninguna es mejor que otra: la comodidad personal es lo que guía la elección.',
    contentsTitle: 'En este artículo',
    topics: [
      'Los distintos tipos de protección',
      'Cómo elegir según tu comodidad',
      'Cómo cambiar tu protección',
    ],
    body1: 'Para la primera menstruación, la compresa suele ser la protección más sencilla de usar, ya que se coloca directamente en la ropa interior. Las bragas menstruales y los tampones son otras opciones que puedes probar más adelante, si te apetece.',
    options: [
      {
        title: 'Compresas',
        text: 'Fáciles de usar, se colocan en la ropa interior y se cambian con regularidad.',
      },
      {
        title: 'Bragas menstruales',
        text: 'Una braga absorbente y lavable, cómoda para el uso diario.',
      },
      {
        title: 'Tampones',
        text: 'Se insertan por dentro; su uso se elige con el tiempo y a tu propio ritmo.',
      },
    ],
    body2: 'No existe una protección buena ni una mala: cada una se adapta de forma diferente según el cuerpo, los hábitos y el nivel de comodidad de cada persona. Los tampones, por ejemplo, se insertan por dentro y requieren algo más de familiaridad con tu cuerpo; nada te obliga a usarlos desde tu primera menstruación.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'Probar distintas protecciones con el tiempo te permite encontrar la que mejor te conviene, sin ninguna presión.',
    body3: 'Una protección se cambia, en promedio, cada 4 a 6 horas, con más frecuencia los días de flujo más abundante. Cambiarla con regularidad te ayuda a sentirte cómoda y a mantener una buena higiene íntima.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Comprende tu flujo menstrual', meta: '7 min  ·  Guía'},
      {title: '¿Cómo gestionar tu primera menstruación en el día a día?', meta: '5 min  ·  Guía'},
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
    ],
    shareMessage: '¿Qué protección elegir para mi primera menstruación? — AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'Quale protezione scegliere\nper il primo ciclo?',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Esistono diversi modi per proteggerti durante il ciclo. Nessuno è migliore di un altro: a guidare la scelta è il comfort personale.',
    contentsTitle: 'In questo articolo',
    topics: [
      'I diversi tipi di protezione',
      'Come scegliere in base al tuo comfort',
      'Come cambiare la protezione',
    ],
    body1: 'Per il primo ciclo, l’assorbente esterno è di solito la protezione più semplice da usare, perché si applica direttamente sulla biancheria intima. Le mutandine mestruali e i tamponi sono altre opzioni che puoi provare più avanti, quando ne avrai voglia.',
    options: [
      {
        title: 'Assorbenti',
        text: 'Facili da usare, si applicano sulla biancheria intima e si cambiano regolarmente.',
      },
      {
        title: 'Mutandine mestruali',
        text: 'Biancheria assorbente e lavabile, comoda per l’uso di tutti i giorni.',
      },
      {
        title: 'Tamponi',
        text: 'Si inseriscono all’interno del corpo; se e quando usarli dipende da te, con i tuoi tempi.',
      },
    ],
    body2: 'Non esiste una protezione giusta o sbagliata: ognuna si adatta a corpi, abitudini e livelli di comfort diversi. I tamponi, per esempio, si inseriscono all’interno del corpo e richiedono un po’ più di familiarità con esso: nulla dice che tu debba usarli già dal primo ciclo.',
    tipTitle: 'Da sapere',
    tipText: 'Provare nel tempo diversi tipi di protezione ti aiuta a trovare quella più adatta a te, senza alcuna pressione.',
    body3: 'In media, la protezione va cambiata ogni 4-6 ore, più spesso nei giorni di flusso più abbondante. Cambiarla regolarmente ti aiuta a stare comoda e a mantenere una buona igiene intima.',
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'Capire il tuo flusso mestruale',
        meta: '7 min  ·  Guida',
      },
      {
        title: 'Come gestire il primo ciclo giorno per giorno?',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Il tuo primo ciclo: cosa aspettarti',
        meta: '5 min  ·  Guida',
      },
    ],
    shareMessage: 'Quale protezione scegliere per il primo ciclo? — AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetim için\nhangi ürünü seçmeliyim?',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adet döneminde kendini korumanın birkaç yolu var. Hiçbiri diğerinden daha iyi değil; seçimi kişisel konforun belirler.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Farklı koruma ürünleri',
      'Konforuna göre nasıl seçersin',
      'Koruma ürününü nasıl değiştirirsin',
    ],
    body1: 'İlk adetinde ped genellikle kullanması en kolay üründür, çünkü doğrudan iç çamaşırına yerleştirilir. Adet külotu ve tampon ise canın istediğinde daha sonra deneyebileceğin diğer seçeneklerdir.',
    options: [
      {
        title: 'Ped',
        text: 'Kullanımı kolaydır, iç çamaşırına yerleştirilir ve düzenli aralıklarla değiştirilir.',
      },
      {
        title: 'Adet külotu',
        text: 'Emici, yıkanabilir ve günlük kullanımda rahat bir iç çamaşırıdır.',
      },
      {
        title: 'Tampon',
        text: 'Vücudun içine yerleştirilir; kullanıp kullanmayacağın ve ne zaman kullanacağın kendi hızında, sana kalmış.',
      },
    ],
    body2: 'Doğru ya da yanlış bir koruma ürünü yoktur: her biri farklı bedenlere, alışkanlıklara ve konfor düzeylerine uyar. Örneğin tamponlar vücudun içine yerleştirilir ve vücudunu biraz daha tanımayı gerektirir; ilk adetinden itibaren kullanman gerektiği anlamına gelmez.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Zaman içinde farklı koruma ürünlerini denemek, kendine en uygun olanı baskı hissetmeden bulmana yardımcı olur.',
    body3: 'Ortalama olarak koruma ürünü her 4 ila 6 saatte bir değiştirilmelidir; kanamanın yoğun olduğu günlerde daha sık değiştirmen gerekebilir. Düzenli değiştirmek, rahat etmene ve genital hijyeni iyi korumana yardımcı olur.',
    relatedTitle: '♥  Bunlar da ilgini çekebilir',
    related: [
      {
        title: 'Adet kanamanı anlamak',
        meta: '7 dk  ·  Rehber',
      },
      {
        title: 'İlk adetini günlük hayatında nasıl yönetirsin?',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'İlk adetin: neler beklemelisin',
        meta: '5 dk  ·  Rehber',
      },
    ],
    shareMessage: 'İlk adetim için hangi ürünü seçmeliyim? — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodProtectionArticleScreen({
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

          {content.options.map((option, index) => (
            <View key={option.title} style={styles.visualCard}>
              <Image
                source={OPTION_IMAGES[index]}
                resizeMode="cover"
                style={styles.visualImage}
              />

              <View style={styles.visualCopy}>
                <Text style={styles.visualTitle}>{option.title}</Text>
                <Text style={styles.visualText}>{option.text}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

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
              <Text style={styles.tipTitle}>{content.tipTitle}</Text>
              <Text style={styles.tipText}>
                {content.tipText}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>
        </View>

        <View style={styles.relatedHeader}>
          <Text style={styles.relatedTitle}>{content.relatedTitle}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {RELATED_IMAGES.map((item, index) => (
            <Pressable
              key={item.articleId + index}
              onPress={() =>
                navigation.push('ArticleReader', {articleId: item.articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={resolveEditorialImage(item.image, lang)}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <Text numberOfLines={3} style={styles.relatedCardTitle}>
                  {content.related[index].title}
                </Text>
                <Text style={styles.relatedMeta}>
                  {content.related[index].meta}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.text},
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
  visualText: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16},
  relatedHeader: {
    marginTop: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedTitle: {color: theme.colors.text, fontSize: 16, fontWeight: '800'},
  relatedRow: {gap: 10, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 5},
  relatedCard: {
    width: 230,
    height: 105,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...theme.shadow,
  },
  relatedImage: {width: 80, height: '100%'},
  relatedCopy: {flex: 1, padding: 12},
  relatedCardTitle: {color: theme.colors.text, fontSize: 11.5, lineHeight: 15, fontWeight: '800'},
  relatedMeta: {marginTop: 9, color: theme.colors.textMuted, fontSize: 9.5},
  });
}
