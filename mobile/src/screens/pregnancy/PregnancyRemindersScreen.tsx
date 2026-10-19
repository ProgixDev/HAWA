import {continueAfterObjectiveSetup} from '../../state/objectiveSetupFlow';
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
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaSwitch} from '../../components/ui/AwaSwitch';
import {AwaText} from '../../components/ui/AwaText';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  getPregnancyNotificationSettings,
  hydratePregnancyNotificationSettings,
  setPregnancyNotificationSettings,
} from '../../state/pregnancyNotificationSettingsStore';
import {resyncAllPregnancyNotifications} from '../../utils/pregnancyReminderScheduling';
import NotificationPermissionNotice from '../../components/notifications/NotificationPermissionNotice';
import {useReminderPermissionGuard} from '../../hooks/useReminderPermissionGuard';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PregnancyReminders'
>;

// These 3 keys are THE canonical toggles — same fields
// pregnancyNotificationSettingsStore.ts already defines and
// pregnancyReminderScheduling.ts already schedules from. This onboarding
// screen no longer maintains its own disconnected boolean state: enabling
// "Journal quotidien" here uses the store's own existing default time
// (dailyJournalTime, already '20:00' unless she later picks another time in
// "Notifications & rappels") — never an invented one.
type ReminderKey = 'appointmentsEnabled' | 'examsEnabled' | 'dailyJournalEnabled';

type OptionConfig = {
  id: ReminderKey;
  icon: React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];
  label: string;
  description: string;
};

// Local alias for react-i18next's `t` — avoids depending on a named
// `TFunction` export (not provided by the app's current react-i18next
// version); matches the shape actually used here (key only, no
// interpolation on this screen).
type TFn = (key: string) => string;

function buildOptions(t: TFn): OptionConfig[] {
  return [
    {
      id: 'appointmentsEnabled',
      icon: 'calendar-month-outline',
      label: t('pregnancyReminders.options.appointments.label'),
      description: t('pregnancyReminders.options.appointments.description'),
    },
    {
      id: 'examsEnabled',
      icon: 'clipboard-pulse-outline',
      label: t('pregnancyReminders.options.exams.label'),
      description: t('pregnancyReminders.options.exams.description'),
    },
    {
      id: 'dailyJournalEnabled',
      icon: 'notebook-edit-outline',
      label: t('pregnancyReminders.options.dailyJournal.label'),
      description: t('pregnancyReminders.options.dailyJournal.description'),
    },
  ];
}

type ReminderRowProps = {
  option: OptionConfig;
  enabled: boolean;
  delay: number;
  onToggle: (value: boolean) => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
};

function ReminderRow({
  option,
  enabled,
  delay,
  onToggle,
  theme,
  styles,
}: ReminderRowProps): React.JSX.Element {
  const entranceAnim = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 340,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animation d'entrée exécutée une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <View style={styles.row}>
        {/* ICON */}
        <View style={styles.iconBox}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name={option.icon}
            size={19}
          />
        </View>

        {/* TEXT */}
        <View style={styles.rowCopy}>
          <Text style={styles.rowLabel}>
            {option.label}
          </Text>

          <Text style={styles.rowDescription}>
            {option.description}
          </Text>
        </View>

        {/* SWITCH */}
        <AwaSwitch
          accessibilityLabel={option.label}
          onValueChange={onToggle}
          value={enabled}
        />
      </View>
    </Animated.View>
  );
}

function PregnancyRemindersScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const OPTIONS = useMemo(() => buildOptions(t), [t]);

  // Reads the REAL canonical Pregnancy notification settings — same store
  // PregnancyNotificationsScreen.tsx and pregnancyReminderScheduling.ts
  // already use — so this onboarding screen can no longer drift from what
  // actually gets scheduled. Re-hydrated below in case App.tsx's own
  // boot-time hydrate hasn't resolved yet by the time onboarding reaches
  // this screen (same defensive pattern as MenopauseLabTrackingScreen.tsx).
  const [preferences, setPreferences] = useState<Record<ReminderKey, boolean>>(() => {
    const settings = getPregnancyNotificationSettings();
    return {
      appointmentsEnabled: settings.appointmentsEnabled,
      examsEnabled: settings.examsEnabled,
      dailyJournalEnabled: settings.dailyJournalEnabled,
    };
  });

  useEffect(() => {
    let active = true;
    hydratePregnancyNotificationSettings().then(settings => {
      if (active) {
        setPreferences({
          appointmentsEnabled: settings.appointmentsEnabled,
          examsEnabled: settings.examsEnabled,
          dailyJournalEnabled: settings.dailyJournalEnabled,
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const headerAnim = useRef(
    new Animated.Value(0),
  ).current;

  const infoAnim = useRef(
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

      Animated.timing(infoAnim, {
        toValue: 1,
        duration: 380,
        delay: 380,
        easing,
        useNativeDriver: true,
      }),

      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        delay: 460,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    headerAnim,
    infoAnim,
    buttonAnim,
  ]);

  const toggleOption = (
    id: ReminderKey,
    value: boolean,
  ) => {
    setPreferences(current => ({
      ...current,
      [id]: value,
    }));
  };

  // Whether Android would actually show a reminder she has switched on
  // (notifications off / reminders channel blocked). Only read while one of
  // this screen's reminder switches is on.
  const anyReminderOn =
    preferences.appointmentsEnabled ||
    preferences.examsEnabled ||
    preferences.dailyJournalEnabled;
  const permissionGuard = useReminderPermissionGuard(anyReminderOn);

  const goToNext = () => {
    if (route.params?.mode === 'edit') {
      navigation.goBack();
      return;
    }

    continueAfterObjectiveSetup(navigation);
  };

  // One finish at a time: asking Android for the permission keeps this
  // handler pending for as long as the system dialog is open.
  const finishing = useRef(false);

  const handleFinish = async () => {
    if (finishing.current) {return;}
    finishing.current = true;
    try {
      // Merge onto the CURRENT real settings (never overwrite fields this
      // screen doesn't own, like weeklyUpdateEnabled/dailyJournalTime/reminder
      // offsets) and resync through the existing scheduling architecture —
      // same two calls PregnancyNotificationsScreen.tsx already makes after
      // its own save, never a second scheduling path.
      const current = getPregnancyNotificationSettings();
      try {
        await setPregnancyNotificationSettings({
          ...current,
          ...preferences,
        });
      } catch (saveError) {
        // Not persisted: stay here with the choices intact (see services/saveFailure.ts).
        presentSaveFailure(saveError);
        return;
      }
      resyncAllPregnancyNotifications();

      // Only asked when a reminder is actually being saved as enabled — never
      // merely for opening this screen. Refused: she stays on this screen
      // with the notice (her choices above are already saved either way) and
      // can open Android's settings or carry on without notifications.
      const allowed = await permissionGuard.allowSave(anyReminderOn);
      if (!allowed) {
        return;
      }

      goToNext();
    } finally {
      finishing.current = false;
    }
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

  const infoStyle = {
    opacity: infoAnim,

    transform: [
      {
        translateY:
          infoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 0],
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
                {t('pregnancyReminders.title')}
              </AwaText>

              <AwaText variant="bodyLarge" style={styles.subtitle}>
                {t('pregnancyReminders.subtitle')}
              </AwaText>

              <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.description}>
                {
                  t('pregnancyReminders.description')
                }
              </AwaText>
            </View>
          </Animated.View>

          {/* REMINDERS */}
          <View style={styles.list}>
            {OPTIONS.map(
              (
                option,
                index,
              ) => (
                <ReminderRow
                  delay={
                    60 * index
                  }
                  enabled={
                    preferences[
                      option.id
                    ]
                  }
                  key={option.id}
                  onToggle={value =>
                    toggleOption(
                      option.id,
                      value,
                    )
                  }
                  option={option}
                  styles={styles}
                  theme={theme}
                />
              ),
            )}

            {/* "Rappels personnalisés" isn't a global on/off switch in the
                real architecture — pregnancyCustomRemindersStore.ts models
                it as individually-created reminder entries, not a single
                boolean. Rather than persist a fake flag nothing reads, this
                links straight to where those entries are actually created:
                the same "Notifications & rappels" screen
                PregnancyNotificationsScreen.tsx already provides. */}
            <Pressable
              accessibilityLabel={t('pregnancyReminders.customReminders.accessibility')}
              accessibilityRole="button"
              onPress={() => navigation.navigate('PregnancyNotifications')}
              style={({pressed}) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.iconBox}>
                <MaterialDesignIcons color={theme.colors.primary} name="bell-plus-outline" size={19} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowLabel}>{t('pregnancyReminders.customReminders.label')}</Text>
                <Text style={styles.rowDescription}>
                  {t('pregnancyReminders.customReminders.description')}
                </Text>
              </View>
              <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={20} />
            </Pressable>
          </View>

          {/* The one shared notice (same wording, "open settings" and
              re-check on every objective's reminders step). Once a save was
              blocked it also offers "Continue without notifications", which
              performs the navigation Save would have. */}
          {anyReminderOn ? (
            <NotificationPermissionNotice
              onContinue={permissionGuard.saveBlocked ? goToNext : undefined}
              onRecheck={permissionGuard.refresh}
              state={permissionGuard.state}
              testID="pregnancy-reminders-permission-notice"
            />
          ) : null}

          {/* INFO CARD */}
          <Animated.View
            style={[
              styles.infoCard,
              infoStyle,
            ]}>
            <MaterialDesignIcons
              color={theme.colors.textSecondary}
              name="information-outline"
              size={17}
            />

            <Text
              style={styles.infoText}>
              {t('pregnancyReminders.infoText')}
            </Text>
          </Animated.View>

          {/* BUTTON */}
          <Animated.View
            style={buttonStyle}>
            <AwaButton
              accessibilityLabel={t('pregnancyReminders.finishButton')}
              fullWidth
              label={t('pregnancyReminders.finishButton')}
              onPress={handleFinish}
              size="large"
              style={styles.nextButton}
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

  subtitle: {marginTop: 8, textAlign: 'center'},

  description: {maxWidth: 300, marginTop: 6, textAlign: 'center'},

  list: {
    gap: 9,
  },

  row: {
    minHeight: 68,

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor:
      theme.colors.border,

    borderRadius: 16,

    backgroundColor:
      withAlpha(theme.colors.surface, 0.90),

    paddingHorizontal: 12,
    paddingVertical: 10,

    elevation: 2,

    shadowColor: theme.shadow.shadowColor,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.05,
    shadowRadius: 7,
  },

  iconBox: {
    width: 36,
    height: 36,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 18,

    backgroundColor: theme.colors.primarySoft,
  },

  rowCopy: {
    flex: 1,

    minWidth: 0,

    marginHorizontal: 11,
  },

  rowLabel: {
    color: theme.colors.text,

    fontSize: 14,

    fontWeight: '700',

    lineHeight: 18,
  },

  rowDescription: {
    marginTop: 2,

    color: theme.colors.textSecondary,

    fontSize: 11.5,

    lineHeight: 15,
  },

  infoCard: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 9,

    marginTop: spacing.md,

    borderRadius: 12,

    backgroundColor:
      withAlpha(theme.colors.primarySoft, 0.75),

    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  infoText: {
    flex: 1,

    minWidth: 0,

    color: theme.colors.textSecondary,

    fontSize: 11.5,

    lineHeight: 16,
  },

  pressed: {
    opacity: 0.82,
  },

  nextButton: {marginTop: spacing.md},

  });
}

export default PregnancyRemindersScreen;
