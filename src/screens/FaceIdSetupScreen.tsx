import React, {useEffect, useRef} from 'react';
import {Animated, Easing, ImageBackground, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, TOP_SPACING_EXTRA} from '../theme/spacing';

const BACKGROUND = require('../assets/images/school-selection-background.png');

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_MUTED = '#655A8D';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = NativeStackScreenProps<RootStackParamList, 'FaceIdSetup'>;
type BenefitProps = {delay: number; icon: IconName; title: string; description: string};

function Benefit({delay, icon, title, description}: BenefitProps) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {delay, duration: 520, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true}).start();
  }, [delay, progress]);
  return <Animated.View style={[styles.benefit, {opacity: progress, transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [14, 0]})}, {scale: progress.interpolate({inputRange: [0, 1], outputRange: [0.985, 1]})}]}]}><View style={styles.benefitIconBox}><MaterialDesignIcons color={PURPLE} name={icon} size={32} /></View><View style={styles.benefitCopy}><Text style={styles.benefitTitle}>{title}</Text><View style={styles.accentLine} /><Text style={styles.benefitDescription}>{description}</Text></View></Animated.View>;
}

function FaceIdSetupScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const finish = () => navigation.replace('CycleHome');
  return <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.page}><SafeAreaView style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle="dark-content" /><ScrollView contentContainerStyle={[styles.content, {paddingTop: TOP_SPACING_EXTRA + spacing.lg, paddingBottom: Math.max(insets.bottom, 16) + spacing.lg}]} showsVerticalScrollIndicator={false}>
    <View style={styles.heroIconBox}><MaterialDesignIcons color={PURPLE} name="face-recognition" size={48} /></View>
    <Text style={styles.title}>Utiliser Face ID ?</Text><Text style={styles.subtitle}>{'Activez Face ID pour déverrouiller\nAWA rapidement et en toute sécurité.'}</Text>
    <View style={styles.benefits}><Benefit delay={130} description={'Vos données restent\nprotégées.'} icon="shield-star-outline" title="Sécurisé et privé" /><Benefit delay={260} description={'Accédez à votre compte\nen un seul regard.'} icon="lightning-bolt-outline" title="Rapide et pratique" /></View>
    <View style={styles.spacer} /><Pressable onPress={finish} style={({pressed}) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Activer Face ID</Text></Pressable><Pressable hitSlop={10} onPress={finish}><Text style={styles.later}>Plus tard</Text></Pressable>
  </ScrollView></SafeAreaView></ImageBackground>;
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: '#F8EFFF',
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 18,
  },

  heroIconBox: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 44,
    backgroundColor: '#EEE3FA',
  },

  title: {
    marginTop: 18,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '600',
  },

  subtitle: {
    marginTop: 8,
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  benefits: {
    alignSelf: 'stretch',
    marginTop: 40,
    gap: 12,
  },

  benefit: {
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.16)',
    borderRadius: 20,
    backgroundColor: 'rgba(255,252,255,0.92)',
    paddingHorizontal: 16,
    shadowColor: '#5D4394',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },

  benefitIconBox: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    backgroundColor: '#EEE3FA',
  },

  benefitCopy: {
    flex: 1,
    marginLeft: 16,
  },

  benefitTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },

  accentLine: {
    width: 24,
    height: 2,
    marginTop: 7,
    marginBottom: 6,
    borderRadius: 1,
    backgroundColor: PURPLE,
  },

  benefitDescription: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 18,
  },

  spacer: {
    flex: 1,
  },

  primary: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },

  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  later: {
    marginTop: 14,
    color: PURPLE,
    fontSize: 13,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.82,
  },
});

export default FaceIdSetupScreen;
