import React, {useEffect, useMemo, useRef, useState} from 'react';
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
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'lochia-comprendre-lochies';

const HERO = require('../../assets/images/library/featured-pain.png');

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

const EVOLUTION = [
  {
    number: '01',
    icon: 'numeric-1-circle-outline',
    label: 'Rouge vif',
    period: 'Les premiers jours',
    text: 'Les pertes sont généralement rouges et peuvent être plus abondantes au début.',
  },
  {
    number: '02',
    icon: 'numeric-2-circle-outline',
    label: 'Rosé / brunâtre',
    period: 'Après quelques jours',
    text: 'La couleur devient progressivement plus claire et peut tirer vers le rose ou le brun.',
  },
  {
    number: '03',
    icon: 'numeric-3-circle-outline',
    label: 'Blanc-jaunâtre',
    period: 'Au fil des semaines',
    text: 'Les pertes deviennent généralement plus claires, jaunâtres ou blanchâtres avant de diminuer.',
  },
] as const;

const NORMAL_POINTS = [
  {
    icon: 'water-outline',
    title: 'Une quantité variable',
    text: 'L’abondance peut changer au cours des premiers jours puis diminuer progressivement.',
  },
  {
    icon: 'palette-outline',
    title: 'Une couleur qui évolue',
    text: 'Les lochies passent généralement du rouge vers des teintes plus claires au fil du temps.',
  },
  {
    icon: 'clock-outline',
    title: 'Une durée variable',
    text: 'Elles peuvent persister plusieurs semaines et leur évolution diffère selon chaque personne.',
  },
] as const;

const COMFORT_TIPS = [
  {
    icon: 'hand-wash-outline',
    title: 'Hygiène douce',
    text: 'Privilégie une toilette douce et régulière sans produits irritants.',
  },
  {
    icon: 'calendar-check-outline',
    title: 'Observe l’évolution',
    text: 'Tu peux noter la couleur, la quantité et l’évolution des pertes si cela t’aide à suivre ton rétablissement.',
  },
  {
    icon: 'sleep-outline',
    title: 'Accorde-toi du repos',
    text: 'La période post-partum demande du temps. Écoute ton corps et respecte tes besoins de récupération.',
  },
] as const;

const WARNING_SIGNS = [
  'Une odeur forte ou inhabituelle',
  'De la fièvre ou un état général qui se dégrade',
  'Un flux qui devient soudainement beaucoup plus abondant',
  'Des douleurs importantes, persistantes ou inhabituelles',
  'Un symptôme nouveau qui t’inquiète',
] as const;

const SUMMARY_POINTS = [
  'Les lochies sont des pertes normales après l’accouchement.',
  'Elles évoluent généralement en couleur et en quantité au fil des semaines.',
  'Leur durée et leur évolution peuvent varier selon chaque personne.',
  'Une odeur inhabituelle, de la fièvre, des douleurs importantes ou un saignement soudainement très abondant nécessitent un avis médical.',
] as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function LochiaArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  /* ------------------------------------------------------------------------ */
  /* BOOKMARK                                                                 */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* SHARE                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Comprendre les lochies après la naissance — AWA',
      });
    } catch {
      // Partage annulé ou indisponible.
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      <ScrollView
        ref={scrollRef}
        onScroll={event =>
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
        ]}
      >

        {/* ================================================================== */}
        {/* HERO                                                               */}
        {/* ================================================================== */}

        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(
                  insets.top,
                  true,
                ),
              },
            ]}
          >

            {/* BACK */}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}
            >
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            {/* ACTIONS */}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved
                    ? 'Retirer des favoris'
                    : 'Ajouter aux favoris'
                }
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Partager"
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

          </View>
        </View>

        {/* ================================================================== */}
        {/* ARTICLE                                                            */}
        {/* ================================================================== */}

        <View style={styles.article}>

          {/* ---------------------------------------------------------------- */}
          {/* BADGE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              POST-PARTUM • LOCHIES
            </Text>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* TITLE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.title}>
            Comprendre les lochies
            après {`\n`}la naissance
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* METADATA                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Débutant'],
              ['shield-check-outline', 'Contenu informatif'],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* INTRO                                                            */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.intro}>
            Après l’accouchement, les lochies correspondent aux
            pertes vaginales liées au processus naturel de
            récupération de l’utérus. Leur couleur et leur quantité
            évoluent progressivement au fil des jours et des semaines.
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {[
              'Que sont les lochies ?',
              'Comment évoluent-elles ?',
              'Ce qui peut être normal',
              'Conseils de confort',
              'Quand consulter ?',
              'À retenir',
            ].map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}
              >
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            1. Que sont les lochies ?
          </Text>

          <Text style={styles.body}>
            Les lochies sont des pertes vaginales qui apparaissent
            après l’accouchement. Elles correspondent notamment à
            l’élimination progressive de sang, de sécrétions et de
            tissus provenant de l’utérus pendant sa récupération.
          </Text>

          <Text style={styles.body}>
            Elles sont différentes des règles habituelles. Leur
            présence est attendue pendant la période post-partum
            et elles diminuent généralement progressivement.
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                À retenir
              </Text>

              <Text style={styles.infoText}>
                Les lochies ne signifient pas que les règles ont
                déjà repris. Le retour des règles est un phénomène
                différent qui survient plus tard.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            2. Comment évoluent les lochies ?
          </Text>

          <Text style={styles.body}>
            Leur aspect change généralement au cours des premières
            semaines. La couleur devient progressivement plus claire
            et la quantité tend à diminuer.
          </Text>

          {/* EVOLUTION TIMELINE */}

          <View style={styles.evolutionCard}>

            <View style={styles.evolutionHeader}>
              <View style={styles.evolutionHeaderIcon}>
                <MaterialDesignIcons
                  name="timeline-clock-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.evolutionHeaderCopy}>
                <Text style={styles.evolutionTitle}>
                  Une évolution progressive
                </Text>

                <Text style={styles.evolutionSubtitle}>
                  Les étapes peuvent varier selon chaque personne
                </Text>
              </View>
            </View>

            <View style={styles.timeline}>
              {EVOLUTION.map((item, index) => {
                const isLast =
                  index === EVOLUTION.length - 1;

                return (
                  <View
                    key={item.number}
                    style={styles.timelineItem}
                  >

                    <View style={styles.timelineLeft}>
                      <View style={styles.timelineNode}>
                        <Text style={styles.timelineNumber}>
                          {item.number}
                        </Text>
                      </View>

                      {!isLast ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>

                    <View style={styles.timelineContent}>

                      <View style={styles.timelineTitleRow}>
                        <MaterialDesignIcons
                          name={item.icon as never}
                          size={18}
                          color={theme.colors.primary}
                        />

                        <Text style={styles.timelineTitle}>
                          {item.label}
                        </Text>
                      </View>

                      <Text style={styles.timelinePeriod}>
                        {item.period}
                      </Text>

                      <Text style={styles.timelineText}>
                        {item.text}
                      </Text>

                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            3. Ce qui peut être normal
          </Text>

          <Text style={styles.body}>
            L’évolution des lochies n’est pas exactement identique
            pour tout le monde. Certains changements peuvent
            accompagner naturellement la récupération après la naissance.
          </Text>

          <View style={styles.normalGrid}>
            {NORMAL_POINTS.map(item => (
              <View
                key={item.title}
                style={styles.normalCard}
              >
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>
                  {item.title}
                </Text>

                <Text style={styles.normalText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            4. Conseils de confort et de suivi
          </Text>

          <Text style={styles.body}>
            Pendant cette période, un suivi simple peut t’aider
            à observer l’évolution de ton corps sans chercher
            à comparer ton expérience à celle d’une autre personne.
          </Text>

          <View style={styles.comfortCard}>
            {COMFORT_TIPS.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < COMFORT_TIPS.length - 1 &&
                    styles.comfortRowBorder,
                ]}
              >
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <Text style={styles.comfortTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.comfortText}>
                    {item.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DIFFERENCE LOCHIES / RULES                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            5. Lochies ou retour des règles ?
          </Text>

          <Text style={styles.body}>
            Les lochies apparaissent dans les suites de
            l’accouchement et diminuent progressivement.
            Le retour des règles correspond, lui, à la reprise
            du cycle menstruel après cette période.
          </Text>

          <View style={styles.compareCard}>

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="water-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>
                Lochies
              </Text>

              <Text style={styles.compareText}>
                Pertes liées à la récupération de l’utérus
                après la naissance.
              </Text>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="calendar-month-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>
                Retour des règles
              </Text>

              <Text style={styles.compareText}>
                Reprise du cycle menstruel, à un moment
                variable selon chaque personne.
              </Text>
            </View>

          </View>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            6. Quand consulter ?
          </Text>

          <Text style={styles.body}>
            Si l’évolution te semble inhabituelle ou si ton état
            général se dégrade, il est important de demander
            conseil à un professionnel de santé.
          </Text>

          <View style={styles.warningCard}>

            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <Text style={styles.warningTitle}>
                Signes qui méritent un avis médical
              </Text>
            </View>

            {WARNING_SIGNS.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* TIP                                                                 */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Bon à savoir
              </Text>

              <Text style={styles.tipText}>
                Les lochies évoluent généralement progressivement :
                elles peuvent être rouges au début, puis devenir
                plus claires avant de diminuer. Chaque récupération
                est cependant individuelle.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                            */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            À retenir
          </Text>

          <View style={styles.summaryCard}>
            {SUMMARY_POINTS.map(item => (
              <View
                key={item}
                style={styles.summaryRow}
              >
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                         */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              Contenu informatif. Cet article ne remplace pas
              un avis ou un examen médical. En cas de doute ou
              de symptôme préoccupant, demande conseil à un
              professionnel de santé.
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* READING CONTROLS                                                     */}
      {/* ==================================================================== */}

      <ReadingControls
        articleId={ID}
        durationMinutes={6}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* ========================================================================== */
/* STYLES                                                                      */
/* ========================================================================== */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ------------------------------------------------------------------------ */
  /* SCREEN                                                                   */
  /* ------------------------------------------------------------------------ */

  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  /* ------------------------------------------------------------------------ */
  /* HERO                                                                     */
  /* ------------------------------------------------------------------------ */

  heroWrap: {
    height: 245,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  hero: {
    width: '100%',
    height: '100%',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.74,
  },

  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                  */
  /* ------------------------------------------------------------------------ */

  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },

  badgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
    fontWeight: '700',
  },

  /* ------------------------------------------------------------------------ */
  /* METADATA                                                                 */
  /* ------------------------------------------------------------------------ */

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* INTRO                                                                    */
  /* ------------------------------------------------------------------------ */

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  /* ------------------------------------------------------------------------ */
  /* CONTENTS                                                                 */
  /* ------------------------------------------------------------------------ */

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 25,
    color: theme.colors.primary,
    fontSize: 11.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.3,
    lineHeight: 17,
    color: theme.colors.text,
  },

  /* ------------------------------------------------------------------------ */
  /* HEADINGS & theme.colors.textSecondary                                                          */
  /* ------------------------------------------------------------------------ */

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* INFO CARD                                                                */
  /* ------------------------------------------------------------------------ */

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoCopy: {
    flex: 1,
    marginLeft: 9,
  },

  infoTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* EVOLUTION                                                                */
  /* ------------------------------------------------------------------------ */

  evolutionCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  evolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  evolutionHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  evolutionHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  evolutionTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  evolutionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },

  timeline: {
    marginTop: 5,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 91,
  },

  timelineLeft: {
    width: 43,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 32,
    height: 32,
    marginTop: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },

  timelineNumber: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  timelineLine: {
    position: 'absolute',
    top: 46,
    bottom: 0,
    width: 1.5,
    backgroundColor: theme.colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 13,
    paddingLeft: 9,
    paddingBottom: 12,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  timelineTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
    fontWeight: '800',
  },

  timelinePeriod: {
    marginTop: 2,
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  timelineText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* NORMAL GRID                                                              */
  /* ------------------------------------------------------------------------ */

  normalGrid: {
    marginTop: 13,
    gap: 9,
  },

  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  normalTitle: {
    marginTop: 8,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  normalText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* COMFORT                                                                  */
  /* ------------------------------------------------------------------------ */

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  comfortRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
  },

  comfortRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  comfortCopy: {
    flex: 1,
    marginLeft: 10,
  },

  comfortTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  comfortText: {
    marginTop: 3,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* COMPARISON                                                               */
  /* ------------------------------------------------------------------------ */

  compareCard: {
    marginTop: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  compareColumn: {
    flex: 1,
  },

  compareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  compareTitle: {
    marginTop: 8,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  compareText: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  compareDivider: {
    width: 1,
    marginHorizontal: 12,
    backgroundColor: theme.colors.border,
  },

  /* ------------------------------------------------------------------------ */
  /* WARNING                                                                  */
  /* ------------------------------------------------------------------------ */

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  warningTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },

  warningBullet: {
    width: 20,
    alignItems: 'flex-start',
  },

  warningText: {
    flex: 1,
    marginLeft: 5,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },

  /* ------------------------------------------------------------------------ */
  /* TIP                                                                      */
  /* ------------------------------------------------------------------------ */

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                  */
  /* ------------------------------------------------------------------------ */

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  summaryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* DISCLAIMER                                                               */
  /* ------------------------------------------------------------------------ */

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: theme.colors.textMuted,
  },
  });
}