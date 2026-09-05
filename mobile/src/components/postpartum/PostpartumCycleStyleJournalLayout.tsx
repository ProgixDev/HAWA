import React, {useEffect, useMemo, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getTopPadding, spacing} from '../../theme/spacing';

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
  heroIcon: IconName;
  heroImage: number;
  heroTitle: string;
  heroText: string;
  saving?: boolean;
  error?: string;
  onSave: () => void;
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
  children,
}: Props): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
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
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.roundButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="arrow-left" size={24} />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.pageTitle}>{title}</Text>
            <Text numberOfLines={1} style={styles.dateLabel}>{dateLabel}</Text>
          </View>

          <Pressable
            accessibilityLabel="Enregistrer"
            accessibilityRole="button"
            accessibilityState={{disabled: Boolean(saving)}}
            disabled={saving}
            hitSlop={10}
            onPress={onSave}
            style={({pressed}) => [styles.roundButton, styles.saveHeaderButton, (pressed || saving) && styles.pressed]}>
            <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={saving ? 'loading' : 'check'} size={22} />
          </Pressable>
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
                <View style={styles.heroIconCircle}>
                  <MaterialDesignIcons color={theme.colors.primary} name={heroIcon} size={24} />
                </View>
                <Text style={styles.heroTitle}>{heroTitle}</Text>
                <Text style={styles.heroText}>{heroText}</Text>
              </View>
            </ImageBackground>

            <View style={styles.body}>{children}</View>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityLabel="Enregistrer"
              accessibilityRole="button"
              accessibilityState={{disabled: Boolean(saving)}}
              disabled={saving}
              onPress={onSave}
              style={({pressed}) => [styles.saveButton, (pressed || saving) && styles.pressed]}>
              <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={saving ? 'loading' : 'content-save-outline'} size={20} />
              <Text style={styles.saveText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
            </Pressable>
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
  icon: IconName;
  title: string;
  subtitle?: string;
  optional?: boolean;
  badge?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const cardStyles = useMemo(() => createCardStyles(theme), [theme]);
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.heading}>
        <View style={cardStyles.headingIcon}>
          <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
        </View>
        <View style={cardStyles.headingCopy}>
          <Text style={cardStyles.title}>
            {title}
            {optional ? <Text style={cardStyles.optional}> (optionnel)</Text> : null}
          </Text>
          {subtitle ? <Text style={cardStyles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={cardStyles.badge}>
            <MaterialDesignIcons color={theme.colors.primary} name="check-circle-outline" size={13} />
            <Text style={cardStyles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: {flex: 1, backgroundColor: theme.colors.background},
  flex: {flex: 1},
  pressed: {opacity: 0.78, transform: [{scale: 0.98}]},

  topBar: {minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8},
  roundButton: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14)},
  saveHeaderButton: {backgroundColor: theme.colors.primary, borderWidth: 0, ...theme.shadow},
  headerCopy: {flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8},
  pageTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 22, fontWeight: '700'},
  dateLabel: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center'},

  content: {paddingHorizontal: 13, paddingTop: 6, gap: 10},

  hero: {
    minHeight: 158,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 20,
    backgroundColor: theme.colors.primarySoft,
  },
  heroImage: {borderRadius: 20},
  heroContent: {width: '59%', minHeight: 158, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 16},
  heroIconCircle: {width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.surface},
  heroTitle: {marginTop: 9, color: theme.colors.accent, fontFamily: 'serif', fontSize: 17, lineHeight: 21, fontWeight: '700'},
  heroText: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15},

  body: {marginTop: 10, gap: 10},

  error: {marginTop: 10, color: theme.colors.danger, fontSize: 12.5, textAlign: 'center'},

  saveButton: {
    width: '88%',
    maxWidth: 360,
    minHeight: 54,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 4,
  },
  saveText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},
  });
}

function createCardStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    padding: 13,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },
  heading: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12},
  headingIcon: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.colors.primarySoft},
  headingCopy: {flex: 1, minWidth: 0, marginLeft: 9},
  title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
  optional: {fontFamily: undefined, color: theme.colors.textSecondary, fontSize: 11, fontWeight: '400'},
  subtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 14},
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
  badgeText: {color: theme.colors.primary, fontSize: 10, fontWeight: '700'},
  });
}
