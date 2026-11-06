import React, {useMemo} from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {APP_METADATA} from '../utils/appMetadata';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaInfoRow} from '../components/ui/AwaInfoRow';
import {AwaText} from '../components/ui/AwaText';
import {
  interpolateHex,
  onPrimaryTextColor,
  pickReadableTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';

const LOGO = require('../assets/images/hawa-logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

type AboutRowProps = {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
};

function AboutRow({
  icon,
  label,
  value,
  onPress,
  last,
}: AboutRowProps) {
  return (
    <AwaInfoRow
      accessibilityLabel={`${label}, ${value}`}
      icon={icon}
      iconTone="primary"
      last={last}
      onPress={onPress}
      subtitle={value}
      title={label}
      trailing={onPress ? 'chevron' : 'none'}
    />
  );
}

export default function AboutScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const compact = width < 360 || height < 700;

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={styles.safe}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          {
            paddingTop:
              Math.max(insets.top, 18) + 8,
            paddingBottom:
              Math.max(insets.bottom, 18) + 25,
          },
        ]}
        showsVerticalScrollIndicator={false}>

        {/* HEADER */}

        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.header}>
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="chevron-left"
            onPress={navigation.goBack}
            variant="tonal"
          />

          <View style={styles.headerCopy}>
            <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">
              {t('about.title')}
            </AwaText>

            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">
              {t('about.subtitle')}
            </AwaText>
          </View>

          
        </Animated.View>

        {/* AWA IDENTITY */}

        <Animated.View
          entering={FadeInUp.delay(70).duration(420)}>
          <AwaCard style={styles.identity} variant="elevated">
          <View style={styles.logoWrap}>
            <Image
              accessibilityLabel={t('about.logoA11y')}
              resizeMode="contain"
              source={LOGO}
              style={styles.logo}
            />
          </View>

          <View style={styles.identityCopy}>
            <View style={styles.nameRow}>
              <AwaText style={styles.appName} variant="headlineSmall">
                AWA
              </AwaText>

              <View style={styles.badge}>
                <AwaText colorRole="onPrimaryContainer" style={styles.badgeText} variant="labelSmall">
                  {t('about.versionBadge', {version: APP_METADATA.version})}
                </AwaText>
              </View>
            </View>

            <AwaText colorRole="onSurfaceVariant" style={styles.description} variant="bodySmall">
              {t('about.appDescription')}
            </AwaText>
          </View>
          </AwaCard>
        </Animated.View>
        {/* LEGAL */}

        <AwaText accessibilityRole="header" style={styles.sectionTitle} variant="titleMedium">
          {t('about.sectionLegal')}
        </AwaText>

        <Animated.View
          entering={FadeInUp.delay(250).duration(420)}>
          <AwaCard padding="none" style={styles.card} variant="filled">
          <AboutRow
            icon="file-document-outline"
            label={t('about.termsOfUse')}
            onPress={() =>
              navigation.navigate('TermsOfUse')
            }
            value={t('about.viewDocument')}
          />

          <AboutRow
            icon="shield-lock-outline"
            label={t('about.privacyPolicy')}
            last
            onPress={() =>
              navigation.navigate(
                'PrivacyPolicy',
              )
            }
            value={t('about.viewDocument')}
          />
          </AwaCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  // The logo PNG is ~95% transparent, with only the gold crest/lettering
  // opaque — it needs a genuinely dark backdrop to read, regardless of
  // theme. theme.colors.accent is dark in every LIGHT variant (it's a
  // heading color drawn on a light surface) but flips to a LIGHT tone in
  // every DARK variant (a heading color drawn on a dark surface), so using
  // it as-is only worked in Light. Gated on the accent's OWN resolved
  // luminance (never theme.isDark): kept unchanged where it's already dark
  // enough, darkened toward black (preserving its hue family) otherwise —
  // same technique already used for the Library featured-card CTA.
  const logoBackgroundIsDarkEnough = pickReadableTextColor(theme.colors.accent) === '#FFFFFF';
  const logoWrapBackground = logoBackgroundIsDarkEnough
    ? theme.colors.accent
    : interpolateHex(theme.colors.accent, '#000000', 0.65);

  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 16,
  },

  contentCompact: {
    paddingHorizontal: 11,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
  },

  title: {},

  subtitle: {marginTop: 3},


  /* IDENTITY CARD */

  identity: {flexDirection: 'row', alignItems: 'center'},

  logoWrap: {
    flexBasis: '27%',
    aspectRatio: 1,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: logoWrapBackground,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.45),

    padding: 12,

    elevation: 3,

    shadowColor: theme.colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  identityCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },


  badge: {
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },



  /* SECTIONS */

  sectionTitle: {marginTop: 4},

  card: {overflow: 'hidden'},

  /* ROW */







  /* ABOUT VALUE BLOCK */






  /* COMMUNITY */

  community: {flexDirection: 'row', alignItems: 'center', gap: 12},

  communityCopy: {flex: 1},



  /* PRESS */


  /* MODAL */

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(theme.colors.accent, 0.38),
  },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    backgroundColor: theme.colors.surface,

    paddingHorizontal: 20,
    paddingTop: 10,
  },

  handle: {
    alignSelf: 'center',

    width: '14%',
    aspectRatio: 8,

    borderRadius: 999,

    backgroundColor: theme.colors.border,
  },

  modalIcon: {
    alignSelf: 'center',
    marginTop: 18,
  },

  sheetTitle: {marginTop: 8, textAlign: 'center'},
  sheetText: {marginTop: 8, textAlign: 'center'},
  teamText: {marginTop: 9, textAlign: 'center'},
  description: {marginTop: 6},
  appName: {},
  badgeText: {},
  communityTitle: {textAlign: 'center'},
  communityText: {marginTop: 4, textAlign: 'center'},



  done: {marginTop: 18},


  /* TOAST */

  toast: {
    position: 'absolute',

    left: '10%',
    right: '10%',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    borderRadius: 12,

    backgroundColor: theme.colors.primary,

    padding: 16,

    elevation: 6,
  },

  toastText: {flex: 1, color: onPrimaryTextColor(theme)},
  });
}
