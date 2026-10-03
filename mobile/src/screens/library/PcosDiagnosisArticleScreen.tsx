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

const ID = 'pcos-diagnostic-examens';

const HERO = require('../../assets/images/library/featured-spm.png');

// Icons/numbers stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these entries.
const DIAGNOSIS_STEP_META = [
  {number: '01', icon: 'clipboard-text-outline'},
  {number: '02', icon: 'stethoscope'},
  {number: '03', icon: 'flask-outline'},
  {number: '04', icon: 'ultrasound'},
] as const;

const BLOOD_TEST_META = [
  {icon: 'test-tube'},
  {icon: 'water-outline'},
  {icon: 'chart-line'},
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK',
    title: 'Diagnostic du SOPK :\nexamens et bilan',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Comment le SOPK est diagnostiqué, quels examens peuvent être proposés et comment préparer sereinement ta consultation.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre le bilan diagnostique',
      'Les principales étapes du bilan',
      'La prise de sang hormonale',
      'L’échographie pelvienne',
      'Ce que le diagnostic ne dit pas',
      'Préparer sa consultation',
      'À retenir',
    ],
    section1Body1: 'Le diagnostic du syndrome des ovaires polykystiques ne repose pas sur un seul examen. Le professionnel de santé rassemble plusieurs informations : l’histoire des cycles, les symptômes éventuels, l’examen clinique, les analyses biologiques et, selon la situation, une échographie.',
    section1Body2: 'L’objectif est à la fois de rechercher les caractéristiques compatibles avec un SOPK et d’écarter d’autres causes pouvant expliquer des règles irrégulières ou certains symptômes hormonaux.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Le diagnostic est toujours personnalisé. Deux femmes ayant un SOPK peuvent avoir des symptômes et des résultats d’examens très différents.',
    section2Body: 'Le bilan peut suivre plusieurs étapes. Elles ne sont pas nécessairement toutes réalisées de la même façon chez chaque personne.',
    diagnosisSteps: [
      {title: 'Interrogatoire', text: 'Le professionnel recueille ton histoire : cycles, symptômes, antécédents et traitements.'},
      {title: 'Examen clinique', text: 'Il recherche notamment des signes d’excès d’androgènes et évalue ton état général.'},
      {title: 'Bilan sanguin', text: 'Des analyses hormonales et métaboliques peuvent être demandées pour préciser la situation.'},
      {title: 'Échographie', text: 'Elle peut compléter le bilan en observant l’aspect des ovaires.'},
    ],
    flowTitle: 'Le parcours en un coup d’œil',
    flowItems: [
      'Histoire et symptômes',
      'Examen clinique',
      'Analyses selon le contexte',
      'Échographie si nécessaire',
    ],
    section3Body1: 'Une prise de sang peut être proposée pour rechercher des signes d’excès d’androgènes, évaluer certaines hormones impliquées dans le fonctionnement reproductif et rechercher d’autres causes possibles des symptômes.',
    section3Body2: 'Les analyses choisies dépendent de ton âge, de tes symptômes, de ton histoire médicale et de ce que le professionnel cherche à vérifier.',
    bloodTests: [
      {title: 'Androgènes', text: 'Testostérone et autres hormones selon le contexte.'},
      {title: 'Fonction thyroïdienne', text: 'Permet notamment d’écarter certaines causes de cycles irréguliers.'},
      {title: 'Bilan métabolique', text: 'Glycémie, parfois bilan lipidique selon les facteurs de risque.'},
    ],
    alertTitle: 'Important',
    alertText: 'Les résultats hormonaux doivent être interprétés avec le contexte clinique. Une valeur isolée ne permet généralement pas, à elle seule, de conclure à un SOPK.',
    section4Body: 'Une échographie peut être utilisée pour observer l’aspect des ovaires et rechercher notamment un nombre important de petits follicules. Elle permet également au professionnel de rechercher d’autres éléments pouvant expliquer certains symptômes.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Voir de nombreux follicules à l’échographie ne signifie pas automatiquement que tu as un SOPK. Le résultat doit être interprété avec les autres éléments du bilan.',
    section5Body: 'Recevoir un diagnostic de SOPK ne permet pas de prédire exactement ton évolution future. Le syndrome peut se manifester de manière très différente d’une personne à l’autre.',
    mythItems: [
      'Le SOPK ne signifie pas automatiquement infertilité.',
      'Le SOPK ne signifie pas forcément avoir des kystes.',
      'Le diagnostic ne détermine pas à lui seul le traitement.',
      'Une échographie normale n’exclut pas nécessairement le SOPK.',
    ],
    section6Body: 'Quelques informations préparées à l’avance peuvent aider le professionnel à comprendre ton histoire et à choisir les examens les plus pertinents.',
    appointmentQuestions: [
      'Depuis quand tes cycles sont-ils irréguliers ?',
      'As-tu remarqué de l’acné, une pilosité ou une perte de cheveux inhabituelles ?',
      'Y a-t-il des antécédents de SOPK ou de diabète dans ta famille ?',
      'As-tu un désir de grossesse à court ou moyen terme ?',
    ],
    preparationTitle: 'Petit conseil avant le rendez-vous',
    preparationText: 'Si possible, note les dates de tes dernières règles, la durée approximative de tes cycles, les symptômes que tu observes et les traitements ou compléments que tu prends.',
    summaryTitle: 'L’essentiel du bilan',
    summaryItems: [
      'Le diagnostic repose sur plusieurs éléments, pas sur un seul examen.',
      'Une prise de sang peut rechercher certains déséquilibres hormonaux et éliminer d’autres causes.',
      'Une échographie peut compléter le bilan selon la situation.',
      'Les résultats doivent toujours être interprétés par un professionnel de santé.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText: 'Un bilan de SOPK n’est pas un examen unique ni un jugement définitif. Il sert à comprendre ton fonctionnement hormonal, à rechercher d’autres causes possibles et à construire un accompagnement adapté à ta situation.',
    disclaimerText: 'Cet article est informatif et ne remplace pas une consultation médicale ni l’interprétation personnalisée de tes examens.',
    shareMessage: 'Diagnostic du SOPK : examens et bilan — AWA',
  },
  en: {
    badge: 'PCOS',
    title: 'PCOS diagnosis:\ntests and workup',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'How PCOS is diagnosed, what tests may be offered, and how to prepare calmly for your appointment.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding the diagnostic workup',
      'The main steps of the workup',
      'The hormonal blood test',
      'The pelvic ultrasound',
      'What the diagnosis doesn’t tell you',
      'Preparing for your appointment',
      'Key takeaways',
    ],
    section1Body1: 'The diagnosis of polycystic ovary syndrome doesn’t rely on a single test. The healthcare professional brings together several pieces of information: your cycle history, any symptoms, the clinical exam, lab tests, and, depending on the situation, an ultrasound.',
    section1Body2: 'The goal is both to look for features consistent with PCOS and to rule out other causes that could explain irregular periods or certain hormonal symptoms.',
    tip1Title: 'Good to know',
    tip1Text: 'The diagnosis is always personalized. Two women with PCOS can have very different symptoms and test results.',
    section2Body: 'The workup can follow several steps. They aren’t necessarily all carried out the same way for everyone.',
    diagnosisSteps: [
      {title: 'History-taking', text: 'The professional gathers your history: cycles, symptoms, medical background, and treatments.'},
      {title: 'Clinical exam', text: 'They look in particular for signs of excess androgens and assess your overall condition.'},
      {title: 'Blood workup', text: 'Hormonal and metabolic tests may be requested to clarify the situation.'},
      {title: 'Ultrasound', text: 'It can complete the workup by observing the appearance of the ovaries.'},
    ],
    flowTitle: 'The process at a glance',
    flowItems: [
      'History and symptoms',
      'Clinical exam',
      'Tests depending on the situation',
      'Ultrasound if needed',
    ],
    section3Body1: 'A blood test may be offered to look for signs of excess androgens, assess certain hormones involved in reproductive function, and look for other possible causes of your symptoms.',
    section3Body2: 'The tests chosen depend on your age, your symptoms, your medical history, and what the professional is looking to check.',
    bloodTests: [
      {title: 'Androgens', text: 'Testosterone and other hormones depending on the situation.'},
      {title: 'Thyroid function', text: 'Helps in particular rule out certain causes of irregular cycles.'},
      {title: 'Metabolic workup', text: 'Blood glucose, sometimes a lipid panel depending on risk factors.'},
    ],
    alertTitle: 'Important',
    alertText: 'Hormonal results need to be interpreted alongside the clinical context. A single value usually isn’t enough, on its own, to conclude a PCOS diagnosis.',
    section4Body: 'An ultrasound can be used to observe the appearance of the ovaries and look in particular for a high number of small follicles. It also allows the professional to look for other factors that could explain certain symptoms.',
    tip2Title: 'Good to know',
    tip2Text: 'Seeing many follicles on ultrasound doesn’t automatically mean you have PCOS. The result needs to be interpreted alongside the rest of the workup.',
    section5Body: 'Receiving a PCOS diagnosis doesn’t make it possible to predict exactly how things will progress for you. The syndrome can show up very differently from one person to another.',
    mythItems: [
      'PCOS doesn’t automatically mean infertility.',
      'PCOS doesn’t necessarily mean having cysts.',
      'The diagnosis alone doesn’t determine the treatment.',
      'A normal ultrasound doesn’t necessarily rule out PCOS.',
    ],
    section6Body: 'A few pieces of information prepared ahead of time can help the professional understand your history and choose the most relevant tests.',
    appointmentQuestions: [
      'How long have your cycles been irregular?',
      'Have you noticed acne, unusual hair growth, or hair loss?',
      'Is there a family history of PCOS or diabetes?',
      'Do you wish to become pregnant in the short or medium term?',
    ],
    preparationTitle: 'A small tip before the appointment',
    preparationText: 'If possible, note the dates of your last period, the approximate length of your cycles, the symptoms you’re noticing, and any treatments or supplements you’re taking.',
    summaryTitle: 'The essentials of the workup',
    summaryItems: [
      'The diagnosis relies on several factors, not a single test.',
      'A blood test can look for certain hormonal imbalances and rule out other causes.',
      'An ultrasound can complete the workup depending on the situation.',
      'Results should always be interpreted by a healthcare professional.',
    ],
    finalTipTitle: 'Key takeaways',
    finalTipText: 'A PCOS workup isn’t a single test or a final verdict. It helps you understand your hormonal functioning, look for other possible causes, and build care that’s suited to your situation.',
    disclaimerText: 'This article is for information only and doesn’t replace a medical consultation or the personalized interpretation of your test results.',
    shareMessage: 'PCOS diagnosis: tests and workup — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosDiagnosisArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
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
        {/* HERO */}
        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* METADATA */}
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

          {/* SOMMAIRE */}
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

          {/* SECTION 1 */}
          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
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

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          {/* DIAGNOSTIC STEPS */}
          <View style={styles.stepsContainer}>
            {DIAGNOSIS_STEP_META.map((step, index) => (
              <View key={step.number} style={styles.stepCard}>
                <View style={styles.stepTop}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>
                      {step.number}
                    </Text>
                  </View>

                  <MaterialDesignIcons
                    name={step.icon as never}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.stepTitle}>
                  {content.diagnosisSteps[index].title}
                </Text>

                <Text style={styles.stepText}>
                  {content.diagnosisSteps[index].text}
                </Text>
              </View>
            ))}
          </View>

          {/* FLOW */}
          <View style={styles.flowCard}>
            <View style={styles.flowHeader}>
              <MaterialDesignIcons
                name="format-list-numbered"
                size={20}
                color={theme.colors.primary}
              />

              <Text style={styles.flowTitle}>
                {content.flowTitle}
              </Text>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <Text style={styles.flowText}>{content.flowItems[0]}</Text>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <Text style={styles.flowText}>{content.flowItems[1]}</Text>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <Text style={styles.flowText}>{content.flowItems[2]}</Text>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <Text style={styles.flowText}>{content.flowItems[3]}</Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.section3Body1}
          </Text>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          <View style={styles.testsGrid}>
            {BLOOD_TEST_META.map((test, index) => (
              <View key={content.bloodTests[index].title} style={styles.testCard}>
                <View style={styles.testIcon}>
                  <MaterialDesignIcons
                    name={test.icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.testTitle}>
                  {content.bloodTests[index].title}
                </Text>

                <Text style={styles.testText}>
                  {content.bloodTests[index].text}
                </Text>
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

          {/* SECTION 4 */}
          <Text style={styles.h2}>
            4. {content.topics[3]}
          </Text>

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

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

          {/* SECTION 5 */}
          <Text style={styles.h2}>
            5. {content.topics[4]}
          </Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <View style={styles.mythList}>
            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color={theme.colors.warning}
              />

              <Text style={styles.mythText}>
                {content.mythItems[0]}
              </Text>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color={theme.colors.warning}
              />

              <Text style={styles.mythText}>
                {content.mythItems[1]}
              </Text>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color={theme.colors.warning}
              />

              <Text style={styles.mythText}>
                {content.mythItems[2]}
              </Text>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color={theme.colors.warning}
              />

              <Text style={styles.mythText}>
                {content.mythItems[3]}
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}
          <Text style={styles.h2}>
            6. {content.topics[5]}
          </Text>

          <Text style={styles.body}>
            {content.section6Body}
          </Text>

          <View style={styles.checkList}>
            {content.appointmentQuestions.map(item => (
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

          <View style={styles.preparationCard}>
            <View style={styles.preparationHeader}>
              <MaterialDesignIcons
                name="notebook-edit-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.preparationTitle}>
                {content.preparationTitle}
              </Text>
            </View>

            <Text style={styles.preparationText}>
              {content.preparationText}
            </Text>
          </View>

          {/* SECTION 7 */}
          <Text style={styles.h2}>7. {content.topics[6]}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>
                {content.summaryTitle}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryNumber}>01</Text>

              <Text style={styles.summaryText}>
                {content.summaryItems[0]}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryNumber}>02</Text>

              <Text style={styles.summaryText}>
                {content.summaryItems[1]}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryNumber}>03</Text>

              <Text style={styles.summaryText}>
                {content.summaryItems[2]}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryNumber}>04</Text>

              <Text style={styles.summaryText}>
                {content.summaryItems[3]}
              </Text>
            </View>
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.finalTipTitle}</Text>

              <Text style={styles.tipText}>
                {content.finalTipText}
              </Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="information-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
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
    paddingBottom: 30,
  },

  heroWrap: {
    height: 245,
    backgroundColor: theme.colors.surfaceSecondary,
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

  pressed: {
    opacity: 0.74,
  },

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

  badgeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },

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

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 40,
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
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 26,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  /* PRINCIPALES ÉTAPES */

  stepsContainer: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
  },

  stepCard: {
    width: '48.5%',
    minHeight: 178,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  stepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stepNumber: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  stepNumberText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '900',
  },

  stepTitle: {
    marginTop: 13,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  stepText: {
    marginTop: 6,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* PARCOURS */

  flowCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 11,
  },

  flowTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  flowLine: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  flowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  flowText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  /* ANALYSES */

  testsGrid: {
    marginTop: 14,
    gap: 8,
  },

  testCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  testIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  testTitle: {
    marginTop: 9,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  testText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* CHECK LIST */

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
    marginBottom: 10,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  /* MYTHES */

  mythList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  mythRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 10,
  },

  mythText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* TIP */

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ALERT */

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* PREPARATION */

  preparationCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  preparationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  preparationTitle: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  preparationText: {
    marginTop: 9,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  summaryTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  summaryNumber: {
    width: 31,
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '900',
    paddingTop: 2,
  },

  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  finalTip: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },
  });
}
