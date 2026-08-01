import React from 'react';
import {
  Alert,
  Image,
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
import {spacing} from '../theme/spacing';

const WELCOME_WOMAN = require('../assets/images/welcome-woman.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

function WelcomeScreen({navigation}: Props): React.JSX.Element {
  const {height, width} = useWindowDimensions();
  const illustrationSize = Math.min(width, height * 0.46, 500);

  const handleStart = () => {
    navigation.navigate('Objective');
  };

  const handleLogin = () => {
    Alert.alert('Connexion', 'L’écran de connexion arrive bientôt.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        hidden={false}
        backgroundColor={colors.cream}
        barStyle="dark-content"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{'Bienvenue\nchez HAWA'}</Text>
          <Text style={styles.subtitle}>
            {'Comprendre ton cycle,\nprendre soin de toi,\nen accord avec ta foi.'}
          </Text>
        </View>

        <Image
          source={WELCOME_WOMAN}
          resizeMode="contain"
          style={{width: illustrationSize, height: illustrationSize}}
          accessibilityLabel="Femme portant un hijab vert entourée de feuillage"
        />

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Commencer"
            onPress={handleStart}
            style={({pressed}) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}>
            <Text style={styles.primaryButtonText}>Commencer</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="J’ai déjà un compte"
            hitSlop={12}
            onPress={handleLogin}
            style={({pressed}) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
            ]}>
            <Text style={styles.loginText}>J’ai déjà un compte</Text>
          </Pressable>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.cream,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.backgroundDeep,
    fontFamily: 'serif',
    fontSize: 34,
    fontWeight: '500',
    lineHeight: 41,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.md,
    color: '#1E3031',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  primaryButton: {
    width: '88%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#216846',
    elevation: 4,
    shadowColor: colors.backgroundDeep,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{scale: 0.99}],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  loginButton: {
    marginTop: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loginButtonPressed: {
    opacity: 0.55,
  },
  loginText: {
    color: '#14613E',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
