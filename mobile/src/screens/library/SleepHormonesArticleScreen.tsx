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

const ID = 'sleep-sommeil-et-cycle';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const BODY = '#4A444B';
const MUTED = '#777078';
const GREEN = '#789276';

const HERO = require('../../assets/images/library/spm-sleep.png');

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

const PHASE_SLEEP = [
  {
    icon: 'water-outline',
    title: 'Pendant les règles',
    text: 'L’inconfort physique et la fatigue peuvent rendre le sommeil plus léger.',
  },
  {
    icon: 'egg-outline',
    title: 'Autour de l’ovulation',
    text: 'Le sommeil est généralement plus stable pour la plupart des personnes.',
  },
  {
    icon: 'weather-night',
    title: 'Avant les règles',
    text: 'La baisse de progestérone peut rendre le sommeil plus léger, avec des réveils possibles.',
  },
] as const;

const EVENING_ROUTINE = [
  {
    icon: 'clock-outline',
    title: 'Des horaires réguliers',
    text: 'Se coucher et se lever à des heures stables aide à réguler l’horloge interne.',
  },
  {
    icon: 'cellphone-off',
    title: 'Moins d’écrans le soir',
    text: 'La lumière bleue peut retarder l’endormissement ; une pause écran aide à s’apaiser.',
  },
  {
    icon: 'snowflake',
    title: 'Une chambre fraîche',
    text: 'Une température modérée facilite l’endormissement, à tout âge.',
  },
] as const;

const CONSULT_SIGNS = [
  'Les troubles du sommeil durent depuis plusieurs semaines',
  'La fatigue impacte fortement le quotidien',
  'L’insomnie persiste malgré de bonnes habitudes',
] as const;

const SUMMARY_POINTS = [
  'La progestérone a un léger effet sédatif ; sa baisse en fin de cycle peut perturber le sommeil.',
  'À la ménopause, les bouffées de chaleur nocturnes sont une cause fréquente de réveils.',
  'Une routine du coucher stable et une chambre fraîche aident à limiter ces perturbations, à tout âge.',
  'Des troubles du sommeil qui persistent méritent d’être évoqués avec un professionnel de santé.',
] as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function SleepHormonesArticleScreen({
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
        message: 'Sommeil et hormones : le lien méconnu — AWA',
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
            <Text style={styles.badgeText}>CYCLE MENSTRUEL • SOMMEIL</Text>
          </View>

          <Text style={styles.title}>
            Sommeil et hormones :{`\n`}le lien méconnu
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
              ['book-open-page-variant-outline', 'Article'],
              ['chart-bar', 'Débutant'],
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
            Pourquoi ton sommeil varie selon la phase du cycle, et à la
            ménopause.
          </Text>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Pourquoi les hormones influencent le sommeil',
              'Le sommeil selon les phases du cycle',
              'Stress et qualité du sommeil',
              'Une routine du soir apaisante',
              'Quand consulter',
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

          <Text style={styles.h2}>1. Pourquoi les hormones influencent le sommeil</Text>

          <Text style={styles.body}>
            La progestérone a un léger effet sédatif ; sa baisse en fin de
            cycle peut perturber le sommeil, en le rendant plus léger ou plus
            fragmenté.
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={ROSE}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Bon à savoir</Text>
              <Text style={styles.infoText}>
                La légère hausse de température corporelle après l’ovulation
                peut aussi rendre l’endormissement un peu plus difficile pour
                certaines personnes.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. Le sommeil selon les phases du cycle</Text>

          <View style={styles.normalGrid}>
            {PHASE_SLEEP.map(item => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={20}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            À la ménopause, les bouffées de chaleur nocturnes sont une cause
            fréquente de réveils, pour des raisons hormonales similaires.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. Stress et qualité du sommeil</Text>

          <Text style={styles.body}>
            Le stress peut amplifier les perturbations du sommeil pendant les
            phases déjà plus sensibles du cycle. Des techniques de relaxation
            simples (respiration, étirements doux) peuvent aider à s’apaiser
            avant le coucher.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. Une routine du soir apaisante</Text>

          <Text style={styles.body}>
            Une routine du coucher stable et une chambre fraîche aident à
            limiter ces perturbations, à tout âge.
          </Text>

          <View style={styles.comfortCard}>
            {EVENING_ROUTINE.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < EVENING_ROUTINE.length - 1 && styles.comfortRowBorder,
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
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. Quand consulter</Text>

          <Text style={styles.body}>
            De bonnes habitudes ne suffisent pas toujours. Il peut être utile
            d’en parler à un professionnel si :
          </Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color="#B76568"
              />

              <Text style={styles.warningTitle}>Signes qui méritent un avis</Text>
            </View>

            {CONSULT_SIGNS.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color="#B76568"
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="stethoscope"
              size={23}
              color={ROSE}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Se préparer à ce rendez-vous</Text>
              <Text style={styles.infoText}>
                Noter depuis quand les troubles durent et ce qui semble les
                influencer peut aider ton professionnel de santé à mieux
                t’orienter.
              </Text>
            </View>
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
                Ces variations de sommeil sont fréquentes et généralement
                temporaires : elles ne signifient pas qu’il y a un problème.
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

  normalGrid: {marginTop: 13, gap: 9},
  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },
  normalTitle: {marginTop: 8, fontSize: 12.5, color: INK, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: '#585057'},

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
