import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../navigation/AppNavigator';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

type Props = NativeStackScreenProps<RootStackParamList, 'AnonymousModeLimitations'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const LIMITATION_ICONS: ReadonlyArray<{key: string; icon: IconName; titleKey: string; descriptionKey: string; accent?: 'success'}> = [
  {
    key: 'recovery',
    icon: 'email-outline',
    titleKey: 'anonymous.limitations.recoveryTitle',
    descriptionKey: 'anonymous.limitations.recoveryText',
  },
  {
    key: 'sync',
    icon: 'cloud-sync-outline',
    titleKey: 'anonymous.limitations.syncTitle',
    descriptionKey: 'anonymous.limitations.syncText',
  },
  {
    key: 'communications',
    icon: 'email-off-outline',
    titleKey: 'anonymous.limitations.communicationsTitle',
    descriptionKey: 'anonymous.limitations.communicationsText',
  },
  {
    key: 'security',
    icon: 'shield-key-outline',
    titleKey: 'anonymous.limitations.securityTitle',
    descriptionKey: 'anonymous.limitations.securityText',
    accent: 'success',
  },
];

function FadeInUp({
  children,
  delay = 0,
  distance = 15,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
}): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [distance, 0]})}],
      }}>
      {children}
    </Animated.View>
  );
}

export default function AnonymousModeLimitationsScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const source = route.params?.source;
  const [accepted, setAccepted] = useState(false);
  const LIMITATIONS = LIMITATION_ICONS.map(item => ({...item, title: t(item.titleKey), description: t(item.descriptionKey)}));

  const activate = () => {
    if (!accepted) {return;}
    // The actual activation call now runs on AnonymousModeCreatingScreen,
    // which also owns the loading/success/error states.
    navigation.navigate('AnonymousModeCreating', {source});
  };

  return (
    <View style={styles.page}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            hitSlop={10}
            icon="arrow-left"
            onPress={navigation.goBack}
          />

          <View style={styles.headerTitleBlock}>
            <AwaText accessibilityRole="header" variant="titleMedium">{t('anonymous.limitations.headerTitle')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{t('anonymous.limitations.headerSubtitle')}</AwaText>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 96}]}
          showsVerticalScrollIndicator={false}>
          <FadeInUp distance={8}>
            <View style={styles.hero}>
              <MaterialDesignIcons color={theme.colors.primary} name="shield-account-outline" size={46} />

              <AwaText style={styles.title} variant="headlineSmall">{t('anonymous.limitations.title')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
                {t('anonymous.limitations.subtitle')}
              </AwaText>
            </View>
          </FadeInUp>

          <FadeInUp delay={90}>
            <AwaCard style={styles.card} variant="filled">
              {LIMITATIONS.map((item, index) => (
                <View key={item.key} style={[styles.row, index < LIMITATIONS.length - 1 && styles.rowBorder]}>
                  <View style={[styles.rowIcon, item.accent === 'success' && styles.rowIconAccent]}>
                    <MaterialDesignIcons color={item.accent === 'success' ? theme.colors.success : theme.colors.accent} name={item.icon} size={20} />
                  </View>
                  <View style={styles.rowCopy}>
                    <AwaText variant="titleSmall">{item.title}</AwaText>
                    <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{item.description}</AwaText>
                  </View>
                </View>
              ))}
            </AwaCard>
          </FadeInUp>

          <FadeInUp delay={160}>
            <Pressable
              accessibilityLabel={t('anonymous.limitations.acknowledgeLabel')}
              accessibilityRole="checkbox"
              accessibilityState={{checked: accepted}}
              onPress={() => setAccepted(current => !current)}
              style={({pressed}) => [styles.checkboxRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                {accepted ? <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check-bold" size={14} /> : null}
              </View>
              <AwaText variant="bodyMedium">{t('anonymous.limitations.acknowledgeLabel')}</AwaText>
            </Pressable>
          </FadeInUp>
        </ScrollView>

        <FadeInUp delay={220} distance={12}>
          <View style={[styles.ctaArea, {paddingBottom: Math.max(insets.bottom, 14)}]}>
            <AwaButton
              accessibilityLabel={t('anonymous.limitations.activate')}
              accessibilityState={{disabled: !accepted}}
              disabled={!accepted}
              fullWidth
              icon="incognito"
              label={t('anonymous.limitations.activate')}
              onPress={activate}
              size="large"
            />
            <AwaButton
              accessibilityLabel={t('common.back')}
              fullWidth
              label={t('common.back')}
              onPress={navigation.goBack}
              style={styles.cancel}
              variant="text"
            />
          </View>
        </FadeInUp>
      </SafeAreaView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  page: {flex: 1, backgroundColor: theme.colors.background},
  safe: {flex: 1},


  header: {
    minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18,
  },
  headerTitleBlock: {alignItems: 'center'},
  headerSpace: {width: 42},

  content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 6},

  hero: {alignItems: 'center', paddingTop: 10},

  title: {marginTop: 16, textAlign: 'center'},
  subtitle: {maxWidth: 330, alignSelf: 'center', marginTop: 8, textAlign: 'center'},

  card: {marginTop: 24},
  row: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12},
  rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
  rowIcon: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  rowIconAccent: {},
  rowCopy: {flex: 1, minWidth: 0, marginLeft: 13},

  checkboxRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44, marginTop: 18, gap: 12,
  },
  checkbox: {
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 7,
    borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  checkboxChecked: {backgroundColor: theme.colors.primary, borderColor: theme.colors.primary},

  ctaArea: {
    paddingHorizontal: 18, paddingTop: 10, backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border,
  },
  cancel: {marginTop: 4},

  pressed: {opacity: 0.85},
  });
}
