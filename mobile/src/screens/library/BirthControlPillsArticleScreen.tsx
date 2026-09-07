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

const ID = 'birthcontrolpills-comprendre-la-pilule';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

const ADVANTAGES = [
  'Réduit fortement le risque de grossesse lorsqu’elle est utilisée correctement',
  'Peut rendre les règles plus régulières et prévisibles',
  'Peut diminuer les douleurs et les saignements chez certaines personnes',
  'Peut être adaptée ou changée si elle ne convient pas',
] as const;

const LIMITATIONS = [
  'Nécessite une prise régulière selon le type de pilule',
  'Les oublis peuvent diminuer son efficacité',
  'Des effets indésirables peuvent apparaître chez certaines personnes',
  'Ne protège pas contre les infections sexuellement transmissibles (IST)',
] as const;

const ROUTINE_TIPS = [
  'Choisir un moment de la journée facile à retenir (repas, coucher...)',
  'Utiliser un rappel ou une application si besoin',
  'Garder la notice à portée de main en cas de doute',
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BirthControlPillsArticleScreen({
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
      message: 'Comprendre la pilule contraceptive — AWA',
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
            <Text style={styles.badgeText}>PILULE CONTRACEPTIVE</Text>
          </View>

          <Text style={styles.title}>
            Comprendre la{`\n`}pilule contraceptive
          </Text>

          {/* METADATA */}
          <View style={styles.metas}>
            {[
              ['clock-outline', '7 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
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
            Comment agit la pilule, comment l’utiliser au quotidien et quels
            sont ses principaux avantages et limites.
          </Text>

          {/* TABLE OF CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Comment agit la pilule',
              'Bien la prendre au quotidien',
              'Avantages et limites',
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
          <Text style={styles.h2}>1. Comment agit la pilule</Text>

          <Text style={styles.body}>
            La pilule contient des hormones, œstrogènes et/ou progestatif selon
            le type, qui agissent principalement en empêchant ou en bloquant
            l’ovulation. Elle modifie également la glaire cervicale, ce qui
            rend le passage des spermatozoïdes plus difficile.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Il existe plusieurs types de pilules, notamment les pilules
                combinées et celles contenant uniquement un progestatif. Leur
                composition et leur mode de prise peuvent varier.
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>2. Bien la prendre au quotidien</Text>

          <Text style={styles.body}>
            La régularité de la prise est importante. Selon le type de pilule,
            les règles en cas d’oubli peuvent être différentes : il est donc
            essentiel de consulter la notice de son médicament.
          </Text>

          <View style={styles.checkList}>
            {ROUTINE_TIPS.map(item => (
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

          {/* SECTION 3 */}
          <Text style={styles.h2}>3. Avantages et limites</Text>

          <Text style={styles.sectionIntro}>
            Comme toute méthode contraceptive, la pilule présente des
            avantages mais aussi certaines limites à connaître avant de la
            choisir.
          </Text>

          {/* CENTRAL SCHEMA */}
          <View style={styles.schema}>
            {/* ADVANTAGES */}
            <View style={styles.schemaCard}>
              <View style={styles.schemaHeader}>
                <View style={styles.iconCirclePositive}>
                  <MaterialDesignIcons
                    name="check-circle-outline"
                    size={22}
                    color={theme.colors.success}
                  />
                </View>

                <View style={styles.schemaHeaderText}>
                  <Text style={styles.schemaTitle}>Avantages</Text>
                  <Text style={styles.schemaSubtitle}>
                    Ce qu’elle peut apporter
                  </Text>
                </View>
              </View>

              <View style={styles.schemaLine} />

              {ADVANTAGES.map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.schemaRow,
                    index === ADVANTAGES.length - 1 &&
                      styles.schemaRowLast,
                  ]}>
                  <View style={styles.smallPositiveIcon}>
                    <MaterialDesignIcons
                      name="check"
                      size={14}
                      color={theme.colors.success}
                    />
                  </View>

                  <Text style={styles.schemaText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* LIMITATIONS */}
            <View style={styles.schemaCard}>
              <View style={styles.schemaHeader}>
                <View style={styles.iconCircleWarning}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.schemaHeaderText}>
                  <Text style={styles.schemaTitle}>Limites</Text>
                  <Text style={styles.schemaSubtitle}>
                    Les points à connaître
                  </Text>
                </View>
              </View>

              <View style={styles.schemaLine} />

              {LIMITATIONS.map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.schemaRow,
                    index === LIMITATIONS.length - 1 &&
                      styles.schemaRowLast,
                  ]}>
                  <View style={styles.smallWarningIcon}>
                    <MaterialDesignIcons
                      name="alert-outline"
                      size={14}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.schemaText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. À retenir</Text>

          <View style={styles.takeaway}>
            <View style={styles.takeawayIcon}>
              <MaterialDesignIcons
                name="pill"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.takeawayContent}>
              <Text style={styles.takeawayTitle}>
                Une méthode à connaître
              </Text>

              <Text style={styles.takeawayText}>
                La pilule est une méthode contraceptive hormonale efficace
                lorsqu’elle est utilisée correctement. Sa prise régulière,
                ses éventuels effets indésirables et l’absence de protection
                contre les IST sont des éléments importants à connaître.
              </Text>
            </View>
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={22}
              color={theme.colors.primary}
            />

            <Text style={styles.finalTipText}>
              Si tu envisages une contraception ou si ta méthode actuelle ne
              te convient pas, n’hésite pas à en discuter avec un médecin,
              une sage-femme ou un autre professionnel de santé.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
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

  sectionIntro: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  note: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
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

  /* ADVANTAGES / LIMITATIONS SCHEMA */

  schema: {
    marginTop: 15,
    gap: 12,
  },

  schemaCard: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  schemaHeaderText: {
    flex: 1,
    marginLeft: 11,
  },

  schemaTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  schemaSubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  iconCirclePositive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  iconCircleWarning: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.primary, 0.12),
  },

  schemaLine: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginTop: 13,
    marginBottom: 4,
  },

  schemaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  schemaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 3,
  },

  smallPositiveIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  smallWarningIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    backgroundColor: withAlpha(theme.colors.primary, 0.12),
  },

  schemaText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  takeaway: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  takeawayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  takeawayContent: {
    flex: 1,
    marginLeft: 11,
  },

  takeawayTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  takeawayText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  finalTip: {
    marginTop: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  finalTipText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  });
}
