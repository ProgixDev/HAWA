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

const ID = 'ovulation-comprendre-ovulation';

const HERO = require('../../assets/images/library/spm-stress.png');

const ART = {
  mucus: require('../../assets/images/library/flow-texture-mucus.png'),
};

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'OVULATION',
    title: 'Comprendre\nl’ovulation',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Le moment clé de ton cycle, et comment le repérer.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que l’ovulation ?',
      'Les signes qui peuvent l’accompagner',
      'Repérer son propre rythme',
      'À retenir',
    ],
    body1:
      'L’ovulation correspond à la libération d’un ovule par l’un des ovaires. Elle survient généralement environ 14 jours avant les règles suivantes, quelle que soit la durée totale du cycle.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'C’est la date des prochaines règles qui varie d’une femme à l’autre, bien plus que le délai entre l’ovulation et leur arrivée.',
    body2:
      'Certains signes physiques peuvent accompagner l’approche de l’ovulation, à des degrés variables selon les femmes.',
    visualTitle: 'Une glaire plus fluide',
    visualText:
      'À l’approche de l’ovulation, la glaire cervicale devient plus claire, filante et élastique.',
    otherSigns: [
      'Une légère douleur d’un côté du bas-ventre (« mittelschmerz »)',
      'Une sensibilité des seins',
      'Une légère hausse de la température basale après l’ovulation',
      'Un regain d’énergie chez certaines femmes',
    ],
    body3:
      'Observer ces signes sur plusieurs cycles aide à mieux connaître ton propre rythme, qui peut différer des moyennes générales.',
    alertTitle: 'À noter',
    alertText:
      'Un cycle sans ovulation peut arriver occasionnellement, sans que cela soit systématiquement préoccupant. En cas d’absence prolongée de règles ou de doute, un avis médical est recommandé.',
    tip2Title: 'Bon à savoir',
    tip2Text:
      'Aucun signe isolé n’est parfaitement fiable à lui seul : les combiner donne une meilleure idée de ton moment le plus fertile.',
    shareMessage: 'Comprendre l’ovulation — AWA',
  },
  en: {
    badge: 'OVULATION',
    title: 'Understanding\novulation',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The key moment of your cycle, and how to recognize it.',
    contentsTitle: 'In this article',
    topics: [
      'What is ovulation?',
      'The signs that may come with it',
      'Recognizing your own rhythm',
      'Key takeaways',
    ],
    body1:
      'Ovulation is the release of an egg by one of the ovaries. It usually occurs about 14 days before your next period, regardless of your cycle’s total length.',
    tip1Title: 'Good to know',
    tip1Text:
      'It’s the date of your next period that varies from woman to woman, much more than the time between ovulation and its arrival.',
    body2:
      'Certain physical signs may accompany the approach of ovulation, to varying degrees depending on the woman.',
    visualTitle: 'More fluid cervical mucus',
    visualText:
      'As ovulation approaches, cervical mucus becomes clearer, stretchier, and more elastic.',
    otherSigns: [
      'Mild pain on one side of the lower abdomen ("mittelschmerz")',
      'Breast tenderness',
      'A slight rise in basal body temperature after ovulation',
      'A boost of energy in some women',
    ],
    body3:
      'Observing these signs over several cycles helps you get to know your own rhythm, which can differ from general averages.',
    alertTitle: 'Please note',
    alertText:
      'A cycle without ovulation can occasionally happen, without this necessarily being a cause for concern. If your period is absent for a long time or you’re unsure, medical advice is recommended.',
    tip2Title: 'Good to know',
    tip2Text:
      'No single sign is perfectly reliable on its own: combining them gives a better idea of your most fertile time.',
    shareMessage: 'Understanding ovulation — AWA',
  },
  es: {
    badge: 'OVULACIÓN',
    title: 'Comprender\nla ovulación',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'El momento clave de tu ciclo, y cómo detectarlo.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la ovulación?',
      'Las señales que pueden acompañarla',
      'Identificar tu propio ritmo',
      'Para recordar',
    ],
    body1:
      'La ovulación corresponde a la liberación de un óvulo por uno de los ovarios. Suele ocurrir unos 14 días antes de la siguiente regla, sea cual sea la duración total del ciclo.',
    tip1Title: 'Dato útil',
    tip1Text:
      'Es la fecha de la siguiente regla la que varía de una mujer a otra, mucho más que el tiempo entre la ovulación y su llegada.',
    body2:
      'Algunas señales físicas pueden acompañar la proximidad de la ovulación, en grados variables según cada mujer.',
    visualTitle: 'Un moco más fluido',
    visualText:
      'Cerca de la ovulación, el moco cervical se vuelve más claro, filante y elástico.',
    otherSigns: [
      'Un ligero dolor en un lado del bajo vientre («mittelschmerz»)',
      'Sensibilidad en los senos',
      'Una ligera subida de la temperatura basal después de la ovulación',
      'Un aumento de energía en algunas mujeres',
    ],
    body3:
      'Observar estas señales durante varios ciclos ayuda a conocer mejor tu propio ritmo, que puede diferir de los promedios generales.',
    alertTitle: 'A tener en cuenta',
    alertText:
      'Un ciclo sin ovulación puede ocurrir ocasionalmente, sin que eso sea sistemáticamente preocupante. Si la regla falta durante mucho tiempo o tienes dudas, se recomienda una opinión médica.',
    tip2Title: 'Dato útil',
    tip2Text:
      'Ninguna señal aislada es perfectamente fiable por sí sola: combinarlas da una mejor idea de tu momento más fértil.',
    shareMessage: 'Comprender la ovulación — AWA',
  },
  it: {
    badge: 'OVULAZIONE',
    title: 'Capire\nl’ovulazione',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Il momento chiave del tuo ciclo e come riconoscerlo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è l’ovulazione?',
      'I segni che possono accompagnarla',
      'Riconoscere il tuo ritmo',
      'Punti chiave',
    ],
    body1: 'L’ovulazione è il rilascio di un ovulo da parte di una delle ovaie. Di solito avviene circa 14 giorni prima del tuo prossimo periodo mestruale, indipendentemente dalla durata totale del tuo ciclo.',
    tip1Title: 'Da sapere',
    tip1Text: 'È la data del prossimo periodo mestruale a variare da donna a donna, molto più del tempo che passa tra l’ovulazione e il suo arrivo.',
    body2: 'Alcuni segni fisici possono accompagnare l’avvicinarsi dell’ovulazione, in misura diversa a seconda della donna.',
    visualTitle: 'Muco cervicale più fluido',
    visualText: 'Con l’avvicinarsi dell’ovulazione, il muco cervicale diventa più trasparente, più filante e più elastico.',
    otherSigns: [
      'Lieve dolore su un lato del basso ventre («mittelschmerz»)',
      'Tensione al seno',
      'Un leggero aumento della temperatura basale dopo l’ovulazione',
      'Una spinta di energia in alcune donne',
    ],
    body3: 'Osservare questi segni nel corso di più cicli ti aiuta a conoscere il tuo ritmo, che può differire dalle medie generali.',
    alertTitle: 'Attenzione',
    alertText: 'Un ciclo senza ovulazione può verificarsi occasionalmente, senza che questo sia necessariamente motivo di preoccupazione. Se il periodo mestruale è assente per molto tempo o hai dei dubbi, è consigliato un parere medico.',
    tip2Title: 'Da sapere',
    tip2Text: 'Nessun segno è perfettamente affidabile da solo: combinarli permette di farsi un’idea migliore del tuo periodo più fertile.',
    shareMessage: 'Capire l’ovulazione — AWA',
  },
  tr: {
    badge: 'YUMURTLAMA',
    title: 'Yumurtlamayı\nanlamak',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Döngünün en önemli anı ve onu nasıl fark edebileceğin.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Yumurtlama nedir?',
      'Yumurtlamaya eşlik edebilecek belirtiler',
      'Kendi ritmini tanımak',
      'Akılda tutulacaklar',
    ],
    body1: 'Yumurtlama, yumurtalıklardan birinin bir yumurta hücresi salmasıdır. Döngünün toplam uzunluğundan bağımsız olarak genellikle bir sonraki adetinden yaklaşık 14 gün önce gerçekleşir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Kadından kadına değişen, yumurtlama ile adetin gelişi arasındaki süreden çok bir sonraki adet tarihidir.',
    body2: 'Bazı bedensel belirtiler, kadından kadına değişen ölçüde yumurtlamanın yaklaştığına eşlik edebilir.',
    visualTitle: 'Daha akışkan servikal mukus',
    visualText: 'Yumurtlama yaklaştıkça servikal mukus daha berrak, daha uzayabilen ve daha elastik hâle gelir.',
    otherSigns: [
      'Alt karnın bir tarafında hafif ağrı (“mittelschmerz”)',
      'Memelerde hassasiyet',
      'Yumurtlamadan sonra bazal vücut sıcaklığında hafif bir artış',
      'Bazı kadınlarda enerji artışı',
    ],
    body3: 'Bu belirtileri birkaç döngü boyunca gözlemlemek, genel ortalamalardan farklı olabilen kendi ritmini tanımana yardımcı olur.',
    alertTitle: 'Dikkat',
    alertText: 'Yumurtlamanın olmadığı bir döngü ara sıra yaşanabilir; bu mutlaka endişe verici olmak zorunda değildir. Adetin uzun süre gelmezse ya da emin değilsen tıbbi görüş almanı öneririz.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Hiçbir belirti tek başına tamamen güvenilir değildir: belirtileri bir arada değerlendirmek, en doğurgan zamanın hakkında daha iyi bir fikir verir.',
    shareMessage: 'Yumurtlamayı anlamak — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function OvulationArticleScreen({
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

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.mucus}
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

          <View style={styles.checkList}>
            {content.otherSigns.map(item => (
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

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>
              <Text style={styles.tipText}>
                {content.alertText}
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
              <Text style={styles.tipTitle}>{content.tip2Title}</Text>
              <Text style={styles.tipText}>
                {content.tip2Text}
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
  checkText: {flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17},
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
