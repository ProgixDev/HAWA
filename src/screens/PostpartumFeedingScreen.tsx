import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {
  getPostpartumPreferences,
  setFeedingType,
  type PostpartumFeedingType,
} from '../state/postpartumPreferences';

// Same background/visual identity as PostpartumDeliveryTypeScreen — the two
// screens belong to the same onboarding sequence and must feel identical.
const BACKGROUND = require('../assets/images/school-selection-background.png');

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_SECONDARY = '#655A8D';

type Props = NativeStackScreenProps<RootStackParamList, 'PostpartumFeeding'>;

type FeedingOption = {
  id: PostpartumFeedingType;
  label: string;
  // NOTE: these 4 illustrations don't exist yet in
  // src/assets/images/postpartum/feeding/ — add them at these exact paths
  // (see final report). Until then this screen will fail to bundle.
  image: number;
};

const OPTIONS: FeedingOption[] = [
  {
    id: 'exclusive_breastfeeding',
    label: 'Allaitement maternel exclusif',
    image: require('../assets/images/postpartum/feeding/feeding-breastfeeding.png'),
  },
  {
    id: 'mixed',
    label: 'Allaitement mixte\n(sein + biberon)',
    image: require('../assets/images/postpartum/feeding/feeding-mixed.png'),
  },
  {
    id: 'exclusive_bottle',
    label: 'Biberon exclusivement',
    image: require('../assets/images/postpartum/feeding/feeding-bottle.png'),
  },
  {
    id: 'unknown',
    label: 'Je ne sais pas encore',
    image: require('../assets/images/postpartum/feeding/feeding-unknown.png'),
  },
];

type OptionCardProps = {
  option: FeedingOption;
  selected: boolean;
  onPress: () => void;
};

// Identical card behavior/animation to PostpartumDeliveryTypeScreen's
// OptionCard — same subtle scale pulse on selection.
function OptionCard({option, selected, onPress}: OptionCardProps): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!selected) {return;}
    Animated.sequence([
      Animated.timing(scale, {toValue: 0.98, duration: 90, useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, damping: 14, stiffness: 220, useNativeDriver: true}),
    ]).start();
  }, [selected, scale]);

  return (
    <Animated.View style={[styles.optionWrapper, {transform: [{scale}]}]}>
      <Pressable
        accessibilityLabel={option.label.replace('\n', ' ')}
        accessibilityRole="radio"
        accessibilityState={{checked: selected}}
        onPress={onPress}
        style={({pressed}) => [styles.optionCard, selected && styles.optionCardSelected, pressed && styles.pressed]}>
        <View style={styles.optionIcon}>
          <Image accessibilityIgnoresInvertColors resizeMode="contain" source={option.image} style={styles.optionImage} />
        </View>

        <Text style={styles.optionLabel}>{option.label}</Text>

        <View style={[styles.checkBadge, selected && styles.checkBadgeSelected]}>
          {selected ? <MaterialDesignIcons color="#FFFFFF" name="check" size={14} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PostpartumFeedingScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  // Preselect a previously saved choice (canonical postpartumPreferences
  // store, reused as-is — no second store); otherwise nothing is
  // preselected, so the user makes an explicit choice.
  const [selected, setSelected] = useState<PostpartumFeedingType | null>(
    () => getPostpartumPreferences().feedingType,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: reduceMotion.current ? 0 : 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const handleNext = async () => {
    if (saving) {return;}
    setSaving(true);
    try {
      // Optional field — proceeding without picking anything is allowed.
      // "Je ne sais pas encore" (feedingType === 'unknown') is a real,
      // explicit answer and is persisted as-is, never collapsed to null.
      if (selected) {
        await setFeedingType(selected);
      }
      navigation.navigate('SecuritySetup');
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.mainContent, entranceStyle]}>
            <View style={styles.header}>
              <Text style={styles.title}>Allaitement</Text>
              <Text style={styles.subtitle}>Ton choix nous aide à personnaliser ton suivi et nos conseils.</Text>
            </View>

            <View style={styles.optionsCenterContainer}>
              <View style={styles.optionsList}>
                {OPTIONS.map(option => (
                  <OptionCard
                    key={option.id}
                    onPress={() => setSelected(option.id)}
                    option={option}
                    selected={selected === option.id}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={handleNext}
            style={({pressed}) => [styles.nextButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.nextText}>{saving ? 'Enregistrement…' : 'Suivant'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg},
  mainContent: {flex: 1},
  header: {alignItems: 'center', paddingTop: 24, marginBottom: spacing.md},
  title: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 310,
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  optionsCenterContainer: {flex: 1, justifyContent: 'center', paddingVertical: spacing.md},
  optionsList: {gap: 12},
  optionWrapper: {width: '100%'},
  optionCard: {
    width: '100%',
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.4,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,255,0.94)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    elevation: 3,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  optionCardSelected: {borderColor: PURPLE, backgroundColor: '#F5F0FC'},
  optionIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F1EAFB',
    overflow: 'hidden',
  },
  optionImage: {width: 48, height: 48},
  optionLabel: {flex: 1, minWidth: 0, marginHorizontal: 13, color: '#2A2050', fontSize: 14.5, fontWeight: '600', lineHeight: 19},
  checkBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: 'rgba(111,83,190,0.28)',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  checkBadgeSelected: {borderColor: PURPLE, backgroundColor: PURPLE},
  nextButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderRadius: 18,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.82},
});

export default PostpartumFeedingScreen;
