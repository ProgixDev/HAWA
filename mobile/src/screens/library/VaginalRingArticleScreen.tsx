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

const ID = 'ring-anneau-vaginal';

const HERO = require('../../assets/images/library/popular-phases.png');

const CARE_TIPS = [
  ['hand-heart-outline', 'Simple à utiliser', 'Il se pose et se retire soi-même.'],
  ['calendar-week-outline', 'Rythme régulier', 'Il reste généralement en place pendant trois semaines.'],
  ['shield-check-outline', 'Action continue', 'Les hormones sont diffusées en continu pendant la période d’utilisation.'],
  ['alert-circle-outline', 'Ne protège pas des IST', 'Une protection supplémentaire peut être nécessaire selon la situation.'],
] as const;

const PRACTICAL_STEPS = [
  'Se laver les mains avant la pose ou le retrait',
  'Choisir un moment facile à retenir pour suivre le calendrier',
  'Vérifier occasionnellement qu’il est toujours en place',
  'Consulter la notice en cas de déplacement ou d’expulsion',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function VaginalRingArticleScreen({
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
      message: 'L’anneau vaginal contraceptif — AWA',
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
        {/* HERO */}
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
                accessibilityLabel="Ajouter aux favoris"
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ANNEAU VAGINAL</Text>
          </View>

          <Text style={styles.title}>
            L’anneau vaginal{`\n`}contraceptif
          </Text>

          {/* META */}
          <View style={styles.metas}>
            {[
              ['clock-outline', '5 min de lecture'],
              ['book-open-page-variant-outline', 'Article'],
              ['chart-bar', 'Débutant'],
              ['shield-check-outline', 'Contenu validé'],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? <View style={styles.metaDivider} /> : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            Un anneau souple, posé pour trois semaines.
          </Text>

          {/* TABLE OF CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Comment fonctionne l’anneau',
              'La pose et le retrait',
              'Ce qu’il faut savoir',
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
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}
          <Text style={styles.h2}>1. Comment fonctionne l’anneau</Text>

          <Text style={styles.body}>
            L’anneau est un dispositif souple qui libère en continu de
            faibles doses d’hormones directement au niveau vaginal, avec la
            même action contraceptive qu’une pilule combinée.
          </Text>

          {/* VISUAL SCHEMA */}
          <View style={styles.flowCard}>
            <Text style={styles.flowTitle}>Son fonctionnement</Text>

            <View style={styles.flow}>
              <View style={styles.flowStep}>
                <View style={styles.flowIcon}>
                  <MaterialDesignIcons
                    name="circle-outline"
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.flowStepTitle}>Anneau</Text>

                <Text style={styles.flowStepText}>
                  Placé dans le vagin
                </Text>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.textMuted}
              />

              <View style={styles.flowStep}>
                <View style={styles.flowIcon}>
                  <MaterialDesignIcons
                    name="water-outline"
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.flowStepTitle}>Hormones</Text>

                <Text style={styles.flowStepText}>
                  Diffusion continue
                </Text>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.textMuted}
              />

              <View style={styles.flowStep}>
                <View style={styles.flowIcon}>
                  <MaterialDesignIcons
                    name="shield-check-outline"
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.flowStepTitle}>Protection</Text>

                <Text style={styles.flowStepText}>
                  Action contraceptive
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>2. La pose et le retrait</Text>

          <Text style={styles.body}>
            Il se place soi-même, reste en continu pendant trois semaines,
            puis est retiré pour une semaine de pause pendant laquelle les
            règles surviennent.
          </Text>

          {/* 3 WEEK SCHEMA */}
          <View style={styles.calendarCard}>
            <Text style={styles.calendarTitle}>Un rythme simple à suivre</Text>

            <View style={styles.weekRow}>
              <View style={styles.weekItemActive}>
                <Text style={styles.weekNumber}>1</Text>
                <Text style={styles.weekLabel}>Anneau</Text>
              </View>

              <View style={styles.weekItemActive}>
                <Text style={styles.weekNumber}>2</Text>
                <Text style={styles.weekLabel}>Anneau</Text>
              </View>

              <View style={styles.weekItemActive}>
                <Text style={styles.weekNumber}>3</Text>
                <Text style={styles.weekLabel}>Anneau</Text>
              </View>

              <View style={styles.weekItemPause}>
                <Text style={styles.weekNumber}>4</Text>
                <Text style={styles.weekLabel}>Pause</Text>
              </View>
            </View>

            <View style={styles.calendarLegend}>
              <View style={styles.legendDotActive} />

              <Text style={styles.legendText}>Période avec anneau</Text>

              <View style={styles.legendDotPause} />

              <Text style={styles.legendText}>Semaine de pause</Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Sa position exacte dans le vagin n’a pas besoin d’être
                précise pour être efficace, ce qui le rend simple à utiliser.
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>3. Ce qu’il faut savoir</Text>

          <Text style={styles.body}>
            L’anneau présente plusieurs points pratiques à connaître avant
            de l’adopter.
          </Text>

          {/* INFORMATION GRID */}
          <View style={styles.infoGrid}>
            {CARE_TIPS.map(([icon, title, text]) => (
              <View key={title} style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={23}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.infoTitle}>{title}</Text>

                <Text style={styles.infoText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* PRACTICAL CHECKLIST */}
          <View style={styles.checkList}>
            <Text style={styles.checkListTitle}>
              Les bons réflexes
            </Text>

            {PRACTICAL_STEPS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* WARNING */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>

              <Text style={styles.tipText}>
                Une expulsion ou un déplacement prolongé peut nécessiter
                des consignes particulières. Consulte toujours la notice
                du dispositif ou demande conseil à un professionnel de santé
                en cas de doute.
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. À retenir</Text>

          {/* SUMMARY SCHEMA */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>
                L’essentiel en 4 points
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>1</Text>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.summaryItemTitle}>
                  Pose simple
                </Text>

                <Text style={styles.summaryItemText}>
                  L’anneau peut être posé et retiré soi-même.
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>2</Text>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.summaryItemTitle}>
                  Rythme hebdomadaire
                </Text>

                <Text style={styles.summaryItemText}>
                  Il suit généralement un cycle de trois semaines avec une
                  semaine de pause.
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>3</Text>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.summaryItemTitle}>
                  Contrôle occasionnel
                </Text>

                <Text style={styles.summaryItemText}>
                  Vérifier régulièrement sa présence aide à utiliser le
                  dispositif sereinement.
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>4</Text>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.summaryItemTitle}>
                  Pas de protection contre les IST
                </Text>

                <Text style={styles.summaryItemText}>
                  Une protection adaptée peut être nécessaire selon la
                  situation.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À retenir</Text>

              <Text style={styles.tipText}>
                L’anneau vaginal combine une diffusion hormonale continue
                avec un rythme d’utilisation qui évite une prise quotidienne.
                Le choix d’une contraception doit toutefois être adapté à
                chaque personne et discuté avec un professionnel de santé.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

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
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
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
    width: 24,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  /* FUNCTIONING SCHEMA */

  flowCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  flowTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 15,
  },

  flow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  flowStep: {
    flex: 1,
    alignItems: 'center',
  },

  flowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  flowStepTitle: {
    marginTop: 7,
    fontSize: 11.5,
    color: theme.colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },

  flowStepText: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  /* CALENDAR SCHEMA */

  calendarCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  calendarTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 14,
  },

  weekRow: {
    flexDirection: 'row',
    gap: 7,
  },

  weekItemActive: {
    flex: 1,
    minHeight: 68,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  weekItemPause: {
    flex: 1,
    minHeight: 68,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  weekNumber: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  weekLabel: {
    marginTop: 3,
    fontSize: 10,
    color: theme.colors.text,
    fontWeight: '700',
  },

  calendarLegend: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },

  legendDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  legendDotPause: {
    marginLeft: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textMuted,
  },

  legendText: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  /* TIP */

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
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
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* INFORMATION GRID */

  infoGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
  },

  infoCard: {
    width: '48.5%',
    minHeight: 150,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoTitle: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
  },

  /* CHECKLIST */

  checkList: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  checkListTitle: {
    marginBottom: 11,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  /* ALERT */

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },

  summaryTitle: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 13,
  },

  summaryNumber: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  summaryNumberText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  summaryCopy: {
    flex: 1,
    marginLeft: 10,
  },

  summaryItemTitle: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryItemText: {
    marginTop: 2,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
  },
  });
}
