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

import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';

const WELCOME_BACKGROUND = require('../assets/images/welcome-background.png');
const WELCOME_ARROW = require('../assets/images/welcome-arrow.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

function WelcomeScreen({navigation}: Props): React.JSX.Element {
  const {height} = useWindowDimensions();
  const compact = height < 740;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.cream} barStyle="dark-content" />
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
              <Text style={[styles.hawa, compact && styles.hawaCompact]}> HAWA</Text>
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

        <View style={[styles.actions, compact && styles.actionsCompact]}>
          <Pressable
            accessibilityLabel="Commencer"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Objective')}
            style={({pressed}) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Commencer</Text>
            <View style={styles.arrowCircle}>
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={WELCOME_ARROW}
                style={styles.arrowImage}
              />
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel="J’ai déjà un compte"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Auth')}
            style={({pressed}) => [styles.loginButton, pressed && styles.pressed]}>
            <Text style={styles.loginText}>J’ai déjà un compte</Text>
          </Pressable>

        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.cream},
  page: {flex: 1, justifyContent: 'space-between', backgroundColor: colors.cream},
  intro: {alignItems: 'center', paddingTop: 22, paddingHorizontal: 24},
  introCompact: {paddingTop: 10},
  titleBlock: {alignItems: 'center'},
  welcomeTitle: {color: '#225A45', fontFamily: 'serif', fontSize: 44, lineHeight: 48},
  welcomeTitleCompact: {fontSize: 36, lineHeight: 39},
  brandLine: {flexDirection: 'row', alignItems: 'baseline', marginTop: -7},
  chez: {color: '#225A45', fontFamily: 'serif', fontSize: 34, fontStyle: 'italic'},
  chezCompact: {fontSize: 28},
  hawa: {color: '#225A45', fontFamily: 'serif', fontSize: 43},
  hawaCompact: {fontSize: 35},
  ornamentRow: {flexDirection: 'row', alignItems: 'center', marginTop: 1},
  ornamentLine: {width: 45, height: 1, backgroundColor: '#98A989'},
  ornament: {marginHorizontal: 8, color: '#3D7A5D', fontSize: 14},
  subtitle: {marginTop: 10, color: '#283334', fontSize: 15, lineHeight: 23, textAlign: 'center'},
  subtitleCompact: {marginTop: 5, fontSize: 13, lineHeight: 19},
  actions: {alignItems: 'center', paddingHorizontal: 20, paddingBottom: 18},
  actionsCompact: {paddingBottom: 8},
  primaryButton: {width: '92%', height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#82A58A', borderRadius: 29, backgroundColor: 'rgba(80, 126, 94, 0.94)', elevation: 5},
  primaryButtonText: {color: '#FFFFFF', fontSize: 19, fontWeight: '700'},
  arrowCircle: {position: 'absolute', right: 16, width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 20},
  arrowImage: {width: 23, height: 23},
  loginButton: {width: '92%', height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderWidth: 1.5, borderColor: '#DCE7DF', borderRadius: 24, backgroundColor: 'rgba(18, 70, 55, 0.36)'},
  loginText: {color: '#B9DDBD', fontSize: 16, fontWeight: '500'},
  pagination: {flexDirection: 'row', marginTop: 18, gap: 17},
  dot: {width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(220, 230, 224, 0.45)'},
  activeDot: {backgroundColor: '#8DD09A'},
  pressed: {opacity: 0.84, transform: [{scale: 0.99}]},
});

export default WelcomeScreen;
