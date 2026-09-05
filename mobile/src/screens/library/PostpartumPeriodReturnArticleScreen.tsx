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

const ID = 'postpartum-retour-de-couches-freemium';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const BODY = '#4A444B';
const MUTED = '#777078';
const GREEN = '#789276';

const HERO = require('../../assets/images/library/featured-cycle.png');

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

const CYCLE_STAGES = [
  {
    number: '01',
    icon: 'baby-face-outline',
    title: 'Après l’accouchement',
    text: 'Le cycle menstruel s’interrompt temporairement après la naissance.',
  },
  {
    number: '02',
    icon: 'clock-outline',
    title: 'Période post-partum',
    text: 'Le corps récupère progressivement et le rythme hormonal évolue.',
  },
  {
    number: '03',
    icon: 'baby-bottle-outline',
    title: 'Allaitement',
    text: 'L’allaitement peut retarder le retour des règles, mais son effet varie selon chaque personne.',
  },
  {
    number: '04',
    icon: 'calendar-month-outline',
    title: 'Retour des règles',
    text: 'Les premières règles peuvent revenir après quelques semaines ou plusieurs mois.',
  },
  {
    number: '05',
    icon: 'chart-timeline-variant',
    title: 'Premiers cycles',
    text: 'Les cycles peuvent être irréguliers avant de retrouver progressivement leur rythme habituel.',
  },
] as const;

const OBSERVATIONS = [
  {
    icon: 'calendar-outline',
    title: 'Les dates',
    text: 'Note le premier jour des règles.',
  },
  {
    icon: 'clock-outline',
    title: 'Le rythme',
    text: 'Observe progressivement l’intervalle entre les cycles.',
  },
  {
    icon: 'water-outline',
    title: 'Le flux',
    text: 'Observe simplement les changements par rapport à ton habitude.',
  },
] as const;

const WARNING_SIGNS = [
  'Des saignements qui te semblent inhabituels',
  'Une douleur importante ou persistante',
  'De la fièvre ou un malaise important',
  'Un symptôme nouveau qui t’inquiète',
] as const;

const SUMMARY_POINTS = [
  'Le retour de couches correspond au retour des règles après l’accouchement.',
  'L’allaitement peut retarder le retour des règles.',
  'Les premiers cycles peuvent être irréguliers.',
  'Noter les dates peut aider à suivre l’évolution du cycle.',
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

export default function PostpartumPeriodReturnFreemiumArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [saved, setSaved] = useState(false);

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
        message: 'Le retour de couches, à quoi s’attendre — AWA',
      });
    } catch {
      // Share cancelled or unavailable.
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
        barStyle="dark-content"
      />

      <ScrollView
        ref={scrollRef}
        onScroll={event => {
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          );
        }}
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
                color={INK}
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
                  color={ROSE}
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
                  color={ROSE}
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
              FREEMIUM • POST-PARTUM
            </Text>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* TITLE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.title}>
            Le retour de couches,{'\n'}
            à quoi s’attendre
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* METADATA                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.metas}>
            <View style={styles.metaItem}>
              <MaterialDesignIcons
                name="clock-outline"
                size={16}
                color={MUTED}
              />

              <Text style={styles.meta}>
                5 min de lecture
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <MaterialDesignIcons
                name="book-open-page-variant-outline"
                size={16}
                color={MUTED}
              />

              <Text style={styles.meta}>
                Guide
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* INTRODUCTION                                                     */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.intro}>
            Après l’accouchement, le retour des règles peut prendre
            un certain temps. Le délai varie notamment selon
            l’allaitement et chaque personne peut vivre cette période
            différemment.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            1. Qu’est-ce que le retour de couches ?
          </Text>

          <Text style={styles.body}>
            Le « retour de couches » désigne le retour des règles
            après l’accouchement. Le cycle menstruel ne reprend pas
            forcément immédiatement son rythme habituel.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={ROSE}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                À retenir
              </Text>

              <Text style={styles.highlightText}>
                Il n’existe pas une date unique valable pour toutes
                les personnes.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            2. Quand les règles peuvent-elles revenir ?
          </Text>

          <Text style={styles.body}>
            Le délai dépend notamment de l’allaitement. Sans
            allaitement, le retour peut généralement survenir
            autour de 6 à 8 semaines. Avec un allaitement exclusif,
            il peut être retardé de plusieurs mois.
          </Text>

          <View style={styles.simpleInfo}>

            <View style={styles.simpleInfoRow}>
              <MaterialDesignIcons
                name="calendar-clock-outline"
                size={23}
                color={ROSE}
              />

              <View style={styles.simpleInfoCopy}>
                <Text style={styles.simpleInfoTitle}>
                  Sans allaitement
                </Text>

                <Text style={styles.simpleInfoText}>
                  En général autour de 6 à 8 semaines.
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.simpleInfoRow}>
              <MaterialDesignIcons
                name="baby-bottle-outline"
                size={23}
                color={ROSE}
              />

              <View style={styles.simpleInfoCopy}>
                <Text style={styles.simpleInfoTitle}>
                  Avec allaitement exclusif
                </Text>

                <Text style={styles.simpleInfoText}>
                  Le retour peut être retardé de plusieurs mois.
                </Text>
              </View>
            </View>

          </View>

          {/* ================================================================= */}
          {/* SECTION 3 — SCHEMA                                                */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            3. Le schéma du retour du cycle
          </Text>

          <Text style={styles.body}>
            Le retour du cycle se fait progressivement après
            l’accouchement. L’allaitement peut influencer le moment
            où les règles réapparaissent.
          </Text>

          {/* TIMELINE CARD */}

          <View style={styles.schemaCard}>

            {/* HEADER */}

            <View style={styles.schemaHeader}>
              <View style={styles.schemaHeaderIcon}>
                <MaterialDesignIcons
                  name="chart-timeline-variant"
                  size={23}
                  color={ROSE}
                />
              </View>

              <View style={styles.schemaHeaderCopy}>
                <Text style={styles.schemaTitle}>
                  Retour progressif du cycle
                </Text>

                <Text style={styles.schemaSubtitle}>
                  Un repère général, étape par étape
                </Text>
              </View>
            </View>

            {/* TIMELINE */}

            <View style={styles.timeline}>
              {CYCLE_STAGES.map((stage, index) => {
                const isLast =
                  index === CYCLE_STAGES.length - 1;

                return (
                  <View
                    key={stage.number}
                    style={styles.timelineItem}
                  >

                    {/* TIMELINE LEFT */}

                    <View style={styles.timelineLeft}>

                      <View style={styles.timelineNode}>
                        <Text style={styles.timelineNumber}>
                          {stage.number}
                        </Text>
                      </View>

                      {!isLast && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>

                    {/* TIMELINE CONTENT */}

                    <View style={styles.timelineContent}>

                      <View style={styles.timelineTitleRow}>
                        <MaterialDesignIcons
                          name={stage.icon as never}
                          size={17}
                          color={ROSE}
                        />

                        <Text style={styles.timelineTitle}>
                          {stage.title}
                        </Text>
                      </View>

                      <Text style={styles.timelineText}>
                        {stage.text}
                      </Text>

                    </View>
                  </View>
                );
              })}
            </View>

            {/* NOTE */}

            <View style={styles.schemaNote}>
              <MaterialDesignIcons
                name="information-outline"
                size={18}
                color={ROSE}
              />

              <Text style={styles.schemaNoteText}>
                Il n’existe pas de calendrier identique pour tout
                le monde. Le moment du retour des règles peut
                varier selon la personne, notamment en fonction
                de l’allaitement.
              </Text>
            </View>

          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            4. Les premiers cycles
          </Text>

          <Text style={styles.body}>
            Lorsque les règles reviennent, les premiers cycles
            peuvent être différents de ceux d’avant la grossesse.
            Ils peuvent notamment être irréguliers au début.
          </Text>

          <View style={styles.cards}>

            <View style={styles.smallCard}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons
                  name="calendar-alert-outline"
                  size={21}
                  color={ROSE}
                />
              </View>

              <Text style={styles.cardTitle}>
                Rythme variable
              </Text>

              <Text style={styles.cardText}>
                Le cycle peut mettre du temps à retrouver
                un rythme familier.
              </Text>
            </View>

            <View style={styles.smallCard}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons
                  name="water-outline"
                  size={21}
                  color={ROSE}
                />
              </View>

              <Text style={styles.cardTitle}>
                Flux différent
              </Text>

              <Text style={styles.cardText}>
                Le flux peut être différent de celui observé
                avant la grossesse.
              </Text>
            </View>

          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            5. Que peux-tu observer ?
          </Text>

          <Text style={styles.body}>
            Un suivi simple permet de mieux observer l’évolution
            du cycle au fil du temps.
          </Text>

          <View style={styles.observationCard}>
            {OBSERVATIONS.map(item => (
              <View
                key={item.title}
                style={styles.observationRow}
              >
                <View style={styles.observationIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={19}
                    color={ROSE}
                  />
                </View>

                <View style={styles.observationCopy}>
                  <Text style={styles.observationTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.observationText}>
                    {item.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            6. Quand demander conseil ?
          </Text>

          <Text style={styles.body}>
            Si quelque chose te semble inhabituel, persistant ou
            préoccupant, demande conseil à un professionnel de santé.
          </Text>

          <View style={styles.warningCard}>
            {WARNING_SIGNS.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color="#B76568"
                />

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
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
                  color={GREEN}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
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
              Contenu informatif. Les délais peuvent varier selon
              chaque situation et ne remplacent pas un avis médical.
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* READING CONTROLS                                                     */}
      {/* ==================================================================== */}

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* ========================================================================== */
/* STYLES                                                                      */
/* ========================================================================== */

const styles = StyleSheet.create({
  /* ------------------------------------------------------------------------ */
  /* SCREEN                                                                   */
  /* ------------------------------------------------------------------------ */

  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  scroll: {
    paddingBottom: 30,
  },

  /* ------------------------------------------------------------------------ */
  /* HERO                                                                     */
  /* ------------------------------------------------------------------------ */

  heroWrap: {
    height: 235,
    backgroundColor: '#EFE3D5',
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: BORDER,
  },

  pressed: {
    opacity: 0.7,
  },

  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                  */
  /* ------------------------------------------------------------------------ */

  article: {
    marginTop: -15,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
    fontSize: 9.5,
    color: ROSE,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 33,
    color: INK,
    fontWeight: '700',
  },

  /* ------------------------------------------------------------------------ */
  /* METADATA                                                                 */
  /* ------------------------------------------------------------------------ */

  metas: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#DDD5DA',
  },

  meta: {
    fontSize: 9.5,
    color: MUTED,
  },

  /* ------------------------------------------------------------------------ */
  /* INTRO                                                                    */
  /* ------------------------------------------------------------------------ */

  intro: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: BODY,
    fontWeight: '600',
  },

  /* ------------------------------------------------------------------------ */
  /* HEADINGS & BODY                                                          */
  /* ------------------------------------------------------------------------ */

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 26,
    color: INK,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 21,
    color: BODY,
  },

  /* ------------------------------------------------------------------------ */
  /* HIGHLIGHT                                                                */
  /* ------------------------------------------------------------------------ */

  highlight: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F8EEF1',
    borderWidth: 1,
    borderColor: '#F0DDE3',
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 9,
  },

  highlightTitle: {
    fontSize: 12.5,
    color: INK,
    fontWeight: '800',
  },

  highlightText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#585057',
  },

  /* ------------------------------------------------------------------------ */
  /* SIMPLE INFO                                                              */
  /* ------------------------------------------------------------------------ */

  simpleInfo: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  simpleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  simpleInfoCopy: {
    flex: 1,
    marginLeft: 10,
  },

  simpleInfoTitle: {
    fontSize: 12.5,
    color: INK,
    fontWeight: '800',
  },

  simpleInfoText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: '#585057',
  },

  separator: {
    height: 1,
    marginVertical: 13,
    backgroundColor: '#EEE6E0',
  },

  /* ------------------------------------------------------------------------ */
  /* CYCLE SCHEMA                                                             */
  /* ------------------------------------------------------------------------ */

  schemaCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EDE3DE',
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE4DF',
  },

  schemaHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3DFE5',
  },

  schemaHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  schemaTitle: {
    fontSize: 13.5,
    color: INK,
    fontWeight: '800',
  },

  schemaSubtitle: {
    marginTop: 3,
    fontSize: 10.5,
    color: MUTED,
  },

  /* ------------------------------------------------------------------------ */
  /* TIMELINE                                                                 */
  /* ------------------------------------------------------------------------ */

  timeline: {
    marginTop: 8,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 88,
  },

  timelineLeft: {
    width: 44,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 34,
    height: 34,
    marginTop: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3DFE5',
    borderWidth: 1,
    borderColor: '#E5CCD4',
    zIndex: 2,
  },

  timelineNumber: {
    fontSize: 9.5,
    color: ROSE,
    fontWeight: '800',
  },

  timelineLine: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#E5D7DC',
  },

  timelineContent: {
    flex: 1,
    paddingTop: 13,
    paddingLeft: 10,
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
    color: INK,
    fontWeight: '800',
  },

  timelineText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: '#585057',
  },

  /* ------------------------------------------------------------------------ */
  /* SCHEMA NOTE                                                              */
  /* ------------------------------------------------------------------------ */

  schemaNote: {
    marginTop: 8,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 11,
    backgroundColor: '#F8EEF1',
    borderWidth: 1,
    borderColor: '#F0DDE3',
  },

  schemaNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: '#585057',
  },

  /* ------------------------------------------------------------------------ */
  /* SMALL CARDS                                                              */
  /* ------------------------------------------------------------------------ */

  cards: {
    marginTop: 13,
    flexDirection: 'row',
    gap: 9,
  },

  smallCard: {
    flex: 1,
    minHeight: 135,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },

  cardTitle: {
    marginTop: 8,
    fontSize: 12,
    color: INK,
    fontWeight: '800',
  },

  cardText: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: '#585057',
  },

  /* ------------------------------------------------------------------------ */
  /* OBSERVATION CARD                                                         */
  /* ------------------------------------------------------------------------ */

  observationCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  observationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  observationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },

  observationCopy: {
    flex: 1,
    marginLeft: 9,
  },

  observationTitle: {
    fontSize: 12,
    color: INK,
    fontWeight: '800',
  },

  observationText: {
    marginTop: 2,
    fontSize: 10.7,
    lineHeight: 16,
    color: '#585057',
  },

  /* ------------------------------------------------------------------------ */
  /* WARNING CARD                                                             */
  /* ------------------------------------------------------------------------ */

  warningCard: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FCF5F3',
    borderWidth: 1,
    borderColor: '#F1DFDB',
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginBottom: 9,
  },

  warningText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: BODY,
  },

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                  */
  /* ------------------------------------------------------------------------ */

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EBDDE2',
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },

  summaryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: BODY,
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
    color: '#8A8190',
  },
});