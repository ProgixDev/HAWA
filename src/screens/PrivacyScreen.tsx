import React from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing} from '../theme/spacing';

const BACKGROUND = require('../assets/images/school-selection-background.png');
const NO_RESALE = require('../assets/images/privacy-no-resale.png');
const LOCK = require('../assets/images/privacy-lock.png');
const STORAGE = require('../assets/images/privacy-storage.png');
const SHIELD = require('../assets/images/privacy-shield.png');

const guarantees = [
  {icon: NO_RESALE, title: 'Aucune revente de données', description: 'Tes données ne sont jamais\nvendues à des tiers.'},
  {icon: LOCK, title: 'Données chiffrées', description: 'Toutes tes données sont\ncryptées et sécurisées.'},
  {icon: STORAGE, title: 'Stockage sécurisé', description: 'Hébergées sur des serveurs\nsécurisés et fiables.'},
  {icon: SHIELD, title: 'Confidentialité garantie', description: 'Tu gardes le contrôle total\nsur tes informations.'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

function PrivacyScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(insets.top, 20) + spacing.md, paddingBottom: Math.max(insets.bottom, 16) + spacing.sm}]} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{'Ta confidentialité\nest notre priorité'}</Text>
            <Text style={styles.subtitle}>{'Nous nous engageons à protéger\ntes données personnelles.'}</Text>
          </View>

          <View style={styles.guaranteesCard}>
            {guarantees.map(item => (
              <View key={item.title} style={styles.guaranteeRow}>
                <Image accessibilityIgnoresInvertColors source={item.icon} style={styles.icon} />
                <View style={styles.guaranteeCopy}>
                  <Text style={styles.guaranteeTitle}>{item.title}</Text>
                  <Text style={styles.guaranteeDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.preferenceCard}>
            <Image accessibilityIgnoresInvertColors source={SHIELD} style={styles.preferenceIcon} />
            <Text style={styles.preferenceText}>{'Tu peux modifier tes préférences\nà tout moment dans les paramètres.'}</Text>
          </View>

          <View style={styles.spacer} />
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Summary')}
            style={({pressed}) => [styles.nextButton, pressed && styles.pressed]}>
            <Text style={styles.nextText}>Suivant</Text>
          </Pressable>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg},
  header: {alignItems: 'center', marginBottom: 17},
  title: {color: '#28166F', fontFamily: 'serif', fontSize: 29, fontWeight: '700', lineHeight: 35, textAlign: 'center'},
  subtitle: {marginTop: 8, color: '#655A8D', fontSize: 13, lineHeight: 19, textAlign: 'center'},
  guaranteesCard: {paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(111,83,190,0.16)', borderRadius: 22, backgroundColor: 'rgba(255,252,255,0.78)'},
  guaranteeRow: {minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8},
  icon: {width: 68, height: 68, resizeMode: 'contain'},
  guaranteeCopy: {flex: 1, paddingLeft: 2},
  guaranteeTitle: {color: '#382174', fontSize: 14, fontWeight: '700'},
  guaranteeDescription: {marginTop: 3, color: '#655A8D', fontSize: 12, lineHeight: 17},
  preferenceCard: {minHeight: 70, flexDirection: 'row', alignItems: 'center', marginTop: 12, borderRadius: 18, backgroundColor: 'rgba(246,239,255,0.86)', paddingHorizontal: 9},
  preferenceIcon: {width: 63, height: 63, resizeMode: 'contain'},
  preferenceText: {flex: 1, color: '#5C5078', fontSize: 12, lineHeight: 17},
  spacer: {flex: 1},
  nextButton: {minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#6949BE', shadowColor: '#4E319A', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.25, shadowRadius: 9, elevation: 5},
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.8},
});

export default PrivacyScreen;
