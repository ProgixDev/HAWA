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
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import ReadingControls from '../../components/articles/ReadingControls';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';

const ARTICLE_ID = 'cycle-phases-expliquees';

const HERO = CYCLE_PHASES_HERO;
const DIAGRAM = require('../../assets/images/library/cycle-phases-diagram.png');

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const BODY_CHANGES_ICONS = [
  {icon: 'water-outline'},
  {icon: 'leaf'},
  {icon: 'white-balance-sunny'},
  {icon: 'weather-night'},
] as const;

const WHY_ITEMS_ICONS = [
  {icon: 'heart-pulse'},
  {icon: 'calendar-check-outline'},
  {icon: 'emoticon-happy-outline'},
  {icon: 'lightning-bolt'},
  {icon: 'notebook-edit-outline'},
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'Cycle menstruel',
    title: 'Les différentes phases\ndu cycle expliquées',
    metaDuration: '6 min de lecture',
    metaValidated: 'Contenu validé',
    intro: 'Ton cycle menstruel se compose de plusieurs phases, chacune ayant un rôle essentiel dans ton équilibre hormonal et ta santé.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les 4 phases du cycle',
      'Comment ton corps change',
      'Pourquoi comprendre ton cycle est important',
      'Questions fréquentes',
    ],
    body1: 'Ton cycle est généralement divisé en quatre phases principales. Leur durée peut varier d’une personne à l’autre : chaque corps possède son propre rythme.',
    diagram: {
      menstrual: {name: 'Phase menstruelle', days: 'Jours 1 à 5'},
      follicular: {name: 'Phase folliculaire', days: 'Jours 1 à 13'},
      luteal: {name: 'Phase lutéale', days: 'Jours 15 à 28'},
      ovulatory: {name: 'Phase ovulatoire', days: 'Autour du jour 14'},
    },
    tip1Title: 'Bon à savoir',
    tip1Text: 'Chaque femme est unique : observe ton corps et apprends à connaître ton propre rythme.',
    body2: 'Les variations hormonales peuvent influencer ton énergie, ton humeur, ton sommeil et certaines sensations physiques tout au long du cycle.',
    bodyChanges: [
      {title: 'Pendant les règles', text: 'Ton énergie peut être plus basse et ton corps peut avoir besoin de davantage de repos.'},
      {title: 'Phase folliculaire', text: 'L’énergie remonte progressivement et tu peux te sentir plus dynamique.'},
      {title: 'Autour de l’ovulation', text: 'Certaines femmes ressentent davantage d’énergie, de motivation et de confiance.'},
      {title: 'Phase lutéale', text: 'La fatigue, les ballonnements ou les variations d’humeur peuvent apparaître.'},
    ],
    softTipTitle: 'Écoute ton corps',
    softTipText: 'Il n’existe pas une seule façon de vivre chaque phase. Tes sensations personnelles restent le meilleur repère.',
    body3: 'Mieux connaître ton cycle peut t’aider à anticiper certaines périodes et à comprendre les changements que tu observes dans ton quotidien.',
    whyItems: [
      'Mieux comprendre les signaux de ton corps',
      'Anticiper tes règles et tes différentes phases',
      'Comprendre certaines variations d’humeur',
      'Adapter ton activité selon ton niveau d’énergie',
      'Améliorer ton suivi quotidien',
    ],
    body4: 'Voici quelques réponses aux questions souvent posées sur les différentes phases du cycle.',
    faq: [
      {
        question: 'Est-ce normal que mon cycle ne dure pas exactement 28 jours ?',
        answer: 'Oui. La durée d’un cycle peut varier d’une personne à l’autre et même légèrement d’un mois à l’autre.',
      },
      {
        question: 'L’ovulation a-t-elle toujours lieu au jour 14 ?',
        answer: 'Non. Le jour 14 est une estimation courante pour un cycle de 28 jours, mais l’ovulation peut survenir plus tôt ou plus tard.',
      },
      {
        question: 'Pourquoi mes symptômes changent-ils selon les phases ?',
        answer: 'Les variations hormonales au cours du cycle peuvent influencer l’énergie, l’humeur, le sommeil et certaines sensations physiques.',
      },
      {
        question: 'Est-ce utile de suivre mes symptômes ?',
        answer: 'Oui. Les noter régulièrement peut t’aider à reconnaître tes propres tendances et à mieux comprendre ton rythme.',
      },
    ],
    endTitle: 'Ton cycle, ton rythme',
    endText: 'Plus tu observes ton cycle, plus tu peux comprendre ce qui est habituel pour toi.',
    shareMessage: 'Les différentes phases du cycle expliquées — AWA',
  },
  en: {
    badge: 'Menstrual cycle',
    title: 'The different phases\nof the cycle explained',
    metaDuration: '6 min read',
    metaValidated: 'Reviewed content',
    intro: 'Your menstrual cycle is made up of several phases, each playing an essential role in your hormonal balance and your health.',
    contentsTitle: 'In this article',
    topics: [
      'The 4 phases of the cycle',
      'How your body changes',
      'Why understanding your cycle matters',
      'Frequently asked questions',
    ],
    body1: 'Your cycle is generally divided into four main phases. Their length can vary from person to person: every body has its own rhythm.',
    diagram: {
      menstrual: {name: 'Menstrual phase', days: 'Days 1 to 5'},
      follicular: {name: 'Follicular phase', days: 'Days 1 to 13'},
      luteal: {name: 'Luteal phase', days: 'Days 15 to 28'},
      ovulatory: {name: 'Ovulatory phase', days: 'Around day 14'},
    },
    tip1Title: 'Good to know',
    tip1Text: 'Every woman is unique: observe your body and learn your own rhythm.',
    body2: 'Hormonal changes can influence your energy, mood, sleep, and certain physical sensations throughout the cycle.',
    bodyChanges: [
      {title: 'During your period', text: 'Your energy may be lower and your body may need more rest.'},
      {title: 'Follicular phase', text: 'Energy gradually rises and you may feel more energized.'},
      {title: 'Around ovulation', text: 'Some women feel more energy, motivation, and confidence.'},
      {title: 'Luteal phase', text: 'Fatigue, bloating, or mood changes may appear.'},
    ],
    softTipTitle: 'Listen to your body',
    softTipText: 'There isn’t just one way to experience each phase. Your own sensations remain the best guide.',
    body3: 'Getting to know your cycle better can help you anticipate certain periods and understand the changes you notice day to day.',
    whyItems: [
      'Better understand your body’s signals',
      'Anticipate your period and its different phases',
      'Understand certain mood changes',
      'Adjust your activity to your energy level',
      'Improve your daily tracking',
    ],
    body4: 'Here are a few answers to questions commonly asked about the different phases of the cycle.',
    faq: [
      {
        question: 'Is it normal that my cycle doesn’t last exactly 28 days?',
        answer: 'Yes. The length of a cycle can vary from person to person, and even slightly from month to month.',
      },
      {
        question: 'Does ovulation always happen on day 14?',
        answer: 'No. Day 14 is a common estimate for a 28-day cycle, but ovulation can happen earlier or later.',
      },
      {
        question: 'Why do my symptoms change depending on the phase?',
        answer: 'Hormonal changes throughout the cycle can influence energy, mood, sleep, and certain physical sensations.',
      },
      {
        question: 'Is it useful to track my symptoms?',
        answer: 'Yes. Noting them regularly can help you recognize your own patterns and better understand your rhythm.',
      },
    ],
    endTitle: 'Your cycle, your rhythm',
    endText: 'The more you observe your cycle, the more you can understand what’s typical for you.',
    shareMessage: 'The different phases of the cycle explained — AWA',
  },
  es: {
    badge: 'Ciclo menstrual',
    title: 'Las diferentes fases\ndel ciclo explicadas',
    metaDuration: '6 min de lectura',
    metaValidated: 'Contenido validado',
    intro: 'Tu ciclo menstrual se compone de varias fases, cada una con un papel esencial en tu equilibrio hormonal y tu salud.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las 4 fases del ciclo',
      'Cómo cambia tu cuerpo',
      'Por qué es importante entender tu ciclo',
      'Preguntas frecuentes',
    ],
    body1: 'Tu ciclo generalmente se divide en cuatro fases principales. Su duración puede variar de una persona a otra: cada cuerpo tiene su propio ritmo.',
    diagram: {
      menstrual: {name: 'Fase menstrual', days: 'Días 1 a 5'},
      follicular: {name: 'Fase folicular', days: 'Días 1 a 13'},
      luteal: {name: 'Fase lútea', days: 'Días 15 a 28'},
      ovulatory: {name: 'Fase ovulatoria', days: 'Alrededor del día 14'},
    },
    tip1Title: 'Dato útil',
    tip1Text: 'Cada mujer es única: observa tu cuerpo y aprende a conocer tu propio ritmo.',
    body2: 'Las variaciones hormonales pueden influir en tu energía, tu estado de ánimo, tu sueño y ciertas sensaciones físicas a lo largo del ciclo.',
    bodyChanges: [
      {title: 'Durante el período', text: 'Tu energía puede ser más baja y tu cuerpo puede necesitar más descanso.'},
      {title: 'Fase folicular', text: 'La energía sube progresivamente y puedes sentirte más activa.'},
      {title: 'Alrededor de la ovulación', text: 'Algunas mujeres sienten más energía, motivación y confianza.'},
      {title: 'Fase lútea', text: 'Pueden aparecer fatiga, hinchazón o cambios en el estado de ánimo.'},
    ],
    softTipTitle: 'Escucha a tu cuerpo',
    softTipText: 'No existe una única forma de vivir cada fase. Tus propias sensaciones siguen siendo la mejor referencia.',
    body3: 'Conocer mejor tu ciclo puede ayudarte a anticipar ciertos momentos y a entender los cambios que observas en tu día a día.',
    whyItems: [
      'Entender mejor las señales de tu cuerpo',
      'Anticipar tu período y sus diferentes fases',
      'Entender ciertos cambios en el estado de ánimo',
      'Adaptar tu actividad según tu nivel de energía',
      'Mejorar tu seguimiento diario',
    ],
    body4: 'Aquí tienes algunas respuestas a las preguntas que se hacen con frecuencia sobre las diferentes fases del ciclo.',
    faq: [
      {
        question: '¿Es normal que mi ciclo no dure exactamente 28 días?',
        answer: 'Sí. La duración de un ciclo puede variar de una persona a otra, e incluso ligeramente de un mes a otro.',
      },
      {
        question: '¿La ovulación siempre ocurre en el día 14?',
        answer: 'No. El día 14 es una estimación habitual para un ciclo de 28 días, pero la ovulación puede ocurrir antes o después.',
      },
      {
        question: '¿Por qué cambian mis síntomas según la fase?',
        answer: 'Las variaciones hormonales a lo largo del ciclo pueden influir en la energía, el estado de ánimo, el sueño y ciertas sensaciones físicas.',
      },
      {
        question: '¿Es útil hacer seguimiento de mis síntomas?',
        answer: 'Sí. Anotarlos con regularidad puede ayudarte a reconocer tus propias tendencias y a entender mejor tu ritmo.',
      },
    ],
    endTitle: 'Tu ciclo, tu ritmo',
    endText: 'Cuanto más observes tu ciclo, mejor podrás entender lo que es habitual para ti.',
    shareMessage: 'Las diferentes fases del ciclo explicadas — AWA',
  },
  it: {
    badge: 'Ciclo mestruale',
    title: 'Le diverse fasi\ndel ciclo spiegate',
    metaDuration: '6 min di lettura',
    metaValidated: 'Contenuto validato',
    intro: 'Il tuo ciclo mestruale è composto da diverse fasi, ognuna con un ruolo essenziale per il tuo equilibrio ormonale e la tua salute.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Le 4 fasi del ciclo',
      'Come cambia il tuo corpo',
      'Perché è importante capire il tuo ciclo',
      'Domande frequenti',
    ],
    body1: 'Il ciclo si divide generalmente in quattro fasi principali. La loro durata può variare da persona a persona: ogni corpo ha il suo ritmo.',
    diagram: {
      menstrual: {
        name: 'Fase mestruale',
        days: 'Giorni da 1 a 5',
      },
      follicular: {
        name: 'Fase follicolare',
        days: 'Giorni da 1 a 13',
      },
      luteal: {
        name: 'Fase luteale',
        days: 'Giorni da 15 a 28',
      },
      ovulatory: {
        name: 'Fase ovulatoria',
        days: 'Intorno al giorno 14',
      },
    },
    tip1Title: 'Da sapere',
    tip1Text: 'Ogni donna è unica: osserva il tuo corpo e impara a conoscere il tuo ritmo.',
    body2: 'I cambiamenti ormonali possono influire su energia, umore, sonno e su alcune sensazioni fisiche nel corso del ciclo.',
    bodyChanges: [
      {
        title: 'Durante il periodo mestruale',
        text: 'La tua energia può essere più bassa e il tuo corpo può avere bisogno di più riposo.',
      },
      {
        title: 'Fase follicolare',
        text: 'L’energia aumenta gradualmente e puoi sentirti più in forma.',
      },
      {
        title: 'Intorno all’ovulazione',
        text: 'Alcune donne sentono più energia, motivazione e fiducia in sé.',
      },
      {
        title: 'Fase luteale',
        text: 'Possono comparire stanchezza, gonfiore o variazioni dell’umore.',
      },
    ],
    softTipTitle: 'Ascolta il tuo corpo',
    softTipText: 'Non esiste un solo modo di vivere ogni fase. Le tue sensazioni restano la migliore guida.',
    body3: 'Conoscere meglio il tuo ciclo può aiutarti a prevedere alcuni momenti e a capire i cambiamenti che noti giorno dopo giorno.',
    whyItems: [
      'Comprendere meglio i segnali del tuo corpo',
      'Prevedere il tuo periodo mestruale e le sue diverse fasi',
      'Capire alcune variazioni dell’umore',
      'Adattare la tua attività al tuo livello di energia',
      'Migliorare il tuo monitoraggio quotidiano',
    ],
    body4: 'Ecco alcune risposte alle domande più frequenti sulle diverse fasi del ciclo.',
    faq: [
      {
        question: 'È normale che il mio ciclo non duri esattamente 28 giorni?',
        answer: 'Sì. La durata di un ciclo può variare da persona a persona, e anche leggermente da un mese all’altro.',
      },
      {
        question: 'L’ovulazione avviene sempre il giorno 14?',
        answer: 'No. Il giorno 14 è una stima comune per un ciclo di 28 giorni, ma l’ovulazione può avvenire prima o dopo.',
      },
      {
        question: 'Perché i miei sintomi cambiano a seconda della fase?',
        answer: 'I cambiamenti ormonali nel corso del ciclo possono influire su energia, umore, sonno e su alcune sensazioni fisiche.',
      },
      {
        question: 'È utile monitorare i miei sintomi?',
        answer: 'Sì. Annotarli con regolarità può aiutarti a riconoscere i tuoi schemi personali e a capire meglio il tuo ritmo.',
      },
    ],
    endTitle: 'Il tuo ciclo, il tuo ritmo',
    endText: 'Più osservi il tuo ciclo, più puoi capire cosa è tipico per te.',
    shareMessage: 'Le diverse fasi del ciclo spiegate — AWA',
  },
  tr: {
    badge: 'Adet döngüsü',
    title: 'Döngünün farklı\nevreleri anlatılıyor',
    metaDuration: '6 dk okuma',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adet döngün, hormonal dengen ve sağlığın için temel bir rol oynayan birkaç evreden oluşur.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Döngünün 4 evresi',
      'Vücudun nasıl değişir',
      'Döngünü anlamak neden önemli',
      'Sık sorulan sorular',
    ],
    body1: 'Döngün genellikle dört ana evreye ayrılır. Süreleri kişiden kişiye değişebilir: her vücudun kendine özgü bir ritmi vardır.',
    diagram: {
      menstrual: {
        name: 'Adet evresi',
        days: '1. ila 5. günler',
      },
      follicular: {
        name: 'Foliküler evre',
        days: '1. ila 13. günler',
      },
      luteal: {
        name: 'Luteal evre',
        days: '15. ila 28. günler',
      },
      ovulatory: {
        name: 'Yumurtlama evresi',
        days: '14. gün civarı',
      },
    },
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Her kadın benzersizdir: vücudunu gözlemle ve kendi ritmini öğren.',
    body2: 'Hormonal değişimler, döngü boyunca enerjini, ruh halini, uykunu ve bazı bedensel hislerini etkileyebilir.',
    bodyChanges: [
      {
        title: 'Adet sırasında',
        text: 'Enerjin daha düşük olabilir ve vücudun daha fazla dinlenmeye ihtiyaç duyabilir.',
      },
      {
        title: 'Foliküler evre',
        text: 'Enerjin giderek artar ve kendini daha dinç hissedebilirsin.',
      },
      {
        title: 'Yumurtlama civarı',
        text: 'Bazı kadınlar kendini daha enerjik, motive ve kendinden emin hisseder.',
      },
      {
        title: 'Luteal evre',
        text: 'Yorgunluk, şişkinlik veya ruh hali değişimleri ortaya çıkabilir.',
      },
    ],
    softTipTitle: 'Vücudunu dinle',
    softTipText: 'Her evreyi yaşamanın tek bir yolu yoktur. Kendi hislerin en iyi rehberin olmaya devam eder.',
    body3: 'Döngünü daha iyi tanımak, bazı dönemleri önceden tahmin etmene ve günlük hayatta fark ettiğin değişimleri anlamana yardımcı olabilir.',
    whyItems: [
      'Vücudunun verdiği sinyalleri daha iyi anlamak',
      'Adetini ve farklı evrelerini önceden tahmin etmek',
      'Bazı ruh hali değişimlerini anlamak',
      'Aktiviteni enerji düzeyine göre ayarlamak',
      'Günlük takibini geliştirmek',
    ],
    body4: 'İşte döngünün farklı evreleri hakkında sık sorulan soruların bazı yanıtları.',
    faq: [
      {
        question: 'Döngümün tam 28 gün sürmemesi normal mi?',
        answer: 'Evet. Bir döngünün uzunluğu kişiden kişiye, hatta aydan aya hafifçe değişebilir.',
      },
      {
        question: 'Yumurtlama her zaman 14. günde mi olur?',
        answer: 'Hayır. 14. gün, 28 günlük bir döngü için yaygın bir tahmindir, ancak yumurtlama daha erken veya daha geç olabilir.',
      },
      {
        question: 'Belirtilerim neden evreye göre değişiyor?',
        answer: 'Döngü boyunca yaşanan hormonal değişimler enerjiyi, ruh halini, uykuyu ve bazı bedensel hisleri etkileyebilir.',
      },
      {
        question: 'Belirtilerimi takip etmek işe yarar mı?',
        answer: 'Evet. Belirtilerini düzenli olarak not etmek, kendi örüntülerini fark etmene ve ritmini daha iyi anlamana yardımcı olabilir.',
      },
    ],
    endTitle: 'Döngün, senin ritmin',
    endText: 'Döngünü ne kadar çok gözlemlersen, senin için neyin olağan olduğunu o kadar iyi anlayabilirsin.',
    shareMessage: 'Döngünün farklı evreleri anlatılıyor — AWA',
  },
} as const;

function CyclePhasesArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
  const content = CONTENT[lang];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [bookmarked, setBookmarked] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(
    null,
  );
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (mounted) {
        setBookmarked(
          isArticleBookmarked(ARTICLE_ID),
        );
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

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
        showsVerticalScrollIndicator={false}
        onScroll={event =>
          saveScrollPosition(
            ARTICLE_ID,
            event.nativeEvent.contentOffset.y,
          )
        }
        scrollEventThrottle={200}
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
          <Image
            source={resolveEditorialImage(HERO, lang)}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.topBar,
              {
                paddingTop: getTopPadding(
                  insets.top,
                  true,
                ),
              },
            ]}>
            <Pressable
              accessibilityLabel={t('library.reader.back')}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() =>
                navigation.goBack()
              }
              style={({pressed}) => [
                styles.circleButton,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                color={theme.colors.text}
                name="chevron-left"
                size={23}
              />
            </Pressable>

            <View style={styles.topActions}>
              <Pressable
                accessibilityLabel={t('libraryArticle.bookmarkA11y')}
                accessibilityRole="button"
                hitSlop={10}
                onPress={() =>
                  setBookmarked(
                    toggleBookmark(ARTICLE_ID),
                  )
                }
                style={({pressed}) => [
                  styles.circleButton,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name={
                    bookmarked
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={20}
                />
              </Pressable>

              <Pressable
                accessibilityLabel={t('libraryArticle.shareA11y')}
                accessibilityRole="button"
                hitSlop={10}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circleButton,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="share-variant-outline"
                  size={20}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          <View style={styles.metaRow}>
            {[
              [
                'clock-outline',
                content.metaDuration,
              ],
              [
                'shield-check-outline',
                content.metaValidated,
              ],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View
                    style={styles.metaDivider}
                  />
                ) : null}

                <View style={styles.meta}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={14}
                    color={theme.colors.textMuted}
                  />

                  <Text style={styles.metaText}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* SOMMAIRE */}
          <View style={styles.contentsCard}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.topics.map((text, index) => (
              <View
                key={text}
                style={styles.contentsRow}>
                <View style={styles.contentsLeft}>
                  <Text
                    style={styles.contentsNumber}>
                    {index + 1}.
                  </Text>

                  <Text
                    style={styles.contentsText}>
                    {text}
                  </Text>
                </View>

                {/* Kept as textMuted (not the dominant accent): this chevron
                    was already a distinct muted gray in the original design,
                    not the PURPLE accent used for contentsNumber. */}
                <MaterialDesignIcons
                  name="chevron-right"
                  color={theme.colors.textMuted}
                  size={19}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}
          <Text style={styles.sectionTitle}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <View style={styles.diagramCard}>
            <View style={styles.phaseRow}>
              <View style={styles.phaseCopy}>
                <Text style={styles.phaseName}>
                  {content.diagram.menstrual.name}
                </Text>

                <Text style={styles.phaseDays}>
                  {content.diagram.menstrual.days}
                </Text>
              </View>

              <View style={styles.phaseCopy}>
                <Text
                  style={[
                    styles.phaseName,
                    styles.right,
                  ]}>
                  {content.diagram.follicular.name}
                </Text>

                <Text
                  style={[
                    styles.phaseDays,
                    styles.right,
                  ]}>
                  {content.diagram.follicular.days}
                </Text>
              </View>
            </View>

            <Image
              source={DIAGRAM}
              style={styles.diagram}
              resizeMode="cover"
            />

            <View style={styles.phaseRow}>
              <View style={styles.phaseCopy}>
                <Text style={styles.phaseName}>
                  {content.diagram.luteal.name}
                </Text>

                <Text style={styles.phaseDays}>
                  {content.diagram.luteal.days}
                </Text>
              </View>

              <View style={styles.phaseCopy}>
                <Text
                  style={[
                    styles.phaseName,
                    styles.right,
                  ]}>
                  {content.diagram.ovulatory.name}
                </Text>

                <Text
                  style={[
                    styles.phaseDays,
                    styles.right,
                  ]}>
                  {content.diagram.ovulatory.days}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="lightbulb-outline"
              size={24}
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

          {/* SECTION 2 */}
          <Text style={styles.sectionTitle}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.changeGrid}>
            {BODY_CHANGES_ICONS.map((iconItem, index) => {
              const item = content.bodyChanges[index];

              return (
                <View
                  key={item.title}
                  style={styles.changeCard}>
                  <View style={styles.changeIcon}>
                    <MaterialDesignIcons
                      name={iconItem.icon as never}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.changeTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.changeText}>
                    {item.text}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.softTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.softTipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.softTipText}
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.sectionTitle}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <View style={styles.whyCard}>
            {WHY_ITEMS_ICONS.map((iconItem, index) => {
              const text = content.whyItems[index];

              return (
                <View
                  key={text}
                  style={[
                    styles.whyRow,
                    index <
                      WHY_ITEMS_ICONS.length - 1 &&
                      styles.whyDivider,
                  ]}>
                  <View style={styles.whyIcon}>
                    <MaterialDesignIcons
                      name={iconItem.icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.whyText}>
                    {text}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* SECTION 4 */}
          <Text style={styles.sectionTitle}>
            4. {content.topics[3]}
          </Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

          <View style={styles.faqList}>
            {content.faq.map((item, index) => {
              const opened = openFaq === index;

              return (
                <Pressable
                  key={item.question}
                  onPress={() =>
                    setOpenFaq(
                      opened ? null : index,
                    )
                  }
                  style={({pressed}) => [
                    styles.faqCard,
                    opened &&
                      styles.faqCardOpen,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.faqHeader}>
                    <Text
                      style={styles.faqQuestion}>
                      {item.question}
                    </Text>

                    <View
                      style={[
                        styles.faqChevron,
                        opened &&
                          styles.faqChevronOpen,
                      ]}>
                      <MaterialDesignIcons
                        name={
                          opened
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>
                  </View>

                  {opened ? (
                    <Text style={styles.faqAnswer}>
                      {item.answer}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.endCard}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.endCopy}>
              <Text style={styles.endTitle}>
                {content.endTitle}
              </Text>

              <Text style={styles.endText}>
                {content.endText}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ARTICLE_ID}
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

    heroWrap: {
      height: 270,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    hero: {
      width: '100%',
      height: '100%',
    },

    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    topActions: {
      flexDirection: 'row',
      gap: 8,
    },

    circleButton: {
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
      opacity: 0.72,
    },

    article: {
      marginTop: -14,
      paddingHorizontal: 19,
      paddingTop: 20,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
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
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },

    title: {
      marginTop: 12,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 25,
      lineHeight: 30,
      fontWeight: '700',
    },

    metaRow: {
      marginTop: 13,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 12,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    metaDivider: {
      width: 1,
      height: 18,
      backgroundColor: theme.colors.border,
    },

    metaText: {
      color: theme.colors.textMuted,
      fontSize: 10,
    },

    intro: {
      marginTop: 17,
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 21,
    },

    contentsCard: {
      marginTop: 18,
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    contentsTitle: {
      marginBottom: 7,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    contentsRow: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    contentsLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    contentsNumber: {
      width: 23,
      color: theme.colors.primary,
      fontSize: 11.5,
      fontWeight: '800',
    },

    contentsText: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
    },

    sectionTitle: {
      marginTop: 24,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 21,
      lineHeight: 27,
      fontWeight: '700',
    },

    body: {
      marginTop: 9,
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 21,
    },

    diagramCard: {
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    diagram: {
      alignSelf: 'center',
      width: 220,
      height: 220,
      borderRadius: 110,
    },

    phaseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    phaseCopy: {
      width: '46%',
    },

    phaseName: {
      color: theme.colors.text,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
    },

    phaseDays: {
      marginTop: 3,
      color: theme.colors.textMuted,
      fontSize: 9.5,
    },

    right: {
      textAlign: 'right',
    },

    tip: {
      marginTop: 17,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    softTip: {
      marginTop: 15,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    tipCopy: {
      flex: 1,
      marginLeft: 12,
    },

    tipTitle: {
      color: theme.colors.primary,
      fontSize: 12.5,
      fontWeight: '800',
    },

    tipText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 11.5,
      lineHeight: 17,
    },

    changeGrid: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    changeCard: {
      width: '48.7%',
      minHeight: 142,
      padding: 12,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    changeIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    changeTitle: {
      marginTop: 9,
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '800',
    },

    changeText: {
      marginTop: 5,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 15,
    },

    whyCard: {
      marginTop: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    whyRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
    },

    whyDivider: {
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },

    whyIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    whyText: {
      flex: 1,
      marginLeft: 11,
      color: theme.colors.text,
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: '600',
    },

    faqList: {
      marginTop: 14,
      gap: 8,
    },

    faqCard: {
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    faqCardOpen: {
      borderColor: theme.colors.primary,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    faqQuestion: {
      flex: 1,
      paddingRight: 10,
      color: theme.colors.text,
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: '700',
    },

    faqChevron: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    faqChevronOpen: {
      backgroundColor: withAlpha(theme.colors.primary, 0.18),
    },

    faqAnswer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
    },

    endCard: {
      marginTop: 18,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    endCopy: {
      flex: 1,
      marginLeft: 12,
    },

    endTitle: {
      color: theme.colors.text,
      fontSize: 12.5,
      fontWeight: '800',
    },

    endText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
    },
  });
}

export default CyclePhasesArticleScreen;
