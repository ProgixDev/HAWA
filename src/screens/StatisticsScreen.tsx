import React from 'react';
import {
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import {
  homeColors,
  homeRadii,
  homeShadow,
} from '../components/home/homeTheme';

const BACKGROUND = require('../assets/images/auth-mosque-background.png');

type Props = MainTabScreenProps<'Statistics'>;

function StatisticsScreen(_props: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const topSpacing = Math.max(insets.top + 9, 16);

  return (
    <ImageBackground
      resizeMode="cover"
      source={BACKGROUND}
      style={styles.background}>
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: topSpacing,
              paddingBottom:
                Math.max(insets.bottom, 16) + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            Statistiques
          </Text>

          <Text style={styles.subtitle}>
            Comprends ton corps grâce à tes tendances ✨
          </Text>

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <MaterialDesignIcons
                color={homeColors.primary}
                name="chart-donut"
                size={30}
              />
            </View>

            <Text style={styles.cardTitle}>
              Bientôt disponible
            </Text>

            <Text style={styles.cardText}>
              Les tendances de ton cycle sur 3, 6 et 12 mois seront bientôt
              disponibles ici, calculées à partir de ton journal quotidien.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F8EFFF',
  },

  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 16,
  },

  title: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 4,
    color: homeColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },

  card: {
    marginTop: 24,
    alignItems: 'center',
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    ...homeShadow,
  },

  iconCircle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: homeColors.lightLavender,
  },

  cardTitle: {
    marginTop: 16,
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },

  cardText: {
    marginTop: 8,
    color: homeColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});

export default StatisticsScreen;