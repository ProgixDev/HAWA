import React from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../theme/spacing';

const WELCOME_BACKGROUND = require('../assets/images/welcome-background.png');
const WELCOME_ARROW = require('../assets/images/welcome-arrow.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

function WelcomeScreen({navigation}: Props): React.JSX.Element {
  const {height, width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 760 || width < 360;
  const buttonWidth = Math.min(width * (compact ? 0.76 : 0.72), 320);
  const bottomSpacing = Math.max(insets.bottom + 16, Math.min(height * 0.045, 38));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#C9A9DB" barStyle="dark-content" />
      <ImageBackground
        resizeMode="cover"
        source={WELCOME_BACKGROUND}
        style={styles.page}>
        <View style={[styles.intro, compact && styles.introCompact]}>
          <View style={styles.titleBlock}>
            <Text style={[styles.welcomeTitle, compact && styles.welcomeTitleCompact]}>
              Bienvenue
            </Text>
            <View style={styles.brandLine}>
              <Text style={[styles.chez, compact && styles.chezCompact]}>chez</Text>
              <Text style={[styles.hawa, compact && styles.hawaCompact]}> AWA</Text>
            </View>
            <View style={styles.ornamentRow}>
              <View style={styles.ornamentLine} />
              <Text style={styles.ornament}>✦</Text>
              <View style={styles.ornamentLine} />
            </View>
          </View>

          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
            {'Comprendre ton cycle,\nprendre soin de toi,\nen accord avec ta foi.'}
          </Text>
        </View>

        <View
          style={[
            styles.actions,
            compact && styles.actionsCompact,
            {paddingBottom: bottomSpacing},
          ]}>
          <Pressable
            accessibilityLabel="Commencer"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Objective')}
            style={({pressed}) => [
              styles.primaryButton,
              compact && styles.primaryButtonCompact,
              {width: buttonWidth},
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.primaryButtonText, compact && styles.primaryButtonTextCompact]}>Commencer</Text>
            <View style={[styles.arrowCircle, compact && styles.arrowCircleCompact]}>
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={WELCOME_ARROW}
                style={[styles.arrowImage, compact && styles.arrowImageCompact]}
              />
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel="J’ai déjà un compte"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Auth')}
            style={({pressed}) => [
              styles.loginButton,
              compact && styles.loginButtonCompact,
              {width: buttonWidth},
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.loginText, compact && styles.loginTextCompact]}>J’ai déjà un compte</Text>
          </Pressable>

        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#C9A9DB'},
  page: {flex: 1, justifyContent: 'space-between', backgroundColor: '#C9A9DB'},
  intro: {alignItems: 'center', paddingTop: TOP_SPACING_EXTRA, paddingHorizontal: 24},
  introCompact: {paddingTop: TOP_SPACING_EXTRA_COMPACT},
  titleBlock: {alignItems: 'center'},
  welcomeTitle: {color: '#43206B', fontFamily: 'serif', fontSize: 44, lineHeight: 48},
  welcomeTitleCompact: {fontSize: 36, lineHeight: 39},
  brandLine: {flexDirection: 'row', alignItems: 'baseline', marginTop: -7},
  chez: {color: '#43206B', fontFamily: 'serif', fontSize: 34, fontStyle: 'italic'},
  chezCompact: {fontSize: 28},
  hawa: {color: '#43206B', fontFamily: 'serif', fontSize: 43},
  hawaCompact: {fontSize: 35},
  ornamentRow: {flexDirection: 'row', alignItems: 'center', marginTop: 1},
  ornamentLine: {width: 45, height: 1, backgroundColor: '#D6AE78'},
  ornament: {marginHorizontal: 8, color: '#512576', fontSize: 14},
  subtitle: {marginTop: 10, color: '#3F2364', fontFamily: 'serif', fontSize: 15, lineHeight: 23, textAlign: 'center'},
  subtitleCompact: {marginTop: 5, fontSize: 13, lineHeight: 19},
  actions: {alignItems: 'center', paddingHorizontal: 20},
  actionsCompact: {paddingHorizontal: 14},
  primaryButton: {height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#D9B47B', borderRadius: 28, backgroundColor: 'rgba(83, 36, 119, 0.96)', shadowColor: '#2E154B', shadowOpacity: 0.28, shadowRadius: 9, shadowOffset: {width: 0, height: 4}, elevation: 7},
  primaryButtonCompact: {height: 50, borderRadius: 25},
  primaryButtonText: {color: '#FFFFFF', fontFamily: 'serif', fontSize: 20, fontWeight: '700'},
  primaryButtonTextCompact: {fontSize: 17},
  arrowCircle: {position: 'absolute', right: 9, width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 20},
  arrowCircleCompact: {right: 7, width: 35, height: 35, borderRadius: 18},
  arrowImage: {width: 24, height: 24, tintColor: '#FFFFFF'},
  arrowImageCompact: {width: 20, height: 20},
  loginButton: {height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 11, borderWidth: 1.5, borderColor: '#FFFFFF', borderRadius: 24, backgroundColor: 'rgba(76, 32, 111, 0.22)'},
  loginButtonCompact: {height: 44, marginTop: 9, borderRadius: 22},
  loginText: {color: '#FFFFFF', fontFamily: 'serif', fontSize: 17, fontWeight: '500'},
  loginTextCompact: {fontSize: 15},
  pagination: {flexDirection: 'row', marginTop: 18, gap: 17},
  dot: {width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(220, 230, 224, 0.45)'},
  activeDot: {backgroundColor: '#8DD09A'},
  pressed: {opacity: 0.84, transform: [{scale: 0.99}]},
});

export default WelcomeScreen;
