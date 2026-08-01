import React, {useEffect, useRef} from 'react';
import {Alert, Animated, Easing, Image, ImageBackground, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View, type ImageSourcePropType} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing} from '../theme/spacing';

const BACKGROUND = require('../assets/images/objective-background.png');
const FACE_ID = require('../assets/images/faceid-main-icon.png');
const SHIELD = require('../assets/images/faceid-security-icon.png');
const LIGHTNING = require('../assets/images/faceid-speed-icon.png');

type Props = NativeStackScreenProps<RootStackParamList, 'FaceIdSetup'>;
type BenefitProps = {delay: number; icon: ImageSourcePropType; title: string; description: string};

function Benefit({delay, icon, title, description}: BenefitProps) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {delay, duration: 520, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true}).start();
  }, [delay, progress]);
  return <Animated.View style={[styles.benefit, {opacity: progress, transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [14, 0]})}, {scale: progress.interpolate({inputRange: [0, 1], outputRange: [0.985, 1]})}]}]}><View style={styles.benefitIconBox}><Image accessibilityIgnoresInvertColors source={icon} style={styles.benefitIcon} /></View><View style={styles.benefitCopy}><Text style={styles.benefitTitle}>{title}</Text><View style={styles.goldLine} /><Text style={styles.benefitDescription}>{description}</Text></View></Animated.View>;
}

function FaceIdSetupScreen({navigation}: Props): React.JSX.Element {
  const finish = (enabled: boolean) => Alert.alert('Face ID', enabled ? 'Face ID est activé.' : 'Tu pourras activer Face ID plus tard dans les paramètres.');
  return <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.page}><SafeAreaView style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle="dark-content" /><View style={styles.content}>
    <Pressable accessibilityLabel="Retour" hitSlop={12} onPress={navigation.goBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
    <View style={styles.heroIconBox}><Image accessibilityIgnoresInvertColors source={FACE_ID} style={styles.heroIcon} /></View>
    <Text style={styles.title}>Utiliser Face ID ?</Text><Text style={styles.subtitle}>{'Activez Face ID pour déverrouiller\nHAWA rapidement et en toute sécurité.'}</Text>
    <View style={styles.benefits}><Benefit delay={130} description={'Vos données restent\nprotégées.'} icon={SHIELD} title="Sécurisé et privé" /><Benefit delay={260} description={'Accédez à votre compte\nen un seul regard.'} icon={LIGHTNING} title="Rapide et pratique" /></View>
    <View style={styles.spacer} /><Pressable onPress={() => finish(true)} style={({pressed}) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Activer Face ID</Text></Pressable><Pressable hitSlop={10} onPress={() => finish(false)}><Text style={styles.later}>Plus tard</Text></Pressable>
  </View></SafeAreaView></ImageBackground>;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FBF6EC',
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 18,
  },

  back: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(248,243,234,0.88)',
  },

  backText: {
    marginTop: -4,
    color: '#174F3D',
    fontSize: 32,
    fontWeight: '300',
  },

  heroIconBox: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 44,
    backgroundColor: 'rgba(248,238,220,0.84)',
  },

  heroIcon: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },

  title: {
    marginTop: 18,
    color: '#14201D',
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '600',
  },

  subtitle: {
    marginTop: 8,
    color: '#4F5A56',
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
    borderColor: '#E9DED1',
    borderRadius: 20,
    backgroundColor: 'rgba(255,253,249,0.96)',
    paddingHorizontal: 16,
    shadowColor: '#705C45',
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
    backgroundColor: '#F3F1E7',
  },

  benefitIcon: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },

  benefitCopy: {
    flex: 1,
    marginLeft: 16,
  },

  benefitTitle: {
    color: '#174F3D',
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },

  goldLine: {
    width: 24,
    height: 2,
    marginTop: 7,
    marginBottom: 6,
    borderRadius: 1,
    backgroundColor: '#DCAF57',
  },

  benefitDescription: {
    color: '#27312E',
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
    backgroundColor: '#176548',
    elevation: 3,
  },

  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  later: {
    marginTop: 14,
    color: '#176548',
    fontSize: 13,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.82,
  },
});

export default FaceIdSetupScreen;