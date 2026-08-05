import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, ImageBackground, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {authenticateWithBiometry, getBiometryIcon, getBiometryLabel, getBiometryType} from '../../services/privateSectionAuth';
import {unlockIntimacy} from '../../state/privateSectionAuthStore';
import type * as Keychain from 'react-native-keychain';

const PURPLE = '#6736B4';
const PURPLE_DARK = '#35117E';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type Props = NativeStackScreenProps<RootStackParamList, 'PrivateIntimacyFaceId'>;

function getBiometrySubtitle(type: Keychain.BIOMETRY_TYPE | null): string {
  if (type === 'FaceID' || type === 'Face') {return 'Regarde ton téléphone pour déverrouiller\ncet espace privé.';}
  if (type === 'Fingerprint' || type === 'TouchID') {return 'Pose ton doigt sur le capteur pour déverrouiller\ncet espace privé.';}
  if (type === 'Iris' || type === 'OpticID') {return 'Regarde ton téléphone pour déverrouiller\ncet espace privé.';}
  return 'Utilise ta biométrie pour déverrouiller\ncet espace privé.';
}

export default function PrivateIntimacyFaceIdScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const attempted = useRef(false);

  const [title, setTitle] = useState('Face ID');
  const [subtitle, setSubtitle] = useState('Regarde ton téléphone pour déverrouiller\ncet espace privé.');
  const [icon, setIcon] = useState<IconName>('face-recognition');
  const [buttonLabel, setButtonLabel] = useState('Utiliser Face ID');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => Animated.timing(entrance, {toValue: 1, duration: reduce ? 0 : 420, easing: Easing.out(Easing.cubic), useNativeDriver: true}).start());
    getBiometryType().then(type => {
      const label = getBiometryLabel(type);
      setButtonLabel(label);
      setTitle(label.replace(/^Utiliser /, ''));
      setIcon(getBiometryIcon(type) as IconName);
      setSubtitle(getBiometrySubtitle(type));
    });
  }, [entrance]);

  const fail = (message: string) => {
    setError(message);
    Animated.sequence([6, -6, 4, -4, 0].map(value => Animated.timing(shake, {toValue: value, duration: 45, easing: Easing.linear, useNativeDriver: true}))).start();
  };

  const attempt = async () => {
    if (busy) {return;}
    try {
      setBusy(true);
      setError('');
      if (await authenticateWithBiometry()) {unlockIntimacy(); navigation.replace('IntimacyEntry'); return;}
      fail('Authentification non reconnue. Réessaie.');
    } catch {
      fail('Authentification non reconnue. Réessaie.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (attempted.current) {return;}
    attempted.current = true;
    attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ImageBackground resizeMode="cover" source={require('../../assets/images/private-lock-background.png')} style={styles.safe}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <View style={[styles.content, {paddingBottom: Math.max(insets.bottom, 14)}]}>
          <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={styles.back}>
            <MaterialDesignIcons color={PURPLE_DARK} name="arrow-left" size={27} />
          </Pressable>

          <Animated.View
            style={[
              styles.main,
              {
                opacity: entrance,
                transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}],
              },
            ]}>
            <View style={styles.badge}>
              <MaterialDesignIcons color={PURPLE} name={icon} size={64} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </Animated.View>

          <Animated.Text accessibilityLiveRegion="polite" style={[styles.error, {transform: [{translateX: shake}]}]}>
            {error || ' '}
          </Animated.Text>

          <Pressable
            accessibilityLabel={buttonLabel}
            accessibilityRole="button"
            disabled={busy}
            onPress={attempt}
            style={({pressed}) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}>
            <MaterialDesignIcons color="#FFFFFF" name={icon} size={22} />
            <Text style={styles.primaryText}>{busy ? 'Vérification…' : buttonLabel}</Text>
          </Pressable>

          <Pressable accessibilityLabel="Utiliser le code privé" hitSlop={10} onPress={() => navigation.replace('PrivateIntimacyPin')}>
            <Text style={styles.link}>Utiliser le code privé à la place</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F3ECFB'},
  flex: {flex: 1},
  content: {flex: 1, alignItems: 'center', paddingTop: 246, paddingHorizontal: 26},
  back: {position: 'absolute', top: 12, left: 16, zIndex: 2, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8DFF0', borderRadius: 16, backgroundColor: '#FFFFFF'},
  main: {alignItems: 'center'},
  badge: {width: 118, height: 118, alignItems: 'center', justifyContent: 'center', borderRadius: 59, backgroundColor: '#F1E7F7'},
  title: {marginTop: 18, color: PURPLE_DARK, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  subtitle: {marginTop: 8, color: '#6A5C78', fontSize: 13, lineHeight: 19, textAlign: 'center'},
  error: {height: 31, marginTop: 16, color: '#8A5370', fontSize: 11, textAlign: 'center'},
  primary: {width: '100%', minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, backgroundColor: PURPLE},
  primaryText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},
  link: {marginTop: 18, color: PURPLE_DARK, fontSize: 13, fontWeight: '600', textAlign: 'center'},
  pressed: {opacity: 0.82, transform: [{scale: 0.99}]},
  disabled: {opacity: 0.55},
});

