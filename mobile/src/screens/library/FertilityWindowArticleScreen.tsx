import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
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
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';

const ID = 'fertility-fenetre-fertile';

const HERO = CYCLE_PHASES_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const TRACKING_ICONS = [
  'calendar-month-outline',
  'water-outline',
  'thermometer',
  'test-tube',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'FENÊTRE FERTILE',
    title: 'La fenêtre fertile,\ncomment ça marche',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi les jours autour de l’ovulation comptent le plus pour concevoir.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que la fenêtre fertile ?',
      'Pourquoi ces jours comptent le plus',
      'Comment repérer sa fenêtre fertile',
      'À retenir',
    ],
    section1Body: 'La fenêtre fertile désigne la période du cycle pendant laquelle une grossesse est possible. Elle s’étend sur environ 6 jours : les 5 jours précédant l’ovulation, plus le jour de l’ovulation lui-même.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Chaque cycle est différent : la fenêtre fertile ne tombe pas forcément au même jour du calendrier d’un mois à l’autre.',
    section2Body1: 'Les spermatozoïdes peuvent survivre jusqu’à 5 jours dans les voies génitales, ce qui élargit la période de conception possible. L’ovule, lui, ne reste fécondable qu’environ 24 heures après sa libération.',
    section2Body2: 'Par exemple, un rapport survenu 3 jours avant l’ovulation peut aboutir à une conception, alors qu’un rapport le lendemain de l’ovulation arrive souvent trop tard.',
    section3Intro: 'Plusieurs signaux, observés ensemble, aident à mieux cerner cette période :',
    trackingSigns: [
      'Suivre la longueur de ton cycle',
      'Observer ta glaire cervicale',
      'Mesurer ta température basale',
      'Utiliser des tests d’ovulation (LH)',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Multiplier les repères (cycle, glaire, température) donne une vision plus fiable de ta fenêtre fertile qu’un seul indice isolé.',
    shareMessage: 'La fenêtre fertile, comment ça marche — AWA',
  },
  en: {
    badge: 'FERTILE WINDOW',
    title: 'The fertile window:\nhow it works',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why the days around ovulation matter most for conceiving.',
    contentsTitle: 'In this article',
    topics: [
      'What is the fertile window?',
      'Why these days matter most',
      'How to identify your fertile window',
      'Key takeaways',
    ],
    section1Body: 'The fertile window refers to the period in your cycle during which pregnancy is possible. It spans about 6 days: the 5 days before ovulation, plus the day of ovulation itself.',
    tip1Title: 'Good to know',
    tip1Text: 'Every cycle is different: the fertile window doesn’t necessarily fall on the same calendar day from one month to the next.',
    section2Body1: 'Sperm can survive for up to 5 days in the reproductive tract, which widens the period during which conception is possible. The egg, meanwhile, remains fertilizable for only about 24 hours after it’s released.',
    section2Body2: 'For example, intercourse that happens 3 days before ovulation can lead to conception, while intercourse the day after ovulation often comes too late.',
    section3Intro: 'Several signs, observed together, help you better pinpoint this period:',
    trackingSigns: [
      'Tracking your cycle length',
      'Observing your cervical mucus',
      'Measuring your basal body temperature',
      'Using ovulation (LH) tests',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Combining several signs (cycle, mucus, temperature) gives a more reliable picture of your fertile window than any single sign on its own.',
    shareMessage: 'The fertile window: how it works — AWA',
  },
  es: {
    badge: 'VENTANA FÉRTIL',
    title: 'La ventana fértil,\ncómo funciona',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué los días alrededor de la ovulación son los que más importan para concebir.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la ventana fértil?',
      'Por qué estos días importan más',
      'Cómo identificar tu ventana fértil',
      'Para recordar',
    ],
    section1Body: 'La ventana fértil designa el periodo del ciclo durante el cual un embarazo es posible. Se extiende a lo largo de unos 6 días: los 5 días previos a la ovulación, más el día de la ovulación en sí.',
    tip1Title: 'Dato útil',
    tip1Text: 'Cada ciclo es diferente: la ventana fértil no cae necesariamente en el mismo día del calendario de un mes a otro.',
    section2Body1: 'Los espermatozoides pueden sobrevivir hasta 5 días en las vías genitales, lo que amplía el periodo de concepción posible. El óvulo, en cambio, solo permanece fecundable durante unas 24 horas tras su liberación.',
    section2Body2: 'Por ejemplo, una relación sexual 3 días antes de la ovulación puede derivar en una concepción, mientras que una relación al día siguiente de la ovulación suele llegar demasiado tarde.',
    section3Intro: 'Varias señales, observadas en conjunto, ayudan a identificar mejor este periodo:',
    trackingSigns: [
      'Seguir la duración de tu ciclo',
      'Observar tu moco cervical',
      'Medir tu temperatura basal',
      'Usar pruebas de ovulación (LH)',
    ],
    tip2Title: 'Dato útil',
    tip2Text: 'Combinar varios indicios (ciclo, moco, temperatura) da una visión más fiable de tu ventana fértil que una sola señal aislada.',
    shareMessage: 'La ventana fértil, cómo funciona — AWA',
  },
  it: {
    badge: 'FINESTRA FERTILE',
    title: 'La finestra fertile:\ncome funziona',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché i giorni intorno all’ovulazione sono i più importanti per concepire.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è la finestra fertile?',
      'Perché questi giorni contano di più',
      'Come individuare la tua finestra fertile',
      'Punti chiave',
    ],
    section1Body: 'La finestra fertile indica il periodo del tuo ciclo in cui una gravidanza è possibile. Dura circa 6 giorni: i 5 giorni prima dell’ovulazione, più il giorno stesso dell’ovulazione.',
    tip1Title: 'Da sapere',
    tip1Text: 'Ogni ciclo è diverso: la finestra fertile non cade necessariamente nello stesso giorno del calendario da un mese all’altro.',
    section2Body1: 'Gli spermatozoi possono sopravvivere fino a 5 giorni nelle vie genitali, il che amplia il periodo in cui il concepimento è possibile. L’ovulo, invece, rimane fecondabile solo per circa 24 ore dopo il rilascio.',
    section2Body2: 'Ad esempio, un rapporto che avviene 3 giorni prima dell’ovulazione può portare al concepimento, mentre un rapporto il giorno dopo l’ovulazione arriva spesso troppo tardi.',
    section3Intro: 'Diversi segnali, osservati insieme, ti aiutano a individuare meglio questo periodo:',
    trackingSigns: [
      'Tenere traccia della durata del tuo ciclo',
      'Osservare il tuo muco cervicale',
      'Misurare la tua temperatura basale',
      'Usare i test di ovulazione (LH)',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'Combinare più segnali (ciclo, muco, temperatura) offre un quadro più affidabile della tua finestra fertile rispetto a un singolo segnale preso da solo.',
    shareMessage: 'La finestra fertile: come funziona — AWA',
  },
  tr: {
    badge: 'DOĞURGANLIK DÖNEMİ',
    title: 'Doğurganlık dönemi:\nnasıl işler?',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hamile kalmak için yumurtlama çevresindeki günlerin neden en önemli olduğu.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Doğurganlık dönemi nedir?',
      'Bu günler neden en önemli?',
      'Doğurganlık dönemini nasıl belirlersin?',
      'Akılda kalacaklar',
    ],
    section1Body: 'Doğurganlık dönemi, döngünde gebeliğin mümkün olduğu zaman aralığını ifade eder. Yaklaşık 6 gün sürer: yumurtlamadan önceki 5 gün ve yumurtlamanın gerçekleştiği gün.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Her döngü farklıdır: doğurganlık dönemi, bir aydan diğerine takvimde mutlaka aynı güne denk gelmez.',
    section2Body1: 'Sperm, üreme yolunda 5 güne kadar canlı kalabilir; bu da hamile kalmanın mümkün olduğu süreyi genişletir. Yumurta hücresi ise salındıktan sonra yalnızca yaklaşık 24 saat boyunca döllenebilir durumda kalır.',
    section2Body2: 'Örneğin, yumurtlamadan 3 gün önce gerçekleşen cinsel ilişki hamileliğe yol açabilirken, yumurtlamadan bir gün sonraki ilişki çoğu zaman çok geç kalmış olur.',
    section3Intro: 'Birlikte gözlemlenen birkaç belirti, bu dönemi daha iyi saptamana yardımcı olur:',
    trackingSigns: [
      'Döngü uzunluğunu takip etmek',
      'Servikal mukusunu gözlemlemek',
      'Bazal vücut sıcaklığını ölçmek',
      'Ovülasyon (LH) testleri kullanmak',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Birkaç belirtiyi (döngü, mukus, sıcaklık) bir arada kullanmak, doğurganlık dönemin hakkında tek bir belirtiden daha güvenilir bir tablo sunar.',
    shareMessage: 'Doğurganlık dönemi: nasıl işler? — AWA',
  },
  ru: {
    badge: 'ФЕРТИЛЬНОЕ ОКНО',
    title: 'Фертильное окно:\nкак оно работает',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Почему дни вокруг овуляции важнее всего для зачатия.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое фертильное окно?',
      'Почему эти дни важнее всего',
      'Как определить своё фертильное окно',
      'Главное',
    ],
    section1Body: 'Фертильное окно — это период цикла, в который возможна беременность. Оно длится около 6 дней: 5 дней до овуляции и сам день овуляции.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Каждый цикл отличается: фертильное окно не обязательно приходится на одни и те же числа месяца от цикла к циклу.',
    section2Body1: 'Сперматозоиды могут сохранять жизнеспособность в половых путях до 5 дней, что расширяет период, в который возможно зачатие. Яйцеклетка же способна к оплодотворению лишь около 24 часов после выхода из яичника.',
    section2Body2: 'Например, половой акт за 3 дня до овуляции может привести к зачатию, а на следующий день после овуляции он чаще всего уже слишком поздний.',
    section3Intro: 'Определить этот период точнее помогают несколько признаков, которые наблюдают вместе:',
    trackingSigns: [
      'Отслеживание длительности цикла',
      'Наблюдение за цервикальной слизью',
      'Измерение базальной температуры',
      'Тесты на овуляцию (ЛГ)',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Сочетание нескольких признаков (цикл, слизь, температура) даёт более надёжное представление о вашем фертильном окне, чем любой отдельный признак.',
    shareMessage: 'Фертильное окно: как оно работает — AWA',
  },
  de: {
    badge: 'FRUCHTBARES FENSTER',
    title: 'Das fruchtbare Fenster:\nSo funktioniert es',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Warum die Tage rund um den Eisprung für eine Schwangerschaft am wichtigsten sind.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist das fruchtbare Fenster?',
      'Warum diese Tage am wichtigsten sind',
      'Wie du dein fruchtbares Fenster erkennst',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Das fruchtbare Fenster bezeichnet die Zeit in deinem Zyklus, in der eine Schwangerschaft möglich ist. Es umfasst etwa 6 Tage: die 5 Tage vor dem Eisprung sowie den Tag des Eisprungs selbst.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Jeder Zyklus ist anders: Das fruchtbare Fenster fällt nicht unbedingt jeden Monat auf denselben Kalendertag.',
    section2Body1: 'Spermien können bis zu 5 Tage in den Geschlechtsorganen überleben, wodurch sich der Zeitraum verlängert, in dem eine Empfängnis möglich ist. Die Eizelle hingegen bleibt nach ihrer Freisetzung nur etwa 24 Stunden befruchtungsfähig.',
    section2Body2: 'Geschlechtsverkehr 3 Tage vor dem Eisprung kann zum Beispiel zu einer Empfängnis führen, während er am Tag nach dem Eisprung oft zu spät kommt.',
    section3Intro: 'Mehrere Anzeichen, gemeinsam beobachtet, helfen dir, diesen Zeitraum besser einzugrenzen:',
    trackingSigns: [
      'Die Länge deines Zyklus verfolgen',
      'Deinen Zervixschleim beobachten',
      'Deine Basaltemperatur messen',
      'Ovulationstests (LH-Tests) verwenden',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Wenn du mehrere Anzeichen (Zyklus, Schleim, Temperatur) kombinierst, erhältst du ein verlässlicheres Bild deines fruchtbaren Fensters als mit einem einzelnen Anzeichen.',
    shareMessage: 'Das fruchtbare Fenster: So funktioniert es – AWA',
  },
  zh: {
      badge: '易孕期',
      title: '易孕期：\n它是如何运作的',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '为什么排卵前后的几天，对受孕来说最为关键。',
      contentsTitle: '本文内容',
      topics: [
        '什么是易孕期？',
        '为什么这几天最关键',
        '如何判断你的易孕期',
        '要点回顾',
      ],
      section1Body: '易孕期是指你的周期中可能怀孕的那段时间，约持续 6 天：排卵前的 5 天，加上排卵当天。',
      tip1Title: '小贴士',
      tip1Text: '每个周期都不一样：易孕期不一定每个月都落在日历上的同一天。',
      section2Body1: '精子在生殖道内最多可存活 5 天，这使得可能受孕的时间范围变宽。而卵子排出后，只有大约 24 小时具备受精能力。',
      section2Body2: '例如，排卵前 3 天发生的性生活可能导致受孕，而排卵后一天的性生活往往已经太晚。',
      section3Intro: '结合观察几个迹象，可以帮助你更准确地判断这段时间：',
      trackingSigns: [
        '记录你的周期长度',
        '观察你的宫颈黏液',
        '测量你的基础体温',
        '使用排卵试纸（LH 检测）',
      ],
      tip2Title: '小贴士',
      tip2Text: '把几种迹象（周期、黏液、体温）结合起来，比单看某一个迹象，更能可靠地反映你的易孕期。',
      shareMessage: '易孕期：它是如何运作的 — AWA',
    },
  id: {
    badge: 'MASA SUBUR',
    title: 'Masa subur:\ncara kerjanya',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Mengapa hari-hari di sekitar ovulasi paling penting untuk program hamil.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu masa subur?',
      'Mengapa hari-hari ini paling penting',
      'Cara mengenali masa suburmu',
      'Poin penting',
    ],
    section1Body: 'Masa subur adalah periode dalam siklusmu ketika kehamilan mungkin terjadi. Rentangnya sekitar 6 hari: 5 hari sebelum ovulasi, ditambah hari ovulasi itu sendiri.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Setiap siklus berbeda: masa subur tidak selalu jatuh pada tanggal kalender yang sama dari satu bulan ke bulan berikutnya.',
    section2Body1: 'Sperma dapat bertahan hingga 5 hari di saluran reproduksi, sehingga memperluas periode ketika pembuahan mungkin terjadi. Sementara itu, sel telur hanya bisa dibuahi sekitar 24 jam setelah dilepaskan.',
    section2Body2: 'Misalnya, hubungan intim yang terjadi 3 hari sebelum ovulasi dapat menyebabkan pembuahan, sedangkan hubungan intim sehari setelah ovulasi sering kali sudah terlambat.',
    section3Intro: 'Beberapa tanda, jika diamati bersama, membantumu menentukan periode ini dengan lebih tepat:',
    trackingSigns: [
      'Mencatat panjang siklusmu',
      'Mengamati lendir serviksmu',
      'Mengukur suhu tubuh basalmu',
      'Menggunakan tes ovulasi (LH)',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Menggabungkan beberapa tanda (siklus, lendir, suhu) memberi gambaran masa suburmu yang lebih andal daripada satu tanda saja.',
    shareMessage: 'Masa subur: cara kerjanya — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FertilityWindowArticleScreen({
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
          <Image source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {paddingTop: getTopPadding(insets.top, true)},
            ]}>
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={t('library.screen.addBookmark')}
                icon={saved ? 'bookmark' : 'bookmark-outline'}
                iconSize={20}
                onPress={handleBookmark}
                variant="tonal"
              />

              <AwaIconButton
                accessibilityLabel={t('libraryArticle.shareA11y')}
                icon="share-variant-outline"
                iconSize={20}
                onPress={handleShare}
                variant="tonal"
              />
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

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

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{text}</AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
                  <AwaText variant="bodySmall" style={styles.contentText}>{item}</AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section2Body1}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section2Body2}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section3Intro}
          </AwaText>

          <View style={styles.daily}>
            {TRACKING_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.trackingSigns[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 32},
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
  article: {
    marginTop: -16,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: theme.colors.background,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  title: {
    marginTop: 12,
  },
  metas: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  intro: {
    marginTop: 16,
  },
  contents: {
    marginTop: 20,
    padding: 16,
  },
  contentsTitle: {marginBottom: 8},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 24},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
  });
}
