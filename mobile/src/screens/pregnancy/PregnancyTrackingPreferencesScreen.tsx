import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  getPregnancyTrackingPreferences,
  setPregnancyTrackingPreferences,
  type PregnancyTrackingPreference,
} from '../../state/pregnancyPreferences';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PregnancyTrackingPreferences'
>;

type OptionConfig = {
  id: PregnancyTrackingPreference;
  icon: React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];
  label: string;
};

/*
 * Suivi grossesse :
 *
 * 1. Symptômes ressentis
 * 2. Poids
 * 3. Humeur
 * 4. Sommeil
 * 5. Informations médicales personnelles
 *
 * Aucun autre élément n'est proposé sur cet écran.
 */
// Built from `t()` inside the component (see `useMemo(buildOptions, ...)`
// below) rather than as a module-level constant, since the labels must
// react to the active app language. Only `id` is ever persisted (see
// setPregnancyTrackingPreferences below) — `label` is pure display text.
function buildOptions(t: (key: string) => string): OptionConfig[] {
  return [
    {
      id: 'symptoms',
      icon: 'heart-pulse',
      label: t('pregnancyTrackingPreferences.options.symptoms'),
    },
    {
      id: 'weight',
      icon: 'scale-bathroom',
      label: t('pregnancyTrackingPreferences.options.weight'),
    },
    {
      id: 'mood',
      icon: 'emoticon-happy-outline',
      label: t('pregnancyTrackingPreferences.options.mood'),
    },
    {
      id: 'sleep',
      icon: 'weather-night',
      label: t('pregnancyTrackingPreferences.options.sleep'),
    },
    {
      id: 'medicalInfo',
      icon: 'shield-lock-outline',
      label: t('pregnancyTrackingPreferences.options.medicalInfo'),
    },
  ];
}

type TrackingRowProps = {
  option: OptionConfig;
  selected: boolean;
  delay: number;
  onToggle: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
};

function TrackingRow({
  option,
  selected,
  delay,
  onToggle,
  theme,
  styles,
}: TrackingRowProps): React.JSX.Element {
  const entranceAnim = useRef(
    new Animated.Value(0),
  ).current;

  const checkScale = useRef(
    new Animated.Value(1),
  ).current;

  const isFirstRender = useRef(true);

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 340,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animation d'entrée uniquement au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),

      Animated.timing(checkScale, {
        toValue: 1,
        duration: 130,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected, checkScale]);

  const entranceStyle = {
    opacity: entranceAnim,

    transform: [
      {
        translateY: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={entranceStyle}>
      <Pressable
        accessibilityLabel={option.label}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: selected,
        }}
        onPress={onToggle}
        style={({pressed}) => [
          styles.row,
          selected && styles.rowSelected,
          pressed && styles.pressed,
        ]}>
        {/* CHECKBOX */}
        <Animated.View
          style={[
            styles.checkbox,
            selected && styles.checkboxSelected,
            {
              transform: [
                {
                  scale: checkScale,
                },
              ],
            },
          ]}>
          {selected ? (
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name="check"
              size={14}
            />
          ) : null}
        </Animated.View>

        {/* ICON */}
        <View style={styles.iconBox}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name={option.icon}
            size={19}
          />
        </View>

        {/* LABEL */}
        <Text style={styles.rowLabel}>
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function PregnancyTrackingPreferencesScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const OPTIONS = useMemo(() => buildOptions(t), [t]);

  const [selected, setSelected] = useState<
    Set<PregnancyTrackingPreference>
  >(() => {
    /*
     * On ne conserve à l'écran que les choix appartenant
     * réellement aux 5 catégories Grossesse.
     *
     * Cela évite qu'une ancienne préférence comme
     * hydration/activity/notes/appointments reste
     * sélectionnée silencieusement.
     */
    const saved =
      getPregnancyTrackingPreferences();

    const allowedIds = new Set(
      OPTIONS.map(option => option.id),
    );

    return new Set(
      [...saved].filter(id =>
        allowedIds.has(id),
      ),
    );
  });

  const headerAnim = useRef(
    new Animated.Value(0),
  ).current;

  const buttonAnim = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    const easing =
      Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        easing,
        useNativeDriver: true,
      }),

      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        delay: 300,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, buttonAnim]);

  const toggleOption = (
    id: PregnancyTrackingPreference,
  ) => {
    setSelected(current => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const canContinue =
    selected.size > 0;

  const handleNext = async () => {
    if (!canContinue) {
      return;
    }

    /*
     * On sauvegarde uniquement les catégories
     * actuellement affichées/sélectionnées.
     */
    try {
      await setPregnancyTrackingPreferences(
        selected,
      );
    } catch (saveError) {
      // Not persisted: stay here with the selection intact (see services/saveFailure.ts).
      presentSaveFailure(saveError);
      return;
    }

    if (route.params?.mode === 'edit') {
      navigation.goBack();
      return;
    }

    navigation.navigate(
      'PregnancyReminders',
    );
  };

  const headerStyle = {
    opacity: headerAnim,

    transform: [
      {
        translateY:
          headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
      },
    ],
  };

  const buttonStyle = {
    opacity: buttonAnim,

    transform: [
      {
        translateY:
          buttonAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
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

      <View style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop:
                getTopPadding(
                  insets.top,
                ),

              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + spacing.sm,
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          {/* BACK */}
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="arrow-left"
            onPress={
              navigation.goBack
            }
            style={styles.backButton}
          />

          {/* HEADER */}
          <Animated.View
            style={headerStyle}>
            <View style={styles.header}>
              <AwaText variant="headlineMedium" style={styles.title}>
                {
                  t('pregnancyTrackingPreferences.title')
                }
              </AwaText>

              <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.subtitle}>
                {
                  t('pregnancyTrackingPreferences.subtitle')
                }
              </AwaText>
            </View>
          </Animated.View>

          {/* LIST */}
          <View style={styles.list}>
            {OPTIONS.map(
              (
                option,
                index,
              ) => (
                <TrackingRow
                  delay={
                    55 * index
                  }
                  key={option.id}
                  onToggle={() =>
                    toggleOption(
                      option.id,
                    )
                  }
                  option={option}
                  selected={selected.has(
                    option.id,
                  )}
                  styles={styles}
                  theme={theme}
                />
              ),
            )}
          </View>

          {/* FLEX SPACER */}
          <View style={styles.spacer} />

          {/* NEXT BUTTON */}
          <Animated.View
            style={buttonStyle}>
            <AwaButton
              disabled={!canContinue}
              fullWidth
              label={route.params?.mode === 'edit' ? t('common.save') : t('pregnancyTrackingPreferences.next')}
              onPress={handleNext}
              size="large"
            />
          </Animated.View>
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

  safeArea: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },

  backButton: {alignSelf: 'flex-start', marginBottom: 8},

  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  title: {textAlign: 'center'},

  subtitle: {maxWidth: 310, marginTop: 8, textAlign: 'center'},

  list: {
    gap: 11,
  },

  row: {
    minHeight: 64,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,

    borderColor:
      theme.colors.border,

    borderRadius: 16,

    backgroundColor:
      withAlpha(theme.colors.surface, 0.92),

    paddingHorizontal: 16,
    paddingVertical: 12,

    elevation: 2,

    shadowColor: theme.shadow.shadowColor,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.055,
    shadowRadius: 7,
  },

  rowSelected: {
    borderColor: theme.colors.primary,

    backgroundColor:
      withAlpha(theme.colors.primarySoft, 0.98),
  },

  pressed: {
    opacity: 0.82,
  },

  checkbox: {
    width: 23,
    height: 23,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,

    borderColor: withAlpha(theme.colors.primary, 0.35),

    borderRadius: 7,

    backgroundColor:
      'transparent',
  },

  checkboxSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  iconBox: {
    width: 38,
    height: 38,

    marginHorizontal: 11,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 19,

    backgroundColor: theme.colors.primarySoft,
  },

  rowLabel: {
    flex: 1,

    minWidth: 0,

    color: theme.colors.text,

    fontSize: 14.2,

    fontWeight: '600',

    lineHeight: 19,
  },

  spacer: {
    flex: 1,
    minHeight: spacing.lg,
  },

  });
}

export default PregnancyTrackingPreferencesScreen;
