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

const ID = 'flow-hygiene-intime';

const HERO = require('../../assets/images/library/flow-colors-hero.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const RELATED_IMAGES = [
  {
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
  {
    image: require('../../assets/images/library/rules-hero.png'),
    articleId: 'flow-comprendre-flux',
  },
  {
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'FLUX MENSTRUEL',
    title: 'Bien vivre son hygiène intime\npendant les règles',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Prendre soin de son intimité, c’est respecter son corps et son équilibre naturel.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi c’est important',
      'Les bons gestes',
      'À éviter',
      'Quand consulter',
      'Conseils pratiques',
    ],
    body: 'Pendant les règles, ton corps change et devient plus sensible. Adopter les bons gestes aide à prévenir les irritations, les infections et à rester à l’aise au quotidien.',
    goodPractices: [
      'Lave-toi doucement : un simple lavage à l’eau claire, de l’avant vers l’arrière, suffit pour préserver ta flore naturelle.',
      'Change régulièrement tes protections : toutes les 4 à 6 heures pour éviter l’humidité et les mauvaises odeurs.',
      'Privilégie le coton : les sous-vêtements en coton laissent la peau respirer et réduisent les risques d’irritation.',
    ],
    thingsToAvoid: [
      'Les savons agressifs et les produits parfumés',
      'Les douches vaginales qui perturbent la flore naturelle',
      'Garder une protection humide trop longtemps',
    ],
    consultReasons: [
      'Irritations, démangeaisons ou brûlures persistantes',
      'Odeur inhabituelle ou pertes différentes de ton habitude',
      'Douleurs importantes ou symptômes qui t’inquiètent',
    ],
    tipTitle: 'Conseil AWA',
    tipText: 'Ton corps possède déjà un mécanisme naturel d’équilibre. Un lavage doux suffit généralement.',
    takeawaysTitle: 'À retenir',
    takeaways: [
      'Lavage doux à l’eau claire',
      'Changer régulièrement',
      'Éviter les produits parfumés',
      'Privilégier le coton',
    ],
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Comprendre les douleurs menstruelles', meta: '7 min  ·  Guide'},
      {title: 'Choisir la protection adaptée à ton corps', meta: '5 min  ·  Guide'},
      {title: 'Comment soulager les crampes naturellement', meta: '6 min  ·  Guide'},
    ],
    shareTitle: 'Hygiène intime · AWA',
    shareMessage: 'Bien vivre son hygiène intime pendant les règles · AWA',
  },
  en: {
    badge: 'MENSTRUAL FLOW',
    title: 'Taking care of your intimate hygiene\nduring your period',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Caring for your intimate hygiene means respecting your body and its natural balance.',
    contentsTitle: 'In this article',
    topics: [
      'Why it matters',
      'Good habits',
      'What to avoid',
      'When to see a doctor',
      'Practical tips',
    ],
    body: 'During your period, your body changes and becomes more sensitive. Adopting the right habits helps prevent irritation and infection, and helps you stay comfortable day to day.',
    goodPractices: [
      'Wash gently: a simple rinse with clear water, from front to back, is enough to protect your natural flora.',
      'Change your protection regularly: every 4 to 6 hours to avoid moisture and unpleasant odors.',
      'Choose cotton: cotton underwear lets your skin breathe and reduces the risk of irritation.',
    ],
    thingsToAvoid: [
      'Harsh soaps and scented products',
      'Vaginal douches, which disrupt your natural flora',
      'Keeping a damp pad or tampon on for too long',
    ],
    consultReasons: [
      'Persistent irritation, itching, or burning',
      'Unusual odor or discharge that’s different from what’s normal for you',
      'Significant pain or symptoms that worry you',
    ],
    tipTitle: 'AWA tip',
    tipText: 'Your body already has a natural balancing mechanism. A gentle wash is usually enough.',
    takeawaysTitle: 'Key takeaways',
    takeaways: [
      'Gentle wash with clear water',
      'Change regularly',
      'Avoid scented products',
      'Choose cotton',
    ],
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Understanding menstrual pain', meta: '7 min  ·  Guide'},
      {title: 'Choosing the right protection for your body', meta: '5 min  ·  Guide'},
      {title: 'How to relieve cramps naturally', meta: '6 min  ·  Guide'},
    ],
    shareTitle: 'Intimate hygiene · AWA',
    shareMessage: 'Taking care of your intimate hygiene during your period · AWA',
  },
  es: {
    badge: 'FLUJO MENSTRUAL',
    title: 'Cuidar bien tu higiene íntima\ndurante el período',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Cuidar tu intimidad es respetar tu cuerpo y su equilibrio natural.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué es importante',
      'Las buenas prácticas',
      'Qué evitar',
      'Cuándo consultar',
      'Consejos prácticos',
    ],
    body: 'Durante el período, tu cuerpo cambia y se vuelve más sensible. Adoptar las buenas prácticas ayuda a prevenir irritaciones e infecciones, y te permite sentirte cómoda en tu día a día.',
    goodPractices: [
      'Lávate con suavidad: un simple lavado con agua limpia, de adelante hacia atrás, basta para preservar tu flora natural.',
      'Cambia tus protecciones con regularidad: cada 4 a 6 horas para evitar la humedad y los malos olores.',
      'Elige el algodón: la ropa interior de algodón deja que la piel respire y reduce el riesgo de irritación.',
    ],
    thingsToAvoid: [
      'Los jabones agresivos y los productos perfumados',
      'Las duchas vaginales, que alteran la flora natural',
      'Mantener una protección húmeda demasiado tiempo',
    ],
    consultReasons: [
      'Irritaciones, picor o ardor persistentes',
      'Olor inusual o flujo diferente de lo habitual en ti',
      'Dolores intensos o síntomas que te preocupan',
    ],
    tipTitle: 'Consejo AWA',
    tipText: 'Tu cuerpo ya cuenta con un mecanismo natural de equilibrio. Por lo general, un lavado suave es suficiente.',
    takeawaysTitle: 'Para recordar',
    takeaways: [
      'Lavado suave con agua limpia',
      'Cambiar con regularidad',
      'Evitar los productos perfumados',
      'Elegir el algodón',
    ],
    relatedTitle: '♥  También te puede interesar',
    related: [
      {title: 'Entender los dolores menstruales', meta: '7 min  ·  Guía'},
      {title: 'Elegir la protección adecuada para tu cuerpo', meta: '5 min  ·  Guía'},
      {title: 'Cómo aliviar los cólicos de forma natural', meta: '6 min  ·  Guía'},
    ],
    shareTitle: 'Higiene íntima · AWA',
    shareMessage: 'Cuidar bien tu higiene íntima durante el período · AWA',
  },
  it: {
    badge: 'FLUSSO MESTRUALE',
    title: 'Prenderti cura dell’igiene intima\ndurante il ciclo',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Prenderti cura della tua igiene intima significa rispettare il tuo corpo e il suo equilibrio naturale.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché è importante',
      'Buone abitudini',
      'Cosa evitare',
      'Quando rivolgersi al medico',
      'Consigli pratici',
    ],
    body: 'Durante il ciclo il tuo corpo cambia e diventa più sensibile. Adottare le giuste abitudini aiuta a prevenire irritazioni e infezioni e a stare comoda giorno dopo giorno.',
    goodPractices: [
      'Lavati con delicatezza: basta un semplice risciacquo con acqua pulita, dall’avanti all’indietro, per proteggere la tua flora naturale.',
      'Cambia la protezione regolarmente: ogni 4-6 ore per evitare umidità e cattivi odori.',
      'Scegli il cotone: la biancheria intima in cotone lascia respirare la pelle e riduce il rischio di irritazioni.',
    ],
    thingsToAvoid: [
      'Saponi aggressivi e prodotti profumati',
      'Lavande vaginali, che alterano la tua flora naturale',
      'Tenere troppo a lungo un assorbente o un tampone umido',
    ],
    consultReasons: [
      'Irritazione, prurito o bruciore persistenti',
      'Odore o perdite insoliti, diversi da quelli che per te sono normali',
      'Dolore importante o sintomi che ti preoccupano',
    ],
    tipTitle: 'Consiglio AWA',
    tipText: 'Il tuo corpo ha già un meccanismo naturale di equilibrio. Di solito basta un lavaggio delicato.',
    takeawaysTitle: 'Da ricordare',
    takeaways: [
      'Lavaggio delicato con acqua pulita',
      'Cambiare con regolarità',
      'Evitare i prodotti profumati',
      'Scegliere il cotone',
    ],
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'Capire il dolore mestruale',
        meta: '7 min  ·  Guida',
      },
      {
        title: 'Scegliere la protezione giusta per il tuo corpo',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Come alleviare i crampi in modo naturale',
        meta: '6 min  ·  Guida',
      },
    ],
    shareTitle: 'Igiene intima · AWA',
    shareMessage: 'Prenderti cura dell’igiene intima durante il ciclo · AWA',
  },
  tr: {
    badge: 'ADET KANAMASI',
    title: 'Adet döneminde intim hijyenine\ndikkat etmek',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'İntim hijyenine özen göstermek, bedenine ve doğal dengesine saygı göstermektir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Neden önemli?',
      'İyi alışkanlıklar',
      'Nelerden kaçınmalı?',
      'Ne zaman doktora gitmeli?',
      'Pratik ipuçları',
    ],
    body: 'Adet döneminde bedenin değişir ve daha hassas hale gelir. Doğru alışkanlıklar edinmek tahriş ve enfeksiyonu önlemeye yardımcı olur, günlük hayatta kendini rahat hissetmeni sağlar.',
    goodPractices: [
      'Nazikçe yıka: önden arkaya doğru, sade suyla basit bir durulama doğal florayı korumak için yeterlidir.',
      'Pedini düzenli değiştir: nemden ve hoş olmayan kokulardan kaçınmak için her 4 ila 6 saatte bir.',
      'Pamuklu olanı seç: pamuklu iç çamaşırı cildinin nefes almasını sağlar ve tahriş riskini azaltır.',
    ],
    thingsToAvoid: [
      'Sert sabunlar ve kokulu ürünler',
      'Doğal florayı bozan vajinal duşlar',
      'Islanmış bir pedi ya da tamponu çok uzun süre takılı tutmak',
    ],
    consultReasons: [
      'Geçmeyen tahriş, kaşıntı ya da yanma',
      'Normalinden farklı, alışılmadık koku ya da akıntı',
      'Belirgin ağrı ya da seni endişelendiren belirtiler',
    ],
    tipTitle: 'AWA ipucu',
    tipText: 'Bedeninin zaten doğal bir denge mekanizması var. Nazik bir yıkama genellikle yeterlidir.',
    takeawaysTitle: 'Akılda kalacaklar',
    takeaways: [
      'Sade suyla nazik yıkama',
      'Düzenli değiştirme',
      'Kokulu ürünlerden kaçınma',
      'Pamuklu olanı seçme',
    ],
    relatedTitle: '♥  Bunlar da ilgini çekebilir',
    related: [
      {
        title: 'Adet ağrısını anlamak',
        meta: '7 dk  ·  Rehber',
      },
      {
        title: 'Bedenine uygun adet ürününü seçmek',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'Kramplar doğal yollarla nasıl hafifletilir?',
        meta: '6 dk  ·  Rehber',
      },
    ],
    shareTitle: 'İntim hijyen · AWA',
    shareMessage: 'Adet döneminde intim hijyenine dikkat etmek · AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FlowMenstrualArticleScreen({
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
      title: content.shareTitle,
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
            {content.body}
          </Text>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <View style={styles.checkList}>
            {content.goodPractices.map(item => (
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <View style={styles.alertList}>
            {content.thingsToAvoid.map(item => (
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

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.checkList}>
            {content.consultReasons.map(item => (
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

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

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

          <Text style={styles.contentsTitle}>{content.takeawaysTitle}</Text>

          <View style={styles.checkList}>
            {content.takeaways.map(item => (
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
                source={item.image}
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
    contentsTitle: {
      marginTop: 24,
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
    checkList: {
      marginTop: 13,
      padding: 13,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    alertList: {
      marginTop: 13,
      padding: 13,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.12),
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 9,
    },
    checkText: {flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17},
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
