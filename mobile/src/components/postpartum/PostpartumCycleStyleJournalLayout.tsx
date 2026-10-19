import React, {useEffect, useMemo, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getTopPadding, spacing} from '../../theme/spacing';
import '../../i18n';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';
import {JOURNAL_HERO_INK} from '../journal/journalHeroInk';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Chrome for Postpartum's Sommeil/Humeur/Symptômes journal screens — built
// to visually mirror Cycle's own JournalSleepScreen / JournalMoodScreen /
// JournalSymptomsScreen (back + title + round save button header, tinted
// hero banner, white heading-icon cards, full-width purple save button)
// AS CLOSELY AS POSSIBLE, without touching those Cycle files. Deliberately
// separate from PostpartumJournalScreenLayout.tsx (still used unchanged by
// Poids/Informations médicales personnelles) since that one uses a
// different header shape (centered icon-circle hero) that this task must
// not extend to these 3 categories. Uses useSafeAreaInsets + getTopPadding
// rather than Cycle's own bare `SafeAreaView` (Cycle's screens reserve no
// Android top inset that way) — the project's own proven-correct pattern,
// kept for the "no overlap with the Android status bar" requirement.
type Props = {
  title: string;
  dateLabel: string;
  /** Small icon tile above the hero title; omitted: no tile (the Humeur screen shows none). */
  heroIcon?: IconName;
  heroImage: number;
  heroTitle: string;
  heroText: string;
  saving?: boolean;
  error?: string;
  onSave: () => void;
  /** Optional: shown only when there is a saved answer to clear (M25). */
  onClear?: () => void;
  children: React.ReactNode;
};

export function PostpartumCycleStyleJournalLayout({
  title,
  dateLabel,
  heroIcon,
  heroImage,
  heroTitle,
  heroText,
  saving,
  error,
  onSave,
  onClear,
  children,
}: Props): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {return;}
      Animated.timing(entrance, {
        toValue: 1,
        duration: reduce ? 0 : 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {active = false;};
  }, [entrance]);

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };

  return (
    <View style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top} style={styles.flex}>
        <View style={[styles.topBar, {paddingTop: getTopPadding(insets.top, true)}]}>
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            hitSlop={10}
            icon="arrow-left"
            onPress={navigation.goBack}
          />

          <View style={styles.headerCopy}>
            <AwaText variant="headlineSmall" style={styles.pageTitle}>{title}</AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" numberOfLines={1} style={styles.dateLabel}>{dateLabel}</AwaText>
          </View>

          <AwaIconButton
            accessibilityLabel={t('common.save')}
            disabled={saving}
            hitSlop={10}
            icon={saving ? 'loading' : 'check'}
            onPress={onSave}
            variant="filled"
          />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + spacing.lg}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View style={entranceStyle}>
            <ImageBackground
              imageStyle={styles.heroImage}
              resizeMode="cover"
              source={heroImage}
              style={styles.hero}>
              <View style={styles.heroContent}>
                {heroIcon ? (
                  <View style={styles.heroIconCircle}>
                    <MaterialDesignIcons color={theme.colors.primary} name={heroIcon} size={24} />
                  </View>
                ) : null}
                <AwaText variant="titleMedium" style={[styles.heroTitle, !heroIcon && styles.heroTitleNoIcon]}>{heroTitle}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.heroText}>{heroText}</AwaText>
              </View>
            </ImageBackground>

            <View style={styles.body}>{children}</View>

            {error ? <AwaText variant="bodySmall" colorRole="error" accessibilityRole="alert" style={styles.error}>{error}</AwaText> : null}

            <AwaButton
              accessibilityLabel={t('common.save')}
              icon="content-save-outline"
              loading={Boolean(saving)}
              onPress={onSave}
              label={saving ? t('postpartumCycleStyleJournalLayout.saving') : t('common.save')}
              style={styles.saveButton}
            />

            {onClear ? (
              <AwaButton
                accessibilityLabel={t('postpartumCycleStyleJournalLayout.clearAnswer')}
                accessibilityRole="button"
                disabled={saving}
                onPress={onClear}
                label={t('postpartumCycleStyleJournalLayout.clearAnswer')}
                variant="text"
                style={styles.clearButton}
              />
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Shared "white card with an icon-circle heading" pattern — mirrors the
// Card/Heading building blocks each Cycle journal screen repeats inline,
// factored once here so Sommeil/Humeur/Symptômes share one implementation
// instead of three copies.
export function PostpartumJournalCard({
  icon,
  title,
  subtitle,
  optional,
  badge,
  children,
}: {
  /** Small round icon tile before the title; omitted: no tile and the title starts at the card's edge. */
  icon?: IconName;
  title: string;
  subtitle?: string;
  optional?: boolean;
  badge?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const cardStyles = useMemo(() => createCardStyles(theme), [theme]);
  return (
    <AwaCard padding="none" variant="filled" style={cardStyles.card}>
      <View style={cardStyles.heading}>
        {icon ? (
          <View style={cardStyles.headingIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
          </View>
        ) : null}
        <View style={[cardStyles.headingCopy, !icon && cardStyles.headingCopyNoIcon]}>
          <AwaText variant="titleSmall" style={cardStyles.title}>
            {title}
            {optional ? <Text style={cardStyles.optional}> {t('postpartumCycleStyleJournalLayout.optionalSuffix')}</Text> : null}
          </AwaText>
          {subtitle ? <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={cardStyles.subtitle}>{subtitle}</AwaText> : null}
        </View>
        {badge ? (
          <View style={cardStyles.badge}>
            <MaterialDesignIcons color={theme.colors.primary} name="check-circle-outline" size={13} />
            <Text style={cardStyles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: {flex: 1, backgroundColor: theme.colors.background},
  flex: {flex: 1},

  topBar: {minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8},
  headerCopy: {flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8},
  pageTitle: {color: theme.colors.accent},
  dateLabel: {marginTop: 2, textAlign: 'center'},

  content: {paddingHorizontal: 13, paddingTop: 6, gap: 10},

  hero: {
    minHeight: 158,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  heroImage: {borderRadius: 12},
  heroContent: {width: '59%', minHeight: 158, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 16},
  heroIconCircle: {width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.surface},
  // The hero photo is light in every theme (see journalHeroInk.ts): dark ink, not the themed accent / onSurfaceVariant.
  heroTitle: {marginTop: 9, color: JOURNAL_HERO_INK.title},
  heroTitleNoIcon: {marginTop: 0},
  heroText: {marginTop: 5, color: JOURNAL_HERO_INK.body},

  body: {marginTop: 10, gap: 10},

  error: {marginTop: 10, textAlign: 'center'},

  saveButton: {width: '88%', maxWidth: 360, alignSelf: 'center', marginTop: 14},
  clearButton: {alignSelf: 'center', marginTop: 4},
  });
}

function createCardStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  card: {padding: 13},
  heading: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12},
  headingIcon: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.primarySoft},
  headingCopy: {flex: 1, minWidth: 0, marginLeft: 9},
  headingCopyNoIcon: {marginLeft: 0},
  title: {color: theme.colors.accent},
  optional: {fontFamily: undefined, color: theme.colors.textSecondary, fontSize: 11, fontWeight: '400'},
  subtitle: {marginTop: 3},
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  badgeText: {color: theme.colors.primary, fontSize: 11, fontWeight: '700'},
  });
}
