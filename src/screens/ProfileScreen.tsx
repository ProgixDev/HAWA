import React, {useMemo} from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {getTopPadding} from '../theme/spacing';
import {
  getCyclePreferences,
  getFirstName,
  getSelectedLocation,
  getSelectedObjective,
  getSelectedSchool,
  getSpiritualMarkersEnabled,
  type ObjectiveId,
  type SchoolId,
} from '../state/onboardingPreferences';
import {lockIntimacy} from '../state/privateSectionAuthStore';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';

const BACKGROUND = require('../assets/images/school-selection-background.png');
const PROFILE_CARD_BACKGROUND = require('../assets/images/background-card.png');
const AVATAR = require('../assets/images/icone_avatar.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const OBJECTIVE_LABELS: Record<ObjectiveId, string> = {
  cycle: 'Suivi classique du cycle',
  conceive: 'Essaye de concevoir',
  contraception: 'Contraception',
  irregular: 'Cycles irréguliers (SOPK)',
  menopause: 'Post-ménopause / Ménopause',
  pregnancy: 'Suivi de grossesse',
  postpartum: 'Post-partum',
  loss: 'Après une fausse couche',
};

const SCHOOL_LABELS: Record<SchoolId, string> = {
  hanafi: 'École hanafite',
  maliki: 'École malikite',
  chafii: 'École chaféite',
  hanbali: 'École hanbalite',
  unknown: 'École non précisée',
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long'}).format(date);

const formatHijriDate = (date: Date): string | undefined => {
  try {
    return new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return undefined;
  }
};

const computeNextPeriod = (lastPeriodStart: Date, cycleDuration: number): Date => {
  const today = startOfDay(new Date());
  let next = startOfDay(lastPeriodStart);
  while (next.getTime() < today.getTime()) {
    next = new Date(next.getFullYear(), next.getMonth(), next.getDate() + cycleDuration);
  }
  return next;
};

type StatCardProps = {icon: IconName; label: string; value: string};

function StatCard({icon, label, value}: StatCardProps): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <MaterialDesignIcons color={PURPLE} name={icon} size={18} />
      </View>
      <Text numberOfLines={1} style={styles.statValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type MenuRowProps = {icon: IconName; title: string; subtitle: string; onPress?: () => void};

function MenuRow({icon, title, subtitle, onPress}: MenuRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={styles.menuIcon}>
        <MaterialDesignIcons color={PURPLE} name={icon} size={21} />
      </View>
      <View style={styles.menuCopy}>
        <Text numberOfLines={1} style={styles.menuTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <MaterialDesignIcons color="#B7ACC9" name="chevron-right" size={22} />
    </Pressable>
  );
}

function ProfileScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 360;

  const firstName = getFirstName();
  const spiritualEnabled = getSpiritualMarkersEnabled();
  const objective = getSelectedObjective();
  const school = useMemo(() => getSelectedSchool(), []);
  const location = useMemo(() => getSelectedLocation(), []);
  const cycle = useMemo(() => getCyclePreferences(), []);

  const nextPeriod = useMemo(
    () => computeNextPeriod(cycle.lastPeriodStart, cycle.cycleDuration),
    [cycle],
  );
  const hijriToday = useMemo(() => formatHijriDate(new Date()), []);

  const metaParts = [OBJECTIVE_LABELS[objective]];
  if (school && school !== 'unknown') {metaParts.push(SCHOOL_LABELS[school]);}
  if (location?.city) {metaParts.push(location.city);}

  const showAbout = () =>
    Alert.alert(
      'À propos de AWA',
      'AWA t’accompagne au quotidien dans le suivi de ton cycle, avec douceur, pudeur et en accord avec tes repères spirituels.',
    );

  const showSupport = () =>
    Alert.alert(
      'Aide & support',
      'Une question ou un souci ? Notre équipe support te répondra rapidement.',
    );

  const confirmSignOut = () =>
    Alert.alert(
      'Se déconnecter ?',
      'Tu devras te reconnecter pour retrouver ton profil.',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => {
            lockIntimacy();
            navigation.reset({index: 0, routes: [{name: 'Auth'}]});
          },
        },
      ],
    );

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.page}>
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: getTopPadding(insets.top, compact),
              paddingBottom: Math.max(insets.bottom, 16) + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Profil</Text>
              <Text style={styles.headerSubtitle}>Gère tes informations et préférences</Text>
            </View>

            <Pressable accessibilityLabel="Notifications" style={styles.notification}>
              <MaterialDesignIcons color={PURPLE} name="bell-outline" size={23} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          <ImageBackground
            imageStyle={styles.profileCardImage}
            resizeMode="cover"
            source={PROFILE_CARD_BACKGROUND}
            style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                <Image accessibilityIgnoresInvertColors source={AVATAR} style={styles.avatar} />
                <Pressable
                  accessibilityLabel="Changer la photo de profil"
                  style={({pressed}) => [styles.avatarBadge, pressed && styles.pressed]}>
                  <MaterialDesignIcons color="#FFFFFF" name="camera-outline" size={14} />
                </Pressable>
              </View>

              <View style={styles.identity}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.name}>{firstName}</Text>
                  <Pressable accessibilityLabel="Modifier le profil" hitSlop={8}>
                    <MaterialDesignIcons color={PURPLE} name="pencil-outline" size={16} />
                  </Pressable>
                </View>

                <Text numberOfLines={2} style={styles.meta}>{metaParts.join(' • ')}</Text>

                <View
                  style={[
                    styles.spiritualPill,
                    spiritualEnabled ? styles.spiritualPillActive : styles.spiritualPillInactive,
                  ]}>
                  <MaterialDesignIcons
                    color={spiritualEnabled ? '#FFFFFF' : PURPLE}
                    name="moon-waning-crescent"
                    size={12}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.spiritualPillText,
                      spiritualEnabled ? styles.spiritualPillTextActive : styles.spiritualPillTextInactive,
                    ]}>
                    {spiritualEnabled ? 'Repères spirituels activés' : 'Repères spirituels désactivés'}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.statsGrid}>
            <StatCard icon="calendar-range" label="Cycle moyen" value={`${cycle.cycleDuration} jours`} />
            <StatCard icon="water-outline" label="Durée règles" value={`${cycle.periodDuration} jours`} />
            <StatCard icon="calendar-month-outline" label="Prochaines règles" value={formatShortDate(nextPeriod)} />
            <StatCard icon="weather-night" label="Date hijri" value={hijriToday ?? '—'} />
          </View>

          <Text style={styles.sectionTitle}>Mes informations</Text>

          <View style={styles.menuCard}>
            <MenuRow
              icon="account-outline"
              subtitle="Nom, email, date de naissance…"
              title="Informations personnelles"
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="target"
              onPress={() => navigation.navigate('Objective')}
              subtitle={OBJECTIVE_LABELS[objective]}
              title="Mon objectif"
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="heart-pulse"
              subtitle="Poids, taille, groupe sanguin, maladies…"
              title="Santé générale"
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="shield-lock-outline"
              onPress={() => navigation.navigate('SecuritySetup')}
              subtitle="Code, Face ID, mode discret, suppression des données"
              title="Confidentialité & Sécurité"
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="cloud-outline"
              subtitle="Sauvegarde cloud, restauration…"
              title="Sauvegarde"
            />
          </View>

          <View style={styles.spiritualCard}>
            <View style={styles.spiritualHeader}>
              <View style={styles.spiritualIconCircle}>
                <MaterialDesignIcons color={PURPLE} name="mosque" size={23} />
              </View>

              <View style={styles.spiritualCopy}>
                <View style={styles.spiritualTitleRow}>
                  <Text style={styles.spiritualTitle}>Repères spirituels</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      spiritualEnabled ? styles.statusBadgeActive : styles.statusBadgeInactive,
                    ]}>
                    <Text
                      style={[
                        styles.statusBadgeText,
                        spiritualEnabled ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive,
                      ]}>
                      {spiritualEnabled ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.spiritualText}>
                  Gère tes préférences liées aux prières, au jeûne et au calendrier hijri.
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('SpiritualPreferences')}
              style={({pressed}) => [styles.manageButton, pressed && styles.pressed]}>
              <Text style={styles.manageButtonText}>Gérer</Text>
              <MaterialDesignIcons color="#FFFFFF" name="chevron-right" size={17} />
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Plus</Text>

          <View style={styles.menuCard}>
            <MenuRow
              icon="information-outline"
              onPress={showAbout}
              subtitle="Version, mentions et valeurs de l’application"
              title="À propos de AWA"
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="lifebuoy"
              onPress={showSupport}
              subtitle="Questions, signalement, contact"
              title="Aide & support"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={confirmSignOut}
            style={({pressed}) => [styles.signOut, pressed && styles.pressed]}>
            <MaterialDesignIcons color="#B4485A" name="logout" size={19} />
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#F0E3F9'},
  safe: {flex: 1},
  content: {paddingHorizontal: 18},

  header: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  headerCopy: {flex: 1, marginRight: 12},
  headerTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 28, fontWeight: '700'},
  headerSubtitle: {marginTop: 3, color: '#655A8D', fontSize: 13},
  notification: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.16)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,252,255,0.92)',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#DC7B82',
  },

  profileCard: {marginTop: 18, borderRadius: 26, overflow: 'hidden', padding: 16},
  profileCardImage: {borderRadius: 26},
  avatarRow: {flexDirection: 'row', alignItems: 'center'},
  avatarWrap: {width: 74, height: 74},
  avatar: {width: 74, height: 74, borderRadius: 37, borderWidth: 2, borderColor: '#FFFFFF'},
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 13,
    backgroundColor: PURPLE,
  },
  identity: {flex: 1, marginLeft: 14, minWidth: 0},
  nameRow: {flexDirection: 'row', alignItems: 'center', gap: 7},
  name: {flexShrink: 1, color: PURPLE_DARK, fontFamily: 'serif', fontSize: 20, fontWeight: '700'},
  meta: {marginTop: 3, color: '#5B5177', fontSize: 12, lineHeight: 16},
  spiritualPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  spiritualPillActive: {backgroundColor: PURPLE},
  spiritualPillInactive: {backgroundColor: 'rgba(105,73,190,0.14)'},
  spiritualPillText: {fontSize: 10.5, fontWeight: '700'},
  spiritualPillTextActive: {color: '#FFFFFF'},
  spiritualPillTextInactive: {color: PURPLE},

  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16},
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#F0E8FC',
  },
  statValue: {marginTop: 9, color: PURPLE_DARK, fontSize: 15, fontWeight: '700'},
  statLabel: {marginTop: 1, color: '#8479A0', fontSize: 11},

  sectionTitle: {marginTop: 22, marginBottom: 9, color: PURPLE_DARK, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},

  menuCard: {
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 22,
    backgroundColor: 'rgba(255,252,255,0.92)',
    paddingHorizontal: 6,
  },
  menuRow: {minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8},
  menuDivider: {height: StyleSheet.hairlineWidth, marginHorizontal: 8, backgroundColor: 'rgba(111,83,190,0.14)'},
  menuIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F0E8FC',
  },
  menuCopy: {flex: 1, minWidth: 0, marginHorizontal: 11},
  menuTitle: {color: '#2A2050', fontSize: 14.5, fontWeight: '700'},
  menuSubtitle: {marginTop: 2, color: '#8479A0', fontSize: 11.5},

  spiritualCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.18)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,252,255,0.92)',
    padding: 14,
  },
  spiritualHeader: {flexDirection: 'row', alignItems: 'flex-start'},
  spiritualIconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#EEE3FA',
  },
  spiritualCopy: {flex: 1, marginLeft: 12, minWidth: 0},
  spiritualTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  spiritualTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  statusBadge: {borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3},
  statusBadgeActive: {backgroundColor: '#E4F3E7'},
  statusBadgeInactive: {backgroundColor: 'rgba(111,83,190,0.14)'},
  statusBadgeText: {fontSize: 10.5, fontWeight: '700'},
  statusBadgeTextActive: {color: '#3E8E56'},
  statusBadgeTextInactive: {color: '#756A90'},
  spiritualText: {marginTop: 5, color: '#756A90', fontSize: 11.5, lineHeight: 16},
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 13,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: PURPLE,
  },
  manageButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},

  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    minHeight: 52,
    borderWidth: 1,
    borderColor: 'rgba(180,72,90,0.28)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,255,0.9)',
  },
  signOutText: {color: '#B4485A', fontSize: 15, fontWeight: '700'},

  pressed: {opacity: 0.82, transform: [{scale: 0.99}]},
});

export default ProfileScreen;
