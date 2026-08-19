import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';

const PURPLE = '#6949BE';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const guarantees: {icon: IconName; title: string; description: string}[] = [
  {
    icon: 'cash-off',
    title: 'Aucune revente de données',
    description:
      'Tes données ne sont jamais vendues, cédées ou utilisées à des fins commerciales.',
  },
  {
    icon: 'lock-outline',
    title: 'Contrôle absolu',
    description:
      'Tu gardes le contrôle de tes informations et de leur utilisation à tout moment.',
  },
  {
    icon: 'database-lock-outline',
    title: 'Aucune exportation',
    description:
      'Tes données personnelles ne sont pas exportées en dehors du service.',
  },
  {
    icon: 'shield-lock-outline',
    title: 'Données chiffrées et anonymisées',
    description:
      'Les informations sensibles sont protégées et les données d’identité sont anonymisées.',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

function PrivacyScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <View style={styles.safeArea}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: getTopPadding(insets.top),
              paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {'Ta confidentialité\nest notre priorité'}
            </Text>

            <Text style={styles.subtitle}>
              {
                'Tu gardes le contrôle absolu sur tes données.\nNous les protégeons à chaque étape.'
              }
            </Text>
          </View>

          <View style={styles.guaranteesCard}>
            {guarantees.map((item, index) => (
              <View key={item.title}>
                <View style={styles.guaranteeRow}>
                  <View style={styles.iconContainer}>
                    <MaterialDesignIcons
                      color={PURPLE}
                      name={item.icon}
                      size={32}
                    />
                  </View>

                  <View style={styles.guaranteeCopy}>
                    <Text style={styles.guaranteeTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.guaranteeDescription}>
                      {item.description}
                    </Text>
                  </View>
                </View>

                {index < guarantees.length - 1 ? (
                  <View style={styles.rowDivider} />
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.commitmentCard}>
            <View style={styles.commitmentHeader}>
              <View style={styles.commitmentIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="shield-check-outline"
                  size={26}
                />
              </View>

              <View style={styles.commitmentCopy}>
                <Text style={styles.commitmentTitle}>
                  Notre engagement
                </Text>

                <Text style={styles.commitmentSubtitle}>
                  Tes informations restent privées.
                </Text>
              </View>
            </View>

            <View style={styles.commitmentList}>
              <View style={styles.commitmentItem}>
                <View style={styles.bullet} />
                <Text style={styles.commitmentText}>
                  Tu gardes le contrôle absolu sur tes données.
                </Text>
              </View>

              <View style={styles.commitmentItem}>
                <View style={styles.bullet} />
                <Text style={styles.commitmentText}>
                  Aucune de tes données personnelles n’est exportée.
                </Text>
              </View>

              <View style={styles.commitmentItem}>
                <View style={styles.bullet} />
                <Text style={styles.commitmentText}>
                  Aucun accès interne n’est autorisé en dehors des opérations
                  strictement nécessaires et sécurisées.
                </Text>
              </View>

              <View style={styles.commitmentItem}>
                <View style={styles.bullet} />
                <Text style={styles.commitmentText}>
                  Les données d’identité, comme ton nom, sont chiffrées et
                  anonymisées.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceIcon}>
              <MaterialDesignIcons
                color={PURPLE}
                name="account-cog-outline"
                size={28}
              />
            </View>

            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>
                Tu restes libre
              </Text>

              <Text style={styles.preferenceText}>
                {
                  'Tu peux modifier tes préférences ou demander la suppression de tes données à tout moment dans les paramètres.'
                }
              </Text>
            </View>
          </View>

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Summary')}
            style={({pressed}) => [
              styles.nextButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.nextText}>Suivant</Text>

            <View style={styles.nextArrowContainer}>
              <MaterialDesignIcons
                color="#6949BE"
                name="arrow-right"
                size={20}
              />
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F2ECF8',
  },

  pageBackgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  pageGlowTop: {
    position: 'absolute',
    top: -150,
    right: -110,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },

  header: {
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 35,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 10,
    color: '#655A8D',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  guaranteesCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.16)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,252,255,0.84)',
    paddingVertical: 4,
  },

  guaranteeRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  iconContainer: {
    width: 68,
    height: 68,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(246,239,255,0.7)',
  },

  guaranteeCopy: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 10,
    paddingRight: 6,
  },

  guaranteeTitle: {
    color: '#382174',
    fontSize: 14,
    fontWeight: '700',
  },

  guaranteeDescription: {
    marginTop: 4,
    color: '#655A8D',
    fontSize: 11.5,
    lineHeight: 16.5,
  },

  rowDivider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: 'rgba(111,83,190,0.10)',
  },

  commitmentCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.82)',
    padding: 15,
  },

  commitmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  commitmentIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F3EAFE',
  },

  commitmentCopy: {
    flex: 1,
    marginLeft: 11,
  },

  commitmentTitle: {
    color: '#301A73',
    fontSize: 15,
    fontWeight: '800',
  },

  commitmentSubtitle: {
    marginTop: 3,
    color: '#71658F',
    fontSize: 10.5,
  },

  commitmentList: {
    marginTop: 13,
    gap: 10,
  },

  commitmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bullet: {
    width: 7,
    height: 7,
    flexShrink: 0,
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: '#7654C5',
  },

  commitmentText: {
    flex: 1,
    marginLeft: 9,
    color: '#5F547C',
    fontSize: 11.5,
    lineHeight: 17,
  },

  preferenceCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(246,239,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  preferenceIcon: {
    width: 52,
    height: 52,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },

  preferenceCopy: {
    flex: 1,
    marginLeft: 5,
  },

  preferenceTitle: {
    color: '#382174',
    fontSize: 12.5,
    fontWeight: '700',
  },

  preferenceText: {
    marginTop: 3,
    color: '#5C5078',
    fontSize: 10.8,
    lineHeight: 16,
  },

  spacer: {
    flex: 1,
    minHeight: 18,
  },

  nextButton: {
    position: 'relative',
    width: '78%',
    maxWidth: 320,
    minHeight: 52,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 54,
    borderRadius: 18,
    backgroundColor: '#6949BE',
    shadowColor: '#4E319A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },

  nextText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  nextArrowContainer: {
    position: 'absolute',
    right: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.99}],
  },
});

export default PrivacyScreen;