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
import {EDITORIAL_IMAGE_ALT, resolveEditorialImage, PREGNANCY_EXERCISE_HERO} from '../../i18n/editorialImages';

const ID = 'exercise-bouger-enceinte';

const HERO = PREGNANCY_EXERCISE_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const RECOMMENDED_ICONS = ['walk', 'swim', 'yoga'] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'GROSSESSE • ACTIVITÉ PHYSIQUE',
    title: 'Bouger pendant\nla grossesse',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Rester active en douceur, en toute sécurité, à chaque trimestre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les activités recommandées',
      'Ce qu’il vaut mieux éviter',
      'Écouter les signaux de ton corps',
      'À noter',
      'À retenir',
    ],
    body1: 'La marche, la natation et le yoga prénatal sont généralement recommandés tout au long de la grossesse, à un rythme adapté à ton ressenti.',
    recommended: ['Marche', 'Natation', 'Yoga prénatal'],
    body2: 'Éviter les sports à impact ou à risque de chute, surtout à partir du deuxième trimestre :',
    toAvoid: [
      'Sports à impact (course intensive, sports de raquette rapides)',
      'Activités avec risque de chute (ski, équitation, vélo en terrain accidenté)',
      'Sports de contact ou de combat',
      'Efforts intenses en altitude ou forte chaleur',
    ],
    listenSigns: [
      'Essoufflement inhabituel ou vertiges',
      'Douleurs, saignements ou contractions pendant l’effort',
      'Fatigue qui ne passe pas après le repos',
    ],
    neutralText: 'Toujours écouter les signaux de ton corps et en parler à ta sage-femme ou ton médecin avant de commencer ou de modifier une activité physique.',
    tipTitle: 'Bon à savoir',
    tipText: 'Une activité douce et régulière est bénéfique pour la plupart des grossesses : l’essentiel est d’adapter l’intensité à chaque étape et à ton propre ressenti.',
    shareMessage: 'Bouger pendant la grossesse — AWA',
  },
  en: {
    badge: 'PREGNANCY • PHYSICAL ACTIVITY',
    title: 'Staying active\nduring pregnancy',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Staying gently active, safely, at every trimester.',
    contentsTitle: 'In this article',
    topics: [
      'Recommended activities',
      'What’s best to avoid',
      'Listening to your body’s signals',
      'Note',
      'Key takeaway',
    ],
    body1: 'Walking, swimming, and prenatal yoga are generally recommended throughout pregnancy, at a pace that matches how you feel.',
    recommended: ['Walking', 'Swimming', 'Prenatal yoga'],
    body2: 'Avoid high-impact sports or activities with a risk of falling, especially from the second trimester onward:',
    toAvoid: [
      'High-impact sports (intense running, fast-paced racquet sports)',
      'Activities with a risk of falling (skiing, horseback riding, cycling on rough terrain)',
      'Contact or combat sports',
      'Intense exertion at altitude or in extreme heat',
    ],
    listenSigns: [
      'Unusual shortness of breath or dizziness',
      'Pain, bleeding, or contractions during exertion',
      'Fatigue that doesn’t go away after resting',
    ],
    neutralText: 'Always listen to your body’s signals and talk to your midwife or doctor before starting or changing a physical activity.',
    tipTitle: 'Good to know',
    tipText: 'Gentle, regular activity is beneficial for most pregnancies: the key is adapting the intensity to each stage and to how you feel.',
    shareMessage: 'Staying active during pregnancy — AWA',
  },
  es: {
    badge: 'EMBARAZO • ACTIVIDAD FÍSICA',
    title: 'Moverte durante\nel embarazo',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Mantenerte activa con suavidad, con toda seguridad, en cada trimestre.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las actividades recomendadas',
      'Lo que es mejor evitar',
      'Escuchar las señales de tu cuerpo',
      'Para tener en cuenta',
      'Para recordar',
    ],
    body1: 'Caminar, nadar y el yoga prenatal generalmente se recomiendan durante todo el embarazo, a un ritmo adaptado a cómo te sientas.',
    recommended: ['Caminar', 'Natación', 'Yoga prenatal'],
    body2: 'Evita los deportes de impacto o con riesgo de caída, sobre todo a partir del segundo trimestre:',
    toAvoid: [
      'Deportes de impacto (carrera intensa, deportes de raqueta rápidos)',
      'Actividades con riesgo de caída (esquí, equitación, bicicleta en terreno accidentado)',
      'Deportes de contacto o de combate',
      'Esfuerzos intensos en altitud o con mucho calor',
    ],
    listenSigns: [
      'Falta de aire inusual o mareos',
      'Dolor, sangrado o contracciones durante el esfuerzo',
      'Fatiga que no desaparece después de descansar',
    ],
    neutralText: 'Escucha siempre las señales de tu cuerpo y habla con tu partera o tu médico antes de empezar o modificar una actividad física.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'Una actividad suave y regular es beneficiosa para la mayoría de los embarazos: lo esencial es adaptar la intensidad a cada etapa y a cómo te sientas.',
    shareMessage: 'Moverte durante el embarazo — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • ATTIVITÀ FISICA',
    title: 'Restare attiva\ndurante la gravidanza',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Restare attiva con dolcezza e in sicurezza, in ogni trimestre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Attività consigliate',
      'Cosa è meglio evitare',
      'Ascoltare i segnali del tuo corpo',
      'Nota',
      'Punto chiave',
    ],
    body1: 'Camminare, nuotare e fare yoga prenatale sono in genere attività consigliate per tutta la gravidanza, a un ritmo adatto a come ti senti.',
    recommended: [
      'Camminata',
      'Nuoto',
      'Yoga prenatale',
    ],
    body2: 'Evita gli sport ad alto impatto o le attività con rischio di caduta, soprattutto dal secondo trimestre in poi:',
    toAvoid: [
      'Sport ad alto impatto (corsa intensa, sport con la racchetta a ritmo sostenuto)',
      'Attività con rischio di caduta (sci, equitazione, ciclismo su terreni accidentati)',
      'Sport di contatto o da combattimento',
      'Sforzi intensi in quota o con caldo estremo',
    ],
    listenSigns: [
      'Mancanza di fiato o capogiri insoliti',
      'Dolore, sanguinamento o contrazioni durante lo sforzo',
      'Stanchezza che non passa dopo il riposo',
    ],
    neutralText: 'Ascolta sempre i segnali del tuo corpo e parlane con la tua ostetrica o il tuo medico prima di iniziare o modificare un’attività fisica.',
    tipTitle: 'Da sapere',
    tipText: 'Un’attività dolce e regolare è benefica per la maggior parte delle gravidanze: l’importante è adattare l’intensità a ogni fase e a come ti senti.',
    shareMessage: 'Restare attiva durante la gravidanza — AWA',
  },
  tr: {
    badge: 'GEBELİK • FİZİKSEL AKTİVİTE',
    title: 'Gebelikte\naktif kalmak',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Her trimesterde nazikçe ve güvenle aktif kalmak.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Önerilen aktiviteler',
      'Kaçınmak daha iyi olanlar',
      'Bedeninin sinyallerini dinlemek',
      'Not',
      'Öne çıkan nokta',
    ],
    body1: 'Yürüyüş, yüzme ve gebelik yogası, kendini nasıl hissettiğine uygun bir tempoda, gebelik boyunca genellikle önerilir.',
    recommended: [
      'Yürüyüş',
      'Yüzme',
      'Gebelik yogası',
    ],
    body2: 'Özellikle ikinci trimesterden itibaren yüksek etkili sporlardan veya düşme riski taşıyan aktivitelerden kaçın:',
    toAvoid: [
      'Yüksek etkili sporlar (yoğun koşu, hızlı tempolu raket sporları)',
      'Düşme riski taşıyan aktiviteler (kayak, at binme, engebeli arazide bisiklet)',
      'Temaslı veya dövüş sporları',
      'Yüksek rakımda veya aşırı sıcakta yoğun efor',
    ],
    listenSigns: [
      'Alışılmadık nefes darlığı veya baş dönmesi',
      'Efor sırasında ağrı, kanama veya kasılmalar',
      'Dinlenince geçmeyen yorgunluk',
    ],
    neutralText: 'Bedeninin sinyallerini her zaman dinle ve fiziksel bir aktiviteye başlamadan ya da onu değiştirmeden önce ebenle veya doktorunla konuş.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Nazik ve düzenli aktivite çoğu gebelik için yararlıdır: önemli olan yoğunluğu her evreye ve kendini nasıl hissettiğine göre ayarlamaktır.',
    shareMessage: 'Gebelikte aktif kalmak — AWA',
  },
  ru: {
    badge: 'БЕРЕМЕННОСТЬ • ФИЗИЧЕСКАЯ АКТИВНОСТЬ',
    title: 'Оставаться активной\nво время беременности',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Оставаться мягко активной безопасно на каждом триместре.',
    contentsTitle: 'В этой статье',
    topics: [
      'Рекомендуемые виды активности',
      'Чего лучше избегать',
      'Прислушиваться к сигналам тела',
      'Примечание',
      'Главный вывод',
    ],
    body1: 'Ходьба, плавание и йога для беременных, как правило, рекомендуются на протяжении всей беременности в темпе, соответствующем вашему самочувствию.',
    recommended: ['Ходьба', 'Плавание', 'Йога для беременных'],
    body2: 'Избегайте видов спорта с высокой ударной нагрузкой и занятий с риском падения, особенно начиная со второго триместра:',
    toAvoid: [
      'Виды спорта с высокой ударной нагрузкой (интенсивный бег, быстрые игры с ракеткой)',
      'Занятия с риском падения (лыжи, верховая езда, езда на велосипеде по пересечённой местности)',
      'Контактные виды спорта и единоборства',
      'Интенсивные нагрузки на высоте или в сильную жару',
    ],
    listenSigns: [
      'Необычная одышка или головокружение',
      'Боль, кровянистые выделения или схватки во время нагрузки',
      'Усталость, которая не проходит после отдыха',
    ],
    neutralText: 'Всегда прислушивайтесь к сигналам своего тела и поговорите с акушеркой или врачом, прежде чем начинать или менять физическую активность.',
    tipTitle: 'Полезно знать',
    tipText: 'Мягкая регулярная активность полезна при большинстве беременностей: главное — подбирать интенсивность в соответствии с этапом и вашим самочувствием.',
    shareMessage: 'Оставаться активной во время беременности — AWA',
  },
  de: {
    badge: 'SCHWANGERSCHAFT • KÖRPERLICHE AKTIVITÄT',
    title: 'In der Schwangerschaft\naktiv bleiben',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Sanft und sicher aktiv bleiben, in jedem Trimester.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Empfohlene Aktivitäten',
      'Was du besser vermeidest',
      'Auf die Signale deines Körpers hören',
      'Hinweis',
      'Das Wichtigste',
    ],
    body1: 'Spazierengehen, Schwimmen und Yoga für Schwangere werden während der gesamten Schwangerschaft in der Regel empfohlen, in einem Tempo, das zu deinem Befinden passt.',
    recommended: ['Spazierengehen', 'Schwimmen', 'Schwangerschaftsyoga'],
    body2: 'Vermeide Sportarten mit hoher Belastung oder mit Sturzrisiko, besonders ab dem zweiten Trimester:',
    toAvoid: [
      'Sportarten mit hoher Stoßbelastung (intensives Laufen, schnelle Rückschlagsportarten)',
      'Aktivitäten mit Sturzrisiko (Skifahren, Reiten, Radfahren im unebenen Gelände)',
      'Kontakt- oder Kampfsportarten',
      'Intensive Anstrengung in großer Höhe oder bei extremer Hitze',
    ],
    listenSigns: [
      'Ungewöhnliche Atemnot oder Schwindel',
      'Schmerzen, Blutungen oder Kontraktionen bei Anstrengung',
      'Müdigkeit, die auch nach Ausruhen nicht vergeht',
    ],
    neutralText: 'Höre immer auf die Signale deines Körpers und sprich mit deiner Hebamme oder deiner Ärztin bzw. deinem Arzt, bevor du eine körperliche Aktivität beginnst oder änderst.',
    tipTitle: 'Gut zu wissen',
    tipText: 'Sanfte, regelmäßige Bewegung tut den meisten Schwangerschaften gut: Entscheidend ist, die Intensität an jede Phase und an dein Befinden anzupassen.',
    shareMessage: 'In der Schwangerschaft aktiv bleiben — AWA',
  },
  zh: {
      badge: '怀孕 • 体育活动',
      title: '孕期保持\n适度活动',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '在孕期的每个阶段，安全、轻柔地保持活动。',
      contentsTitle: '本文内容',
      topics: [
        '推荐的活动',
        '最好避免的活动',
        '倾听身体的信号',
        '注意',
        '核心要点',
      ],
      body1: '散步、游泳和孕妇瑜伽通常适合整个孕期，按照你自己的感觉调整节奏即可。',
      recommended: [
        '散步',
        '游泳',
        '孕妇瑜伽',
      ],
      body2: '请避免高冲击运动或有跌倒风险的活动，尤其是从孕中期开始：',
      toAvoid: [
        '高冲击运动（高强度跑步、节奏快的球拍类运动）',
        '有跌倒风险的活动（滑雪、骑马、在崎岖路面骑行）',
        '接触性或搏击类运动',
        '在高海拔地区或极端高温下的高强度运动',
      ],
      listenSigns: [
        '异常的气短或头晕',
        '运动时出现疼痛、出血或宫缩',
        '休息后仍不缓解的疲倦',
      ],
      neutralText: '请始终倾听身体发出的信号，在开始或调整任何体育活动之前，先咨询你的助产士或医生。',
      tipTitle: '小贴士',
      tipText: '轻柔而规律的活动，对大多数孕期都有益：关键是根据每个阶段和你的感觉来调整强度。',
      shareMessage: '孕期保持适度活动 — AWA',
    },
  id: {
    badge: 'KEHAMILAN • AKTIVITAS FISIK',
    title: 'Tetap aktif\nselama kehamilan',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Tetap aktif dengan lembut, dengan aman, di setiap trimester.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Aktivitas yang dianjurkan',
      'Yang sebaiknya dihindari',
      'Mendengarkan sinyal tubuhmu',
      'Catatan',
      'Poin penting',
    ],
    body1: 'Berjalan kaki, berenang, dan yoga prenatal umumnya dianjurkan sepanjang kehamilan, dengan tempo yang sesuai dengan kondisimu.',
    recommended: [
      'Berjalan kaki',
      'Berenang',
      'Yoga prenatal',
    ],
    body2: 'Hindari olahraga berdampak tinggi atau aktivitas yang berisiko jatuh, terutama mulai trimester kedua:',
    toAvoid: [
      'Olahraga berdampak tinggi (lari intens, olahraga raket dengan tempo cepat)',
      'Aktivitas yang berisiko jatuh (ski, berkuda, bersepeda di medan kasar)',
      'Olahraga kontak atau bela diri',
      'Aktivitas berat di ketinggian atau di cuaca yang sangat panas',
    ],
    listenSigns: [
      'Sesak napas atau pusing yang tidak biasa',
      'Nyeri, perdarahan, atau kontraksi saat beraktivitas',
      'Kelelahan yang tidak hilang setelah beristirahat',
    ],
    neutralText: 'Selalu dengarkan sinyal tubuhmu dan bicarakan dengan bidan atau dokter sebelum memulai atau mengubah aktivitas fisik.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Aktivitas yang lembut dan teratur bermanfaat bagi sebagian besar kehamilan: kuncinya adalah menyesuaikan intensitas dengan setiap tahap dan dengan kondisimu.',
    shareMessage: 'Tetap aktif selama kehamilan — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PregnancyExerciseArticleScreen({
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
          <Image accessible accessibilityLabel={EDITORIAL_IMAGE_ALT.pregnancyExercise[lang]} accessibilityRole="image" source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>{content.title}</AwaText>

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
            {RECOMMENDED_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.recommended[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.toAvoid.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {content.listenSigns.map(item => (
              <View key={item} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
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
