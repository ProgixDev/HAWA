import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';

const HERO = require('../assets/images/privacy/anonymous-mode-woman.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AnonymousModeSuccess'>;

// Same design tokens as the rest of the anonymous-mode flow — final step,
// must read as one continuous experience.
const BACKGROUND = '#F7F5FA';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#28223A';
const TEXT_SECONDARY = '#716A7D';
const PURPLE = '#6547B8';
const PURPLE_DEEP = '#3D2A79';
const LAVENDER = '#EEE8F7';
const BORDER = '#DED7E8';
const SUCCESS = '#559579';

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

export default function AnonymousModeSuccessScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const fromAuth = route.params?.source === 'auth';
  const heroEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroEntrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroEntrance]);

  const finish = () => {
    if (fromAuth) {
      // Fresh setup from AuthScreen — next step is choosing the anonymous
      // avatar, then entering the app. replace() so Success can't be
      // reached again via back.
      navigation.replace('AnonymousAvatarCustomizer', {source: 'auth'});
      return;
    }
    // Stack is [origin, AnonymousMode, AnonymousModeLimitations,
    // AnonymousModeSuccess] — AnonymousModeCreating was replaced by this
    // screen, so popping 3 returns straight to the screen that opened the
    // flow (PrivacySecurityScreen), the only entry point into AnonymousMode
    // for an already-onboarded user managing settings.
    navigation.pop(3);
  };

  return (
    <View style={styles.page}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      <View pointerEvents="none" style={styles.backgroundDecoration}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobLeft} />
        <View style={styles.blobBottom} />
      </View>

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Mode anonyme</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 96}]}
          showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.hero,
              {
                opacity: heroEntrance,
                transform: [{scale: heroEntrance.interpolate({inputRange: [0, 1], outputRange: [0.96, 1]})}],
              },
            ]}>
            <View style={styles.heroHaloOuter}>
              <View style={styles.heroHaloInner}>
                <Image accessibilityLabel="Illustration du mode anonyme" resizeMode="contain" source={HERO} style={styles.heroImage} />
              </View>

              <View style={styles.successBadge}>
                <MaterialDesignIcons color="#FFFFFF" name="check-bold" size={17} />
              </View>
            </View>
          </Animated.View>

          <FadeInUp delay={90} distance={10}>
            <Text style={styles.title}>Mode anonyme activé</Text>
            <Text style={styles.subtitle}>
              Ton profil est maintenant dissocié de ton identité. Profite d’AWA en toute confidentialité.
            </Text>
          </FadeInUp>

          <FadeInUp delay={160}>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderIcon}>
                  <MaterialDesignIcons color={PURPLE} name="shield-check-outline" size={20} />
                </View>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardHeaderTitle}>Ton espace est prêt</Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    Tu peux désactiver le mode anonyme à tout moment depuis Confidentialité &amp; sécurité.
                  </Text>
                </View>
              </View>
            </View>
          </FadeInUp>
        </ScrollView>

        <FadeInUp delay={220} distance={12}>
          <View style={[styles.ctaArea, {paddingBottom: Math.max(insets.bottom, 14)}]}>
            <Pressable
              accessibilityLabel={fromAuth ? 'Continuer' : 'Terminer'}
              accessibilityRole="button"
              onPress={finish}
              style={({pressed}) => [styles.primary, pressed && styles.pressed]}>
              <MaterialDesignIcons color="#FFFFFF" name="check-circle-outline" size={20} />
              <Text style={styles.primaryText}>{fromAuth ? 'Continuer' : 'Terminer'}</Text>
            </Pressable>
          </View>
        </FadeInUp>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: BACKGROUND},
  safe: {flex: 1},

  backgroundDecoration: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  blobTopRight: {
    position: 'absolute', top: -70, right: -60, width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(107,73,190,0.07)',
  },
  blobLeft: {
    position: 'absolute', top: 230, left: -70, width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(103,91,128,0.05)',
  },
  blobBottom: {
    position: 'absolute', bottom: -60, right: -30, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(105,73,190,0.04)',
  },

  header: {height: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18},
  headerTitleBlock: {alignItems: 'center'},
  headerTitle: {color: TEXT_PRIMARY, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},

  content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 14},

  hero: {alignItems: 'center'},
  heroHaloOuter: {
    width: 150, height: 150, alignItems: 'center', justifyContent: 'center', borderRadius: 75, backgroundColor: LAVENDER,
  },
  heroHaloInner: {
    width: 118, height: 118, alignItems: 'center', justifyContent: 'center', borderRadius: 59, backgroundColor: CARD, overflow: 'hidden',
    shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  heroImage: {width: 118, height: 118},
  successBadge: {
    position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
    borderRadius: 17, backgroundColor: SUCCESS, borderWidth: 2, borderColor: BACKGROUND,
  },

  title: {
    marginTop: 22, color: TEXT_PRIMARY, fontFamily: 'serif', fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center',
  },
  subtitle: {
    maxWidth: 330, alignSelf: 'center', marginTop: 10, color: TEXT_SECONDARY, fontSize: 14, lineHeight: 20, textAlign: 'center',
  },

  card: {
    marginTop: 26, borderRadius: 22, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    padding: 16, shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardHeaderRow: {flexDirection: 'row', alignItems: 'flex-start'},
  cardHeaderIcon: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: LAVENDER,
  },
  cardHeaderCopy: {flex: 1, minWidth: 0, marginLeft: 12},
  cardHeaderTitle: {color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700'},
  cardHeaderSubtitle: {marginTop: 4, color: TEXT_SECONDARY, fontSize: 12.5, lineHeight: 18},

  ctaArea: {
    paddingHorizontal: 18, paddingTop: 10, backgroundColor: BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER,
  },
  primary: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 18,
    backgroundColor: PURPLE, shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.22, shadowRadius: 9, elevation: 5,
  },
  primaryText: {color: '#FFFFFF', fontSize: 15.5, fontWeight: '800'},

  pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
});
