import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {typography} from '../theme/typography';

const AWA_LOGO = require('../assets/images/hawa-logo.png');
const SPLASH_BACKGROUND = require('../assets/images/hawa-splash-background.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

function SplashScreen({navigation}: Props): React.JSX.Element {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const separatorOpacity = useRef(new Animated.Value(0)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 950,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(180, [
        Animated.timing(separatorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(sloganOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const progressAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: 4800,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.012,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    entrance.start(({finished}) => finished && breathing.start());
    progressAnimation.start();

    const timer = setTimeout(() => navigation.replace('Welcome'), 5000);

    return () => {
      clearTimeout(timer);
      entrance.stop();
      progressAnimation.stop();
      breathing.stop();
    };
  }, [
    logoOpacity,
    logoScale,
    logoTranslateY,
    navigation,
    progress,
    separatorOpacity,
    sloganOpacity,
  ]);

  const logoWidth = Math.min(width * 0.76, height * 0.39, 390);
  const progressWidth = Math.min(width * 0.48, 220);

  return (
    <ImageBackground
      source={SPLASH_BACKGROUND}
      resizeMode="cover"
      style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{translateY: logoTranslateY}, {scale: logoScale}],
          }}>
          <Image
            source={AWA_LOGO}
            resizeMode="contain"
            style={{width: logoWidth, height: logoWidth}}
            accessibilityLabel="Logo AWA"
          />
        </Animated.View>

        <Animated.View style={[styles.separator, {opacity: separatorOpacity}]}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorFlower}>✧</Text>
          <View style={styles.separatorLine} />
        </Animated.View>

        <Animated.Text style={[styles.slogan, {opacity: sloganOpacity}]}>
          {'L’application de cycle\nqui respecte ton corps,\ntes données et ta foi.'}
        </Animated.Text>
      </View>

      <View style={[styles.progressTrack, {width: progressWidth, bottom: Math.max(insets.bottom, 16) + 16}]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['8%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  separatorLine: {
    width: 48,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.accent,
  },
  separatorFlower: {
    marginHorizontal: spacing.sm,
    color: colors.accentLight,
    fontSize: 22,
  },
  slogan: {
    ...typography.slogan,
    color: colors.cream,
    textAlign: 'center',
  },
  progressTrack: {
    position: 'absolute',
    alignSelf: 'center',
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: colors.progressTrack,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accentLight,
  },
});

export default SplashScreen;
