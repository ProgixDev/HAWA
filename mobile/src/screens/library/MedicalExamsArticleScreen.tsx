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

const ID = 'medicalexams-suivi-medical';

const HERO = require('../../assets/images/library/spm-consult.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const ULTRASOUND_ICONS = [
  'numeric-1-circle-outline',
  'numeric-2-circle-outline',
  'numeric-3-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'GROSSESSE • SUIVI MÉDICAL',
    title: 'Le calendrier des\nexamens de grossesse',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Échographies et bilans essentiels, trimestre par trimestre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les échographies de suivi',
      'Les prises de sang essentielles',
      'Préparer chaque rendez-vous',
      'À noter',
      'À retenir',
    ],
    body1:
      'Trois échographies principales rythment généralement la grossesse, une par trimestre, chacune avec un objectif différent.',
    ultrasounds: [
      '1er trimestre : datation et clarté nucale',
      '2e trimestre : échographie morphologique',
      '3e trimestre : croissance et position du bébé',
    ],
    body2:
      'Des prises de sang régulières surveillent plusieurs marqueurs clés tout au long de la grossesse :',
    bloodTests: [
      'Taux de fer, pour dépister une éventuelle anémie',
      'Dépistage du diabète gestationnel, généralement autour du 2e trimestre',
      'Groupe sanguin et recherche d’agglutinines irrégulières',
      'Sérologies (toxoplasmose, rubéole) selon ton statut immunitaire',
    ],
    prepTips: [
      'Noter tes questions au fur et à mesure, avant de les oublier',
      'Apporter ton carnet de suivi de grossesse à chaque rendez-vous',
      'Signaler tout symptôme nouveau, même s’il te semble mineur',
    ],
    neutralText:
      'Le nombre et le calendrier exact des examens peuvent varier selon ton suivi, ton profil de risque et les pratiques de ton pays ou de ton établissement.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Ne pas hésiter à noter tes questions avant chaque rendez-vous pour ne rien oublier sur le moment : aucune question n’est trop petite pour être posée.',
    shareMessage: 'Le calendrier des examens de grossesse — AWA',
  },
  en: {
    badge: 'PREGNANCY • MEDICAL FOLLOW-UP',
    title: 'The pregnancy exam\ncalendar',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Ultrasounds and essential tests, trimester by trimester.',
    contentsTitle: 'In this article',
    topics: [
      'Follow-up ultrasounds',
      'Essential blood tests',
      'Preparing for each appointment',
      'Worth noting',
      'Key takeaways',
    ],
    body1:
      'Pregnancy generally includes three main ultrasounds, one per trimester, each with a different purpose.',
    ultrasounds: [
      '1st trimester: dating and nuchal translucency',
      '2nd trimester: morphology ultrasound',
      '3rd trimester: growth and the baby’s position',
    ],
    body2:
      'Regular blood tests monitor several key markers throughout pregnancy:',
    bloodTests: [
      'Iron levels, to screen for possible anemia',
      'Gestational diabetes screening, generally around the 2nd trimester',
      'Blood type and irregular antibody screening',
      'Serology tests (toxoplasmosis, rubella) depending on your immune status',
    ],
    prepTips: [
      'Write down your questions as they come to you, before you forget them',
      'Bring your pregnancy follow-up booklet to every appointment',
      'Mention any new symptom, even if it seems minor',
    ],
    neutralText:
      'The exact number and schedule of exams can vary depending on your care, your risk profile, and the practices of your country or care provider.',
    tipTitle: 'Good to know',
    tipText:
      'Don’t hesitate to write down your questions before each appointment so you don’t forget anything in the moment: no question is too small to ask.',
    shareMessage: 'The pregnancy exam calendar — AWA',
  },
  es: {
    badge: 'EMBARAZO • SEGUIMIENTO MÉDICO',
    title: 'El calendario de\nlos exámenes del embarazo',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Ecografías y pruebas esenciales, trimestre a trimestre.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las ecografías de seguimiento',
      'Los análisis de sangre esenciales',
      'Preparar cada cita',
      'Para tener en cuenta',
      'Para recordar',
    ],
    body1:
      'Tres ecografías principales marcan generalmente el ritmo del embarazo, una por trimestre, cada una con un objetivo diferente.',
    ultrasounds: [
      '1.er trimestre: datación y translucencia nucal',
      '2.º trimestre: ecografía morfológica',
      '3.er trimestre: crecimiento y posición del bebé',
    ],
    body2:
      'Varios análisis de sangre regulares controlan varios marcadores clave a lo largo del embarazo:',
    bloodTests: [
      'Nivel de hierro, para detectar una posible anemia',
      'Cribado de diabetes gestacional, generalmente alrededor del 2.º trimestre',
      'Grupo sanguíneo e investigación de aglutininas irregulares',
      'Serologías (toxoplasmosis, rubéola) según tu estado inmunitario',
    ],
    prepTips: [
      'Anota tus preguntas a medida que te surjan, antes de olvidarlas',
      'Lleva tu cartilla de seguimiento del embarazo a cada cita',
      'Comenta cualquier síntoma nuevo, aunque te parezca menor',
    ],
    neutralText:
      'El número y el calendario exacto de los exámenes pueden variar según tu seguimiento, tu perfil de riesgo y las prácticas de tu país o de tu centro médico.',
    tipTitle: 'DATO ÚTIL',
    tipText:
      'No dudes en anotar tus preguntas antes de cada cita para no olvidar nada en el momento: ninguna pregunta es demasiado pequeña para hacerla.',
    shareMessage: 'El calendario de los exámenes del embarazo — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • CONTROLLI MEDICI',
    title: 'Il calendario degli esami\nin gravidanza',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Ecografie ed esami essenziali, trimestre per trimestre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Ecografie di controllo',
      'Esami del sangue essenziali',
      'Prepararsi a ogni appuntamento',
      'Da notare',
      'Punti chiave',
    ],
    body1: 'La gravidanza prevede in genere tre ecografie principali, una per trimestre, ciascuna con uno scopo diverso.',
    ultrasounds: [
      'Primo trimestre: datazione e translucenza nucale',
      'Secondo trimestre: ecografia morfologica',
      'Terzo trimestre: crescita e posizione del bambino',
    ],
    body2: 'Esami del sangue regolari monitorano diversi parametri chiave durante la gravidanza:',
    bloodTests: [
      'Livelli di ferro, per individuare una possibile anemia',
      'Screening del diabete gestazionale, in genere intorno al secondo trimestre',
      'Gruppo sanguigno e ricerca degli anticorpi irregolari',
      'Esami sierologici (toxoplasmosi, rosolia) in base al tuo stato immunitario',
    ],
    prepTips: [
      'Scrivi le tue domande man mano che ti vengono in mente, prima di dimenticarle',
      'Porta con te il libretto di gravidanza a ogni appuntamento',
      'Segnala qualsiasi nuovo sintomo, anche se sembra di poco conto',
    ],
    neutralText: 'Il numero esatto e il calendario degli esami possono variare in base alla tua assistenza, al tuo profilo di rischio e alle pratiche del tuo Paese o della struttura sanitaria.',
    tipTitle: 'Da sapere',
    tipText: 'Non esitare a scrivere le tue domande prima di ogni appuntamento per non dimenticare nulla sul momento: nessuna domanda è troppo piccola per essere posta.',
    shareMessage: 'Il calendario degli esami in gravidanza — AWA',
  },
  tr: {
    badge: 'GEBELİK • TIBBİ TAKİP',
    title: 'Gebelik muayeneleri\ntakvimi',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Ultrasonlar ve temel tetkikler, trimester trimester.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Takip ultrasonları',
      'Temel kan tahlilleri',
      'Her randevuya hazırlanmak',
      'Dikkate değer noktalar',
      'Akılda kalacaklar',
    ],
    body1: 'Gebelik genellikle her trimesterde bir tane olmak üzere, her biri farklı bir amaca hizmet eden üç ana ultrason içerir.',
    ultrasounds: [
      '1. trimester: gebelik haftasının belirlenmesi ve ense kalınlığı ölçümü',
      '2. trimester: morfoloji ultrasonu',
      '3. trimester: büyüme ve bebeğin duruşu',
    ],
    body2: 'Düzenli kan tahlilleri, gebelik boyunca birkaç temel göstergeyi izler:',
    bloodTests: [
      'Olası anemiyi taramak için demir düzeyleri',
      'Gebelik şekeri taraması, genellikle 2. trimester civarında',
      'Kan grubu ve düzensiz antikor taraması',
      'Bağışıklık durumuna göre serolojik tetkikler (toksoplazmoz, kızamıkçık)',
    ],
    prepTips: [
      'Aklına gelen soruları unutmadan önce yaz',
      'Her randevuya gebelik takip defterini götür',
      'Küçük görünse bile yeni bir belirtiyi mutlaka söyle',
    ],
    neutralText: 'Muayenelerin tam sayısı ve takvimi; aldığın bakıma, risk profiline ve ülkenin ya da sağlık hizmeti sağlayıcının uygulamalarına göre değişebilir.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Her randevudan önce sorularını yazmaktan çekinme; böylece o an hiçbir şeyi unutmazsın: sorulamayacak kadar küçük bir soru yoktur.',
    shareMessage: 'Gebelik muayeneleri takvimi — AWA',
  },
  ru: {
    badge: 'БЕРЕМЕННОСТЬ • МЕДИЦИНСКОЕ НАБЛЮДЕНИЕ',
    title: 'Календарь обследований\nпри беременности',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'УЗИ и основные анализы — триместр за триместром.',
    contentsTitle: 'В этой статье',
    topics: [
      'УЗИ в ходе наблюдения',
      'Основные анализы крови',
      'Подготовка к каждому приёму',
      'Что стоит учитывать',
      'Главное',
    ],
    body1:
      'При беременности, как правило, проводят три основных УЗИ — по одному в каждом триместре, и у каждого своя цель.',
    ultrasounds: [
      '1-й триместр: определение срока и воротниковое пространство плода',
      '2-й триместр: УЗИ для оценки анатомии плода',
      '3-й триместр: рост и положение ребёнка',
    ],
    body2:
      'Регулярные анализы крови позволяют контролировать несколько важных показателей в течение всей беременности:',
    bloodTests: [
      'Уровень железа — для выявления возможной анемии',
      'Скрининг на гестационный диабет, как правило, около 2-го триместра',
      'Группа крови и скрининг нерегулярных антител',
      'Серологические исследования (токсоплазмоз, краснуха) в зависимости от вашего иммунного статуса',
    ],
    prepTips: [
      'Записывайте вопросы по мере появления, чтобы не забыть',
      'Берите на каждый приём обменную карту беременной',
      'Сообщайте о любом новом симптоме, даже если он кажется незначительным',
    ],
    neutralText:
      'Точное количество и график обследований могут различаться в зависимости от вашего ведения, профиля риска и практики вашей страны или медицинского учреждения.',
    tipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    tipText:
      'Не стесняйтесь записывать вопросы перед каждым приёмом, чтобы ничего не забыть в моменте: нет слишком маленьких вопросов.',
    shareMessage: 'Календарь обследований при беременности — AWA',
  },
  de: {
    badge: 'SCHWANGERSCHAFT • MEDIZINISCHE BETREUUNG',
    title: 'Der Kalender der\nSchwangerschaftsuntersuchungen',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Ultraschalluntersuchungen und wichtige Tests, Trimester für Trimester.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Ultraschalluntersuchungen',
      'Wichtige Bluttests',
      'Auf jeden Termin vorbereitet sein',
      'Gut zu wissen',
      'Das Wichtigste in Kürze',
    ],
    body1:
      'In der Schwangerschaft sind in der Regel drei große Ultraschalluntersuchungen vorgesehen, eine pro Trimester, jede mit einem anderen Schwerpunkt.',
    ultrasounds: [
      '1. Trimester: Bestimmung des Schwangerschaftsalters und Nackentransparenz',
      '2. Trimester: Feinultraschall zur Untersuchung der Organentwicklung',
      '3. Trimester: Wachstum und Lage des Babys',
    ],
    body2:
      'Regelmäßige Bluttests überwachen im Verlauf der Schwangerschaft mehrere wichtige Werte:',
    bloodTests: [
      'Eisenwerte, um eine mögliche Blutarmut zu erkennen',
      'Test auf Schwangerschaftsdiabetes, in der Regel etwa im 2. Trimester',
      'Blutgruppe und Suchtest auf unregelmäßige Antikörper',
      'Serologische Tests (Toxoplasmose, Röteln) je nach deinem Immunstatus',
    ],
    prepTips: [
      'Schreib deine Fragen auf, sobald sie dir einfallen, bevor du sie vergisst',
      'Bring zu jedem Termin deinen Mutterpass mit',
      'Erwähne jedes neue Symptom, auch wenn es unbedeutend erscheint',
    ],
    neutralText:
      'Die genaue Anzahl und der Zeitplan der Untersuchungen können je nach deiner Betreuung, deinem Risikoprofil und den Gepflogenheiten deines Landes oder deiner Betreuungsperson variieren.',
    tipTitle: 'Gut zu wissen',
    tipText:
      'Schreib dir deine Fragen vor jedem Termin gern auf, damit du im Moment nichts vergisst: Keine Frage ist zu klein, um sie zu stellen.',
    shareMessage: 'Der Kalender der Schwangerschaftsuntersuchungen — AWA',
  },
  zh: {
      badge: '怀孕 • 医疗随访',
      title: '孕期检查\n时间表',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '按孕期阶段了解超声检查和重要的检验项目。',
      contentsTitle: '本文内容',
      topics: [
        '随访超声检查',
        '重要的血液检查',
        '为每次产检做准备',
        '值得注意的事',
        '要点回顾',
      ],
      body1: '孕期通常包括三次主要的超声检查，每个孕期一次，各有不同的目的。',
      ultrasounds: [
        '孕早期：核对孕周和颈项透明层检查',
        '孕中期：胎儿结构超声检查',
        '孕晚期：生长发育和宝宝的胎位',
      ],
      body2: '整个孕期会定期做血液检查，监测几项关键指标：',
      bloodTests: [
        '铁含量，用于筛查可能的贫血',
        '妊娠期糖尿病筛查，通常在孕中期前后进行',
        '血型和不规则抗体筛查',
        '血清学检查（弓形虫病、风疹），视你的免疫状态而定',
      ],
      prepTips: [
        '想到问题就随时记下来，免得忘记',
        '每次产检都带上你的孕期随访手册',
        '提到任何新出现的症状，即使看起来很轻微',
      ],
      neutralText: '检查的具体次数和时间安排，可能因你所接受的医疗服务、风险情况，以及所在国家或医疗机构的做法而有所不同。',
      tipTitle: '小贴士',
      tipText: '每次产检前，不妨把问题写下来，免得当场遗漏：再小的问题都值得问。',
      shareMessage: '孕期检查时间表 — AWA',
    },
  id: {
    badge: 'KEHAMILAN • PEMANTAUAN MEDIS',
    title: 'Kalender pemeriksaan\nkehamilan',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'USG dan tes penting, trimester demi trimester.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'USG pemantauan',
      'Tes darah penting',
      'Mempersiapkan setiap kunjungan',
      'Perlu dicatat',
      'Poin penting',
    ],
    body1: 'Kehamilan umumnya mencakup tiga USG utama, satu per trimester, masing-masing dengan tujuan yang berbeda.',
    ultrasounds: [
      'Trimester ke-1: penentuan usia kehamilan dan pengukuran lipatan tengkuk (nuchal translucency)',
      'Trimester ke-2: USG morfologi',
      'Trimester ke-3: pertumbuhan dan posisi bayi',
    ],
    body2: 'Tes darah rutin memantau beberapa penanda penting sepanjang kehamilan:',
    bloodTests: [
      'Kadar zat besi, untuk mendeteksi kemungkinan anemia',
      'Skrining diabetes gestasional, umumnya sekitar trimester ke-2',
      'Golongan darah dan skrining antibodi tidak teratur',
      'Tes serologi (toksoplasmosis, rubela) tergantung status kekebalan tubuhmu',
    ],
    prepTips: [
      'Tuliskan pertanyaanmu saat terpikir, sebelum kamu lupa',
      'Bawa buku catatan pemantauan kehamilanmu ke setiap kunjungan',
      'Sebutkan setiap gejala baru, meskipun tampak sepele',
    ],
    neutralText: 'Jumlah dan jadwal pemeriksaan yang pasti bisa berbeda tergantung perawatanmu, profil risikomu, dan praktik di negaramu atau di tempatmu berobat.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Jangan ragu menuliskan pertanyaanmu sebelum setiap kunjungan agar tidak ada yang terlupa saat itu: tidak ada pertanyaan yang terlalu kecil untuk diajukan.',
    shareMessage: 'Kalender pemeriksaan kehamilan — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MedicalExamsArticleScreen({
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

          <AwaText variant="titleSmall" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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
            {content.body1}
          </AwaText>

          <View style={styles.daily}>
            {ULTRASOUND_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.ultrasounds[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.bloodTests.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {content.prepTips.map(item => (
              <View key={item} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="pencil-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="bodySmall" style={styles.consultText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.neutralText}>
              {content.neutralText}
            </AwaText>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
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
  contentNumber: {width: 25},
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
    backgroundColor: theme.colors.primarySoft,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  checkText: {flex: 1},
  consultCard: {
    marginTop: 16,
    padding: 12,
  },
  consultRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultText: {
    flex: 1,
    marginLeft: 12,
  },
  neutralBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  neutralText: {flex: 1},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},
  });
}
