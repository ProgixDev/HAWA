import React, {useState} from 'react';
import {Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {spacing} from '../theme/spacing';
import {isBiometricEnabled, isPinEnabled} from '../state/securityPreferences';

const HEADER = require('../assets/images/auth-mosque-header.png');
const APPLE_LOGO = require('../assets/images/auth-apple-logo.png');
const GOOGLE_LOGO = require('../assets/images/auth-google-logo.png');
const EMAIL_LOGO = require('../assets/images/auth-email-logo.png');
const ANONYMOUS_LOGO = require('../assets/images/auth-anonymous-logo.png');
const EMAIL_FIELD_ICON = require('../assets/images/register-email-icon.png');
const LOCK_FIELD_ICON = require('../assets/images/register-lock-icon.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

function AuthScreen({navigation}: Props): React.JSX.Element {
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 700;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const submit = () => {
    if (isPinEnabled()) {navigation.navigate('PinSetup'); return;}
    if (isBiometricEnabled()) {navigation.navigate('FaceIdSetup'); return;}
    navigation.replace('CycleHome');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16)}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ImageBackground source={HEADER} resizeMode="cover" style={[styles.hero, compact && styles.heroCompact]}>
            <View style={styles.brandArea}>
              <Text style={styles.brand}>HAWA</Text>
              <Text style={styles.tagline}>{'Pour une vie alignée,\nà chaque étape.'}</Text>
            </View>
          </ImageBackground>

          <View style={styles.tabs}>
            {(['login', 'register'] as const).map(tab => {
              const active = mode === tab;
              return (
                <Pressable key={tab} onPress={() => tab === 'register' ? navigation.navigate('Registration') : setMode(tab)} style={[styles.tab, active && styles.tabActive]}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab === 'login' ? 'Connexion' : 'Créer un compte'}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.field}>
            <Image
              accessibilityIgnoresInvertColors
              source={EMAIL_FIELD_ICON}
              style={styles.fieldIcon}
            />
            <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Adresse e-mail" placeholderTextColor="#77827E" style={styles.input} value={email} />
          </View>
          <View style={styles.field}>
            <Image
              accessibilityIgnoresInvertColors
              source={LOCK_FIELD_ICON}
              style={styles.fieldIcon}
            />
            <TextInput onChangeText={setPassword} placeholder="Mot de passe" placeholderTextColor="#77827E" secureTextEntry={!passwordVisible} style={styles.input} value={password} />
            <Pressable hitSlop={10} onPress={() => setPasswordVisible(value => !value)}>
              <MaterialDesignIcons color="#46695F" name={passwordVisible ? 'eye-outline' : 'eye-off-outline'} size={20} />
            </Pressable>
          </View>
          {mode === 'login' && <Pressable onPress={() => Alert.alert('Mot de passe oublié')}><Text style={styles.forgot}>Mot de passe oublié ?</Text></Pressable>}

          <Pressable onPress={submit} style={({pressed}) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</Text>
          </Pressable>

          <Text style={styles.or}>ou continuer avec</Text>
          <View style={styles.socialRow}>
            <Pressable onPress={() => Alert.alert('Google')} style={styles.social}><Image accessibilityIgnoresInvertColors source={GOOGLE_LOGO} style={styles.socialLogo} /></Pressable>
            <Pressable onPress={() => Alert.alert('Apple')} style={styles.social}><Image accessibilityIgnoresInvertColors source={APPLE_LOGO} style={styles.socialLogo} /></Pressable>
            <Pressable onPress={() => Alert.alert('E-mail')} style={styles.social}><Image accessibilityIgnoresInvertColors source={EMAIL_LOGO} style={styles.socialLogo} /></Pressable>
          </View>

          <Pressable onPress={() => Alert.alert('Mode anonyme')} style={styles.anonymous}>
            <Image accessibilityIgnoresInvertColors source={ANONYMOUS_LOGO} style={styles.anonymousLogo} />
            <Text style={styles.anonymousText}>Mode anonyme</Text>
          </Pressable>

          <View style={styles.spacer} />
          <Text style={styles.legal}>En continuant, vous acceptez nos</Text>
          <Text style={styles.legalStrong}>Conditions d’utilisation et notre Politique de confidentialité.</Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#FBF6EC'}, safeArea: {flex: 1}, content: {flexGrow: 1, paddingHorizontal: spacing.lg},
  hero: {height: 225, marginHorizontal: -spacing.lg, justifyContent: 'flex-end'},
  heroCompact: {height: 170},
  brandArea: {alignItems: 'center', paddingBottom: 12}, brand: {color: '#0B5847', fontFamily: 'serif', fontSize: 45, letterSpacing: 2},
  tagline: {marginTop: 2, color: '#24594D', fontSize: 12, lineHeight: 17, fontWeight: '600', textAlign: 'center'},
  tabs: {flexDirection: 'row', gap: 9, marginTop: 4, marginBottom: 14}, tab: {flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8DED0', borderRadius: 15, backgroundColor: 'rgba(255,253,248,0.88)'},
  tabActive: {borderColor: '#176548', backgroundColor: '#176548'}, tabText: {color: '#33413D', fontSize: 12}, tabTextActive: {color: '#FFFFFF', fontWeight: '600'},
  field: {minHeight: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 11, borderWidth: 1, borderColor: '#E5D9C8', borderRadius: 13, backgroundColor: 'rgba(255,253,248,0.92)', paddingHorizontal: 13},
  fieldIcon: {width: 34, height: 34, marginHorizontal: -4, resizeMode: 'contain'},
  input: {flex: 1, height: 48, marginLeft: 10, color: '#202C29', fontSize: 13}, forgot: {marginTop: -3, marginBottom: 10, color: '#39705F', fontSize: 11, textAlign: 'right'},
  primaryButton: {minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#176548', elevation: 2}, primaryText: {color: '#FFFFFF', fontSize: 15, fontWeight: '600'},
  or: {marginVertical: 12, color: '#87908C', fontSize: 11, textAlign: 'center'}, socialRow: {flexDirection: 'row', justifyContent: 'center', gap: 18},
  social: {width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DED7CA', borderRadius: 26, backgroundColor: '#FFFCF6'},
  socialLogo: {width: 38, height: 38, resizeMode: 'contain'},
  anonymous: {minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 15, borderRadius: 21, backgroundColor: 'rgba(248,241,230,0.95)', paddingHorizontal: 25},
  anonymousLogo: {width: 43, height: 43, marginHorizontal: -8, resizeMode: 'contain'},
  anonymousText: {marginLeft: 8, color: '#245C4B', fontSize: 12, fontWeight: '600'},
  spacer: {flex: 1}, legal: {color: '#69716E', fontSize: 9, textAlign: 'center'}, legalStrong: {marginTop: 2, color: '#3E4945', fontSize: 9, fontWeight: '600', textAlign: 'center'}, pressed: {opacity: 0.82},
});

export default AuthScreen;
