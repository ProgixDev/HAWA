import React, {useMemo} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Guarantee = {icon: IconName; titleKey: string; descriptionKey: string};

const guarantees: Guarantee[] = [
  {icon: 'cash-off', titleKey: 'privacyScreen.guarantees.noResaleTitle', descriptionKey: 'privacyScreen.guarantees.noResaleDescription'},
  {icon: 'lock-outline', titleKey: 'privacyScreen.guarantees.fullControlTitle', descriptionKey: 'privacyScreen.guarantees.fullControlDescription'},
  {icon: 'database-lock-outline', titleKey: 'privacyScreen.guarantees.noExportTitle', descriptionKey: 'privacyScreen.guarantees.noExportDescription'},
  {icon: 'shield-lock-outline', titleKey: 'privacyScreen.guarantees.encryptedTitle', descriptionKey: 'privacyScreen.guarantees.encryptedDescription'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

function PrivacyScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets = useSafeAreaInsets();

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
          translucent
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: getTopPadding(insets.top),
              paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('privacyScreen.title')}
            </Text>

            <Text style={styles.subtitle}>
              {t('privacyScreen.subtitle')}
            </Text>
          </View>

          <View style={styles.guaranteesCard}>
            {guarantees.map((item, index) => (
              <View key={item.titleKey}>
                <View style={styles.guaranteeRow}>
                  <View style={styles.iconContainer}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name={item.icon}
                      size={32}
                    />
                  </View>

                  <View style={styles.guaranteeCopy}>
                    <Text style={styles.guaranteeTitle}>
                      {t(item.titleKey)}
                    </Text>

                    <Text style={styles.guaranteeDescription}>
                      {t(item.descriptionKey)}
                    </Text>
                  </View>
                </View>

                {index < guarantees.length - 1 ? (
                  <View style={styles.rowDivider} />
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.commitmentCard}>
            <View style={styles.commitmentHeader}>
              <View style={styles.commitmentIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="shield-check-outline"
                  size={26}
                />
              </View>

              <View style={styles.commitmentCopy}>
                <Text style={styles.commitmentTitle}>
                  {t('privacyScreen.commitmentTitle')}
                </Text>

                <Text style={styles.commitmentSubtitle}>
                  {t('privacyScreen.commitmentSubtitle')}
                </Text>
              </View>
            </View>

            <View style={styles.commitmentList}>
              <View style={styles.commitmentItem}>
                <View style={styles.bullet} />
                <Text style={styles.commitmentText}>
                  {t('privacyScreen.commitmentFullControl')}
                </Text>
              </View>

              <View style={styles.commitmentItem}>
                <View style={styles.bullet} />
                <Text style={styles.commitmentText}>
                  {t('privacyScreen.commitmentNoExport')}
                </Text>
              </View>

              <View style={styles.commitmentItem}>
                <View style={styles.bullet} />
                <Text style={styles.commitmentText}>
                  {t('privacyScreen.commitmentNoInternalAccess')}
                </Text>
              </View>

              <View style={styles.commitmentItem}>
                <View style={styles.bullet} />
                <Text style={styles.commitmentText}>
                  {t('privacyScreen.commitmentIdentityEncrypted')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="account-cog-outline"
                size={28}
              />
            </View>

            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>
                {t('privacyScreen.freedomTitle')}
              </Text>

              <Text style={styles.preferenceText}>
                {t('privacyScreen.freedomText')}
              </Text>
            </View>
          </View>

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              route.params?.mode === 'edit'
                ? navigation.goBack()
                : navigation.navigate('Summary')
            }
            style={({pressed}) => [
              styles.nextButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.nextText}>{t('privacyScreen.next')}</Text>

            <View style={styles.nextArrowContainer}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="arrow-right"
                size={20}
              />
            </View>
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

  header: {
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 35,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  guaranteesCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    backgroundColor: withAlpha(theme.colors.surface, 0.84),
    paddingVertical: 4,
  },

  guaranteeRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  iconContainer: {
    width: 68,
    height: 68,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.7),
  },

  guaranteeCopy: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 10,
    paddingRight: 6,
  },

  guaranteeTitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  guaranteeDescription: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16.5,
  },

  rowDivider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: withAlpha(theme.colors.primary, 0.10),
  },

  commitmentCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    backgroundColor: withAlpha(theme.colors.surface, 0.82),
    padding: 15,
  },

  commitmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  commitmentIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: theme.colors.primarySoft,
  },

  commitmentCopy: {
    flex: 1,
    marginLeft: 11,
  },

  commitmentTitle: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },

  commitmentSubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
  },

  commitmentList: {
    marginTop: 13,
    gap: 10,
  },

  commitmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bullet: {
    width: 7,
    height: 7,
    flexShrink: 0,
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  commitmentText: {
    flex: 1,
    marginLeft: 9,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },

  preferenceCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.9),
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  preferenceIcon: {
    width: 52,
    height: 52,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
  },

  preferenceCopy: {
    flex: 1,
    marginLeft: 5,
  },

  preferenceTitle: {
    color: theme.colors.accent,
    fontSize: 12.5,
    fontWeight: '700',
  },

  preferenceText: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 10.8,
    lineHeight: 16,
  },

  spacer: {
    flex: 1,
    minHeight: 18,
  },

  nextButton: {
    position: 'relative',
    width: '78%',
    maxWidth: 320,
    minHeight: 52,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 54,
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
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  nextArrowContainer: {
    position: 'absolute',
    right: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
  },

  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.99}],
  },
  });
}

export default PrivacyScreen;