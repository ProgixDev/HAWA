import React, {memo, useEffect, useMemo, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme, softTone} from '../../theme/awaThemeTokens';
import i18n from '../../i18n';
import {lowerCaseFor} from '../../utils/textCase';
import {AwaCard} from '../ui/AwaCard';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';

const JOURNAL_HEADER = require('../../assets/images/daily-journal-header.png');

export type JournalRoute = Extract<
  keyof RootStackParamList,
  | 'SymptomEntry'
  | 'MoodEntry'
  | 'FlowEntry'
  | 'TemperatureEntry'
  | 'CervicalMucusEntry'
  | 'LHTestEntry'
  | 'CycleEvolutionEntry'
  | 'SleepEntry'
  | 'ActivityEntry'
  | 'HydrationWeightEntry'
  | 'HydrationScreen'
  | 'MenstrualFlowScreen'
  | 'NoteEntry'
  | 'PrivateIntimacyUnlock'
  | 'JournalConceptionReports'
  | 'PrivatePhotoEntry'
>;

// Generic action descriptor for the shared journal sheet — every objective
// (Cycle/Pregnancy/Postpartum) builds an array of these and hands the sheet
// a ready-made `onPress` (close + navigate), so the sheet itself never needs
// to know about route params. See MainTabNavigator's JournalSheetHost, the
// single place that builds these arrays per objective.
export type JournalSheetAction = {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  tint: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: JournalSheetAction[];
  /** Managed daughter profile only: no illustrated header and room for a longer card subtitle. Omitted = the original sheet. */
  compact?: boolean;
};

// Cycle's own action list/copy — unchanged from before this component became
// reusable. Kept here (not in MainTabNavigator) since it's this screen's
// original, still-canonical content; PregnancyDashboard/PostpartumDashboard's
// lists live alongside JournalSheetHost instead.
// A function (not a static array) so its title/subtitle stay in sync with the
// active app language — every consumer (MainTabNavigator's cycle/daughter
// journal, this file's own default actions, tests) calls it fresh rather than
// reading a French-only module-level constant.
export function getCycleJournalItems(): Array<{
  route: JournalRoute;
  icon: string;
  title: string;
  subtitle: string;
  tint: string;
}> {
  return [
    {
      route: 'SymptomEntry',
      icon: 'heart-pulse',
      title: i18n.t('dailyJournalSheet.items.symptom.title'),
      subtitle: i18n.t('dailyJournalSheet.items.symptom.subtitle'),
      tint: '#E9DFFF',
    },
    {
      route: 'MoodEntry',
      icon: 'emoticon-happy-outline',
      title: i18n.t('dailyJournalSheet.items.mood.title'),
      subtitle: i18n.t('dailyJournalSheet.items.mood.subtitle'),
      tint: '#F9DDE8',
    },
    {
      route: 'ActivityEntry',
      icon: 'walk',
      title: i18n.t('dailyJournalSheet.items.activity.title'),
      subtitle: i18n.t('dailyJournalSheet.items.activity.subtitle'),
      tint: '#DFF0F1',
    },
    {
      route: 'SleepEntry',
      icon: 'weather-night',
      title: i18n.t('dailyJournalSheet.items.sleep.title'),
      subtitle: i18n.t('dailyJournalSheet.items.sleep.subtitle'),
      tint: '#E8DDF8',
    },
    {
      route: 'HydrationScreen',
      icon: 'cup-water',
      title: i18n.t('dailyJournalSheet.items.hydration.title'),
      subtitle: i18n.t('dailyJournalSheet.items.hydration.subtitle'),
      tint: '#DDEEFF',
    },
    {
      route: 'MenstrualFlowScreen',
      icon: 'water',
      title: i18n.t('dailyJournalSheet.items.menstrualFlow.title'),
      subtitle: i18n.t('dailyJournalSheet.items.menstrualFlow.subtitle'),
      tint: '#F9DDE8',
    },
    {
      route: 'PrivateIntimacyUnlock',
      icon: 'heart-outline',
      title: i18n.t('dailyJournalSheet.items.intimacy.title'),
      subtitle: i18n.t('dailyJournalSheet.items.intimacy.subtitle'),
      tint: '#F9DCE8',
    },
    {
      route: 'NoteEntry',
      icon: 'notebook-edit-outline',
      title: i18n.t('dailyJournalSheet.items.note.title'),
      subtitle: i18n.t('dailyJournalSheet.items.note.subtitle'),
      tint: '#E9DFF7',
    },
  ];
}

function DailyJournalSheet({visible, onClose, title, subtitle, actions, compact = false}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const resolvedTitle = title ?? t('dailyJournalSheet.defaultTitle');
  const resolvedSubtitle = subtitle ?? t('dailyJournalSheet.defaultSubtitle');
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 260,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => finished && onClose());
  };

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    dragY.setValue(0);
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      damping: 22,
      stiffness: 170,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [dragY, progress, visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => dragY.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 110 || gesture.vy > 1.1) {close(); return;}
        Animated.spring(dragY, {toValue: 0, damping: 20, stiffness: 180, useNativeDriver: true}).start();
      },
    }),
  ).current;

  const sheetTranslateY = Animated.add(
    progress.interpolate({inputRange: [0, 1], outputRange: [height, 0]}),
    dragY,
  );

  return (
    <Modal animationType="none" onRequestClose={close} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, {opacity: progress.interpolate({inputRange: [0, 1], outputRange: [0, 0.35]})}]}>
          <Pressable accessibilityLabel={t('dailyJournalSheet.closeJournal')} onPress={close} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.sheet, {opacity: progress, transform: [{translateY: sheetTranslateY}]}]}>
          <View style={styles.handle} />
          <AwaIconButton
            accessibilityLabel={t('common.close')}
            icon="close"
            onPress={close}
            style={styles.closeButton}
            variant="filled"
          />
          <ScrollView contentContainerStyle={[styles.scrollContent, {paddingBottom: Math.max(insets.bottom, 16) + 20}]} showsVerticalScrollIndicator={false}>
            {compact ? null : <Image accessibilityIgnoresInvertColors resizeMode="cover" source={JOURNAL_HEADER} style={styles.headerImage} />}
            <AwaText variant="headlineSmall" style={compact ? styles.titleCompact : styles.title}>{resolvedTitle}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.subtitle}>{resolvedSubtitle}</AwaText>
            <View style={styles.cards}>
              {actions.map((action, index) => {
                const start = 0.34 + index * 0.055;
                const end = Math.min(1, start + 0.25);
                const cardOpacity = progress.interpolate({inputRange: [0, start, end, 1], outputRange: [0, 0, 1, 1]});
                const cardTranslateY = progress.interpolate({inputRange: [0, start, end, 1], outputRange: [16, 16, 0, 0]});
                return (
                  <Animated.View key={action.key} style={{opacity: cardOpacity, transform: [{translateY: cardTranslateY}]}}>
                    <AwaCard
                        accessibilityHint={t('dailyJournalSheet.openEntryHint', {category: lowerCaseFor(action.title)})}
                        accessibilityLabel={action.title}
                        onPress={action.onPress}
                        padding="none"
                        style={styles.card}
                        variant="outlined">
                      <View style={[styles.iconCircle, {backgroundColor: softTone(theme, action.tint, theme.colors.primary)}]}>
                        <MaterialDesignIcons color={theme.colors.primary} name={action.icon as never} size={25} />
                      </View>
                      <View style={styles.cardCopy}>
                        <AwaText variant="titleMedium">{action.title}</AwaText>
                        <AwaText colorRole="onSurfaceVariant" variant="bodySmall" numberOfLines={2}>{action.subtitle}</AwaText>
                      </View>
                      <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={26} />
                    </AwaCard>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    modalRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    overlay: {...StyleSheet.absoluteFillObject, backgroundColor: '#17102F'},
    sheet: {height: '88%', overflow: 'hidden', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: theme.colors.surface, elevation: 24},
    handle: {width: 46, height: 5, alignSelf: 'center', marginTop: 10, borderRadius: 3, backgroundColor: withAlpha(theme.colors.primary, 0.30)},
    closeButton: {position: 'absolute', right: 16, top: 16, zIndex: 3},
    scrollContent: {paddingHorizontal: 16, paddingBottom: 30},
    headerImage: {width: '100%', height: 145, marginTop: 5, borderRadius: 12},
    title: {marginTop: 3, textAlign: 'center'},
    // Without the header illustration the title clears the close button instead.
    titleCompact: {marginTop: 28, paddingHorizontal: 44, textAlign: 'center'},
    subtitle: {marginTop: 2, textAlign: 'center'},
    cards: {gap: 10, marginTop: 18},
    card: {minHeight: 72, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingHorizontal: 12},
    iconCircle: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24},
    cardCopy: {flex: 1, marginHorizontal: 12},
  });
}

export default memo(DailyJournalSheet);
