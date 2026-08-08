import React, {memo, useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from './homeTheme';
import type {JournalRoute} from '../journal/DailyJournalSheet';
import type {DailyJournalEntry, JournalSection} from '../../types/journal';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Shortcut = {
  section: JournalSection;
  route: JournalRoute;
  icon: IconName;
  label: string;
  subtitle?: string;
};

const SHORTCUTS: Shortcut[] = [
  {section: 'symptoms', route: 'SymptomEntry', icon: 'heart-outline', label: 'Symptômes'},
  {section: 'mood', route: 'MoodEntry', icon: 'emoticon-happy-outline', label: 'Humeur'},
  {section: 'activity', route: 'ActivityEntry', icon: 'run', label: 'Activité'},
  {section: 'sleep', route: 'SleepEntry', icon: 'weather-night', label: 'Sommeil'},
  {section: 'hydration', route: 'HydrationScreen', icon: 'cup-water', label: 'Hydratation'},
  {section: 'flow', route: 'MenstrualFlowScreen', icon: 'water', label: 'Flux menstruel'},
  {
    section: 'intimacy',
    route: 'PrivateIntimacyUnlock',
    icon: 'shield-lock-outline',
    label: 'Vie intime',
    subtitle: 'Rapports, protection et ressenti',
  },
  {section: 'note', route: 'NoteEntry', icon: 'notebook-edit-outline', label: 'Notes'},
];

type Props = {
  entry?: DailyJournalEntry;
  onNavigate: (route: JournalRoute) => void;
};

function DailyJournalCard({entry, onNavigate}: Props): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;
  const completed = SHORTCUTS.filter(shortcut => Boolean(entry?.[shortcut.section])).length;
  const ratio = completed / SHORTCUTS.length;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      Animated.timing(progress, {
        toValue: ratio,
        duration: reduceMotion ? 0 : 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
  }, [progress, ratio]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal du jour</Text>
        <Text style={styles.progressLabel}>{completed} / {SHORTCUTS.length} complété</Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {width: progress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']})},
          ]}
        />
      </View>

      <View style={styles.row}>
        {SHORTCUTS.map(shortcut => {
          const done = Boolean(entry?.[shortcut.section]);
          return (
            <Pressable
              accessibilityHint={shortcut.subtitle}
              accessibilityLabel={`${shortcut.label}${done ? ', complété' : ''}`}
              accessibilityRole="button"
              key={shortcut.section}
              onPress={() => onNavigate(shortcut.route)}
              style={({pressed}) => [styles.item, pressed && styles.pressed]}>
              <View style={styles.iconWrap}>
                <View style={[styles.iconCircle, done && styles.iconCircleDone]}>
                  <MaterialDesignIcons color={done ? '#FFFFFF' : homeColors.primary} name={shortcut.icon} size={16} />
                </View>
                {done && (
                  <View style={styles.check}>
                    <MaterialDesignIcons color="#FFFFFF" name="check" size={9} />
                  </View>
                )}
              </View>
              <Text numberOfLines={2} style={styles.label}>{shortcut.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...homeShadow,
  },
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  progressLabel: {color: homeColors.textSecondary, fontSize: 11.5, fontWeight: '600'},
  track: {marginTop: 10, height: 6, borderRadius: 3, backgroundColor: homeColors.lightLavender, overflow: 'hidden'},
  fill: {height: '100%', borderRadius: 3, backgroundColor: homeColors.primary},
  row: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, rowGap: 12},
  item: {flexBasis: '25%', flexGrow: 0, alignItems: 'center', paddingHorizontal: 1, minWidth: 0},
  iconWrap: {width: 36, height: 36},
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: homeColors.lightLavender,
  },
  iconCircleDone: {backgroundColor: homeColors.primary},
  check: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: homeColors.green,
  },
  label: {marginTop: 6, color: homeColors.textSecondary, fontSize: 9, lineHeight: 11.5, textAlign: 'center'},
  pressed: {opacity: 0.75},
});

export default memo(DailyJournalCard);
