import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import {
  getBottomPadding,
  getTopPadding,
  READING_CONTROLS_SPACE,
} from '../../theme/spacing';

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'basaltemp-suivre-temperature';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const BODY = '#4A444B';
const MUTED = '#777078';
const GREEN = '#789276';

const HERO = require('../../assets/images/library/featured-spm.png');

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

const MEASURING_TIPS = [
  {
    icon: 'thermometer',
    title: 'Le même thermomètre',
    text: 'Utilise toujours le même thermomètre, idéalement basal (plus précis au dixième de degré).',
  },
  {
    icon: 'clock-outline',
    title: 'La même heure',
    text: 'Mesure à heure fixe, avant de te lever, après au moins 3 heures de sommeil ininterrompu.',
  },
  {
    icon: 'pencil-outline',
    title: 'Noter aussitôt',
    text: 'Note la valeur immédiatement, avant même de te lever ou de parler.',
  },
] as const;

const DISRUPTING_FACTORS = [
  'Une nuit de sommeil courte ou agitée',
  'Un réveil à une heure inhabituelle',
  'De la fièvre ou une maladie',
  'De l’alcool la veille au soir',
  'Un décalage horaire récent',
] as const;

const CONSULT_SITUATIONS = [
  'Aucune hausse de température ne se dessine sur plusieurs cycles complets',
  'Les températures restent très irrégulières malgré une mesure rigoureuse',
  'Tu as des questions sur ta fertilité que ce suivi seul ne peut pas résoudre',
] as const;

const SUMMARY_POINTS = [
  'La température basale augmente légèrement (0,2 à 0,5 °C) juste après l’ovulation, sous l’effet de la progestérone.',
  'Elle se mesure chaque matin, avant de se lever, toujours à la même heure et avec le même thermomètre.',
  'Ce n’est pas une méthode prédictive mais confirmative : elle t’aide à mieux connaître ton propre cycle.',
  'La combiner à d’autres signes (glaire cervicale, tests d’ovulation) donne une vision plus complète.',
] as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function BasalTemperatureArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (mounted) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBookmark = () => {
    setSaved(toggleBookmark(ID));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Suivre sa température basale — AWA',
      });
    } catch {
      // Partage annulé ou indisponible.
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ScrollView
        ref={scrollRef}
        onScroll={event =>
          saveScrollPosition(ID, event.nativeEvent.contentOffset.y)
        }
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {paddingTop: getTopPadding(insets.top, true)},
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={INK} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? 'Retirer des favoris' : 'Ajouter aux favoris'
                }
                hitSlop={8}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={ROSE}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Partager"
                hitSlop={8}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={ROSE}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FERTILITÉ • TEMPÉRATURE BASALE</Text>
          </View>

          <Text style={styles.title}>
            Suivre sa{`\n`}température basale
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Intermédiaire'],
              ['shield-check-outline', 'Contenu validé'],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? <View style={styles.metaDivider} /> : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={MUTED}
                    size={17}
                  />

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            Une méthode simple pour confirmer, après coup, que l’ovulation a
            bien eu lieu.
          </Text>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Qu’est-ce que la température basale ?',
              'Quand et comment la mesurer',
              'Repérer la hausse après l’ovulation',
              'Ce qui peut fausser une mesure',
              'Les limites de cette méthode',
              'Quand en parler à un professionnel',
              'À retenir',
            ].map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{item}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={ROSE}
                />
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. Qu’est-ce que la température basale ?</Text>

          <Text style={styles.body}>
            La température basale est la température de ton corps au repos
            complet, avant toute activité. Elle varie très légèrement au fil
            du cycle, sous l’influence de tes hormones.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. Quand et comment la mesurer</Text>

          <Text style={styles.body}>
            Elle se mesure chaque matin, avant de te lever, toujours à la
            même heure et avec le même thermomètre.
          </Text>

          <View style={styles.comfortCard}>
            {MEASURING_TIPS.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < MEASURING_TIPS.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={19}
                    color={ROSE}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <Text style={styles.comfortTitle}>{item.title}</Text>
                  <Text style={styles.comfortText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. Repérer la hausse après l’ovulation</Text>

          <Text style={styles.body}>
            La température basale augmente légèrement (0,2 à 0,5 °C) juste
            après l’ovulation, sous l’effet de la progestérone, et reste plus
            haute jusqu’aux règles suivantes.
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="chart-line"
              size={23}
              color={ROSE}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>À quoi ressemble la courbe</Text>
              <Text style={styles.infoText}>
                Plus basse en première partie de cycle, elle monte d’un cran
                après l’ovulation et s’y maintient — un profil qui ne devient
                lisible qu’après plusieurs jours de relevés.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. Ce qui peut fausser une mesure</Text>

          <View style={styles.checkList}>
            {DISRUPTING_FACTORS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={ROSE}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. Les limites de cette méthode</Text>

          <Text style={styles.body}>
            Ce n’est pas une méthode prédictive mais confirmative : elle
            t’aide à mieux connaître ton propre cycle, une fois l’ovulation
            déjà passée — pas à l’anticiper.
          </Text>

          <Text style={styles.caption}>
            La observer seule sur un ou deux cycles ne suffit généralement
            pas : le profil se dessine avec la répétition.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>6. Quand en parler à un professionnel</Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="calendar-account-outline"
                size={22}
                color={ROSE}
              />

              <Text style={[styles.warningTitle, styles.warningTitleNeutral]}>
                Bon à évoquer avec un professionnel
              </Text>
            </View>

            {CONSULT_SITUATIONS.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="check"
                    size={16}
                    color={GREEN}
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Associer la température basale à l’observation de ta glaire
                cervicale ou à des tests d’ovulation donne une image plus
                complète de ton cycle.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>À retenir</Text>

          <View style={styles.summaryCard}>
            {SUMMARY_POINTS.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={GREEN}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color="#8A8190"
            />

            <Text style={styles.disclaimerText}>
              Contenu informatif. Cet article ne remplace pas un avis
              médical personnalisé. En cas de doute, demande conseil à un
              professionnel de santé.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: CREAM},
  scroll: {paddingBottom: 30},

  heroWrap: {height: 245, backgroundColor: '#EFE3D5'},
  hero: {width: '100%', height: '100%'},

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {flexDirection: 'row', gap: 8},
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  pressed: {opacity: 0.74},

  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: CREAM,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F3DFE5',
  },
  badgeText: {
    fontSize: 10,
    color: ROSE,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: INK,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: '#DDD5DA'},
  meta: {fontSize: 9.5, color: MUTED},

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: BODY,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EBDDE2',
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: INK, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25, color: ROSE, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: INK},

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: INK,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: BODY},
  caption: {marginTop: 10, fontSize: 11, lineHeight: 16, color: MUTED, fontStyle: 'italic'},

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F8EEF1',
    borderWidth: 1,
    borderColor: '#F0DDE3',
  },
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: INK, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: '#585057'},

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: '#EEE6E0'},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },
  comfortCopy: {flex: 1, marginLeft: 10},
  comfortTitle: {fontSize: 12.5, color: INK, fontWeight: '800'},
  comfortText: {marginTop: 3, fontSize: 10.8, lineHeight: 16, color: '#585057'},

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6},
  checkText: {flex: 1, color: BODY, fontSize: 12.5, lineHeight: 17},

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FCF5F3',
    borderWidth: 1,
    borderColor: '#F1DFDB',
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: '#59464A', fontWeight: '800'},
  warningTitleNeutral: {color: INK},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 5, color: BODY, fontSize: 11.5, lineHeight: 17},

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F5EBEF',
    borderWidth: 1,
    borderColor: '#EEDDE3',
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: INK, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: '#585057'},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EBDDE2',
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: BODY},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: '#8A8190'},
});
