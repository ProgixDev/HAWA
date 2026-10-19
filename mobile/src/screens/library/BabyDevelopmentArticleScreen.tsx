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

const ID = 'babydevelopment-developpement-bebe';

const HERO = require('../../assets/images/library/cycle-phases-diagram.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const MILESTONE_ICONS = [
  'heart-pulse',
  'baby-face-outline',
  'ear-hearing',
  'eye-outline',
] as const;

// PHASE 7L.2 — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'GROSSESSE • DÉVELOPPEMENT',
    title: 'Le développement\ndu bébé in utero',
    metaDuration: '6 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comment ton bébé grandit, trimestre après trimestre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le premier trimestre : les débuts',
      'Le deuxième trimestre : les sens s’éveillent',
      'Le troisième trimestre : la dernière ligne droite',
      'Les grandes étapes en un coup d’œil',
      'Idées reçues',
      'À retenir',
    ],
    body1: 'Dès la 6e semaine, un cœur minuscule commence déjà à battre. Au cours de ce premier trimestre, les organes principaux se mettent progressivement en place.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Le rythme cardiaque du bébé est l’un des premiers signes visibles à l’échographie, souvent un moment marquant du suivi.',
    body2: 'Vers la 20e semaine, tu peux généralement ressentir les premiers mouvements du bébé. C’est aussi la période où ses sens commencent à se développer.',
    body3: 'À partir du 3e trimestre, le bébé prend rapidement du poids et se positionne progressivement pour la naissance.',
    neutralText: 'Le rythme de développement varie d’un bébé à l’autre : ces repères restent des moyennes générales.',
    milestones: [
      'Dès 6 semaines : le cœur commence à battre',
      'Vers 20 semaines : premiers mouvements ressentis',
      'Vers 24-26 semaines : l’audition se développe',
      'Vers 28 semaines : les yeux s’ouvrent progressivement',
    ],
    myths: [
      'Le bébé « entend tout » dès le début : l’audition ne se développe réellement qu’à partir du 2e trimestre',
      'La forme du ventre indique le sexe du bébé : aucune preuve scientifique ne le confirme',
      'Un bébé actif est forcément en meilleure santé : le niveau d’activité varie beaucoup d’un bébé à l’autre',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Chaque étape du développement du bébé suit un rythme propre ; le suivi médical régulier permet de vérifier que tout évolue normalement.',
    shareMessage: 'Le développement du bébé in utero — AWA',
  },
  en: {
    badge: 'PREGNANCY • DEVELOPMENT',
    title: 'Your baby’s development\nin utero',
    metaDuration: '6 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'How your baby grows, trimester by trimester.',
    contentsTitle: 'In this article',
    topics: [
      'The first trimester: the early days',
      'The second trimester: the senses awaken',
      'The third trimester: the home stretch',
      'Key milestones at a glance',
      'Common myths',
      'What to remember',
    ],
    body1: 'From as early as week 6, a tiny heart already begins to beat. Over the course of this first trimester, the main organs gradually form.',
    tip1Title: 'Good to know',
    tip1Text: 'The baby’s heartbeat is one of the first visible signs on ultrasound, often a memorable moment in your care.',
    body2: 'Around week 20, you can usually feel the baby’s first movements. This is also when the senses start to develop.',
    body3: 'From the 3rd trimester onward, the baby gains weight quickly and gradually moves into position for birth.',
    neutralText: 'The pace of development varies from baby to baby: these milestones remain general averages.',
    milestones: [
      'From 6 weeks: the heart begins to beat',
      'Around 20 weeks: first movements felt',
      'Around 24-26 weeks: hearing develops',
      'Around 28 weeks: the eyes gradually open',
    ],
    myths: [
      'The baby “hears everything” from the start: hearing doesn’t really develop until the 2nd trimester',
      'The shape of the belly indicates the baby’s sex: no scientific evidence supports this',
      'An active baby is necessarily healthier: activity levels vary widely from one baby to another',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Each stage of the baby’s development follows its own pace; regular medical check-ups help confirm that everything is progressing normally.',
    shareMessage: 'Baby’s development in utero — AWA',
  },
  es: {
    badge: 'EMBARAZO • DESARROLLO',
    title: 'El desarrollo\ndel bebé en el útero',
    metaDuration: '6 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Cómo crece tu bebé, trimestre tras trimestre.',
    contentsTitle: 'En este artículo',
    topics: [
      'El primer trimestre: los inicios',
      'El segundo trimestre: los sentidos despiertan',
      'El tercer trimestre: la recta final',
      'Los grandes hitos de un vistazo',
      'Ideas falsas',
      'Para recordar',
    ],
    body1: 'Ya desde la semana 6, un corazón diminuto empieza a latir. A lo largo de este primer trimestre, los órganos principales se van formando progresivamente.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'El ritmo cardíaco del bebé es una de las primeras señales visibles en la ecografía, a menudo un momento destacado del seguimiento.',
    body2: 'Hacia la semana 20, generalmente puedes sentir los primeros movimientos del bebé. También es el periodo en el que sus sentidos empiezan a desarrollarse.',
    body3: 'A partir del 3.er trimestre, el bebé gana peso rápidamente y se va colocando progresivamente para el nacimiento.',
    neutralText: 'El ritmo de desarrollo varía de un bebé a otro: estas referencias siguen siendo promedios generales.',
    milestones: [
      'Desde las 6 semanas: el corazón empieza a latir',
      'Hacia las 20 semanas: primeros movimientos percibidos',
      'Hacia las 24-26 semanas: se desarrolla la audición',
      'Hacia las 28 semanas: los ojos se abren progresivamente',
    ],
    myths: [
      'El bebé «lo oye todo» desde el principio: la audición solo se desarrolla realmente a partir del 2.º trimestre',
      'La forma de la barriga indica el sexo del bebé: ninguna prueba científica lo confirma',
      'Un bebé activo es necesariamente más sano: el nivel de actividad varía mucho de un bebé a otro',
    ],
    tip2Title: 'DATO ÚTIL',
    tip2Text: 'Cada etapa del desarrollo del bebé sigue su propio ritmo; el seguimiento médico regular permite comprobar que todo evoluciona con normalidad.',
    shareMessage: 'El desarrollo del bebé en el útero — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • SVILUPPO',
    title: 'Lo sviluppo del tuo bambino\nnell’utero',
    metaDuration: '6 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Come cresce il tuo bambino, trimestre dopo trimestre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il primo trimestre: i primi giorni',
      'Il secondo trimestre: i sensi si risvegliano',
      'Il terzo trimestre: il rettilineo finale',
      'Le tappe principali in sintesi',
      'Falsi miti comuni',
      'Cosa ricordare',
    ],
    body1: 'Già dalla settimana 6, un minuscolo cuore comincia a battere. Nel corso di questo primo trimestre, gli organi principali si formano gradualmente.',
    tip1Title: 'Da sapere',
    tip1Text: 'Il battito cardiaco del bambino è uno dei primi segni visibili all’ecografia, spesso un momento memorabile del tuo percorso di cura.',
    body2: 'Intorno alla settimana 20, di solito puoi sentire i primi movimenti del bambino. È anche il momento in cui i sensi iniziano a svilupparsi.',
    body3: 'A partire dal terzo trimestre, il bambino aumenta rapidamente di peso e si posiziona gradualmente per la nascita.',
    neutralText: 'Il ritmo di sviluppo varia da un bambino all’altro: queste tappe restano medie generali.',
    milestones: [
      'Da 6 settimane: il cuore comincia a battere',
      'Intorno alle 20 settimane: si sentono i primi movimenti',
      'Intorno alle 24-26 settimane: si sviluppa l’udito',
      'Intorno alle 28 settimane: gli occhi si aprono gradualmente',
    ],
    myths: [
      'Il bambino «sente tutto» fin dall’inizio: l’udito non si sviluppa davvero prima del secondo trimestre',
      'La forma della pancia indica il sesso del bambino: nessuna prova scientifica lo conferma',
      'Un bambino attivo è necessariamente più sano: il livello di attività varia molto da un bambino all’altro',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'Ogni fase dello sviluppo del bambino segue il proprio ritmo; i controlli medici regolari aiutano a confermare che tutto procede normalmente.',
    shareMessage: 'Lo sviluppo del bambino nell’utero — AWA',
  },
  tr: {
    badge: 'GEBELİK • GELİŞİM',
    title: 'Bebeğinin rahim içindeki\ngelişimi',
    metaDuration: '6 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bebeğinin üç aylık dönemler boyunca nasıl büyüdüğünü öğren.',
    contentsTitle: 'Bu makalede',
    topics: [
      'İlk trimester: ilk günler',
      'İkinci trimester: duyuların uyanışı',
      'Üçüncü trimester: son düzlük',
      'Önemli gelişim adımları bir bakışta',
      'Sık görülen yanlış inanışlar',
      'Akılda tutulacaklar',
    ],
    body1: 'Daha 6. haftadan itibaren minik bir kalp atmaya başlar. Bu ilk trimester boyunca ana organlar yavaş yavaş oluşur.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bebeğin kalp atışı, ultrasonda görülen ilk belirgin işaretlerden biridir ve takibin sırasında çoğu zaman unutulmaz bir andır.',
    body2: '20. hafta civarında bebeğin ilk hareketlerini genellikle hissedebilirsin. Duyular da bu dönemde gelişmeye başlar.',
    body3: '3. trimesterden itibaren bebek hızla kilo alır ve yavaş yavaş doğum için pozisyonunu alır.',
    neutralText: 'Gelişim hızı bebekten bebeğe değişir: bu adımlar genel ortalamalar olarak kalır.',
    milestones: [
      '6. haftadan itibaren: kalp atmaya başlar',
      '20. hafta civarı: ilk hareketler hissedilir',
      '24-26. hafta civarı: işitme gelişir',
      '28. hafta civarı: gözler yavaş yavaş açılır',
    ],
    myths: [
      'Bebek en başından beri “her şeyi duyar”: işitme, 2. trimesterden önce gerçek anlamda gelişmez',
      'Karnın şekli bebeğin cinsiyetini gösterir: bunu destekleyen bilimsel bir kanıt yoktur',
      'Hareketli bir bebek mutlaka daha sağlıklıdır: hareketlilik düzeyi bebekten bebeğe çok değişir',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Bebeğin gelişiminin her aşaması kendi hızında ilerler; düzenli sağlık kontrolleri her şeyin normal seyrettiğini doğrulamana yardımcı olur.',
    shareMessage: 'Bebeğin rahim içindeki gelişimi — AWA',
  },
  ru: {
    badge: 'БЕРЕМЕННОСТЬ • РАЗВИТИЕ',
    title: 'Развитие вашего ребёнка\nво время беременности',
    metaDuration: '6 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Как растёт ваш малыш — триместр за триместром.',
    contentsTitle: 'В этой статье',
    topics: [
      'Первый триместр: самые первые дни',
      'Второй триместр: просыпаются органы чувств',
      'Третий триместр: финишная прямая',
      'Основные этапы вкратце',
      'Распространённые мифы',
      'Что запомнить',
    ],
    body1: 'Уже примерно с 6-й недели начинает биться крошечное сердце. В течение первого триместра постепенно формируются основные органы.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Сердцебиение малыша — один из первых признаков, которые видны на УЗИ, и часто это запоминающийся момент наблюдения за беременностью.',
    body2: 'Примерно к 20-й неделе обычно можно почувствовать первые шевеления малыша. Именно в это время начинают развиваться органы чувств.',
    body3: 'С третьего триместра малыш быстро набирает вес и постепенно занимает положение для родов.',
    neutralText: 'Темп развития у каждого малыша свой: эти этапы остаются лишь общими средними ориентирами.',
    milestones: [
      'С 6 недель: начинает биться сердце',
      'Около 20 недель: ощущаются первые шевеления',
      'Около 24–26 недель: развивается слух',
      'Около 28 недель: глаза постепенно открываются',
    ],
    myths: [
      'Малыш «слышит всё» с самого начала: на самом деле слух по-настоящему развивается лишь во втором триместре',
      'Форма живота указывает на пол малыша: научных подтверждений этому нет',
      'Активный малыш обязательно здоровее: уровень активности у разных малышей сильно различается',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Каждый этап развития малыша идёт в своём темпе; регулярные медицинские осмотры помогают убедиться, что всё протекает нормально.',
    shareMessage: 'Развитие малыша во время беременности — AWA',
  },
  de: {
    badge: 'SCHWANGERSCHAFT • ENTWICKLUNG',
    title: 'Die Entwicklung deines Babys\nim Mutterleib',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wie dein Baby wächst, Trimester für Trimester.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Das erste Trimester: die ersten Tage',
      'Das zweite Trimester: die Sinne erwachen',
      'Das dritte Trimester: die Zielgerade',
      'Wichtige Meilensteine im Überblick',
      'Verbreitete Mythen',
      'Was du dir merken solltest',
    ],
    body1: 'Schon ab der 6. Woche beginnt ein winziges Herz zu schlagen. Im Laufe dieses ersten Trimesters bilden sich nach und nach die wichtigsten Organe.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Der Herzschlag des Babys gehört zu den ersten sichtbaren Zeichen im Ultraschall und ist oft ein unvergesslicher Moment bei deiner Betreuung.',
    body2: 'Etwa ab der 20. Woche kannst du die ersten Bewegungen des Babys meist spüren. Auch die Sinne beginnen sich in dieser Zeit zu entwickeln.',
    body3: 'Ab dem 3. Trimester nimmt das Baby schnell an Gewicht zu und bringt sich nach und nach in die Geburtsposition.',
    neutralText: 'Das Entwicklungstempo ist von Baby zu Baby verschieden: Diese Meilensteine sind nur allgemeine Durchschnittswerte.',
    milestones: [
      'Ab 6 Wochen: Das Herz beginnt zu schlagen',
      'Etwa ab 20 Wochen: erste Bewegungen spürbar',
      'Etwa ab 24–26 Wochen: das Gehör entwickelt sich',
      'Etwa ab 28 Wochen: die Augen öffnen sich allmählich',
    ],
    myths: [
      'Das Baby „hört von Anfang an alles“: Das Gehör entwickelt sich erst im 2. Trimester richtig',
      'Die Form des Bauchs verrät das Geschlecht des Babys: Dafür gibt es keinen wissenschaftlichen Beleg',
      'Ein aktives Baby ist zwangsläufig gesünder: Wie aktiv Babys sind, ist sehr unterschiedlich',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Jede Entwicklungsphase des Babys verläuft in ihrem eigenen Tempo; regelmäßige ärztliche Kontrollen helfen dabei, sicherzugehen, dass alles normal verläuft.',
    shareMessage: 'Die Entwicklung des Babys im Mutterleib — AWA',
  },
  zh: {
      badge: '怀孕 • 发育',
      title: '宝宝在子宫内的\n发育',
      metaDuration: '阅读约 6 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '宝宝是如何一个孕期阶段一个孕期阶段成长的。',
      contentsTitle: '本文内容',
      topics: [
        '孕早期：最初的日子',
        '孕中期：感官苏醒',
        '孕晚期：最后冲刺',
        '关键里程碑一览',
        '常见误区',
        '需要记住的',
      ],
      body1: '最早从第 6 周起，一颗小小的心脏就已开始跳动。在孕早期的这段时间里，主要器官逐步形成。',
      tip1Title: '小贴士',
      tip1Text: '胎心是超声检查中最先能看到的迹象之一，常常是产检过程中令人难忘的一刻。',
      body2: '大约在第 20 周，你通常可以感觉到宝宝的第一次胎动。这个时期，感官也开始发育。',
      body3: '从孕晚期开始，宝宝体重快速增加，并逐渐转入准备分娩的位置。',
      neutralText: '每个宝宝的发育节奏各不相同：这些里程碑只是一般的平均情况。',
      milestones: [
        '从第 6 周起：心脏开始跳动',
        '约第 20 周：首次感觉到胎动',
        '约第 24 至 26 周：听力发育',
        '约第 28 周：眼睛逐渐睁开',
      ],
      myths: [
        '宝宝从一开始就“什么都能听见”：听力要到孕中期才真正发育',
        '肚子的形状可以说明宝宝的性别：没有任何科学依据支持这一说法',
        '胎动多的宝宝一定更健康：不同宝宝的活跃程度差别很大',
      ],
      tip2Title: '小贴士',
      tip2Text: '宝宝发育的每个阶段都有自己的节奏；定期的产检有助于确认一切都在正常进展。',
      shareMessage: '宝宝在子宫内的发育 — AWA',
    },
  id: {
    badge: 'KEHAMILAN • PERKEMBANGAN',
    title: 'Perkembangan bayimu\ndi dalam rahim',
    metaDuration: '6 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Bagaimana bayimu tumbuh, trimester demi trimester.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Trimester pertama: hari-hari awal',
      'Trimester kedua: indra mulai terbangun',
      'Trimester ketiga: menjelang akhir',
      'Tonggak penting sekilas',
      'Mitos yang umum',
      'Yang perlu diingat',
    ],
    body1: 'Sejak minggu ke-6, jantung kecil sudah mulai berdetak. Sepanjang trimester pertama ini, organ-organ utama terbentuk secara bertahap.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Detak jantung bayi adalah salah satu tanda pertama yang terlihat pada USG, sering kali menjadi momen yang berkesan dalam pemeriksaanmu.',
    body2: 'Sekitar minggu ke-20, kamu biasanya bisa merasakan gerakan pertama bayi. Pada masa ini, indra-indranya juga mulai berkembang.',
    body3: 'Mulai trimester ke-3, bayi bertambah berat badannya dengan cepat dan perlahan bergerak ke posisi untuk persalinan.',
    neutralText: 'Kecepatan perkembangan berbeda dari satu bayi ke bayi lain: tonggak-tonggak ini hanyalah rata-rata umum.',
    milestones: [
      'Mulai 6 minggu: jantung mulai berdetak',
      'Sekitar 20 minggu: gerakan pertama terasa',
      'Sekitar 24-26 minggu: pendengaran berkembang',
      'Sekitar 28 minggu: mata mulai terbuka secara bertahap',
    ],
    myths: [
      'Bayi “mendengar segalanya” sejak awal: pendengaran baru benar-benar berkembang pada trimester ke-2',
      'Bentuk perut menunjukkan jenis kelamin bayi: tidak ada bukti ilmiah yang mendukung hal ini',
      'Bayi yang aktif pasti lebih sehat: tingkat keaktifan sangat beragam dari satu bayi ke bayi lain',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Setiap tahap perkembangan bayi mengikuti iramanya sendiri; pemeriksaan medis rutin membantu memastikan semuanya berjalan normal.',
    shareMessage: 'Perkembangan bayi di dalam rahim — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BabyDevelopmentArticleScreen({
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body3}
          </AwaText>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <View style={styles.daily}>
            {MILESTONE_ICONS.map((icon, index) => (
              <View key={content.milestones[index]} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.milestones[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.myths.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

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
  contentNumber: {width: 25},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},
  neutralBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  neutralText: {flex: 1},
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
  });
}
