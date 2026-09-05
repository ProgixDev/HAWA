import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, ImageBackground, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {hasPrivatePin, savePrivatePin, verifyPrivatePin} from '../../services/privateSectionAuth';
import {replaceWithIntimacyDestination, unlockIntimacy} from '../../state/privateSectionAuthStore';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivateIntimacyPin'>;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'empty', '0', 'delete'] as const;

export default function PrivateIntimacyPinScreen({navigation, route}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 720;
  // The padlock artwork (+ its soft shadow) baked into the background ends at ~37% of screen
  // height on our target aspect ratios; clear it with margin before any text renders. Capped so
  // the keypad below it can never be pushed past the bottom edge on shorter devices.
  const availableHeight = height - insets.top - insets.bottom - 12;
  const minContentBelowArtwork = compact ? 340 : 356;
  const desiredClearance = height * 0.4 - insets.top;
  const artworkClearance = Math.max(20, Math.min(desiredClearance, availableHeight - minContentBelowArtwork));

  const [configured, setConfigured] = useState(false);
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hasPrivatePin().then(setConfigured).catch(() => setConfigured(false));
  }, []);

  const fail = (message: string) => {
    setError(message);
    setPin('');
    Animated.sequence([6, -6, 4, -4, 0].map(value => Animated.timing(shake, {toValue: value, duration: 45, easing: Easing.linear, useNativeDriver: true}))).start();
  };

  const complete = async (value: string) => {
    try {
      if (configured) {
        if (await verifyPrivatePin(value)) {unlockIntimacy(); replaceWithIntimacyDestination(navigation, route.params?.target);}
        else {fail('Code incorrect. Réessaie.');}
        return;
      }
      if (!first) {setFirst(value); setPin(''); setError('Confirme ton nouveau code.'); return;}
      if (first !== value) {setFirst(''); fail('Les codes ne correspondent pas. Recommence.'); return;}
      await savePrivatePin(value); unlockIntimacy(); replaceWithIntimacyDestination(navigation, route.params?.target);
    } catch (err) {
      console.error('[PrivateIntimacyPin] verify/save failed', err);
      fail('Une erreur est survenue. Réessaie.');
    }
  };

  const enter = (key: typeof KEYS[number]) => {
    if (key === 'delete') {setPin(v => v.slice(0, -1)); return;}
    if (key === 'empty' || pin.length >= 6) {return;}
    const next = `${pin}${key}`;
    setPin(next);
    setError('');
    if (next.length === 6) {setTimeout(() => complete(next), 120);}
  };

  return (
    <ImageBackground resizeMode="cover" source={require('../../assets/images/private-lock-background.png')} style={styles.safe}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <View style={styles.content}>
          <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={styles.back}>
            <MaterialDesignIcons color={theme.colors.accent} name="arrow-left" size={27} />
          </Pressable>

          <View style={{height: artworkClearance}} />

          <View style={styles.titleBlock}>
            <Text style={[styles.title, compact && styles.titleCompact]}>
              {configured ? 'Saisis ton code privé' : first ? 'Confirme ton code' : 'Crée ton code privé'}
            </Text>
            <Text style={styles.subtitle}>Code sécurisé à 6 chiffres</Text>
          </View>

          <View style={styles.gapSmall} />

          <View style={styles.dotsBlock}>
            <Animated.View accessibilityLabel={`${pin.length} chiffres saisis`} style={[styles.dots, {transform: [{translateX: shake}]}]}>
              {[0, 1, 2, 3, 4, 5].map(index => <View key={index} style={[styles.dot, index < pin.length && styles.dotFilled]} />)}
            </Animated.View>
            <Text accessibilityLiveRegion="polite" style={styles.error}>{error || ' '}</Text>
          </View>

          <View style={styles.gapLarge} />

          <View style={[styles.keypad, compact && styles.keypadCompact]}>
            {KEYS.map((key, index) => key === 'empty' ? (
              <View key={key} style={styles.key} />
            ) : (
              <Pressable
                accessibilityLabel={key === 'delete' ? 'Effacer' : key}
                accessibilityRole="button"
                key={`${key}-${index}`}
                onPress={() => enter(key)}
                style={({pressed}) => [styles.key, styles.keyActive, pressed && styles.pressed]}>
                {key === 'delete' ? <MaterialDesignIcons color={theme.colors.accent} name="backspace-outline" size={25} /> : <Text style={styles.number}>{key}</Text>}
              </Pressable>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    flex: {flex: 1},
    content: {flex: 1, alignItems: 'center', paddingHorizontal: 22, paddingBottom: 12},
    back: {position: 'absolute', top: 12, left: 16, zIndex: 2, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: theme.colors.surface},
    titleBlock: {alignItems: 'center'},
    title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 24, fontWeight: '800', textAlign: 'center'},
    titleCompact: {fontSize: 21},
    subtitle: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12},
    gapSmall: {flexGrow: 0.4, minHeight: 18},
    dotsBlock: {alignItems: 'center'},
    dots: {flexDirection: 'row', gap: 15},
    dot: {width: 14, height: 14, borderWidth: 1.5, borderColor: withAlpha(theme.colors.primary, 0.4), borderRadius: 7, backgroundColor: theme.colors.surface},
    dotFilled: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
    error: {height: 31, marginTop: 10, color: theme.colors.danger, fontSize: 11, textAlign: 'center'},
    gapLarge: {flexGrow: 0.8, minHeight: 28},
    keypad: {width: 264, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 13},
    keypadCompact: {rowGap: 7},
    key: {width: 72, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 25},
    keyActive: {backgroundColor: theme.colors.primarySoft},
    number: {color: theme.colors.accent, fontSize: 23, fontWeight: '600'},
    pressed: {opacity: 0.65, transform: [{scale: 0.96}]},
    bottomSpacer: {flexGrow: 0.5, minHeight: 0},
  });
}
