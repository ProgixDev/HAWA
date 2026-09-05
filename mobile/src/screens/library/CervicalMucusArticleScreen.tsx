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

const ID = 'cervicalmucus-observer-glaire';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const BODY = '#4A444B';
const MUTED = '#777078';
const GREEN = '#789276';

const HERO = require('../../assets/images/library/flow-texture-mucus.png');

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

const CYCLE_EVOLUTION = [
  {
    icon: 'circle-outline',
    title: 'Après les règles',
    text: 'Peu de glaire, souvent une sensation de sécheresse.',
  },
  {
    icon: 'weather-cloudy',
    title: 'Avant l’ovulation',
    text: 'Plus abondante, trouble et collante.',
  },
  {
    icon: 'egg-outline',
    title: 'À l’approche de l’ovulation',
    text: 'Claire, filante et élastique, semblable à du blanc d’œuf.',
  },
  {
    icon: 'moon-waning-crescent',
    title: 'Après l’ovulation',
    text: 'Plus épaisse, opaque, ou beaucoup moins présente.',
  },
] as const;

const FERTILE_SIGNS = [
  'Claire ou transparente',
  'Filante, elle s’étire entre deux doigts',
  'Élastique, semblable à du blanc d’œuf cru',
  'Abondante par rapport aux autres jours',
] as const;

const MODIFYING_FACTORS = [
  'Des rapports récents',
  'Des produits d’hygiène intime',
  'Une contraception hormonale ou certains traitements',
  'Une infection ou un déséquilibre local',
] as const;

const SUMMARY_POINTS = [
  'La glaire cervicale change de texture au fil du cycle sous l’effet des œstrogènes et de la progestérone.',
  'À l’approche de l’ovulation, elle devient claire, filante et élastique, semblable à du blanc d’œuf.',
  'Observer ce changement chaque jour, en complément d’autres signes, aide à mieux cerner ta fenêtre fertile.',
  'Reconnaître son propre profil demande de la pratique et plusieurs cycles d’observation.',
] as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function CervicalMucusArticleScreen({
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
        message: 'Observer sa glaire cervicale — AWA',
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
            <Text style={styles.badgeText}>FERTILITÉ • GLAIRE CERVICALE</Text>
          </View>

          <Text style={styles.title}>
            Observer sa{`\n`}glaire cervicale
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '5 min de lecture'],
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
            Un signal naturel et gratuit pour repérer ta période fertile.
          </Text>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Qu’est-ce que la glaire cervicale ?',
              'Comment elle évolue au fil du cycle',
              'Reconnaître une glaire fertile',
              'Comment l’observer au quotidien',
              'Ce qui peut modifier tes observations',
              'Les limites de cette méthode',
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

          <Text style={styles.h2}>1. Qu’est-ce que la glaire cervicale ?</Text>

          <Text style={styles.body}>
            C’est une sécrétion naturelle produite par le col de l’utérus.
            La glaire cervicale change de texture au fil du cycle sous
            l’effet des œstrogènes et de la progestérone.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. Comment elle évolue au fil du cycle</Text>

          <View style={styles.normalGrid}>
            {CYCLE_EVOLUTION.map(item => (
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

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. Reconnaître une glaire fertile</Text>

          <Text style={styles.body}>
            À l’approche de l’ovulation, elle devient :
          </Text>

          <View style={styles.checkList}>
            {FERTILE_SIGNS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={16}
                  color={GREEN}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. Comment l’observer au quotidien</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="eye-outline"
              size={23}
              color={ROSE}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Un geste simple, chaque jour</Text>
              <Text style={styles.infoText}>
                Observe l’aspect et la texture avec du papier toilette ou des
                doigts propres, à peu près au même moment de la journée, et
                note ce que tu remarques.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. Ce qui peut modifier tes observations</Text>

          <View style={styles.checkList}>
            {MODIFYING_FACTORS.map(item => (
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
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>6. Les limites de cette méthode</Text>

          <Text style={styles.body}>
            Chaque personne a un profil différent, et reconnaître le sien
            demande de la pratique sur plusieurs cycles. Observer ce
            changement chaque jour, en complément d’autres signes, aide à
            mieux cerner ta fenêtre fertile — sans jamais remplacer un avis
            médical en cas d’inquiétude.
          </Text>

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
                Associer la glaire cervicale à ta température basale ou à des
                tests d’ovulation donne une image plus complète de ton cycle.
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

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
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
