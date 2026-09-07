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

const ID = 'breastfeeding-debuter-allaitement';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

/* -------------------------------------------------------------------------- */
/* DATA                                                                        */
/* -------------------------------------------------------------------------- */

const STARTING_STEPS = [
  {
    icon: 'baby-face-outline',
    number: '01',
    title: 'Après la naissance',
    text: 'Le contact peau à peau et une première mise au sein peuvent favoriser le démarrage.',
  },
  {
    icon: 'clock-outline',
    number: '02',
    title: 'Les premières heures',
    text: 'Le bébé peut téter fréquemment. Il est normal que le rythme varie.',
  },
  {
    icon: 'repeat',
    number: '03',
    title: 'Les premiers jours',
    text: 'Les tétées deviennent progressivement un repère pour le bébé et la mère.',
  },
  {
    icon: 'chart-line',
    number: '04',
    title: 'Installation progressive',
    text: 'La lactation s’adapte progressivement aux besoins du bébé.',
  },
] as const;

const SIGNALS = [
  {
    icon: 'clock-outline',
    title: 'Un rythme fréquent',
    text: 'Un nouveau-né peut demander souvent le sein, parfois 8 à 12 fois par 24 heures.',
  },
  {
    icon: 'baby-face-outline',
    title: 'Les signes d’éveil',
    text: 'Le bébé peut bouger, ouvrir la bouche ou chercher le sein lorsqu’il commence à avoir faim.',
  },
  {
    icon: 'water-outline',
    title: 'Les couches',
    text: 'L’évolution des couches mouillées et des selles fait partie des éléments observés au quotidien.',
  },
] as const;

const LATCH_POINTS = [
  {
    icon: 'account-child-outline',
    title: 'Bébé bien positionné',
    text: 'Le bébé est proche du corps et sa tête reste dans un axe confortable.',
  },
  {
    icon: 'gesture-tap',
    title: 'Bouche grande ouverte',
    text: 'Attendre une ouverture suffisante avant de proposer le sein.',
  },
  {
    icon: 'heart-outline',
    title: 'Prise confortable',
    text: 'Une prise efficace ne devrait pas provoquer une douleur importante ou persistante.',
  },
  {
    icon: 'check-circle-outline',
    title: 'Succion régulière',
    text: 'Des mouvements de succion et de déglutition peuvent être observés pendant la tétée.',
  },
] as const;

const SUPPORT_OPTIONS = [
  {
    icon: 'account-heart-outline',
    title: 'Sage-femme',
    text: 'Peut accompagner les premières mises au sein.',
  },
  {
    icon: 'doctor',
    title: 'Professionnel de santé',
    text: 'Peut vérifier la santé du bébé et de la mère.',
  },
  {
    icon: 'human-male-board-poll',
    title: 'Consultante en lactation',
    text: 'Peut aider lorsque la mise au sein ou la prise du sein pose difficulté.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                       */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                      */
/* -------------------------------------------------------------------------- */

export default function BreastfeedingArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

  const handleShare = () => {
    Share.share({
      message: 'Débuter l’allaitement en confiance — AWA',
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
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
        ]}>
        {/* ---------------------------------------------------------------- */}
        {/* HERO                                                             */}
        {/* ---------------------------------------------------------------- */}

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
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

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
                ]}>
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
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* ARTICLE                                                          */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.article}>
          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              POST-PARTUM • ALLAITEMENT
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Débuter l’allaitement{'\n'}en confiance
          </Text>

          {/* Metadata */}
          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Débutant'],
              ['shield-check-outline', 'Contenu validé'],
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

          {/* Introduction */}
          <Text style={styles.intro}>
            Les premiers jours d’allaitement sont une période
            d’apprentissage pour le bébé comme pour la mère.
            Mise au sein, rythme, position et observation permettent
            progressivement de trouver un fonctionnement confortable.
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.contents}>
            <View style={styles.contentsHeader}>
              <View style={styles.contentsIcon}>
                <MaterialDesignIcons
                  name="format-list-bulleted"
                  size={19}
                  color={theme.colors.primary}
                />
              </View>

              <View>
                <Text style={styles.contentsTitle}>
                  Dans cet article
                </Text>

                <Text style={styles.contentsSubtitle}>
                  Les essentiels pour commencer
                </Text>
              </View>
            </View>

            {[
              'Les premières étapes',
              'Les signaux à observer',
              'Une bonne prise du sein',
              'Quand demander de l’aide',
              'À retenir',
            ].map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <View style={styles.contentNumberCircle}>
                    <Text style={styles.contentNumber}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            1. Les premières étapes
          </Text>

          <Text style={styles.body}>
            Le démarrage de l’allaitement se construit progressivement.
            Les premières heures puis les premiers jours permettent
            au bébé et à sa mère d’apprendre ensemble.
          </Text>

          {/* MODERN TIMELINE */}
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <View style={styles.timelineHeaderIcon}>
                <MaterialDesignIcons
                  name="timeline-clock-outline"
                  size={23}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.timelineHeaderCopy}>
                <Text style={styles.timelineTitle}>
                  Le démarrage, étape par étape
                </Text>

                <Text style={styles.timelineSubtitle}>
                  Un repère simple, sans pression
                </Text>
              </View>
            </View>

            {STARTING_STEPS.map((step, index) => (
              <View
                key={step.number}
                style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineNode}>
                    <Text style={styles.timelineNumber}>
                      {step.number}
                    </Text>
                  </View>

                  {index < STARTING_STEPS.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.timelineTitleRow}>
                    <Text style={styles.timelineStepTitle}>
                      {step.title}
                    </Text>

                    <MaterialDesignIcons
                      name={step.icon as never}
                      size={19}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.timelineText}>
                    {step.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            2. Les signaux à observer
          </Text>

          <Text style={styles.body}>
            Plutôt que de se concentrer uniquement sur l’horloge,
            il peut être utile d’observer les signes d’éveil,
            les tétées et l’évolution des couches.
          </Text>

          <View style={styles.signalGrid}>
            {SIGNALS.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.signalCard,
                  index === 0 && styles.signalCardLarge,
                ]}>
                <View style={styles.signalIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.signalTitle}>
                  {item.title}
                </Text>

                <Text style={styles.signalText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 3                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            3. Une bonne prise du sein
          </Text>

          <Text style={styles.body}>
            Une position confortable et une prise efficace peuvent
            faciliter la tétée. Si la douleur est importante ou
            persistante, un professionnel peut vérifier la position
            et la prise du sein.
          </Text>

          {/* LATCH SCHEMA */}
          <View style={styles.latchCard}>
            <View style={styles.latchHeader}>
              <View style={styles.latchBadge}>
                <MaterialDesignIcons
                  name="heart-pulse"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.latchHeaderCopy}>
                <Text style={styles.latchTitle}>
                  Les 4 repères de confort
                </Text>

                <Text style={styles.latchSubtitle}>
                  Une vérification simple pendant la tétée
                </Text>
              </View>
            </View>

            <View style={styles.latchCenter}>
              <View style={styles.latchCircleOuter}>
                <View style={styles.latchCircleInner}>
                  <MaterialDesignIcons
                    name="baby-face-outline"
                    size={35}
                    color={theme.colors.primary}
                  />
                </View>
              </View>

              <View style={styles.latchCenterText}>
                <Text style={styles.latchCenterTitle}>
                  Bébé + sein
                </Text>

                <Text style={styles.latchCenterSubtitle}>
                  Position confortable
                </Text>
              </View>
            </View>

            <View style={styles.latchPoints}>
              {LATCH_POINTS.map((item, index) => (
                <View
                  key={item.title}
                  style={styles.latchPoint}>
                  <View style={styles.latchPointNumber}>
                    <Text style={styles.latchPointNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <View style={styles.latchPointIcon}>
                    <MaterialDesignIcons
                      name={item.icon as never}
                      size={19}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.latchPointCopy}>
                    <Text style={styles.latchPointTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.latchPointText}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 4                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            4. Quand demander de l’aide ?
          </Text>

          <Text style={styles.body}>
            Il n’est pas nécessaire d’attendre que les difficultés
            deviennent importantes. Une personne formée peut aider
            à vérifier la position, la prise du sein ou les besoins
            du bébé.
          </Text>

          <View style={styles.supportCard}>
            {SUPPORT_OPTIONS.map((item, index) => (
              <React.Fragment key={item.title}>
                <View style={styles.supportRow}>
                  <View style={styles.supportIcon}>
                    <MaterialDesignIcons
                      name={item.icon as never}
                      size={21}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.supportCopy}>
                    <Text style={styles.supportTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.supportText}>
                      {item.text}
                    </Text>
                  </View>
                </View>

                {index < SUPPORT_OPTIONS.length - 1 ? (
                  <View style={styles.supportSeparator} />
                ) : null}
              </React.Fragment>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* IMPORTANT NOTE                                                    */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={21}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                Chaque allaitement est différent
              </Text>

              <Text style={styles.infoText}>
                Les premières journées peuvent être très variables.
                Le rythme des tétées et la quantité de lait peuvent
                évoluer progressivement. Si quelque chose t’inquiète,
                demande conseil à un professionnel de santé.
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SUMMARY                                                           */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            À retenir
          </Text>

          <View style={styles.summaryCard}>
            {[
              'Les premières tétées sont une période d’apprentissage pour le bébé et la mère.',
              'Un nouveau-né peut demander fréquemment le sein.',
              'Une position confortable et une bonne prise du sein sont importantes.',
              'L’observation des signes du bébé est plus utile qu’une recherche de rythme parfaitement fixe.',
              'Une sage-femme ou une consultante en lactation peut accompagner les premières difficultés.',
            ].map(item => (
              <View
                key={item}
                style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={19}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* DISCLAIMER */}
          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              Contenu informatif. Cet article ne remplace pas
              l’accompagnement personnalisé d’un professionnel
              de santé.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* -------------------------------------------------------------------- */}
      {/* READING CONTROLS                                                     */}
      {/* -------------------------------------------------------------------- */}

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
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  /* ---------------------------------------------------------------------- */
  /* HERO                                                                   */
  /* ---------------------------------------------------------------------- */

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
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.72,
  },

  /* ---------------------------------------------------------------------- */
  /* ARTICLE                                                                */
  /* ---------------------------------------------------------------------- */

  article: {
    marginTop: -15,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
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

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  /* ---------------------------------------------------------------------- */
  /* CONTENTS                                                               */
  /* ---------------------------------------------------------------------- */

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  contentsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginRight: 10,
  },

  contentsTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentsSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  contentRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumberCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginRight: 9,
  },

  contentNumber: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.3,
    lineHeight: 17,
    color: theme.colors.text,
  },

  /* ---------------------------------------------------------------------- */
  /* HEADINGS                                                               */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /* MODERN TIMELINE                                                        */
  /* ---------------------------------------------------------------------- */

  timelineCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  timelineHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  timelineHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  timelineTitle: {
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  timelineSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 91,
  },

  timelineLeft: {
    width: 46,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 35,
    height: 35,
    marginTop: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },

  timelineNumber: {
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '900',
  },

  timelineLine: {
    position: 'absolute',
    top: 49,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 10,
    paddingLeft: 7,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timelineStepTitle: {
    flex: 1,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  timelineText: {
    marginTop: 4,
    paddingRight: 5,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SIGNAL GRID                                                            */
  /* ---------------------------------------------------------------------- */

  signalGrid: {
    marginTop: 14,
    gap: 9,
  },

  signalCard: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  signalCardLarge: {
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderColor: theme.colors.border,
  },

  signalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  signalTitle: {
    marginTop: 9,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  signalText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* LATCH SCHEMA                                                           */
  /* ---------------------------------------------------------------------- */

  latchCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  latchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  latchBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  latchHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  latchTitle: {
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  latchCenter: {
    marginTop: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  latchCircleOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  latchCircleInner: {
    width: 59,
    height: 59,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },

  latchCenterText: {
    alignItems: 'center',
    marginTop: 9,
  },

  latchCenterTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchCenterSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  latchPoints: {
    marginTop: 13,
  },

  latchPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  latchPointNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  latchPointNumberText: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: '900',
  },

  latchPointIcon: {
    width: 32,
    height: 32,
    marginLeft: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  latchPointCopy: {
    flex: 1,
    marginLeft: 9,
  },

  latchPointTitle: {
    fontSize: 11.8,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchPointText: {
    marginTop: 2,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SUPPORT                                                                */
  /* ---------------------------------------------------------------------- */

  supportCard: {
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },

  supportIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  supportCopy: {
    flex: 1,
    marginLeft: 10,
  },

  supportTitle: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
  },

  supportText: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  supportSeparator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },

  /* ---------------------------------------------------------------------- */
  /* INFO BOX                                                               */
  /* ---------------------------------------------------------------------- */

  infoBox: {
    marginTop: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  infoCopy: {
    flex: 1,
    marginLeft: 10,
  },

  infoTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SUMMARY                                                                */
  /* ---------------------------------------------------------------------- */

  summaryCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
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

  /* ---------------------------------------------------------------------- */
  /* DISCLAIMER                                                             */
  /* ---------------------------------------------------------------------- */

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
