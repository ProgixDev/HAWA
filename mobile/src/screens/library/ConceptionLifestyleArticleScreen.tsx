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
  ru: {
    badge: 'ОБРАЗ ЖИЗНИ',
    title: 'Привычки образа жизни и\nпуть к зачатию',
    metaDuration: '5 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Простые привычки, которые могут поддержать вас на этом пути, — без давления.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что может поддерживать фертильность',
      'Стресс — фактор, который нельзя упускать из виду',
      'Что лучше ограничить',
      'Главное',
    ],
    body1: 'Некоторые простые привычки образа жизни могут поддерживать путь к зачатию, хотя сами по себе не могут гарантировать результат.',
    supportiveHabits: [
      'Сбалансированное питание',
      'Умеренная физическая активность',
      'Качественный сон',
      'Моменты расслабления',
    ],
    body2: 'Хронический стресс может влиять на гормональный баланс и у некоторых женщин — на регулярность цикла. Позволять себе моменты спокойствия — полноценная часть этого пути.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Желание «сделать всё правильно» само по себе может стать источником стресса: достаточно стремиться к здоровым в целом привычкам, без перфекционизма.',
    toLimit: [
      'Курение, которое может влиять на фертильность обоих партнёров',
      'Чрезмерное употребление алкоголя',
      'Интенсивные и длительные спортивные тренировки, которые, напротив, могут снижать фертильность',
      'Избыток рафинированного сахара, который может нарушать гормональный баланс',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Привычки, в целом сбалансированные, без излишеств и перфекционизма, — лучшая повседневная поддержка.',
    shareMessage: 'Привычки образа жизни и путь к зачатию — AWA',
  },
  de: {
    badge: 'LEBENSSTIL',
    title: 'Lebensstil und\ndein Weg zum Wunschkind',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Einfache Gewohnheiten, die dich auf deinem Weg unterstützen können – ganz ohne Druck.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was die Fruchtbarkeit unterstützen kann',
      'Stress – ein Faktor, den man nicht übersehen sollte',
      'Was du besser einschränken solltest',
      'Das Wichtigste in Kürze',
    ],
    body1: 'Einige einfache Lebensgewohnheiten können deinen Weg zur Schwangerschaft unterstützen, ein Ergebnis garantieren sie für sich allein jedoch nicht.',
    supportiveHabits: [
      'Eine ausgewogene Ernährung',
      'Moderate körperliche Aktivität',
      'Erholsamer Schlaf',
      'Momente der Entspannung',
    ],
    body2: 'Chronischer Stress kann das hormonelle Gleichgewicht und bei manchen Frauen die Regelmäßigkeit des Zyklus beeinflussen. Dir Momente der Ruhe zu gönnen, gehört ganz selbstverständlich zu diesem Weg.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Alles „richtig machen“ zu wollen, kann selbst zur Stressquelle werden: Es genügt, auf insgesamt gesunde Gewohnheiten zu achten – ohne Perfektionismus.',
    toLimit: [
      'Rauchen, das die Fruchtbarkeit beider Partner beeinträchtigen kann',
      'Übermäßiger Alkoholkonsum',
      'Intensives, langanhaltendes sportliches Training, das die Fruchtbarkeit umgekehrt sogar bremsen kann',
      'Zu viel raffinierter Zucker, der das hormonelle Gleichgewicht stören kann',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Insgesamt ausgewogene Gewohnheiten, ohne Übertreibung und Perfektionismus, sind die beste Unterstützung im Alltag.',
    shareMessage: 'Lebensstil und dein Weg zum Wunschkind – AWA',
  },
  zh: {
      badge: '生活方式',
      title: '生活习惯与\n你的备孕之路',
      metaDuration: '阅读约 5 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '一些简单的习惯，可以为你的备孕之路提供支持，不必有任何压力。',
      contentsTitle: '本文内容',
      topics: [
        '哪些习惯有助于生育力',
        '压力，不容忽视的因素',
        '最好少碰的东西',
        '核心要点',
      ],
      body1: '一些简单的生活习惯可以为备孕提供支持，不过仅凭它们并不能保证结果。',
      supportiveHabits: [
        '均衡饮食',
        '适度的运动',
        '高质量的睡眠',
        '放松的时刻',
      ],
      body2: '长期的压力可能影响激素平衡，在一些女性身上还可能影响周期的规律性。给自己一些平静的时刻，本身就是备孕之路的一部分。',
      tip1Title: '小贴士',
      tip1Text: '想要“样样都做到最好”，本身也可能成为压力的来源：保持总体健康的习惯就足够了，不必追求完美。',
      toLimit: [
        '吸烟，可能影响双方的生育力',
        '过量饮酒',
        '强度大、持续时间长的运动训练，反而可能让生育力下降',
        '过多的精制糖，可能扰乱激素平衡',
      ],
      tip2Title: '小贴士',
      tip2Text: '总体均衡、不过度也不追求完美的习惯，是日常里最好的支持。',
      shareMessage: '生活习惯与备孕之路 — AWA',
    },
  id: {
    badge: 'GAYA HIDUP',
    title: 'Kebiasaan gaya hidup dan\nperjalanan program hamilmu',
    metaDuration: '5 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Kebiasaan sederhana yang dapat mendukung perjalananmu — tanpa tekanan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Yang dapat mendukung kesuburan',
      'Stres, faktor yang tidak boleh diabaikan',
      'Yang sebaiknya dibatasi',
      'Poin penting',
    ],
    body1: 'Beberapa kebiasaan gaya hidup yang sederhana dapat mendukung perjalanan program hamil, meski tidak bisa menjamin hasil dengan sendirinya.',
    supportiveHabits: [
      'Pola makan seimbang',
      'Aktivitas fisik yang sedang',
      'Tidur berkualitas',
      'Momen relaksasi',
    ],
    body2: 'Stres kronis dapat memengaruhi keseimbangan hormon dan, pada sebagian perempuan, keteraturan siklus. Memberi dirimu momen tenang adalah bagian penting dari perjalanan ini.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Keinginan untuk “melakukan segalanya dengan benar” bisa menjadi sumber stres tersendiri: cukup upayakan kebiasaan yang secara umum sehat, tanpa perfeksionisme.',
    toLimit: [
      'Merokok, yang dapat memengaruhi kesuburan pada kedua pasangan',
      'Konsumsi alkohol berlebihan',
      'Latihan atletik yang intens dan berkepanjangan, yang justru dapat memperlambat kesuburan',
      'Gula rafinasi berlebihan, yang dapat mengganggu keseimbangan hormon',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Kebiasaan yang secara umum seimbang, tanpa berlebihan atau perfeksionisme, adalah dukungan terbaik sehari-hari.',
    shareMessage: 'Kebiasaan gaya hidup dan perjalanan program hamil — AWA',
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <View style={styles.daily}>
            {content.supportiveHabits.map((label, index) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={SUPPORTIVE_HABITS_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{label}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.toLimit.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

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

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
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
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {flex: 1},
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
