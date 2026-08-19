import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {ensureAnonymousAccount, updatePrivacySecuritySettings} from '../state/securityPreferences';

const HERO = require('../assets/images/privacy/anonymous-mode-woman.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AnonymousModeCreating'>;

// Same design tokens as AnonymousModeScreen.tsx/AnonymousModeLimitationsScreen.tsx
// — must read as one continuous experience.
const BACKGROUND = '#F7F5FA';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#28223A';
const TEXT_SECONDARY = '#716A7D';
const PURPLE = '#6547B8';
const PURPLE_DEEP = '#3D2A79';
const LAVENDER = '#EEE8F7';
const BORDER = '#DED7E8';
const SUCCESS = '#559579';
const WARNING = '#A16C55';

type CreationStatus = 'loading' | 'error';

// Purely visual, generic checkpoints — no backend/API/database wording, no
// step is claimed unless it's harmless UI-only framing of the same single
// local activation call below.
const STEPS = ['Préparation de ton espace', 'Configuration de la confidentialité', 'Finalisation'] as const;

// Keeps the loader on screen long enough to read as a deliberate, premium
// transition instead of a flash — the real activation call below is a
// near-instant local write, so without this the screen would barely appear.
const MIN_DISPLAY_TIME = 1800;

function minimumDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, MIN_DISPLAY_TIME);
  });
}

// Wraps the real, already-existing activation call (state/securityPreferences.ts)
// in a Promise so it can race against minimumDelay() via Promise.all — same
// call AnonymousModeLimitationsScreen used to make directly. Also generates
// (once, idempotently) the stable local anonymous identifier ProfileScreen's
// "Informations du compte" sheet reads — see ensureAnonymousAccount().
async function activateAnonymousMode(): Promise<void> {
  try {
    updatePrivacySecuritySettings({anonymousMode: true});
    await ensureAnonymousAccount();
  } catch (error) {
    throw error instanceof Error ? error : new Error('anonymous_mode_activation_failed');
  }
}

function FadeIn({children, delay = 0}: {children: React.ReactNode; delay?: number}): React.JSX.Element {
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

  return <Animated.View style={{opacity: progress}}>{children}</Animated.View>;
}

function RotatingLoader(): React.JSX.Element {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true}),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const spin = rotation.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

  return (
    <View accessibilityLabel="Création de ton espace anonyme en cours" style={styles.loaderHalo}>
      <Animated.View style={[styles.loaderRing, {transform: [{rotate: spin}]}]} />
    </View>
  );
}

export default function AnonymousModeCreatingScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const source = route.params?.source;
  const [status, setStatus] = useState<CreationStatus>('loading');
  const [stepIndex, setStepIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);

  // Guards against the activation call firing twice for the same attempt
  // (e.g. a re-render before the effect's async work settles). Reset only
  // by an explicit "Réessayer" tap, never by React re-rendering the screen.
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => {mountedRef.current = false;}, []);

  const heroEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroEntrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroEntrance]);

  useEffect(() => {
    if (startedRef.current) {return;}
    startedRef.current = true;

    setStatus('loading');
    setStepIndex(0);

    const stepTimer1 = setTimeout(() => {if (mountedRef.current) {setStepIndex(1);}}, 650);
    const stepTimer2 = setTimeout(() => {if (mountedRef.current) {setStepIndex(2);}}, 1250);

    // Real activation starts immediately, in parallel with the minimum
    // display timer — neither one artificially delays the other. If
    // activation rejects, Promise.all rejects right away without waiting
    // for the remaining part of the 1800ms window.
    Promise.all([activateAnonymousMode(), minimumDelay()])
      .then(() => {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        if (!mountedRef.current) {return;}
        setStepIndex(3);
        // replace (not navigate) so the user can't land back on the loader
        // via the hardware/back-button.
        navigation.replace('AnonymousModeSuccess', {source});
      })
      .catch(() => {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        if (!mountedRef.current) {return;}
        setStatus('error');
      });

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    };
  }, [attempt, navigation, source]);

  const retry = () => {
    startedRef.current = false;
    setAttempt(current => current + 1);
  };

  const isError = status === 'error';

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
          {isError ? (
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={10}
              onPress={navigation.goBack}
              style={({pressed}) => [styles.back, pressed && styles.pressed]}>
              <MaterialDesignIcons color={PURPLE} name="arrow-left" size={22} />
            </Pressable>
          ) : (
            // Navigating away mid-activation is intentionally not offered —
            // the underlying call is a single fast local write, so there is
            // nothing meaningful to "interrupt", but a stray back-tap here
            // would leave the user on a screen with no forward path.
            <View style={styles.back} />
          )}

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Création de ton espace</Text>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 24}]}
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
              <View style={styles.heroHaloMiddle}>
                <View style={styles.heroHaloInner}>
                  <Image accessibilityLabel="Illustration du mode anonyme" resizeMode="contain" source={HERO} style={styles.heroImage} />
                </View>
              </View>

              <View style={styles.securityBadge}>
                <MaterialDesignIcons color="#FFFFFF" name={isError ? 'alert-circle-outline' : 'shield-check-outline'} size={16} />
              </View>
            </View>
          </Animated.View>

          <FadeIn delay={80}>
            {isError ? (
              <>
                <Text style={styles.title}>Impossible de terminer l’activation</Text>
                <Text style={styles.subtitle}>Une erreur est survenue. Tu peux réessayer.</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>Création de ton espace anonyme</Text>
                <Text style={styles.subtitle}>
                  AWA prépare ton espace privé et dissocie ton profil de tes informations d’identification.
                </Text>
              </>
            )}
          </FadeIn>

          {isError ? (
            <FadeIn delay={140}>
              <Pressable
                accessibilityLabel="Réessayer"
                accessibilityRole="button"
                onPress={retry}
                style={({pressed}) => [styles.primary, pressed && styles.pressed]}>
                <MaterialDesignIcons color="#FFFFFF" name="reload" size={20} />
                <Text style={styles.primaryText}>Réessayer</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Retour"
                accessibilityRole="button"
                hitSlop={8}
                onPress={navigation.goBack}
                style={styles.cancel}>
                <Text style={styles.cancelText}>Retour</Text>
              </Pressable>
            </FadeIn>
          ) : (
            <>
              <FadeIn delay={140}>
                <View style={styles.loaderBlock}>
                  <RotatingLoader />
                  <Text style={styles.loaderLabel}>Veuillez patienter</Text>
                  <Text style={styles.loaderCaption}>Cette opération ne prendra que quelques instants.</Text>
                </View>
              </FadeIn>

              <FadeIn delay={200}>
                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderIcon}>
                      <MaterialDesignIcons color={PURPLE} name="shield-lock-outline" size={20} />
                    </View>
                    <View style={styles.cardHeaderCopy}>
                      <Text style={styles.cardHeaderTitle}>Protection de ton identité</Text>
                      <Text style={styles.cardHeaderSubtitle}>
                        AWA prépare ton espace tout en appliquant tes préférences de confidentialité.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepsGroup}>
                    {STEPS.map((label, index) => {
                      const done = stepIndex > index;
                      const current = stepIndex === index;
                      return (
                        <View key={label} style={styles.stepRow}>
                          {done ? (
                            <MaterialDesignIcons color={SUCCESS} name="check-circle" size={18} />
                          ) : current ? (
                            <MaterialDesignIcons color={PURPLE} name="circle-slice-6" size={18} />
                          ) : (
                            <MaterialDesignIcons color={TEXT_SECONDARY} name="circle-outline" size={18} />
                          )}
                          <Text style={[styles.stepLabel, (done || current) && styles.stepLabelActive]}>{label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </FadeIn>

              <FadeIn delay={260}>
                <View style={styles.infoCard}>
                  <MaterialDesignIcons color={WARNING} name="information-outline" size={19} />
                  <Text style={styles.infoText}>Ne ferme pas l’application pendant la préparation de ton espace.</Text>
                </View>
              </FadeIn>
            </>
          )}
        </ScrollView>
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

  header: {
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18,
  },
  back: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 16,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  headerTitleBlock: {alignItems: 'center'},
  headerTitle: {color: TEXT_PRIMARY, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  headerSpace: {width: 42},

  content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 10},

  hero: {alignItems: 'center'},
  heroHaloOuter: {
    width: 160, height: 160, alignItems: 'center', justifyContent: 'center', borderRadius: 80, backgroundColor: 'rgba(107,73,190,0.08)',
  },
  heroHaloMiddle: {
    width: 132, height: 132, alignItems: 'center', justifyContent: 'center', borderRadius: 66, backgroundColor: LAVENDER,
  },
  heroHaloInner: {
    width: 104, height: 104, alignItems: 'center', justifyContent: 'center', borderRadius: 52, backgroundColor: CARD, overflow: 'hidden',
    shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  heroImage: {width: 104, height: 104},
  securityBadge: {
    position: 'absolute', bottom: 6, right: 6, width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, backgroundColor: PURPLE, borderWidth: 2, borderColor: BACKGROUND,
  },

  title: {
    marginTop: 22, color: TEXT_PRIMARY, fontFamily: 'serif', fontSize: 22, lineHeight: 28, fontWeight: '700', textAlign: 'center',
  },
  subtitle: {
    maxWidth: 320, alignSelf: 'center', marginTop: 10, color: TEXT_SECONDARY, fontSize: 14, lineHeight: 20, textAlign: 'center',
  },

  loaderBlock: {alignItems: 'center', marginTop: 26},
  loaderHalo: {
    width: 84, height: 84, alignItems: 'center', justifyContent: 'center', borderRadius: 42, backgroundColor: LAVENDER,
  },
  loaderRing: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 4,
    borderColor: 'rgba(101,71,184,0.18)', borderTopColor: PURPLE,
  },
  loaderLabel: {marginTop: 16, color: TEXT_PRIMARY, fontSize: 14.5, fontWeight: '700'},
  loaderCaption: {marginTop: 4, color: TEXT_SECONDARY, fontSize: 12.5, textAlign: 'center'},

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

  stepsGroup: {marginTop: 14, gap: 12},
  stepRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  stepLabel: {color: TEXT_SECONDARY, fontSize: 13},
  stepLabelActive: {color: TEXT_PRIMARY, fontWeight: '600'},

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, borderRadius: 16, borderWidth: 1,
    borderColor: BORDER, backgroundColor: '#F1EDF7', paddingHorizontal: 14, paddingVertical: 13,
  },
  infoText: {flex: 1, minWidth: 0, color: '#66597A', fontSize: 12.5, lineHeight: 18},

  primary: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 18,
    marginTop: 26, backgroundColor: PURPLE, shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.22, shadowRadius: 9, elevation: 5,
  },
  primaryText: {color: '#FFFFFF', fontSize: 15.5, fontWeight: '800'},
  cancel: {alignSelf: 'center', minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, marginTop: 4},
  cancelText: {color: PURPLE, fontSize: 14, fontWeight: '700'},

  pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
});
