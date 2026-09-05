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

const ID = 'lhtests-comprendre-tests-ovulation';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const BODY = '#4A444B';
const MUTED = '#777078';
const GREEN = '#789276';

const HERO = require('../../assets/images/library/spm-consult.png');

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

const TESTING_TIPS = [
  {
    icon: 'calendar-range',
    title: 'Se baser sur ton cycle',
    text: 'Commence quelques jours avant la date d’ovulation estimée par la longueur moyenne de tes cycles.',
  },
  {
    icon: 'clock-outline',
    title: 'Tester à heure fixe',
    text: 'Idéalement en milieu de journée, en évitant la première urine du matin.',
  },
  {
    icon: 'cup-water',
    title: 'Éviter de trop diluer',
    text: 'Limite les grandes quantités de boisson dans les heures qui précèdent le test.',
  },
] as const;

const LIMITATIONS = [
  'Le SOPK peut donner des taux de LH naturellement plus élevés, brouillant la lecture',
  'Certains traitements de fertilité peuvent influencer le résultat',
  'Une urine très diluée peut donner un faux négatif',
  'Un test de moins bonne qualité peut être moins fiable',
] as const;

const SUMMARY_POINTS = [
  'Les tests d’ovulation détectent le pic de l’hormone LH, qui déclenche la libération de l’ovule 24 à 36 heures après.',
  'Il est conseillé de commencer les tests quelques jours avant la date d’ovulation estimée par ton cycle.',
  'Un résultat positif signale le moment le plus fertile pour les rapports dans les 1 à 2 jours qui suivent.',
  'Un pic de LH ne garantit pas à lui seul que l’ovulation a effectivement eu lieu.',
] as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function LhTestsArticleScreen({
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
        message: 'Comprendre les tests d’ovulation (LH) — AWA',
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
            <Text style={styles.badgeText}>FERTILITÉ • TESTS D’OVULATION</Text>
          </View>

          <Text style={styles.title}>
            Comprendre les tests{`\n`}d’ovulation (LH)
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
            Comment fonctionnent ces bandelettes, et quand les utiliser.
          </Text>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Qu’est-ce que la LH ?',
              'Comment fonctionnent ces tests',
              'Quand commencer à tester',
              'Interpréter un résultat',
              'Faux positifs et limites',
              'Les combiner à d’autres signes',
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

          <Text style={styles.h2}>1. Qu’est-ce que la LH ?</Text>

          <Text style={styles.body}>
            La LH (hormone lutéinisante) est produite par le cerveau et
            pilote le fonctionnement des ovaires. Les tests d’ovulation
            détectent le pic de cette hormone, qui déclenche la libération
            de l’ovule 24 à 36 heures après.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. Comment fonctionnent ces tests</Text>

          <Text style={styles.body}>
            Une bandelette urinaire mesure le taux de LH : une ligne test
            aussi foncée ou plus foncée que la ligne de contrôle indique un
            pic.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. Quand commencer à tester</Text>

          <Text style={styles.body}>
            Il est conseillé de commencer les tests quelques jours avant la
            date d’ovulation estimée par ton cycle.
          </Text>

          <View style={styles.comfortCard}>
            {TESTING_TIPS.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < TESTING_TIPS.length - 1 && styles.comfortRowBorder,
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
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. Interpréter un résultat</Text>

          <Text style={styles.body}>
            Un résultat positif signale le moment le plus fertile pour les
            rapports dans les 1 à 2 jours qui suivent. Un résultat négatif
            signifie simplement que le pic n’a pas encore eu lieu.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. Faux positifs et limites</Text>

          <View style={styles.checkList}>
            {LIMITATIONS.map(item => (
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

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={ROSE}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>À garder en tête</Text>
              <Text style={styles.infoText}>
                Un pic de LH indique un signal hormonal déclencheur, mais ne
                garantit pas à lui seul que l’ovule a effectivement été
                libéré.
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
                Associer les tests d’ovulation à ta température basale ou à
                l’observation de ta glaire cervicale donne une image plus
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

  infoCard: {
    marginTop: 13,
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
