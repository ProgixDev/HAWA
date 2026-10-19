import React, {useEffect, useMemo, useRef} from 'react';
import {AccessibilityInfo, Animated, Image, type ImageSourcePropType, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {awaShapes} from '../../theme/shapes';
import {awaSpace} from '../../theme/spaceScale';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaIcon, type AwaIconName} from '../ui/AwaIcon';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';
import {pressedStyle} from '../ui/pressFeedback';
import {dateFormatLocale} from '../../utils/cycleMath';
import '../../i18n';

// Shared journal layout (DESIGN.md, Material 3): a top app bar with a standard icon button and a Fraunces title, content
// on filled cards, filter-chip choices, a full-width filled button, one quiet privacy line. Colours come from the
// resolved theme roles; nothing here changes what a journal screen saves or navigates to.

type Props = {title: string; icon: string; children: React.ReactNode; onSave?: () => void; saving?: boolean; error?: string; heroSource?: ImageSourcePropType; heroLabel?: string; saveLabel?: string ; heroLabelBesideIcon?: boolean; /** Hero card without the small icon before its label (default: the icon is shown). */ hideHeroIcon?: boolean; hideJournalHeader?: boolean; toast?: React.ReactNode; /** Replaces the default "Aujourd’hui · <date>" header line — only for a journal opened on an explicit PAST day (M21). */ dateLabel?: string;};

const BACK_SLOT = 48;

export function JournalScreenLayout({title, icon, children, onSave, saving, error, heroSource, heroLabel, saveLabel, hideHeroIcon = false, hideJournalHeader = false, toast, dateLabel}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const resolvedSaveLabel = saveLabel ?? t('common.save');
  const {theme} = useAwaTheme();
  const {roles} = useAwaTokens();
  const styles = useMemo(() => createStyles(roles), [roles]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {AccessibilityInfo.isReduceMotionEnabled().then(reduce => Animated.timing(entrance, {toValue: 1, duration: reduce ? 0 : 280, useNativeDriver: true}).start());}, [entrance]);
  const date = new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long', day: 'numeric', month: 'long'}).format(new Date());
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.statusBarStyle} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top} style={styles.flex}>
        <View style={styles.header}>
          <AwaIconButton accessibilityLabel={t('common.back')} icon="chevron-left" iconSize={28} onPress={navigation.goBack} />
          <View style={styles.headerCopy}>
            {!hideJournalHeader ? <AwaText colorRole="primary" emphasized variant="labelSmall">{t('dailyJournalSheet.defaultTitle')}</AwaText> : null}
            <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{title}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{dateLabel ?? t('journalScreenLayout.todayDate', {date})}</AwaText>
          </View>
          <View style={styles.backSlot} />
        </View>
        <Animated.View style={[styles.flex, {opacity: entrance, transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}]}]}>
          <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 30}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {heroSource ? (
              <AwaCard padding="none" style={styles.hero} variant="filled">
                <View style={styles.heroCopy}>
                  {hideHeroIcon ? null : <AwaIcon colorRole="primary" decorative name={icon as AwaIconName} size="md" />}
                  <AwaText emphasized style={hideHeroIcon ? undefined : styles.heroLabel} variant="titleSmall">{heroLabel ?? title}</AwaText>
                </View>
                <Image resizeMode="contain" source={heroSource} style={styles.heroImage} />
              </AwaCard>
            ) : null}
            {children}
            {error ? <AwaText accessibilityRole="alert" colorRole="error" style={styles.error} variant="bodyMedium">{error}</AwaText> : null}
            {onSave ? (
              <AwaButton accessibilityLabel={resolvedSaveLabel} disabled={saving} fullWidth icon="check-circle-outline" label={saving ? t('periodStartSheet.saving') : resolvedSaveLabel} onPress={onSave} size="large" />
            ) : null}
            <View style={styles.privacy}>
              <AwaIcon decorative name="lock-outline" size="xs" />
              <AwaText colorRole="onSurfaceVariant" variant="labelSmall">{t('journalScreenLayout.privacyFooter')}</AwaText>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
      {toast}
    </SafeAreaView>
  );
}

const sectionTitleStyle = {marginBottom: awaSpace.s12};

export function SectionCard({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <AwaCard variant="filled">
      <AwaText emphasized style={sectionTitleStyle} variant="titleMedium">{title}</AwaText>
      {children}
    </AwaCard>
  );
}

// `labelFor` is optional and display-only: when provided, it renders a
// translated label for each option while `onChange`/`value`/`values`/`key`
// keep operating on the raw `option` string untouched — used by screens whose
// options are themselves DATA-BEARING (the persisted value), e.g.
// JournalTemperatureScreen.tsx's `method` chips (PHASE 7H). Every other
// caller omits it and keeps today's exact behavior (renders `option` as-is).
export function ChoiceChips({options, value, values, onChange, multiple, labelFor}: {options: string[]; value?: string; values?: string[]; onChange: (value: string) => void; multiple?: boolean; labelFor?: (option: string) => string}) {
  const {roles} = useAwaTokens();
  const styles = useMemo(() => createStyles(roles), [roles]);
  return (
    <View style={styles.chips}>
      {options.map(option => {
        const selected = multiple ? values?.includes(option) : value === option;
        const label = labelFor ? labelFor(option) : option;
        return (
          <Pressable
            key={option}
            accessibilityLabel={labelFor ? label : undefined}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={{checked: Boolean(selected)}}
            hitSlop={4}
            onPress={() => onChange(option)}
            style={({pressed}) => [styles.chip, selected && styles.chipSelected, pressed && pressedStyle(selected ? roles.primaryContainer : undefined, roles.onSurface)]}>
            <AwaText colorRole={selected ? 'onPrimaryContainer' : 'onSurfaceVariant'} emphasized={Boolean(selected)} variant="labelLarge">{label}</AwaText>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(roles: ReturnType<typeof useAwaTokens>['roles']) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: roles.background},
    flex: {flex: 1},
    header: {minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: awaSpace.s8, paddingVertical: awaSpace.s8},
    headerCopy: {flex: 1, alignItems: 'center', paddingHorizontal: awaSpace.s8},
    backSlot: {width: BACK_SLOT},
    title: {marginTop: awaSpace.s4, textAlign: 'center'},
    content: {paddingHorizontal: awaSpace.s16, paddingTop: awaSpace.s4, gap: awaSpace.s12},
    hero: {height: 126, flexDirection: 'row', alignItems: 'center', overflow: 'hidden'},
    heroCopy: {flex: 1, paddingLeft: awaSpace.s16},
    heroLabel: {marginTop: awaSpace.s8},
    heroImage: {width: 132, height: 132, marginRight: -4},
    chips: {flexDirection: 'row', flexWrap: 'wrap', gap: awaSpace.s8},
    chip: {minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: roles.outline, borderRadius: awaShapes.small, paddingHorizontal: awaSpace.s16},
    chipSelected: {borderColor: roles.primaryContainer, backgroundColor: roles.primaryContainer},
    error: {textAlign: 'center'},
    privacy: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: awaSpace.s4, paddingVertical: awaSpace.s4},
  });
}
