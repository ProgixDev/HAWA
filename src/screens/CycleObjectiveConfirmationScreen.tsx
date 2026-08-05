import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {getTopPadding} from '../theme/spacing';

const CONFIRMATION_BACKGROUND = require('../assets/images/cycle-objective-confirmation-background.png');
const PURPLE = '#6949BE';

type Props = NativeStackScreenProps<RootStackParamList, 'CycleObjectiveConfirmation'>;

function CycleObjectiveConfirmationScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  }, [entrance]);

  const translateY = entrance.interpolate({inputRange: [0, 1], outputRange: [18, 0]});

  return (
    <ImageBackground source={CONFIRMATION_BACKGROUND} resizeMode="cover" style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.page, {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + 8}]}>
        <Animated.View style={[styles.content, {opacity: entrance, transform: [{translateY}]}]}>
          <View style={styles.copy}>
            <Text style={styles.title}>Parfait ! 🎉</Text>
            <Text style={styles.lead}>Tu as choisi le suivi classique du cycle.</Text>
            <Text style={styles.description}>
              {'Tu pourras personnaliser ton suivi\net ajouter tes premières informations\nà l’étape suivante.'}
            </Text>
          </View>
        </Animated.View>

        <Pressable
          accessibilityLabel="Commencer mon suivi"
          accessibilityRole="button"
          onPress={() => navigation.navigate('SpiritualPreferences')}
          style={({pressed}) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Commencer mon suivi</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F0E3F9'},
  page: {flex: 1, justifyContent: 'space-between', paddingHorizontal: 18},
  content: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  copy: {alignItems: 'center', marginTop: 90},
  title: {color: '#28166F', fontFamily: 'serif', fontSize: 29, fontWeight: '700', lineHeight: 38, textAlign: 'center'},
  lead: {marginTop: 14, color: '#433467', fontSize: 16, lineHeight: 23, textAlign: 'center'},
  description: {marginTop: 27, color: '#655A8D', fontSize: 15, lineHeight: 22, textAlign: 'center'},
  button: {height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: PURPLE, elevation: 5, shadowColor: '#4E319A', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.25, shadowRadius: 9},
  buttonPressed: {opacity: 0.88, transform: [{scale: 0.99}]},
  buttonText: {color: '#FFFFFF', fontSize: 17, fontWeight: '600'},
});

export default CycleObjectiveConfirmationScreen;
