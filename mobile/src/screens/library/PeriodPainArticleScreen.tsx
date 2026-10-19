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
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';

const ID = 'pain-gerer-douleurs';

const HERO = require('../../assets/images/library/pain-hero.png');

// Images/icons stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these assets.
const SOL_IMAGES = [
  require('../../assets/images/library/pain-heat.png'),
  require('../../assets/images/library/pain-movement.png'),
  require('../../assets/images/library/pain-food.png'),
  require('../../assets/images/library/pain-water.png'),
  require('../../assets/images/library/pain-massage.png'),
] as const;

const DAILY_ICONS = [
  'weather-sunny',
  'food-apple-outline',
  'sleep',
  'calendar-heart',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'DOULEURS',
    title: 'Gérer les douleurs\nmenstruelles',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Chaleur, mouvement doux, alimentation : des gestes qui soulagent vraiment.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre les douleurs menstruelles',
      'Les solutions naturelles efficaces',
      'Quand faut-il consulter ?',
      'Conseils pratiques au quotidien',
    ],
    section1Text: 'Les crampes viennent des contractions utérines qui aident à évacuer la muqueuse. Elles sont dues aux prostaglandines. Chaque corps réagit différemment.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Les douleurs peuvent varier d’un cycle à l’autre et ne sont pas toujours identiques.',
    solutions: [
      {title: 'Chaleur', text: 'Une bouillotte sur le bas-ventre peut détendre les muscles.'},
      {title: 'Mouvement doux', text: 'Yoga, étirements et marche légère soulagent les tensions.'},
      {title: 'Alimentation', text: 'Magnésium, oméga-3 et aliments anti-inflammatoires.'},
      {title: 'Hydratation', text: 'Boire suffisamment aide à limiter les ballonnements.'},
      {title: 'Massage', text: 'Un massage circulaire du bas-ventre détend.'},
    ],
    section3Text: 'Si les douleurs t’empêchent de vivre normalement chaque mois malgré ces solutions, il est important d’en parler à un professionnel de santé.',
    alertTitle: 'Consulter si',
    alertText: 'Douleurs très intenses, saignements importants, fatigue extrême ou symptômes anormaux.',
    dailyTips: [
      'Échauffe doucement ton corps au réveil',
      'Privilégie une alimentation équilibrée',
      'Prends le temps de respirer et te détendre',
      'Suis ton cycle pour mieux comprendre tes douleurs',
    ],
    shareMessage: 'Gérer les douleurs menstruelles — AWA',
  },
  en: {
    badge: 'PAIN',
    title: 'Managing period\npain',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Heat, gentle movement, diet: habits that really bring relief.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding period pain',
      'Effective natural solutions',
      'When should you see a doctor?',
      'Practical everyday tips',
    ],
    section1Text: 'Cramps come from uterine contractions that help shed the uterine lining. They’re caused by prostaglandins. Every body reacts differently.',
    tip1Title: 'Good to know',
    tip1Text: 'Pain can vary from one cycle to the next and isn’t always the same.',
    solutions: [
      {title: 'Heat', text: 'A hot water bottle on your lower abdomen can relax the muscles.'},
      {title: 'Gentle movement', text: 'Yoga, stretching, and light walking relieve tension.'},
      {title: 'Diet', text: 'Magnesium, omega-3s, and anti-inflammatory foods.'},
      {title: 'Hydration', text: 'Drinking enough water helps limit bloating.'},
      {title: 'Massage', text: 'A circular massage on your lower abdomen helps you relax.'},
    ],
    section3Text: 'If the pain keeps you from living normally every month despite these solutions, it’s important to talk to a healthcare professional.',
    alertTitle: 'See a doctor if',
    alertText: 'Very intense pain, heavy bleeding, extreme fatigue, or abnormal symptoms.',
    dailyTips: [
      'Gently warm up your body when you wake up',
      'Favor a balanced diet',
      'Take time to breathe and relax',
      'Track your cycle to better understand your pain',
    ],
    shareMessage: 'Managing period pain — AWA',
  },
  es: {
    badge: 'DOLORES',
    title: 'Manejar los dolores\nmenstruales',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Calor, movimiento suave, alimentación: gestos que realmente alivian.',
    contentsTitle: 'En este artículo',
    topics: [
      'Entender los dolores menstruales',
      'Soluciones naturales eficaces',
      '¿Cuándo hay que consultar?',
      'Consejos prácticos para el día a día',
    ],
    section1Text: 'Los cólicos provienen de las contracciones uterinas que ayudan a expulsar el revestimiento uterino. Se deben a las prostaglandinas. Cada cuerpo reacciona de forma diferente.',
    tip1Title: 'Dato útil',
    tip1Text: 'Los dolores pueden variar de un ciclo a otro y no son siempre iguales.',
    solutions: [
      {title: 'Calor', text: 'Una bolsa de agua caliente en la parte baja del abdomen puede relajar los músculos.'},
      {title: 'Movimiento suave', text: 'El yoga, los estiramientos y caminar suavemente alivian las tensiones.'},
      {title: 'Alimentación', text: 'Magnesio, omega-3 y alimentos antiinflamatorios.'},
      {title: 'Hidratación', text: 'Beber suficiente agua ayuda a limitar la hinchazón.'},
      {title: 'Masaje', text: 'Un masaje circular en la parte baja del abdomen ayuda a relajar.'},
    ],
    section3Text: 'Si los dolores te impiden llevar una vida normal cada mes a pesar de estas soluciones, es importante hablar de ello con un profesional de la salud.',
    alertTitle: 'Consulta si',
    alertText: 'Dolores muy intensos, sangrado abundante, fatiga extrema o síntomas anormales.',
    dailyTips: [
      'Calienta suavemente tu cuerpo al despertar',
      'Opta por una alimentación equilibrada',
      'Tómate tiempo para respirar y relajarte',
      'Haz seguimiento de tu ciclo para entender mejor tus dolores',
    ],
    shareMessage: 'Manejar los dolores menstruales — AWA',
  },
  it: {
    badge: 'DOLORE',
    title: 'Gestire il dolore\nmestruale',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Calore, movimento dolce, alimentazione: abitudini che portano davvero sollievo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Capire il dolore mestruale',
      'Rimedi naturali efficaci',
      'Quando rivolgersi al medico?',
      'Consigli pratici per ogni giorno',
    ],
    section1Text: 'I crampi derivano dalle contrazioni dell’utero che aiutano a eliminare il rivestimento uterino. Sono causati dalle prostaglandine. Ogni corpo reagisce in modo diverso.',
    tip1Title: 'Da sapere',
    tip1Text: 'Il dolore può variare da un ciclo all’altro e non è sempre uguale.',
    solutions: [
      {
        title: 'Calore',
        text: 'Una borsa dell’acqua calda sul basso ventre può rilassare i muscoli.',
      },
      {
        title: 'Movimento dolce',
        text: 'Yoga, stretching e camminate leggere alleviano la tensione.',
      },
      {
        title: 'Alimentazione',
        text: 'Magnesio, omega-3 e alimenti antinfiammatori.',
      },
      {
        title: 'Idratazione',
        text: 'Bere abbastanza acqua aiuta a limitare il gonfiore.',
      },
      {
        title: 'Massaggio',
        text: 'Un massaggio circolare sul basso ventre ti aiuta a rilassarti.',
      },
    ],
    section3Text: 'Se, nonostante questi rimedi, il dolore ti impedisce ogni mese di vivere normalmente, è importante parlarne con un operatore sanitario.',
    alertTitle: 'Rivolgiti a un medico se',
    alertText: 'Dolore molto intenso, sanguinamento abbondante, stanchezza estrema o sintomi anomali.',
    dailyTips: [
      'Scalda dolcemente il corpo al risveglio',
      'Privilegia un’alimentazione equilibrata',
      'Prenditi del tempo per respirare e rilassarti',
      'Monitora il tuo ciclo per capire meglio il tuo dolore',
    ],
    shareMessage: 'Gestire il dolore mestruale — AWA',
  },
  tr: {
    badge: 'AĞRI',
    title: 'Adet ağrısıyla\nbaşa çıkmak',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Sıcaklık, hafif hareket, beslenme: gerçekten rahatlama sağlayan alışkanlıklar.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Adet ağrısını anlamak',
      'Etkili doğal çözümler',
      'Ne zaman doktora başvurmalı?',
      'Günlük hayat için pratik ipuçları',
    ],
    section1Text: 'Kramplar, rahim iç tabakasının dökülmesine yardımcı olan rahim kasılmalarından kaynaklanır. Bunlara prostaglandinler neden olur. Her vücut farklı tepki verir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Ağrı bir döngüden diğerine değişebilir ve her zaman aynı olmaz.',
    solutions: [
      {
        title: 'Sıcaklık',
        text: 'Alt karnına konan bir sıcak su torbası kasları gevşetebilir.',
      },
      {
        title: 'Hafif hareket',
        text: 'Yoga, esneme ve hafif yürüyüş gerginliği azaltır.',
      },
      {
        title: 'Beslenme',
        text: 'Magnezyum, omega-3 ve iltihap önleyici besinler.',
      },
      {
        title: 'Sıvı alımı',
        text: 'Yeterince su içmek şişkinliği sınırlamaya yardımcı olur.',
      },
      {
        title: 'Masaj',
        text: 'Alt karnına yapılan dairesel bir masaj rahatlamana yardımcı olur.',
      },
    ],
    section3Text: 'Bu çözümlere rağmen ağrı her ay normal yaşamanı engelliyorsa, bir sağlık profesyonelle konuşman önemlidir.',
    alertTitle: 'Şu durumlarda doktora başvur',
    alertText: 'Çok şiddetli ağrı, yoğun kanama, aşırı yorgunluk veya olağandışı belirtiler.',
    dailyTips: [
      'Sabah uyandığında vücudunu nazikçe ısıt',
      'Dengeli beslenmeyi tercih et',
      'Nefes almak ve rahatlamak için zaman ayır',
      'Ağrını daha iyi anlamak için döngünü takip et',
    ],
    shareMessage: 'Adet ağrısıyla başa çıkmak — AWA',
  },
  ru: {
    badge: 'БОЛЬ',
    title: 'Как справляться\nс болью при месячных',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Тепло, мягкое движение, питание: привычки, которые действительно приносят облегчение.',
    contentsTitle: 'В этой статье',
    topics: [
      'Как понять боль при месячных',
      'Эффективные натуральные средства',
      'Когда стоит обратиться к врачу?',
      'Практические советы на каждый день',
    ],
    section1Text: 'Спазмы возникают из-за сокращений матки, которые помогают отторгнуть слизистую оболочку. Их вызывают простагландины. Каждый организм реагирует по-своему.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Боль может меняться от цикла к циклу и не всегда бывает одинаковой.',
    solutions: [
      {title: 'Тепло', text: 'Грелка на низ живота может расслабить мышцы.'},
      {title: 'Мягкое движение', text: 'Йога, растяжка и неспешная ходьба снимают напряжение.'},
      {title: 'Питание', text: 'Магний, омега-3 и продукты с противовоспалительным действием.'},
      {title: 'Питьевой режим', text: 'Достаточное количество воды помогает уменьшить вздутие.'},
      {title: 'Массаж', text: 'Круговой массаж низа живота помогает расслабиться.'},
    ],
    section3Text: 'Если, несмотря на эти способы, боль каждый месяц мешает вам жить обычной жизнью, важно поговорить с медицинским специалистом.',
    alertTitle: 'Обратитесь к врачу, если',
    alertText: 'Очень сильная боль, обильное кровотечение, крайняя усталость или необычные симптомы.',
    dailyTips: [
      'Мягко разминайте тело после пробуждения',
      'Отдавайте предпочтение сбалансированному питанию',
      'Находите время, чтобы подышать и расслабиться',
      'Отслеживайте свой цикл, чтобы лучше понимать причины боли',
    ],
    shareMessage: 'Как справляться с болью при месячных — AWA',
  },
  de: {
    badge: 'SCHMERZEN',
    title: 'Periodenschmerzen\nlindern',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wärme, sanfte Bewegung, Ernährung: Gewohnheiten, die wirklich Linderung bringen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Periodenschmerzen verstehen',
      'Wirksame natürliche Lösungen',
      'Wann solltest du zur Ärztin oder zum Arzt?',
      'Praktische Alltagstipps',
    ],
    section1Text: 'Krämpfe entstehen durch Kontraktionen der Gebärmutter, die helfen, die Gebärmutterschleimhaut abzustoßen. Sie werden durch Prostaglandine verursacht. Jeder Körper reagiert anders.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Die Schmerzen können von Zyklus zu Zyklus unterschiedlich sein und sind nicht immer gleich.',
    solutions: [
      {title: 'Wärme', text: 'Eine Wärmflasche auf dem Unterbauch kann die Muskeln entspannen.'},
      {title: 'Sanfte Bewegung', text: 'Yoga, Dehnübungen und leichtes Gehen lösen Verspannungen.'},
      {title: 'Ernährung', text: 'Magnesium, Omega-3-Fettsäuren und entzündungshemmende Lebensmittel.'},
      {title: 'Flüssigkeit', text: 'Ausreichend zu trinken hilft, Blähungen zu begrenzen.'},
      {title: 'Massage', text: 'Eine kreisende Massage auf dem Unterbauch hilft dir, dich zu entspannen.'},
    ],
    section3Text: 'Wenn dich die Schmerzen trotz dieser Maßnahmen jeden Monat daran hindern, ein normales Leben zu führen, ist es wichtig, mit medizinischem Fachpersonal zu sprechen.',
    alertTitle: 'Ärztlichen Rat suchen bei',
    alertText: 'Sehr starken Schmerzen, starken Blutungen, extremer Erschöpfung oder ungewöhnlichen Symptomen.',
    dailyTips: [
      'Wärme deinen Körper beim Aufwachen sanft auf',
      'Bevorzuge eine ausgewogene Ernährung',
      'Nimm dir Zeit zum Atmen und Entspannen',
      'Beobachte deinen Zyklus, um deine Schmerzen besser zu verstehen',
    ],
    shareMessage: 'Periodenschmerzen lindern – AWA',
  },
  zh: {
      badge: '疼痛',
      title: '应对\n经期疼痛',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '热敷、轻柔的活动、饮食：真正能带来缓解的习惯。',
      contentsTitle: '本文内容',
      topics: [
        '了解经期疼痛',
        '有效的自然缓解方法',
        '何时应该就医？',
        '日常实用小建议',
      ],
      section1Text: '痛经来自子宫的收缩，这种收缩有助于子宫内膜脱落，由前列腺素引起。每个人的身体反应都不一样。',
      tip1Title: '小贴士',
      tip1Text: '疼痛在不同的周期之间可能有所不同，并不总是一样。',
      solutions: [
        {
          title: '热敷',
          text: '把热水袋放在下腹部，可以让肌肉放松。',
        },
        {
          title: '轻柔的活动',
          text: '瑜伽、拉伸和轻松的散步可以缓解紧绷感。',
        },
        {
          title: '饮食',
          text: '镁、欧米伽-3 和具有抗炎作用的食物。',
        },
        {
          title: '补水',
          text: '喝足够的水有助于减轻腹胀。',
        },
        {
          title: '按摩',
          text: '在下腹部做环形按摩，有助于放松。',
        },
      ],
      section3Text: '如果尽管用了这些方法，疼痛仍然每个月都影响你的正常生活，那么和医疗专业人员谈一谈很重要。',
      alertTitle: '出现以下情况请就医',
      alertText: '疼痛非常剧烈、出血量很多、极度疲倦，或出现异常症状。',
      dailyTips: [
        '起床后轻柔地活动一下身体',
        '优先选择均衡的饮食',
        '花点时间深呼吸、放松',
        '记录月经周期，以便更好地了解自己的疼痛',
      ],
      shareMessage: '应对经期疼痛 — AWA',
    },
  id: {
    badge: 'NYERI',
    title: 'Mengatasi\nnyeri haid',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Kehangatan, gerakan lembut, pola makan: kebiasaan yang benar-benar meredakan nyeri.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami nyeri haid',
      'Solusi alami yang efektif',
      'Kapan harus ke dokter?',
      'Tips praktis sehari-hari',
    ],
    section1Text: 'Kram berasal dari kontraksi rahim yang membantu meluruhkan lapisan dinding rahim. Kram ini disebabkan oleh prostaglandin. Setiap tubuh bereaksi secara berbeda.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Nyeri bisa berbeda dari satu siklus ke siklus berikutnya dan tidak selalu sama.',
    solutions: [
      {
        title: 'Kehangatan',
        text: 'Botol air panas di perut bagian bawah dapat merelaksasi otot.',
      },
      {
        title: 'Gerakan lembut',
        text: 'Yoga, peregangan, dan jalan kaki ringan meredakan ketegangan.',
      },
      {
        title: 'Pola makan',
        text: 'Magnesium, omega-3, dan makanan antiradang.',
      },
      {
        title: 'Asupan air',
        text: 'Minum air yang cukup membantu mengurangi kembung.',
      },
      {
        title: 'Pijat',
        text: 'Pijatan melingkar di perut bagian bawah membantumu rileks.',
      },
    ],
    section3Text: 'Jika nyeri membuatmu tidak bisa beraktivitas normal setiap bulan meski sudah mencoba solusi-solusi ini, penting untuk berbicara dengan tenaga kesehatan.',
    alertTitle: 'Temui dokter jika',
    alertText: 'Nyeri yang sangat hebat, perdarahan deras, kelelahan ekstrem, atau gejala yang tidak biasa.',
    dailyTips: [
      'Hangatkan tubuhmu dengan lembut saat bangun tidur',
      'Utamakan pola makan seimbang',
      'Luangkan waktu untuk bernapas dan rileks',
      'Catat siklusmu agar lebih memahami nyerimu',
    ],
    shareMessage: 'Mengatasi nyeri haid — AWA',
  },
} as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function PeriodPainArticleScreen({
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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
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
                icon={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              [
                'book-open-page-variant-outline',
                content.metaType,
              ],
              ['chart-bar', content.metaLevel],
              [
                'shield-check-outline',
                content.metaValidated,
              ],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {text}
                  </AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="titleMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>
                    {index + 1}.
                  </AwaText>

                  <AwaText variant="bodyMedium" style={styles.contentText}>
                    {item}
                  </AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Text}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.solutions}>
            {content.solutions.map(({title, text}, index) => (
              <View
                key={title}
                style={styles.solution}>
                <Image
                  source={SOL_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.solImage}
                />

                <AwaText variant="titleSmall" emphasized style={styles.solTitle}>
                  {title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.solText}>
                  {text}
                </AwaText>
              </View>
            ))}
          </ScrollView>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section3Text}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.alertTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <View style={styles.daily}>
            {content.dailyTips.map((text, index) => (
              <View
                key={text}
                style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={DAILY_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {text}
                </AwaText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
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
    paddingBottom: 32,
  },

  heroWrap: {
    height: 245,
  },

  hero: {
    width: '100%',
    height: '100%',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },



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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },


  intro: {
    marginTop: 16,
  },

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsTitle: {
    marginBottom: 8,
  },

  contentRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 24,
  },

  contentText: {
    flex: 1,
  },

  h2: {
    marginTop: 24,
  },

  body: {
    marginTop: 8,
  },

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 3,
  },

  solutions: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 3,
  },

  solution: {
    width: 132,
    minHeight: 215,
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  solImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },

  solTitle: {
    marginTop: 8,
  },

  solText: {
    marginTop: 8,
    textAlign: 'center',
  },

  daily: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

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
  });
}