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

const ID = 'firstperiod-comment-savoir';

const HERO = require('../../assets/images/library/flow-colors-hero.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const OBSERVE_IMAGES = [
  require('../../assets/images/library/flow-texture-mucus.png'),
  require('../../assets/images/library/spm-woman.png'),
  require('../../assets/images/library/pain-massage.png'),
] as const;

const RELATED_IMAGES = [
  {
    image: require('../../assets/images/library/spm-hero.png'),
    articleId: 'firstperiod-premiers-signes',
  },
  {
    image: require('../../assets/images/library/featured-flow.png'),
    articleId: 'firstperiod-choisir-protection',
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
    title: 'Comment savoir si mes\npremières règles arrivent ?',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Quelques signes concrets t’aident à repérer que tes premières règles approchent vraiment.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les signes à observer',
      'Premières pertes : à quoi ressemblent-elles ?',
      'Pertes vaginales ou sang menstruel ?',
      'Quand en parler à un adulte ?',
    ],
    observe: [
      {title: 'Pertes blanchâtres', text: 'De légères pertes claires apparaissent souvent quelques mois avant.'},
      {title: 'Poitrine qui se développe', text: 'Un signe fréquent, apparu généralement bien avant les règles.'},
      {title: 'Tiraillements au ventre', text: 'De petites sensations peuvent annoncer l’arrivée prochaine des règles.'},
    ],
    body2: 'Avant l’arrivée des toutes premières règles, il est fréquent de remarquer de légères pertes blanchâtres ou légèrement jaunâtres dans les sous-vêtements. C’est un phénomène normal, lié à l’activité hormonale qui se met en place.',
    body3: 'Les pertes vaginales sont claires ou blanchâtres, sans odeur marquée. Le sang menstruel, lui, a une couleur rouge à brunâtre et marque le vrai début des règles. Si un doute persiste, ce n’est jamais grave d’en parler.',
    tipTitle: 'Bon à savoir',
    tipText: 'Il n’existe pas de moyen de prédire le jour exact. Garder une protection avec toi dès les premiers signes reste la meilleure habitude.',
    body4: 'Dès que tu observes ces signes, ou dès que tu as une question ou une inquiétude, tu peux en parler à ta mère, une sœur, une proche ou un professionnel de santé de confiance. Il n’y a jamais de mauvais moment pour demander de l’aide.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Les premiers signes avant les règles', meta: '5 min  ·  Article'},
      {title: 'Quelle protection choisir pour mes premières règles ?', meta: '6 min  ·  Guide'},
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
    ],
    shareMessage: 'Comment savoir si mes premières règles arrivent ? — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'How can I tell if my\nfirst period is coming?',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'A few concrete signs can help you recognize that your first period is really on its way.',
    contentsTitle: 'In this article',
    topics: [
      'Signs to watch for',
      'First discharge: what does it look like?',
      'Vaginal discharge or menstrual blood?',
      'When should you talk to an adult?',
    ],
    observe: [
      {title: 'Whitish discharge', text: 'Light, clear discharge often appears a few months beforehand.'},
      {title: 'Breast development', text: 'A common sign that usually appears well before your period.'},
      {title: 'Mild tummy twinges', text: 'Small sensations like these can signal that your period is coming soon.'},
    ],
    body2: 'Before your very first period arrives, it’s common to notice light whitish or slightly yellowish discharge in your underwear. This is a normal phenomenon, linked to the hormonal activity getting underway in your body.',
    body3: 'Vaginal discharge is clear or whitish, without a strong smell. Menstrual blood, on the other hand, is red to brownish in color and marks the true start of your period. If you’re ever unsure, it’s never a big deal to talk about it.',
    tipTitle: 'Good to know',
    tipText: 'There’s no way to predict the exact day. Keeping protection with you from the very first signs is the best habit to have.',
    body4: 'As soon as you notice these signs, or whenever you have a question or a worry, you can talk to your mother, a sister, someone close to you, or a healthcare professional you trust. There’s never a wrong time to ask for help.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'The first signs before your period', meta: '5 min  ·  Article'},
      {title: 'Which protection should I choose for my first period?', meta: '6 min  ·  Guide'},
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
    ],
    shareMessage: 'How can I tell if my first period is coming? — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: '¿Cómo saber si se acerca\nmi primera menstruación?',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Algunas señales concretas te ayudan a reconocer que tu primera menstruación realmente se acerca.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las señales que debes observar',
      'Primeras secreciones: ¿cómo son?',
      '¿Secreción vaginal o sangre menstrual?',
      '¿Cuándo hablar de ello con una persona adulta?',
    ],
    observe: [
      {title: 'Secreción blanquecina', text: 'Suele aparecer una secreción clara y ligera unos meses antes.'},
      {title: 'Desarrollo del pecho', text: 'Una señal frecuente, que suele aparecer mucho antes de la menstruación.'},
      {title: 'Tirones en el vientre', text: 'Pequeñas sensaciones que pueden anunciar la llegada próxima de la menstruación.'},
    ],
    body2: 'Antes de la llegada de la primera menstruación, es frecuente notar una ligera secreción blanquecina o algo amarillenta en la ropa interior. Es un fenómeno normal, relacionado con la actividad hormonal que se está poniendo en marcha.',
    body3: 'La secreción vaginal es clara o blanquecina, sin un olor marcado. La sangre menstrual, en cambio, tiene un color rojo a marrón y marca el verdadero comienzo de la menstruación. Si persiste alguna duda, nunca está de más hablar de ello.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'No existe ninguna forma de predecir el día exacto. Llevar protección contigo desde las primeras señales sigue siendo el mejor hábito.',
    body4: 'En cuanto observes estas señales, o en cuanto tengas una pregunta o una preocupación, puedes hablar de ello con tu madre, una hermana, alguien cercano o un profesional de la salud de confianza. Nunca hay un mal momento para pedir ayuda.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Las primeras señales antes de la menstruación', meta: '5 min  ·  Artículo'},
      {title: '¿Qué protección elegir para mi primera menstruación?', meta: '6 min  ·  Guía'},
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
    ],
    shareMessage: '¿Cómo saber si se acerca mi primera menstruación? — AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'Come capire se sta per\narrivare il mio primo ciclo?',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Alcuni segnali concreti possono aiutarti a riconoscere che il tuo primo ciclo sta davvero per arrivare.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Segnali da osservare',
      'Prime perdite: che aspetto hanno?',
      'Perdite vaginali o sangue mestruale?',
      'Quando parlarne con un adulto?',
    ],
    observe: [
      {
        title: 'Perdite biancastre',
        text: 'Perdite leggere e trasparenti compaiono spesso qualche mese prima.',
      },
      {
        title: 'Sviluppo del seno',
        text: 'Un segnale comune che di solito compare ben prima del ciclo.',
      },
      {
        title: 'Lievi fitte alla pancia',
        text: 'Piccole sensazioni come queste possono indicare che il ciclo sta per arrivare.',
      },
    ],
    body2: 'Prima che arrivi il tuo primissimo ciclo, è comune notare nelle mutandine perdite leggere biancastre o leggermente giallastre. È un fenomeno normale, legato all’attività ormonale che si sta avviando nel tuo corpo.',
    body3: 'Le perdite vaginali sono trasparenti o biancastre, senza odore forte. Il sangue mestruale, invece, è di colore da rosso a brunastro e segna il vero inizio del tuo ciclo. Se hai dei dubbi, parlarne non è mai un problema.',
    tipTitle: 'Da sapere',
    tipText: 'Non c’è modo di prevedere il giorno esatto. Tenere con te un assorbente fin dai primi segnali è la migliore abitudine da avere.',
    body4: 'Non appena noti questi segnali, o ogni volta che hai una domanda o una preoccupazione, puoi parlarne con tua madre, una sorella, una persona a te vicina o un professionista sanitario di cui ti fidi. Non c’è mai un momento sbagliato per chiedere aiuto.',
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'I primi segnali prima del ciclo',
        meta: '5 min  ·  Articolo',
      },
      {
        title: 'Quale protezione scegliere per il mio primo ciclo?',
        meta: '6 min  ·  Guida',
      },
      {
        title: 'Il tuo primo ciclo: cosa aspettarti',
        meta: '5 min  ·  Guida',
      },
    ],
    shareMessage: 'Come capire se sta per arrivare il mio primo ciclo? — AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetimin geldiğini\nnasıl anlarım?',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Birkaç somut işaret, ilk adetinin gerçekten yaklaştığını fark etmene yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Dikkat edilecek işaretler',
      'İlk akıntı: nasıl görünür?',
      'Vajinal akıntı mı, adet kanı mı?',
      'Ne zaman bir yetişkinle konuşmalı?',
    ],
    observe: [
      {
        title: 'Beyazımsı akıntı',
        text: 'Hafif, berrak akıntı çoğu zaman birkaç ay önceden görülmeye başlar.',
      },
      {
        title: 'Göğüs gelişimi',
        text: 'Genellikle adetinden epey önce ortaya çıkan yaygın bir işarettir.',
      },
      {
        title: 'Hafif karın sızıları',
        text: 'Bunun gibi küçük hisler, adetinin yakında geleceğinin işareti olabilir.',
      },
    ],
    body2: 'İlk adetin gelmeden önce iç çamaşırında hafif beyazımsı ya da hafif sarımsı bir akıntı fark etmen yaygındır. Bu, vücudunda başlayan hormonal etkinliğe bağlı normal bir durumdur.',
    body3: 'Vajinal akıntı berrak ya da beyazımsıdır ve keskin kokusu yoktur. Adet kanı ise kırmızıdan kahverengiye doğru bir renktedir ve adetinin gerçek başlangıcını işaret eder. Emin olamadığın bir şey olursa bunu konuşmak hiçbir zaman sorun olmaz.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Tam günü önceden tahmin etmenin bir yolu yoktur. İlk işaretlerden itibaren yanında koruma bulundurmak, edinebileceğin en iyi alışkanlıktır.',
    body4: 'Bu işaretleri fark ettiğin anda ya da aklına bir soru veya endişe geldiğinde annenle, bir kız kardeşinle, yakınındaki biriyle veya güvendiğin bir sağlık profesyoneliyle konuşabilirsin. Yardım istemek için yanlış bir zaman yoktur.',
    relatedTitle: '♥  Bunlar da ilgini çekebilir',
    related: [
      {
        title: 'Adetinden önceki ilk işaretler',
        meta: '5 dk  ·  Makale',
      },
      {
        title: 'İlk adetim için hangi korumayı seçmeliyim?',
        meta: '6 dk  ·  Rehber',
      },
      {
        title: 'İlk adetin: neler beklemeli',
        meta: '5 dk  ·  Rehber',
      },
    ],
    shareMessage: 'İlk adetimin geldiğini nasıl anlarım? — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodComingArticleScreen({
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

          {OBSERVE_IMAGES.map((image, index) => (
            <View key={content.observe[index].title} style={styles.visualCard}>
              <Image source={image} resizeMode="cover" style={styles.visualImage} />

              <View style={styles.visualCopy}>
                <Text style={styles.visualTitle}>{content.observe[index].title}</Text>
                <Text style={styles.visualText}>{content.observe[index].text}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <Image
            source={require('../../assets/images/library/rules-process.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

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

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>
            {content.body4}
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
                <Text style={styles.relatedMeta}>{content.related[index].meta}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
  wideImage: {width: '100%', height: 120, marginTop: 14, borderRadius: 12},
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
