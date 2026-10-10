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

const ID = 'bones-sante-osseuse';

const HERO = require('../../assets/images/library/food-magnesium.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PREVENTION_ICONS = [
  'bowl-mix-outline',
  'weather-sunny',
  'shoe-sneaker',
  'smoking-off',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SANTÉ OSSEUSE',
    title: 'Prendre soin de\nsa santé osseuse',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi la ménopause augmente le risque d’ostéoporose, et comment protéger ses os au quotidien.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi la ménopause fragilise les os',
      'Ostéopénie et ostéoporose',
      'Le dépistage par ostéodensitométrie',
      'Les piliers de la prévention',
      'Facteurs qui augmentent le risque',
      'À retenir',
    ],
    body1: 'Les œstrogènes protègent naturellement la densité osseuse en freinant le renouvellement osseux. Leur baisse pendant la ménopause accélère la perte osseuse, surtout durant les premières années suivant l’arrêt des règles.',
    body2: 'L’ostéopénie désigne une densité osseuse plus basse que la normale, sans atteindre le seuil de l’ostéoporose. L’ostéoporose correspond à une fragilité osseuse plus marquée, qui augmente le risque de fracture, notamment en cas de chute.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Ces deux termes décrivent une perte de densité osseuse, pas une fracture déjà présente : ils invitent à la prévention, pas à l’inquiétude.',
    body3: 'Cet examen indolore mesure la densité minérale osseuse. Il peut être proposé selon ton âge, tes antécédents personnels et familiaux, ou d’autres facteurs de risque identifiés avec ton médecin.',
    preventionHabits: [
      'Calcium (produits laitiers, légumes verts)',
      'Vitamine D (soleil modéré, alimentation)',
      'Exercices porteurs de poids (marche, renforcement)',
      'Limiter tabac et alcool',
    ],
    riskFactors: [
      'Des antécédents familiaux d’ostéoporose',
      'Une ménopause précoce (avant 45 ans)',
      'Un tabagisme actuel ou passé',
      'Une corpulence très mince ou une activité physique très faible',
    ],
    alertTitle: 'À noter',
    alertText: 'Avoir un ou plusieurs de ces facteurs ne signifie pas développer une ostéoporose : ils aident surtout à orienter la discussion avec ton médecin sur un éventuel dépistage.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Calcium, vitamine D et activité physique porteuse de poids restent les gestes les plus utiles au quotidien pour préserver la solidité de tes os sur le long terme.',
    shareMessage: 'Prendre soin de sa santé osseuse — AWA',
  },
  en: {
    badge: 'BONE HEALTH',
    title: 'Taking care of\nyour bone health',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'Why menopause increases the risk of osteoporosis, and how to protect your bones every day.',
    contentsTitle: 'In this article',
    topics: [
      'Why menopause weakens bones',
      'Osteopenia and osteoporosis',
      'Screening with bone densitometry',
      'The pillars of prevention',
      'Factors that increase the risk',
      'What to remember',
    ],
    body1: 'Estrogen naturally helps protect bone density by slowing down bone turnover. The drop in estrogen during menopause speeds up bone loss, especially in the first few years after your periods stop.',
    body2: 'Osteopenia refers to bone density that’s lower than normal, without reaching the threshold for osteoporosis. Osteoporosis is a more pronounced bone fragility that increases the risk of fracture, particularly in the event of a fall.',
    tip1Title: 'Good to know',
    tip1Text: 'Both terms describe a loss of bone density, not a fracture that has already happened — they’re a prompt for prevention, not a reason to worry.',
    body3: 'This painless exam measures bone mineral density. It may be offered based on your age, your personal and family history, or other risk factors identified with your doctor.',
    preventionHabits: [
      'Calcium (dairy products, leafy greens)',
      'Vitamin D (moderate sun exposure, diet)',
      'Weight-bearing exercise (walking, strength training)',
      'Limit tobacco and alcohol',
    ],
    riskFactors: [
      'A family history of osteoporosis',
      'Early menopause (before age 45)',
      'Current or past smoking',
      'A very slim build or very low physical activity',
    ],
    alertTitle: 'Please note',
    alertText: 'Having one or more of these factors doesn’t mean you’ll develop osteoporosis — they’re mainly there to help guide the conversation with your doctor about possible screening.',
    tip2Title: 'Good to know',
    tip2Text: 'Calcium, vitamin D, and weight-bearing physical activity remain the most useful everyday habits for preserving bone strength in the long run.',
    shareMessage: 'Taking care of your bone health — AWA',
  },
  es: {
    badge: 'SALUD ÓSEA',
    title: 'Cuidar de\ntu salud ósea',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Por qué la menopausia aumenta el riesgo de osteoporosis, y cómo proteger tus huesos en el día a día.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué la menopausia debilita los huesos',
      'Osteopenia y osteoporosis',
      'La detección mediante densitometría ósea',
      'Los pilares de la prevención',
      'Factores que aumentan el riesgo',
      'Para recordar',
    ],
    body1: 'Los estrógenos protegen naturalmente la densidad ósea al frenar la renovación del hueso. Su disminución durante la menopausia acelera la pérdida ósea, sobre todo durante los primeros años después de que cesen las reglas.',
    body2: 'La osteopenia designa una densidad ósea más baja de lo normal, sin llegar al umbral de la osteoporosis. La osteoporosis corresponde a una fragilidad ósea más marcada, que aumenta el riesgo de fractura, en particular en caso de caída.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Estos dos términos describen una pérdida de densidad ósea, no una fractura ya presente: invitan a la prevención, no a la preocupación.',
    body3: 'Este examen indoloro mide la densidad mineral ósea. Puede proponerse según tu edad, tus antecedentes personales y familiares, u otros factores de riesgo identificados con tu médico.',
    preventionHabits: [
      'Calcio (lácteos, verduras de hoja verde)',
      'Vitamina D (sol moderado, alimentación)',
      'Ejercicios con carga de peso (caminar, fortalecimiento)',
      'Limitar el tabaco y el alcohol',
    ],
    riskFactors: [
      'Antecedentes familiares de osteoporosis',
      'Una menopausia precoz (antes de los 45 años)',
      'Tabaquismo actual o pasado',
      'Una complexión muy delgada o una actividad física muy baja',
    ],
    alertTitle: 'A tener en cuenta',
    alertText: 'Tener uno o varios de estos factores no significa que vayas a desarrollar osteoporosis: sirven sobre todo para orientar la conversación con tu médico sobre una posible detección.',
    tip2Title: 'DATO ÚTIL',
    tip2Text: 'El calcio, la vitamina D y la actividad física con carga de peso siguen siendo los gestos más útiles en el día a día para preservar la solidez de tus huesos a largo plazo.',
    shareMessage: 'Cuidar de tu salud ósea — AWA',
  },
  it: {
    badge: 'SALUTE DELLE OSSA',
    title: 'Prenderti cura\ndella salute delle tue ossa',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Perché la menopausa aumenta il rischio di osteoporosi e come proteggere ogni giorno le tue ossa.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché la menopausa indebolisce le ossa',
      'Osteopenia e osteoporosi',
      'Lo screening con la densitometria ossea',
      'I pilastri della prevenzione',
      'I fattori che aumentano il rischio',
      'Cosa ricordare',
    ],
    body1: 'Gli estrogeni contribuiscono naturalmente a proteggere la densità ossea rallentando il ricambio osseo. Il calo degli estrogeni durante la menopausa accelera la perdita ossea, soprattutto nei primi anni dopo la scomparsa delle mestruazioni.',
    body2: 'L’osteopenia indica una densità ossea inferiore alla norma, senza raggiungere la soglia dell’osteoporosi. L’osteoporosi è una fragilità ossea più marcata che aumenta il rischio di frattura, in particolare in caso di caduta.',
    tip1Title: 'Da sapere',
    tip1Text: 'Entrambi i termini descrivono una perdita di densità ossea, non una frattura già avvenuta — sono uno stimolo alla prevenzione, non un motivo di preoccupazione.',
    body3: 'Questo esame indolore misura la densità minerale ossea. Può essere proposto in base alla tua età, alla tua storia personale e familiare o ad altri fattori di rischio individuati con il tuo medico.',
    preventionHabits: [
      'Calcio (latticini, verdure a foglia verde)',
      'Vitamina D (esposizione moderata al sole, alimentazione)',
      'Esercizio fisico con carico (camminata, allenamento di forza)',
      'Limitare il tabacco e l’alcol',
    ],
    riskFactors: [
      'Una storia familiare di osteoporosi',
      'Menopausa precoce (prima dei 45 anni)',
      'Fumo attuale o passato',
      'Una corporatura molto esile o un’attività fisica molto scarsa',
    ],
    alertTitle: 'Attenzione',
    alertText: 'Avere uno o più di questi fattori non significa che sviluppherai l’osteoporosi — servono soprattutto a orientare il confronto con il tuo medico su un possibile screening.',
    tip2Title: 'Da sapere',
    tip2Text: 'Calcio, vitamina D e attività fisica con carico restano le abitudini quotidiane più utili per preservare nel tempo la solidità delle ossa.',
    shareMessage: 'Prenderti cura della salute delle tue ossa — AWA',
  },
  tr: {
    badge: 'KEMİK SAĞLIĞI',
    title: 'Kemik sağlığına\nözen göster',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Menopoz osteoporoz riskini neden artırır ve kemiklerini her gün nasıl koruyabilirsin?',
    contentsTitle: 'Bu makalede',
    topics: [
      'Menopoz kemikleri neden zayıflatır?',
      'Osteopeni ve osteoporoz',
      'Kemik dansitometrisi ile tarama',
      'Korunmanın temel dayanakları',
      'Riski artıran etkenler',
      'Akılda tutulacaklar',
    ],
    body1: 'Östrojen, kemik yenilenmesini yavaşlatarak kemik yoğunluğunun korunmasına doğal olarak yardımcı olur. Menopozda östrojenin düşmesi, özellikle adetlerin kesilmesinden sonraki ilk yıllarda kemik kaybını hızlandırır.',
    body2: 'Osteopeni, kemik yoğunluğunun normalden düşük olduğu, ancak osteoporoz eşiğine ulaşmadığı durumu ifade eder. Osteoporoz ise kemiklerin daha belirgin biçimde kırılganlaşması anlamına gelir ve özellikle düşme durumunda kırık riskini artırır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Her iki terim de kemik yoğunluğundaki bir kaybı anlatır, yaşanmış bir kırığı değil. Bunlar endişelenmek için değil, korunma için bir hatırlatmadır.',
    body3: 'Bu ağrısız tetkik, kemik mineral yoğunluğunu ölçer. Yaşına, kişisel ve ailesel öyküne ya da doktorunla belirlenen diğer risk etkenlerine göre önerilebilir.',
    preventionHabits: [
      'Kalsiyum (süt ürünleri, yeşil yapraklı sebzeler)',
      'D vitamini (ölçülü güneş ışığı, beslenme)',
      'Ağırlık taşıtan egzersiz (yürüyüş, kuvvet antrenmanı)',
      'Tütün ve alkolü sınırlama',
    ],
    riskFactors: [
      'Ailede osteoporoz öyküsü',
      'Erken menopoz (45 yaşından önce)',
      'Halen ya da geçmişte sigara kullanımı',
      'Çok zayıf bir yapı ya da çok düşük fiziksel aktivite',
    ],
    alertTitle: 'Dikkat',
    alertText: 'Bu etkenlerden birine veya birkaçına sahip olmak osteoporoz geliştireceğin anlamına gelmez. Bu etkenler esas olarak, olası tarama konusunda doktorunla yapacağın görüşmeye yön vermeye yardımcı olur.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Kalsiyum, D vitamini ve ağırlık taşıtan fiziksel aktivite, uzun vadede kemik gücünü korumak için en faydalı günlük alışkanlıklar olmaya devam ediyor.',
    shareMessage: 'Kemik sağlığına özen göster — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BoneHealthArticleScreen({
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

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.daily}>
            {PREVENTION_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.preventionHabits[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <View style={styles.checkList}>
            {content.riskFactors.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

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

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

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
    color: theme.colors.textSecondary,
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
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
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
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
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
