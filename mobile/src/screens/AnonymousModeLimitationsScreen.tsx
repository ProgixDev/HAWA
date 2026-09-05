import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AnonymousModeLimitations'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// Same design tokens as AnonymousModeScreen.tsx — this screen is the second
// step of the same flow and must read as one continuous experience.
const BACKGROUND = '#F7F5FA';
const SURFACE = '#F1EDF7';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#28223A';
const TEXT_SECONDARY = '#716A7D';
const PURPLE = '#6547B8';
const PURPLE_DEEP = '#3D2A79';
const LAVENDER = '#EEE8F7';
const BORDER = '#DED7E8';
const SUCCESS = '#559579';

const LIMITATIONS: ReadonlyArray<{key: string; icon: IconName; title: string; description: string; accent?: 'success'}> = [
  {
    key: 'recovery',
    icon: 'email-outline',
    title: 'Récupération du compte',
    description: 'Sans adresse e-mail associée, la récupération de ton accès pourra être limitée.',
  },
  {
    key: 'sync',
    icon: 'cloud-sync-outline',
    title: 'Synchronisation',
    description: 'Certaines données pourront ne pas être synchronisées sur d’autres appareils.',
  },
  {
    key: 'communications',
    icon: 'email-off-outline',
    title: 'Communications',
    description: 'AWA ne pourra pas t’envoyer d’e-mails liés à ton compte anonyme.',
  },
  {
    key: 'security',
    icon: 'shield-key-outline',
    title: 'Sécurité recommandée',
    description: 'Nous te recommandons d’activer un code PIN ou la biométrie pour protéger l’accès à AWA.',
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
  const insets = useSafeAreaInsets();
  const source = route.params?.source;
  const [accepted, setAccepted] = useState(false);

  const activate = () => {
    if (!accepted) {return;}
    // The actual activation call now runs on AnonymousModeCreatingScreen,
    // which also owns the loading/success/error states.
    navigation.navigate('AnonymousModeCreating', {source});
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
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <MaterialDesignIcons color={PURPLE} name="arrow-left" size={22} />
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Avant de continuer</Text>
            <Text style={styles.headerSubtitle}>Mode anonyme</Text>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 96}]}
          showsVerticalScrollIndicator={false}>
          <FadeInUp distance={8}>
            <View style={styles.hero}>
              <View style={styles.heroHaloOuter}>
                <View style={styles.heroHaloInner}>
                  <MaterialDesignIcons color={PURPLE} name="shield-account-outline" size={46} />
                </View>

                <View style={styles.lockBadge}>
                  <MaterialDesignIcons color="#FFFFFF" name="incognito" size={16} />
                </View>

                <MaterialDesignIcons color={LAVENDER} name="star-four-points" size={14} style={styles.sparkleTop} />
                <MaterialDesignIcons color={LAVENDER} name="star-four-points" size={10} style={styles.sparkleBottom} />
              </View>

              <Text style={styles.title}>Avant de continuer</Text>
              <Text style={styles.subtitle}>
                En mode anonyme, certaines fonctionnalités liées au compte seront limitées ou indisponibles.
              </Text>
            </View>
          </FadeInUp>

          <FadeInUp delay={90}>
            <View style={styles.card}>
              {LIMITATIONS.map((item, index) => (
                <View key={item.key} style={[styles.row, index < LIMITATIONS.length - 1 && styles.rowBorder]}>
                  <View style={[styles.rowIcon, item.accent === 'success' && styles.rowIconAccent]}>
                    <MaterialDesignIcons color={item.accent === 'success' ? SUCCESS : PURPLE_DEEP} name={item.icon} size={20} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInUp>

          <FadeInUp delay={160}>
            <Pressable
              accessibilityLabel="J’ai compris le fonctionnement du mode anonyme."
              accessibilityRole="checkbox"
              accessibilityState={{checked: accepted}}
              onPress={() => setAccepted(current => !current)}
              style={({pressed}) => [styles.checkboxRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                {accepted ? <MaterialDesignIcons color="#FFFFFF" name="check-bold" size={14} /> : null}
              </View>
              <Text style={styles.checkboxText}>J’ai compris le fonctionnement du mode anonyme.</Text>
            </Pressable>
          </FadeInUp>
        </ScrollView>

        <FadeInUp delay={220} distance={12}>
          <View style={[styles.ctaArea, {paddingBottom: Math.max(insets.bottom, 14)}]}>
            <Pressable
              accessibilityLabel="Activer le mode anonyme"
              accessibilityRole="button"
              accessibilityState={{disabled: !accepted}}
              disabled={!accepted}
              onPress={activate}
              style={({pressed}) => [styles.primary, !accepted && styles.primaryDisabled, pressed && accepted && styles.pressed]}>
              <MaterialDesignIcons color="#FFFFFF" name="incognito" size={20} />
              <Text style={styles.primaryText}>Activer le mode anonyme</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={8}
              onPress={navigation.goBack}
              style={styles.cancel}>
              <Text style={styles.cancelText}>Retour</Text>
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
  headerSubtitle: {marginTop: 1, color: TEXT_SECONDARY, fontSize: 11},
  headerSpace: {width: 42},

  content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 6},

  hero: {alignItems: 'center', paddingTop: 10},
  heroHaloOuter: {
    width: 130, height: 130, alignItems: 'center', justifyContent: 'center', borderRadius: 65, backgroundColor: LAVENDER,
  },
  heroHaloInner: {
    width: 100, height: 100, alignItems: 'center', justifyContent: 'center', borderRadius: 50, backgroundColor: CARD,
    shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  lockBadge: {
    position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, backgroundColor: PURPLE, borderWidth: 2, borderColor: BACKGROUND,
  },
  sparkleTop: {position: 'absolute', top: 4, left: 10, opacity: 0.9},
  sparkleBottom: {position: 'absolute', bottom: 18, left: -4, opacity: 0.8},

  title: {
    marginTop: 20, color: TEXT_PRIMARY, fontFamily: 'serif', fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center',
  },
  subtitle: {
    maxWidth: 330, alignSelf: 'center', marginTop: 10, color: TEXT_SECONDARY, fontSize: 14, lineHeight: 20, textAlign: 'center',
  },

  card: {
    marginTop: 26, borderRadius: 22, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    padding: 16, shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  row: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12},
  rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER},
  rowIcon: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: LAVENDER,
  },
  rowIconAccent: {backgroundColor: SURFACE},
  rowCopy: {flex: 1, minWidth: 0, marginLeft: 13},
  rowTitle: {color: TEXT_PRIMARY, fontSize: 14, fontWeight: '700'},
  rowDescription: {marginTop: 3, color: TEXT_SECONDARY, fontSize: 12.5, lineHeight: 18},

  checkboxRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44, marginTop: 18, gap: 12,
  },
  checkbox: {
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 7,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: CARD,
  },
  checkboxChecked: {backgroundColor: PURPLE, borderColor: PURPLE},
  checkboxText: {flex: 1, minWidth: 0, color: TEXT_PRIMARY, fontSize: 13.5, lineHeight: 19},

  ctaArea: {
    paddingHorizontal: 18, paddingTop: 10, backgroundColor: BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER,
  },
  primary: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 18,
    backgroundColor: PURPLE, shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.22, shadowRadius: 9, elevation: 5,
  },
  primaryDisabled: {opacity: 0.45, shadowOpacity: 0, elevation: 0},
  primaryText: {color: '#FFFFFF', fontSize: 15.5, fontWeight: '800'},
  cancel: {alignSelf: 'center', minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15},
  cancelText: {color: PURPLE, fontSize: 14, fontWeight: '700'},

  pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
});
