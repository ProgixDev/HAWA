import React, {useMemo} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
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
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaText} from '../components/ui/AwaText';

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
            <AwaText accessibilityRole="header" style={styles.title} variant="headlineMedium">
              {t('privacyScreen.title')}
            </AwaText>

            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
              {t('privacyScreen.subtitle')}
            </AwaText>
          </View>

          <AwaCard padding="none" style={styles.guaranteesCard} variant="elevated">
            {guarantees.map((item, index) => (
              <View key={item.titleKey}>
                <View style={styles.guaranteeRow}>
                  <View style={styles.iconContainer}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name={item.icon}
                      size={28}
                    />
                  </View>

                  <View style={styles.guaranteeCopy}>
                    <AwaText variant="titleSmall">
                      {t(item.titleKey)}
                    </AwaText>

                    <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                      {t(item.descriptionKey)}
                    </AwaText>
                  </View>
                </View>

                {index < guarantees.length - 1 ? (
                  <View style={styles.rowDivider} />
                ) : null}
              </View>
            ))}
          </AwaCard>

          <AwaCard style={styles.commitmentCard} variant="filled">
            <View style={styles.commitmentHeader}>
              <View style={styles.commitmentIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="shield-check-outline"
                  size={28}
                />
              </View>

              <View style={styles.commitmentCopy}>
                <AwaText variant="titleMedium">
                  {t('privacyScreen.commitmentTitle')}
                </AwaText>

                <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                  {t('privacyScreen.commitmentSubtitle')}
                </AwaText>
              </View>
            </View>

            <View style={styles.commitmentList}>
              <View style={styles.commitmentItem}>
                <View style={styles.bulletSlot}>
                  <View style={styles.bullet} />
                </View>
                <AwaText colorRole="onSurfaceVariant" style={styles.commitmentText} variant="bodyMedium">
                  {t('privacyScreen.commitmentFullControl')}
                </AwaText>
              </View>
              <View style={styles.commitmentItem}>
                <View style={styles.bulletSlot}>
                  <View style={styles.bullet} />
                </View>
                <AwaText colorRole="onSurfaceVariant" style={styles.commitmentText} variant="bodyMedium">
                  {t('privacyScreen.commitmentNoExport')}
                </AwaText>
              </View>
              <View style={styles.commitmentItem}>
                <View style={styles.bulletSlot}>
                  <View style={styles.bullet} />
                </View>
                <AwaText colorRole="onSurfaceVariant" style={styles.commitmentText} variant="bodyMedium">
                  {t('privacyScreen.commitmentNoInternalAccess')}
                </AwaText>
              </View>
              <View style={styles.commitmentItem}>
                <View style={styles.bulletSlot}>
                  <View style={styles.bullet} />
                </View>
                <AwaText colorRole="onSurfaceVariant" style={styles.commitmentText} variant="bodyMedium">
                  {t('privacyScreen.commitmentIdentityEncrypted')}
                </AwaText>
              </View>
            </View>
          </AwaCard>

          <AwaCard padding="compact" style={styles.preferenceCard} variant="filled">
            <View>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="account-cog-outline"
                size={28}
              />
            </View>

            <View style={styles.preferenceCopy}>
              <AwaText variant="titleSmall">
                {t('privacyScreen.freedomTitle')}
              </AwaText>

              <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                {t('privacyScreen.freedomText')}
              </AwaText>
            </View>
          </AwaCard>

          <View style={styles.spacer} />

          <AwaButton
            fullWidth
            label={t('privacyScreen.next')}
            onPress={() =>
              route.params?.mode === 'edit'
                ? navigation.goBack()
                : navigation.navigate('Summary')
            }
            size="large"
            style={styles.nextButton}
          />
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

  header: {
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 10,
    textAlign: 'center',
  },

  guaranteesCard: {
    overflow: 'hidden',
    paddingVertical: 4,
  },

  guaranteeRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  iconContainer: {
    width: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guaranteeCopy: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 10,
    paddingRight: 6,
  },



  rowDivider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: withAlpha(theme.colors.primary, 0.10),
  },

  commitmentCard: {
    marginTop: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },

  commitmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  commitmentIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  commitmentCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  commitmentList: {
    marginTop: 16,
    gap: 14,
  },

  commitmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  // The slot is one text line high (bodyMedium lineHeight 20), so the bullet sits on the first line's centre
  // however many lines the statement wraps to; its width matches the header icon so bullets and icon share one axis.
  bulletSlot: {
    width: 40,
    height: 20,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },

  commitmentText: {
    flex: 1,
    minWidth: 0,
  },


  preferenceCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },


  preferenceCopy: {
    flex: 1,
    marginLeft: 5,
  },



  spacer: {
    flex: 1,
    minHeight: 18,
  },

  nextButton: {
    width: '86%',
    maxWidth: 360,
    alignSelf: 'center',
  },



  });
}

export default PrivacyScreen;