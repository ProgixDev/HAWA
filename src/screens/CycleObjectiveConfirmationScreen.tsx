import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';

const CONFIRMATION_IMAGE = require('../assets/images/cycle-objective-confirmation.png');
const PURPLE = '#6949BE';

type Props = NativeStackScreenProps<RootStackParamList, 'CycleObjectiveConfirmation'>;

function CycleObjectiveConfirmationScreen({navigation}: Props): React.JSX.Element {
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 700;
  const entrance = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, entrance]);

  const translateY = entrance.interpolate({inputRange: [0, 1], outputRange: [18, 0]});
  const scale = breathe.interpolate({inputRange: [0, 1], outputRange: [1, 1.018]});

  return (
    <View style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={[styles.page, {paddingTop: Math.max(insets.top, 20) + (compact ? 8 : 20), paddingBottom: Math.max(insets.bottom, 16) + 8}, compact && styles.pageCompact]}>
        <Animated.View style={[styles.content, {opacity: entrance, transform: [{translateY}]}]}>
          <Animated.View style={[styles.imageWrap, compact && styles.imageWrapCompact, {transform: [{scale}]}]}>
            <Image
              accessibilityLabel="Calendrier botanique validé"
              resizeMode="contain"
              source={CONFIRMATION_IMAGE}
              style={styles.image}
            />
          </Animated.View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F0E3F9'},
  page: {flex: 1, justifyContent: 'space-between', paddingHorizontal: 18},
  pageCompact: {},
  content: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  imageWrap: {width: '88%', maxWidth: 390, aspectRatio: 1},
  imageWrapCompact: {width: '62%', maxWidth: 230},
  image: {width: '100%', height: '100%'},
  copy: {alignItems: 'center', marginTop: -20},
  title: {color: '#28166F', fontFamily: 'serif', fontSize: 29, fontWeight: '700', lineHeight: 38, textAlign: 'center'},
  lead: {marginTop: 14, color: '#433467', fontSize: 16, lineHeight: 23, textAlign: 'center'},
  description: {marginTop: 27, color: '#655A8D', fontSize: 15, lineHeight: 22, textAlign: 'center'},
  button: {height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: PURPLE, elevation: 5, shadowColor: '#4E319A', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.25, shadowRadius: 9},
  buttonPressed: {opacity: 0.88, transform: [{scale: 0.99}]},
  buttonText: {color: '#FFFFFF', fontSize: 17, fontWeight: '600'},
});

export default CycleObjectiveConfirmationScreen;
