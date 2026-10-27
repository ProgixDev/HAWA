import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { usePremium } from '../../hooks/usePremium';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import BookmarkButton from '../../components/library/BookmarkButton';
import { HawaPremiumBottomSheet } from '../../components/premium/HawaPremiumBottomSheet';
import { PremiumLockedCard } from '../../components/premium/PremiumLockedCard';
import ReadingControls from '../../components/articles/ReadingControls';
import { AwaButton } from '../../components/ui/AwaButton';
import { AwaCard } from '../../components/ui/AwaCard';
import { AwaIconButton } from '../../components/ui/AwaIconButton';
import { AwaText } from '../../components/ui/AwaText';
import {
  getArticleById,
  getCategoryById,
  getReligiousDisclaimer,
  getTranslatedArticleById,
  isPremiumArticle,
  libraryCategoryLabel,
  LIBRARY_TINTS,
  type ArticleLevel,
  type ArticleType,
  type TranslateFn,
} from '../../data/libraryContent';
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
import FlowMenstrualArticleScreen from './FlowMenstrualArticleScreen';
import CycleVitalSignArticleScreen from './CycleVitalSignArticleScreen';
import FirstPeriodArticleScreen from './FirstPeriodArticleScreen';
import FirstPeriodSignsArticleScreen from './FirstPeriodSignsArticleScreen';
import FirstPeriodComingArticleScreen from './FirstPeriodComingArticleScreen';
import FirstPeriodProtectionArticleScreen from './FirstPeriodProtectionArticleScreen';
import FirstPeriodDailyLifeArticleScreen from './FirstPeriodDailyLifeArticleScreen';
import FirstPeriodIrregularArticleScreen from './FirstPeriodIrregularArticleScreen';
import FirstPeriodFaqArticleScreen from './FirstPeriodFaqArticleScreen';
import UnderstandMenstrualFlowArticleScreen from './UnderstandMenstrualFlowArticleScreen';
import RegularIrregularCycleArticleScreen from './RegularIrregularCycleArticleScreen';
import CyclePhasesArticleScreen from './CyclePhasesArticleScreen';
import NutritionCycleArticleScreen from './NutritionCycleArticleScreen';
import PeriodPainArticleScreen from './PeriodPainArticleScreen';
import PmsArticleScreen from './PmsArticleScreen';
import FlowColorsTexturesArticleScreen from './FlowColorsTexturesArticleScreen';
import NifasFiqhArticleScreen from './NifasFiqhArticleScreen';
import FiqhWomenIntroArticleScreen from './FiqhWomenIntroArticleScreen';
import MenstruationPurityArticleScreen from './MenstruationPurityArticleScreen';
import IstihadaArticleScreen from './IstihadaArticleScreen';
import RamadanFastingArticleScreen from './RamadanFastingArticleScreen';
import FastingQadaaArticleScreen from './FastingQadaaArticleScreen';
import PrayerDuringMenstruationArticleScreen from './PrayerDuringMenstruationArticleScreen';
import ReturningToPrayerArticleScreen from './ReturningToPrayerArticleScreen';
import ReligiousFaqArticleScreen from './ReligiousFaqArticleScreen';
import ReligiousFaqAfterLossArticleScreen from './ReligiousFaqAfterLossArticleScreen';
import FertilityWindowArticleScreen from './FertilityWindowArticleScreen';
import OvulationArticleScreen from './OvulationArticleScreen';
import ConceptionStartArticleScreen from './ConceptionStartArticleScreen';
import NidationArticleScreen from './NidationArticleScreen';
import ConceptionLifestyleArticleScreen from './ConceptionLifestyleArticleScreen';
import BirthControlPillsArticleScreen from './BirthControlPillsArticleScreen';
import PatchArticleScreen from './PatchArticleScreen';
import VaginalRingArticleScreen from './VaginalRingArticleScreen';
import HormonalTreatmentsPanoramaArticleScreen from './HormonalTreatmentsPanoramaArticleScreen';
import ChooseHormonalMethodArticleScreen from './ChooseHormonalMethodArticleScreen';
import MissedPillsArticleScreen from './MissedPillsArticleScreen';
import SideEffectsArticleScreen from './SideEffectsArticleScreen';
import MenopauseTransitionArticleScreen from './MenopauseTransitionArticleScreen';
import HotFlashesArticleScreen from './HotFlashesArticleScreen';
import BoneHealthArticleScreen from './BoneHealthArticleScreen';
import MenopauseTreatmentsArticleScreen from './MenopauseTreatmentsArticleScreen';
import PcosIntroArticleScreen from './PcosIntroArticleScreen';
import PcosCycleFertilityArticleScreen from './PcosCycleFertilityArticleScreen';
import PcosSkinHairArticleScreen from './PcosSkinHairArticleScreen';
import PcosDiagnosisArticleScreen from './PcosDiagnosisArticleScreen';
import PcosMetabolismArticleScreen from './PcosMetabolismArticleScreen';
import PcosLifestyleManagementArticleScreen from './PcosLifestyleManagementArticleScreen';
import PcosHormonalAcneArticleScreen from './PcosHormonalAcneArticleScreen';
import ExerciseCycleSupportArticleScreen from './ExerciseCycleSupportArticleScreen';
import PregnancyWeeklyArticleScreen from './PregnancyWeeklyArticleScreen';
import BabyDevelopmentArticleScreen from './BabyDevelopmentArticleScreen';
import MedicalExamsArticleScreen from './MedicalExamsArticleScreen';
import ChildbirthPrepArticleScreen from './ChildbirthPrepArticleScreen';
import PregnancyExerciseArticleScreen from './PregnancyExerciseArticleScreen';
import PerineumStrengtheningArticleScreen from './PerineumStrengtheningArticleScreen';
import PostpartumRecoveryArticleScreen from './PostpartumRecoveryArticleScreen';
import PostpartumPeriodReturnArticleScreen from './PostpartumPeriodReturnArticleScreen';
import LochiaArticleScreen from './LochiaArticleScreen';
import NifasMedicalArticleScreen from './NifasMedicalArticleScreen';
import BreastfeedingArticleScreen from './BreastfeedingArticleScreen';
import BabyBluesArticleScreen from './BabyBluesArticleScreen';
import MiscarriagePhysicalRecoveryArticleScreen from './MiscarriagePhysicalRecoveryArticleScreen';
import MiscarriageGriefArticleScreen from './MiscarriageGriefArticleScreen';
import MiscarriageFertilityArticleScreen from './MiscarriageFertilityArticleScreen';
import HydrationCycleArticleScreen from './HydrationCycleArticleScreen';
import SleepHormonesArticleScreen from './SleepHormonesArticleScreen';
import MoodHormonesArticleScreen from './MoodHormonesArticleScreen';
import MenopauseHormonesArticleScreen from './MenopauseHormonesArticleScreen';
import BasalTemperatureArticleScreen from './BasalTemperatureArticleScreen';
import CervicalMucusArticleScreen from './CervicalMucusArticleScreen';
import LhTestsArticleScreen from './LhTestsArticleScreen';

function levelLabel(level: ArticleLevel, t: TranslateFn): string {
  return t(`library.reader.levels.${level}`);
}

function typeLabel(type: ArticleType, t: TranslateFn): string {
  return t(`library.reader.types.${type}`);
}

// These articles have a bespoke, hand-designed editorial layout (hero
// illustration, table of contents, highlight/tip cards, etc.) that doesn't
// fit the generic paragraph-based reader below.
const BESPOKE_ARTICLE_SCREENS: Partial<
  Record<string, React.ComponentType<Props>>
> = {
  'flow-hygiene-intime': FlowMenstrualArticleScreen,
  'cycle-signe-vital': CycleVitalSignArticleScreen,
  'firstperiod-premieres-regles': FirstPeriodArticleScreen,
  'firstperiod-premiers-signes': FirstPeriodSignsArticleScreen,
  'firstperiod-comment-savoir': FirstPeriodComingArticleScreen,
  'firstperiod-choisir-protection': FirstPeriodProtectionArticleScreen,
  'firstperiod-gerer-quotidien': FirstPeriodDailyLifeArticleScreen,
  'firstperiod-cycle-irregulier': FirstPeriodIrregularArticleScreen,
  'firstperiod-questions-frequentes': FirstPeriodFaqArticleScreen,
  'flow-comprendre-flux': UnderstandMenstrualFlowArticleScreen,
  'cycle-comprendre-ton-cycle': RegularIrregularCycleArticleScreen,
  'cycle-phases-expliquees': CyclePhasesArticleScreen,
  'nutrition-conception-fertilite': NutritionCycleArticleScreen,
  'pain-gerer-douleurs': PeriodPainArticleScreen,
  'symptoms-reconnaitre': PmsArticleScreen,
  'flow-colors-textures': FlowColorsTexturesArticleScreen,
  'nifasfiqh-repere-fiqh': NifasFiqhArticleScreen,
  'fiqhwomen-introduction': FiqhWomenIntroArticleScreen,
  'menstruationpurity-statut-de-purete': MenstruationPurityArticleScreen,
  'istihada-comprendre-les-saignements': IstihadaArticleScreen,
  'ramadan-jeune-et-regles': RamadanFastingArticleScreen,
  'fastingqadaa-dispense-et-rattrapage': FastingQadaaArticleScreen,
  'prayerduringmenstruation-la-priere-suspendue': PrayerDuringMenstruationArticleScreen,
  'returningtoprayer-le-ghusl-et-le-retour': ReturningToPrayerArticleScreen,
  'religiousfaq-questions-frequentes': ReligiousFaqArticleScreen,
  'religiousfaq-reperes-apres-une-perte': ReligiousFaqAfterLossArticleScreen,
  'fertility-fenetre-fertile': FertilityWindowArticleScreen,
  'ovulation-comprendre-ovulation': OvulationArticleScreen,
  'conceptiontips-essayer-de-concevoir': ConceptionStartArticleScreen,
  'conceptiontips-comprendre-nidation': NidationArticleScreen,
  'conceptiontips-hygiene-de-vie': ConceptionLifestyleArticleScreen,
  'birthcontrolpills-comprendre-la-pilule': BirthControlPillsArticleScreen,
  'patch-le-patch-contraceptif': PatchArticleScreen,
  'ring-anneau-vaginal': VaginalRingArticleScreen,
  'hormonaltreatments-panorama': HormonalTreatmentsPanoramaArticleScreen,
  'hormonaltreatments-choisir-sa-methode': ChooseHormonalMethodArticleScreen,
  'missedpills-que-faire-en-cas-doubli': MissedPillsArticleScreen,
  'sideeffects-reconnaitre-les-effets-secondaires': SideEffectsArticleScreen,
  'menopause-comprendre-la-transition': MenopauseTransitionArticleScreen,
  'hotflashes-bouffees-de-chaleur': HotFlashesArticleScreen,
  'bones-sante-osseuse': BoneHealthArticleScreen,
  'treatments-traitements-menopause': MenopauseTreatmentsArticleScreen,
  'pcos-comprendre-sopk': PcosIntroArticleScreen,
  'pcos-cycle-ovulation-fertilite': PcosCycleFertilityArticleScreen,
  'pcos-peau-pilosite-symptomes': PcosSkinHairArticleScreen,
  'pcos-diagnostic-examens': PcosDiagnosisArticleScreen,
  'pcos-poids-metabolisme-insuline': PcosMetabolismArticleScreen,
  'pcos-mode-de-vie-prise-en-charge': PcosLifestyleManagementArticleScreen,
  'pcos-acne-hormonale': PcosHormonalAcneArticleScreen,
  'exercise-bouger-pour-le-cycle': ExerciseCycleSupportArticleScreen,
  'pregnancy-semaine-par-semaine': PregnancyWeeklyArticleScreen,
  'babydevelopment-developpement-bebe': BabyDevelopmentArticleScreen,
  'medicalexams-suivi-medical': MedicalExamsArticleScreen,
  'childbirthprep-preparer-accouchement': ChildbirthPrepArticleScreen,
  'exercise-bouger-enceinte': PregnancyExerciseArticleScreen,
  'exercise-renforcer-perinee': PerineumStrengtheningArticleScreen,
  'postpartum-recuperation-globale': PostpartumRecoveryArticleScreen,
  'postpartum-retour-de-couches': PostpartumPeriodReturnArticleScreen,
  'lochia-comprendre-lochies': LochiaArticleScreen,
  'nifas-aspects-medicaux': NifasMedicalArticleScreen,
  'breastfeeding-debuter-allaitement': BreastfeedingArticleScreen,
  'emotionalhealth-baby-blues': BabyBluesArticleScreen,
  'lossphysical-recuperation-physique': MiscarriagePhysicalRecoveryArticleScreen,
  'lossemotional-traverser-le-deuil': MiscarriageGriefArticleScreen,
  'lossfertility-fertilite-apres-perte': MiscarriageFertilityArticleScreen,
  'hydration-bien-shydrater': HydrationCycleArticleScreen,
  'sleep-sommeil-et-cycle': SleepHormonesArticleScreen,
  'mood-humeur-et-hormones': MoodHormonesArticleScreen,
  'hormones-menopause-equilibre': MenopauseHormonesArticleScreen,
  'basaltemp-suivre-temperature': BasalTemperatureArticleScreen,
  'cervicalmucus-observer-glaire': CervicalMucusArticleScreen,
  'lhtests-comprendre-tests-ovulation': LhTestsArticleScreen,
};

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

function ArticleReaderScreen(props: Props): React.JSX.Element {
  const { route } = props;
  const { articleId } = route.params;
  const { isPremium } = usePremium();
  // THE single Premium gate for every guide. Every entry path (Library cards
  // and lists, objective dashboards, notifications, deep links, direct
  // navigation.navigate('ArticleReader', ...)) lands here, so a Premium-flagged
  // article can never be read by a Free user regardless of how it was
  // reached. Checked BEFORE the bespoke/generic dispatch so bespoke layouts
  // (e.g. LochiaArticleScreen) are covered too, and nothing (scroll progress,
  // bookmarks) is recorded for content that is not shown.
  if (isPremiumArticle(getArticleById(articleId)) && !isPremium) {
    return <PremiumArticleGate {...props} />;
  }
  const BespokeScreen = BESPOKE_ARTICLE_SCREENS[articleId];
  if (BespokeScreen) {
    return <BespokeScreen {...props} />;
  }
  return <GenericArticleReaderScreen {...props} />;
}

function PremiumArticleGate({ route, navigation }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const article = getTranslatedArticleById(route.params.articleId, t);
  const [premiumVisible, setPremiumVisible] = useState(false);

  return (
    <View
      style={[
        styles.missingContainer,
        {
          paddingTop: getTopPadding(insets.top, true),
          paddingBottom: getBottomPadding(insets.bottom),
        },
      ]}
    >
      <View style={styles.gateContent}>
        <PremiumLockedCard
          description={t('library.reader.premiumDescription')}
          onUpgrade={() => setPremiumVisible(true)}
          title={article?.title ?? t('library.reader.premiumFallbackTitle')}
        />
        <AwaButton
          accessibilityLabel={t('library.reader.back')}
          label={t('library.reader.back')}
          onPress={navigation.goBack}
          variant="filled"
        />
      </View>
      <HawaPremiumBottomSheet
        onClose={() => setPremiumVisible(false)}
        visible={premiumVisible}
      />
    </View>
  );
}

function GenericArticleReaderScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const { articleId } = route.params;
  const { t } = useTranslation();
  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const article = useMemo(() => getTranslatedArticleById(articleId, t), [articleId, t]);
  const category = article ? getCategoryById(article.categoryId) : undefined;
  const categoryLabel = category ? libraryCategoryLabel(category.id, t) : undefined;
  const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];
  const isReligious = category?.contentType === 'religious';
  const scrollRef = useRef<ScrollView>(null);

  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadLibraryState().then(() => {
      if (!mounted) {
        return;
      }
      setBookmarked(isArticleBookmarked(articleId));
    });
    return () => {
      mounted = false;
    };
  }, [articleId]);

  if (!article) {
    return (
      <View
        style={[
          styles.missingContainer,
          {
            paddingTop: getTopPadding(insets.top, true),
            paddingBottom: getBottomPadding(insets.bottom),
          },
        ]}
      >
        <AwaText colorRole="onSurfaceVariant" variant="bodyMedium">
          {t('library.reader.missingArticle')}
        </AwaText>
        <AwaButton
          label={t('library.reader.back')}
          onPress={navigation.goBack}
          variant="filled"
        />
      </View>
    );
  }

  const handleToggleBookmark = () => {
    const next = toggleBookmark(articleId);
    setBookmarked(next);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      <ScrollView
        onScroll={event =>
          saveScrollPosition(articleId, event.nativeEvent.contentOffset.y)
        }
        ref={scrollRef}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: tint.bg,
              paddingTop: getTopPadding(insets.top, true),
            },
          ]}
        >
          <AwaIconButton
            accessibilityLabel={t('library.reader.back')}
            icon="chevron-left"
            onPress={navigation.goBack}
            variant="tonal"
          />

          <BookmarkButton
            active={bookmarked}
            onPress={handleToggleBookmark}
            tone="light"
          />

          <View style={styles.heroIconWrap}>
            <MaterialDesignIcons
              color={tint.fg}
              name={category?.icon ?? 'book-open-page-variant-outline'}
              size={44}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.pillRow}>
            {category ? (
              <View style={[styles.categoryPill, { backgroundColor: tint.bg }]}>
                <AwaText color={tint.fg} emphasized variant="labelMedium">
                  {categoryLabel}
                </AwaText>
              </View>
            ) : null}
            {isReligious && (
              <View style={styles.educationalPill}>
                <MaterialDesignIcons
                  color={theme.colors.warning}
                  name="school-outline"
                  size={11}
                />
                <AwaText colorRole="warning" emphasized variant="labelMedium">
                  {t('library.reader.educationalContent')}
                </AwaText>
              </View>
            )}
          </View>

          <AwaText style={styles.title} variant="headlineSmall" weight="700">{article.title}</AwaText>

          <View style={styles.metaRow}>
            <MaterialDesignIcons
              color={theme.colors.textSecondary}
              name="clock-outline"
              size={13}
            />
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
              {t('library.reader.durationMinutes', {count: article.durationMinutes})}
            </AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall">•</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{typeLabel(article.type, t)}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall">•</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{levelLabel(article.level, t)}</AwaText>
          </View>

          <AwaText emphasized style={styles.summary} variant="titleMedium">{article.summary}</AwaText>

          <View style={styles.divider} />

          {isReligious && (
            <AwaCard padding="none" style={styles.disclaimer} variant="filled">
              <MaterialDesignIcons
                color={theme.colors.warning}
                name="information-outline"
                size={16}
              />
              <AwaText colorRole="warning" style={styles.disclaimerText} variant="bodySmall">
                {getReligiousDisclaimer(t)}
              </AwaText>
            </AwaCard>
          )}

          {article.content.map((paragraph, index) => (
            <AwaText key={index} style={styles.paragraph} variant="bodyLarge">
              {paragraph}
            </AwaText>
          ))}

          <View
            style={{
              height: getBottomPadding(insets.bottom, READING_CONTROLS_SPACE),
            }}
          />
        </View>
      </ScrollView>

      <ReadingControls
        articleId={articleId}
        durationMinutes={article.durationMinutes}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    heroIconWrap: {
      position: 'absolute',
      right: 24,
      bottom: -10,
      opacity: 0.5,
    },
    body: { paddingHorizontal: 20, paddingTop: 20 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryPill: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    educationalPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      borderRadius: 8,
      backgroundColor: withAlpha(theme.colors.warning, 0.15),
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    disclaimer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
      // The warning tint is meaningful (educational / religious notice), so it stays on the card.
      backgroundColor: withAlpha(theme.colors.warning, 0.15),
      padding: 12,
    },
    disclaimerText: { flex: 1 },
    title: {
      marginTop: 12,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    summary: {
      marginTop: 16,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginTop: 18,
      marginBottom: 4,
    },
    paragraph: {
      marginTop: 16,
    },
    missingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: theme.colors.background,
    },
    gateContent: { width: '100%', paddingHorizontal: 20, gap: 16, alignItems: 'center' },
  });
}

export default ArticleReaderScreen;
