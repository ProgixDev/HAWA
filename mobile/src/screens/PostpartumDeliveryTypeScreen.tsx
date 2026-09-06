import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
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
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {
  getPostpartumPreferences,
  setDeliveryType,
  type PostpartumDeliveryType,
} from '../state/postpartumPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PostpartumDeliveryType'
>;

type DeliveryTypeOption = {
  id: PostpartumDeliveryType;
  label: string;
  image: number;
};

const OPTIONS: DeliveryTypeOption[] = [
  {
    id: 'vaginal',
    label: 'Accouchement vaginal',
    image: require('../assets/images/postpartum/delivery-types/delivery-vaginal.png'),
  },
  {
    id: 'planned_csection',
    label: 'Césarienne programmée',
    image: require('../assets/images/postpartum/delivery-types/delivery-cesarean-planned.png'),
  },
  {
    id: 'emergency_csection',
    label: 'Césarienne en urgence',
    image: require('../assets/images/postpartum/delivery-types/delivery-cesarean-emergency.png'),
  },
  {
    id: 'prefer_not_to_say',
    label: 'Je préfère ne pas préciser',
    image: require('../assets/images/postpartum/delivery-types/delivery-private.png'),
  },
];

type OptionCardProps = {
  option: DeliveryTypeOption;
  selected: boolean;
  onPress: () => void;
};

function OptionCard({
  option,
  selected,
  onPress,
}: OptionCardProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!selected) {
      return;
    }

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected, scale]);

  return (
    <Animated.View
      style={[
        styles.optionWrapper,
        {
          transform: [{scale}],
        },
      ]}>
      <Pressable
        accessibilityLabel={option.label}
        accessibilityRole="radio"
        accessibilityState={{checked: selected}}
        onPress={onPress}
        style={({pressed}) => [
          styles.optionCard,
          selected && styles.optionCardSelected,
          pressed && styles.pressed,
        ]}>
        <View style={styles.optionIcon}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={option.image}
            style={styles.optionImage}
          />
        </View>

        <Text style={styles.optionLabel}>
          {option.label}
        </Text>

        <View
          style={[
            styles.checkBadge,
            selected && styles.checkBadgeSelected,
          ]}>
          {selected ? (
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name="check"
              size={14}
            />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PostpartumDeliveryTypeScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const [selected, setSelected] =
    useState<PostpartumDeliveryType | null>(
      () => getPostpartumPreferences().deliveryType,
    );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
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
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      if (selected) {
        await setDeliveryType(selected);
      }

      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }

      navigation.navigate('PostpartumFeeding');
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <View style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          hidden={false}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: getTopPadding(insets.top),
              paddingBottom:
                Math.max(insets.bottom, 16) + spacing.sm,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Animated.View
            style={[
              styles.mainContent,
              entranceStyle,
            ]}>

            {/* ============================= */}
            {/* TITRE + SOUS-TITRE */}
            {/* ============================= */}

            <View style={styles.header}>
              <Text style={styles.title}>
                Type d’accouchement
              </Text>

              <Text style={styles.subtitle}>
                Cette information reste privée et nous aide à mieux
                t’accompagner.
              </Text>
            </View>

            {/* ============================= */}
            {/* CHOIX CENTRÉS */}
            {/* ============================= */}

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

              {/* INFORMATION */}

              <View style={styles.infoRow}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="information-outline"
                  size={17}
                />

                <Text style={styles.infoText}>
                  Tu pourras modifier ce choix plus tard dans les
                  réglages.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ============================= */}
          {/* BOUTON SUIVANT */}
          {/* ============================= */}

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={handleNext}
            style={({pressed}) => [
              styles.nextButton,
              (pressed || saving) && styles.pressed,
            ]}>
            <Text style={styles.nextText}>
              {saving ? 'Enregistrement...' : 'Suivant'}
            </Text>
          </Pressable>

        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    pageBackgroundDecor: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },

    pageGlowTop: {
      position: 'absolute',
      top: -150,
      right: -110,
      width: 330,
      height: 330,
      borderRadius: 165,
      backgroundColor: withAlpha(theme.colors.primary, 0.07),
    },

    pageGlowMiddle: {
      position: 'absolute',
      top: '38%',
      left: -130,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: withAlpha(theme.colors.primary, 0.045),
    },

    pageGlowBottom: {
      position: 'absolute',
      bottom: -150,
      right: -100,
      width: 310,
      height: 310,
      borderRadius: 155,
      backgroundColor: withAlpha(theme.colors.primary, 0.05),
    },

    safeArea: {
      flex: 1,
    },

    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },

    mainContent: {
      flex: 1,
    },

    /*
     * HEADER
     *
     * paddingTop permet de faire descendre
     * le titre et le sous-titre.
     *
     * Si tu veux encore plus bas :
     * 24 -> 30 ou 35
     */
    header: {
      alignItems: 'center',

      paddingTop: 24,

      marginBottom: spacing.md,
    },

    title: {
      color: theme.colors.text,

      fontFamily: 'serif',

      fontSize: 26,
      fontWeight: '700',

      lineHeight: 32,

      textAlign: 'center',
    },

    subtitle: {
      marginTop: 10,

      maxWidth: 310,

      color: theme.colors.textSecondary,

      fontSize: 13,
      lineHeight: 19,

      textAlign: 'center',
    },

    /*
     * Cette partie prend l'espace disponible
     * entre le header et le bouton.
     *
     * Les choix restent centrés verticalement.
     */
    optionsCenterContainer: {
      flex: 1,

      justifyContent: 'center',

      paddingVertical: spacing.md,
    },

    optionsList: {
      gap: 12,
    },

    optionWrapper: {
      width: '100%',
    },

    optionCard: {
      width: '100%',

      minHeight: 68,

      flexDirection: 'row',

      alignItems: 'center',

      borderWidth: 1.4,

      borderColor: theme.colors.border,

      borderRadius: 18,

      backgroundColor: theme.colors.surface,

      paddingHorizontal: 14,
      paddingVertical: 7,

      elevation: 3,

      shadowColor: theme.shadow.shadowColor,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.08,

      shadowRadius: 10,
    },

    optionCardSelected: {
      borderColor: theme.colors.primary,

      backgroundColor: theme.colors.primarySoft,
    },

    optionIcon: {
      width: 52,
      height: 52,

      alignItems: 'center',

      justifyContent: 'center',

      borderRadius: 16,

      backgroundColor: theme.colors.primarySoft,

      overflow: 'hidden',
    },

    optionImage: {
      width: 48,
      height: 48,
    },

    optionLabel: {
      flex: 1,

      minWidth: 0,

      marginHorizontal: 13,

      color: theme.colors.text,

      fontSize: 14.5,

      fontWeight: '600',

      lineHeight: 19,
    },

    checkBadge: {
      width: 24,
      height: 24,

      alignItems: 'center',

      justifyContent: 'center',

      borderWidth: 1.4,

      borderColor: withAlpha(theme.colors.primary, 0.28),

      borderRadius: 12,

      backgroundColor: 'transparent',
    },

    checkBadgeSelected: {
      borderColor: theme.colors.primary,

      backgroundColor: theme.colors.primary,
    },

    infoRow: {
      flexDirection: 'row',

      alignItems: 'flex-start',

      gap: 8,

      marginTop: spacing.lg,

      paddingHorizontal: 4,
    },

    infoText: {
      flex: 1,

      color: theme.colors.textSecondary,

      fontSize: 12,

      lineHeight: 17,
    },

    /*
     * Bouton toujours en bas du contenu,
     * mais sans position absolute.
     *
     * Cela reste responsive.
     */
    nextButton: {
      minHeight: 54,

      alignItems: 'center',

      justifyContent: 'center',

      marginTop: spacing.sm,

      borderRadius: 18,

      backgroundColor: theme.colors.primary,

      shadowColor: theme.shadow.shadowColor,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.25,

      shadowRadius: 9,

      elevation: 5,
    },

    nextText: {
      color: onPrimaryTextColor(theme),

      fontSize: 18,

      fontWeight: '600',
    },

    pressed: {
      opacity: 0.82,
    },
  });
}

export default PostpartumDeliveryTypeScreen;