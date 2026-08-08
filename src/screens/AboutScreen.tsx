import React, {useState} from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {APP_METADATA} from '../utils/appMetadata';

const PURPLE = '#6D4AE8';
const DARK = '#2F2258';
const MUTED = '#746D92';

const LOGO = require('../assets/images/hawa-logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

type AboutRowProps = {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
};

function AboutRow({
  icon,
  label,
  value,
  onPress,
  last,
}: AboutRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${label}, ${value}`}
      disabled={!onPress}
      onPress={onPress}
      style={({pressed}) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && styles.pressed,
      ]}>
      <View style={styles.rowIcon}>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon}
          size={20}
        />
      </View>

      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>

      {onPress ? (
        <MaterialDesignIcons
          color="#B5ACC5"
          name="chevron-right"
          size={23}
        />
      ) : null}
    </Pressable>
  );
}

type ValueBlockProps = {
  icon: IconName;
  title: string;
  text: string;
};

function ValueBlock({
  icon,
  title,
  text,
}: ValueBlockProps) {
  return (
    <View style={styles.valueBlock}>
      <View style={styles.valueIcon}>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon}
          size={25}
        />
      </View>

      <View style={styles.valueCopy}>
        <Text style={styles.valueTitle}>{title}</Text>
        <Text style={styles.valueText}>{text}</Text>
      </View>
    </View>
  );
}

export default function AboutScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const compact = width < 360 || height < 700;

  const [modal, setModal] = useState<
    'version' | 'team' | null
  >(null);

  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);

    setTimeout(() => {
      setToast('');
    }, 2300);
  };

  const openLink = async (
    type: 'website' | 'email',
  ) => {
    const target =
      type === 'website'
        ? APP_METADATA.websiteUrl
        : APP_METADATA.contactEmail
          ? `mailto:${APP_METADATA.contactEmail}`
          : undefined;

    if (!target) {
      showToast(
        type === 'website'
          ? 'Lien indisponible pour le moment.'
          : 'Adresse e-mail non configurée.',
      );
      return;
    }

    try {
      if (await Linking.canOpenURL(target)) {
        await Linking.openURL(target);
      } else {
        showToast(
          type === 'website'
            ? 'Lien indisponible pour le moment.'
            : 'Impossible d’ouvrir l’application e-mail.',
        );
      }
    } catch {
      showToast('Impossible d’ouvrir ce lien.');
    }
  };

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={styles.safe}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          {
            paddingTop:
              Math.max(insets.top, 18) + 8,
            paddingBottom:
              Math.max(insets.bottom, 18) + 25,
          },
        ]}
        showsVerticalScrollIndicator={false}>

        {/* HEADER */}

        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.header}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={navigation.goBack}
            style={({pressed}) => [
              styles.back,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={PURPLE}
              name="chevron-left"
              size={28}
            />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.title}>
              À propos de AWA
            </Text>

            <Text style={styles.subtitle}>
              En savoir plus sur ton application 💜
            </Text>
          </View>

          <View style={styles.decor}>
            <MaterialDesignIcons
              color="#B998F0"
              name="leaf"
              size={45}
            />

            <MaterialDesignIcons
              color="#9D76E8"
              name="star-four-points"
              size={11}
            />
          </View>
        </Animated.View>

        {/* AWA IDENTITY */}

        <Animated.View
          entering={FadeInUp.delay(70).duration(420)}
          style={styles.identity}>

          <View style={styles.logoWrap}>
            <Image
              accessibilityLabel="Logo AWA"
              resizeMode="contain"
              source={LOGO}
              style={styles.logo}
            />
          </View>

          <View style={styles.identityCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.appName}>
                AWA
              </Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  Version {APP_METADATA.version}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>
              AWA t’accompagne chaque jour pour
              comprendre ton corps, suivre ton cycle
              et prendre soin de toi en toute
              sérénité.
            </Text>
          </View>
        </Animated.View>

        {/* APPLICATION INFORMATION */}

        <Text style={styles.sectionTitle}>
          Informations de l’application
        </Text>

        <Animated.View
          entering={FadeInUp.delay(130).duration(420)}
          style={styles.card}>
          <AboutRow
            icon="cellphone"
            label="Version"
            value={`${APP_METADATA.version} (${APP_METADATA.buildNumber})`}
            onPress={() => setModal('version')}
          />

          <AboutRow
            icon="calendar-month-outline"
            label="Date de publication"
            value={
              APP_METADATA.publicationDate ??
              'Non renseignée'
            }
          />

          <AboutRow
            icon="shield-outline"
            label="Conçue avec"
            value="💜 par l’équipe AWA"
            onPress={() => setModal('team')}
          />

          <AboutRow
            icon="web"
            label="Site web"
            value={
              APP_METADATA.websiteUrl ??
              'Non configuré'
            }
            onPress={() => openLink('website')}
          />

          <AboutRow
            icon="email-outline"
            label="E-mail"
            value={
              APP_METADATA.contactEmail ??
              'Non configurée'
            }
            onPress={() => openLink('email')}
            last
          />
        </Animated.View>

        {/* ABOUT */}

        <Text style={styles.sectionTitle}>
          À propos
        </Text>

        <Animated.View
          entering={FadeInUp.delay(190).duration(420)}
          style={styles.card}>
          <ValueBlock
            icon="hand-heart-outline"
            title="Notre mission"
            text="Aider chaque femme à mieux comprendre son corps, son cycle et sa santé pour vivre en harmonie avec elle-même."
          />

          <ValueBlock
            icon="lock-outline"
            title="Ta confidentialité"
            text="Ta vie privée est notre priorité absolue. Toutes tes données restent protégées dans l’application."
          />

          <ValueBlock
            icon="leaf"
            title="Nos valeurs"
            text="Bienveillance, respect, confidentialité et empowerment féminin sont au cœur de tout ce que nous faisons."
          />
        </Animated.View>

        {/* LEGAL */}

        <Text style={styles.sectionTitle}>
          Mentions légales
        </Text>

        <Animated.View
          entering={FadeInUp.delay(250).duration(420)}
          style={styles.card}>
          <AboutRow
            icon="file-document-outline"
            label="Conditions d’utilisation"
            value="Consulter le document"
            onPress={() =>
              navigation.navigate('TermsOfUse')
            }
          />

          <AboutRow
            icon="shield-lock-outline"
            label="Politique de confidentialité"
            value="Consulter le document"
            onPress={() =>
              navigation.navigate(
                'PrivacyPolicy',
              )
            }
            last
          />
        </Animated.View>

        {/* COMMUNITY */}

        <LinearGradient
          colors={['#F4ECFF', '#EEE1FF']}
          style={styles.community}>
          <MaterialDesignIcons
            color="#A17CE9"
            name="leaf"
            size={34}
          />

          <View style={styles.communityCopy}>
            <Text style={styles.communityTitle}>
              Merci de faire partie de la communauté
              AWA 💜
            </Text>

            <Text style={styles.communityText}>
              Ensemble, prenons soin de nous.
            </Text>
          </View>

          <MaterialDesignIcons
            color="#C1A2F0"
            name="star-four-points"
            size={14}
          />
        </LinearGradient>
      </ScrollView>

      {/* MODAL */}

      <Modal
        animationType="fade"
        onRequestClose={() => setModal(null)}
        statusBarTranslucent
        transparent
        visible={modal !== null}>
        <View style={styles.modalRoot}>
          <Pressable
            onPress={() => setModal(null)}
            style={styles.backdrop}
          />

          <Animated.View
            entering={FadeInUp.springify()}
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(
                  insets.bottom,
                  18,
                ),
              },
            ]}>
            <View style={styles.handle} />

            <MaterialDesignIcons
              color={PURPLE}
              name={
                modal === 'version'
                  ? 'information-outline'
                  : 'heart-outline'
              }
              size={32}
              style={styles.modalIcon}
            />

            <Text style={styles.sheetTitle}>
              {modal === 'version'
                ? 'AWA'
                : 'L’équipe AWA'}
            </Text>

            {modal === 'version' ? (
              <>
                <Text style={styles.sheetText}>
                  Version {APP_METADATA.version}
                </Text>

                <Text style={styles.sheetText}>
                  Build {APP_METADATA.buildNumber}
                </Text>
              </>
            ) : (
              <Text style={styles.teamText}>
                Nous concevons AWA avec
                bienveillance, respect et
                confidentialité.
              </Text>
            )}

            <Pressable
              onPress={() => setModal(null)}
              style={styles.done}>
              <Text style={styles.doneText}>
                Fermer
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* TOAST */}

      {toast ? (
        <Animated.View
          entering={FadeInUp.springify()}
          style={[
            styles.toast,
            {
              bottom:
                Math.max(insets.bottom, 18) +
                12,
            },
          ]}>
          <MaterialDesignIcons
            color="#FFF"
            name="information-outline"
            size={17}
          />

          <Text style={styles.toastText}>
            {toast}
          </Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FCFAFF',
  },

  content: {
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 16,
  },

  contentCompact: {
    paddingHorizontal: 11,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#FFF',
    padding: 9,
    elevation: 2,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
  },

  title: {
    color: DARK,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 3,
    color: MUTED,
    fontSize: 11.5,
  },

  decor: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* IDENTITY CARD */

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE7F5',
    borderRadius: 26,
    backgroundColor: '#FFF',
    padding: 16,

    elevation: 2,

    shadowColor: PURPLE,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  /*
   * IMPORTANT:
   * Background made darker so the gold AWA logo
   * becomes much more visible.
   */
  logoWrap: {
    flexBasis: '27%',
    aspectRatio: 1,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 22,

    backgroundColor: '#79219c',

    borderWidth: 1,
    borderColor: '#AD7FF5',

    padding: 7,

    elevation: 3,

    shadowColor: '#6D4AE8',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  identityCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  appName: {
    color: DARK,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },

  badge: {
    borderRadius: 12,
    backgroundColor: '#F0E5FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  badgeText: {
    color: PURPLE,
    fontSize: 9.5,
    fontWeight: '700',
  },

  description: {
    marginTop: 7,
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },

  /* SECTIONS */

  sectionTitle: {
    marginTop: 2,
    color: DARK,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
  },

  card: {
    overflow: 'hidden',

    borderWidth: 1,
    borderColor: '#EEE7F5',

    borderRadius: 24,

    backgroundColor: '#FFF',

    paddingHorizontal: 12,
  },

  /* ROW */

  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  rowBorder: {
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE8F3',
  },

  rowIcon: {
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: '#F2EBFF',

    padding: 9,
  },

  rowCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  rowLabel: {
    color: MUTED,
    fontSize: 10.5,
  },

  rowValue: {
    marginTop: 2,
    color: DARK,
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* ABOUT VALUE BLOCK */

  valueBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
  },

  valueIcon: {
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 999,

    backgroundColor: '#F2EBFF',

    padding: 12,
  },

  valueCopy: {
    flex: 1,
    marginLeft: 13,
  },

  valueTitle: {
    color: DARK,
    fontSize: 13.5,
    fontWeight: '700',
  },

  valueText: {
    marginTop: 4,
    color: MUTED,
    fontSize: 11.5,
    lineHeight: 17,
  },

  /* COMMUNITY */

  community: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 22,

    padding: 16,
  },

  communityCopy: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 7,
  },

  communityTitle: {
    color: PURPLE,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  communityText: {
    marginTop: 5,
    color: MUTED,
    fontSize: 11,
    textAlign: 'center',
  },

  /* PRESS */

  pressed: {
    opacity: 0.78,
    transform: [{scale: 0.985}],
  },

  /* MODAL */

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35,21,72,.38)',
  },

  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    backgroundColor: '#FFF',

    paddingHorizontal: 20,
    paddingTop: 10,
  },

  handle: {
    alignSelf: 'center',

    width: '14%',
    aspectRatio: 8,

    borderRadius: 999,

    backgroundColor: '#DDD3EA',
  },

  modalIcon: {
    alignSelf: 'center',
    marginTop: 18,
  },

  sheetTitle: {
    marginTop: 8,

    color: DARK,

    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',

    textAlign: 'center',
  },

  sheetText: {
    marginTop: 7,

    color: MUTED,

    fontSize: 13,

    textAlign: 'center',
  },

  teamText: {
    marginTop: 9,

    color: MUTED,

    fontSize: 13,
    lineHeight: 19,

    textAlign: 'center',
  },

  done: {
    alignItems: 'center',

    marginTop: 18,

    borderRadius: 18,

    backgroundColor: PURPLE,

    padding: 14,
  },

  doneText: {
    color: '#FFF',

    fontSize: 14,
    fontWeight: '700',
  },

  /* TOAST */

  toast: {
    position: 'absolute',

    left: '10%',
    right: '10%',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,

    borderRadius: 18,

    backgroundColor: PURPLE,

    padding: 13,

    elevation: 8,
  },

  toastText: {
    flex: 1,

    color: '#FFF',

    fontSize: 11.5,
    fontWeight: '600',
  },
});