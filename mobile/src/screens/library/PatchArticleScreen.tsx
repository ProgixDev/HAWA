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

const ID = 'patch-le-patch-contraceptif';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

const APPLICATION_TIPS = [
  'Changer de zone d’application à chaque pose',
  'Vérifier qu’il reste bien collé',
  'Le poser sur une peau propre et sèche',
];

const PATCH_FACTS = [
  {
    icon: 'calendar-week-outline',
    title: 'Chaque semaine',
    text: 'Le patch se remplace une fois par semaine.',
  },
  {
    icon: 'water-outline',
    title: 'Peau sèche',
    text: 'Il doit être posé sur une peau propre et sèche.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Protection',
    text: 'Il agit en continu lorsqu’il est utilisé correctement.',
  },
  {
    icon: 'alert-circle-outline',
    title: 'À surveiller',
    text: 'Une irritation locale peut parfois apparaître.',
  },
];

const PATCH_LIMITS = [
  'Ne protège pas des IST',
  'Peut provoquer une irritation cutanée',
  'Nécessite de respecter le rythme de remplacement',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PatchArticleScreen({
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
      message: 'Le patch contraceptif — AWA',
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
            <Text style={styles.badgeText}>PATCH CONTRACEPTIF</Text>
          </View>

          <Text style={styles.title}>
            Le patch{`\n`}contraceptif
          </Text>

          {/* METADATA */}
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
            Une alternative hebdomadaire à la pilule quotidienne.
          </Text>

          {/* TABLE OF CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Comment fonctionne le patch',
              'Le rythme d’application',
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
          <Text style={styles.h2}>1. Comment fonctionne le patch</Text>

          <Text style={styles.body}>
            Le patch diffuse en continu des hormones à travers la peau,
            avec une action comparable à celle de la pilule combinée :
            il empêche l’ovulation et épaissit la glaire cervicale.
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
                Son principal avantage est de ne pas nécessiter une prise
                quotidienne.
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>2. Le rythme d’application</Text>

          <Text style={styles.body}>
            Le patch se change généralement une fois par semaine pendant
            trois semaines, suivies d’une semaine sans patch.
          </Text>

          <View style={styles.checkList}>
            {APPLICATION_TIPS.map(item => (
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
          <Text style={styles.h2}>3. Ce qu’il faut savoir</Text>

          <Text style={styles.sectionIntro}>
            Les points essentiels à connaître avant et pendant son
            utilisation.
          </Text>

          {/* VISUAL FACT CARDS */}
          <View style={styles.factGrid}>
            {PATCH_FACTS.map(item => (
              <View key={item.title} style={styles.factCard}>
                <View style={styles.factIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={23}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.factTitle}>{item.title}</Text>

                <Text style={styles.factText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* ADVANTAGES / LIMITS SCHEMA */}
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <MaterialDesignIcons
                name="scale-balance"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.comparisonTitle}>
                Avantages & limites
              </Text>
            </View>

            <View style={styles.comparisonColumns}>
              {/* AVANTAGES */}
              <View style={styles.column}>
                <View style={styles.columnTitleRow}>
                  <MaterialDesignIcons
                    name="check-circle"
                    size={18}
                    color={theme.colors.success}
                  />

                  <Text style={styles.advantageTitle}>Avantages</Text>
                </View>

                <Text style={styles.columnItem}>
                  • Une application par semaine
                </Text>

                <Text style={styles.columnItem}>
                  • Pas de prise quotidienne
                </Text>

                <Text style={styles.columnItem}>
                  • Diffusion hormonale continue
                </Text>
              </View>

              {/* LIMITES */}
              <View style={styles.column}>
                <View style={styles.columnTitleRow}>
                  <MaterialDesignIcons
                    name="alert-circle"
                    size={18}
                    color={theme.colors.warning}
                  />

                  <Text style={styles.limitTitle}>Limites</Text>
                </View>

                {PATCH_LIMITS.map(item => (
                  <Text key={item} style={styles.columnItem}>
                    • {item}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* ALERT */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>

              <Text style={styles.tipText}>
                Une légère irritation peut apparaître à l’endroit de la
                pose. Alterner les zones d’application peut aider à
                limiter ce problème.
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. À retenir</Text>

          <View style={styles.rememberCard}>
            <View style={styles.rememberIcon}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.rememberContent}>
              <Text style={styles.rememberTitle}>
                Les 3 essentiels
              </Text>

              <View style={styles.rememberRow}>
                <Text style={styles.rememberNumber}>01</Text>
                <Text style={styles.rememberText}>
                  Changer le patch chaque semaine.
                </Text>
              </View>

              <View style={styles.rememberRow}>
                <Text style={styles.rememberNumber}>02</Text>
                <Text style={styles.rememberText}>
                  Vérifier régulièrement son adhérence.
                </Text>
              </View>

              <View style={styles.rememberRow}>
                <Text style={styles.rememberNumber}>03</Text>
                <Text style={styles.rememberText}>
                  Demander conseil à un professionnel de santé
                  si nécessaire.
                </Text>
              </View>
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

  sectionIntro: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textMuted,
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

  /* FACT CARDS */

  factGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
  },

  factCard: {
    width: '48.5%',
    minHeight: 145,
    padding: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  factIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginBottom: 9,
  },

  factTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  factText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* COMPARISON */

  comparisonCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },

  comparisonTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  comparisonColumns: {
    flexDirection: 'row',
    gap: 10,
  },

  column: {
    flex: 1,
    padding: 11,
    borderRadius: 11,
    backgroundColor: theme.colors.background,
  },

  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 9,
  },

  advantageTitle: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '800',
  },

  limitTitle: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '800',
  },

  columnItem: {
    marginBottom: 7,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
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

  /* ALERT */

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* REMEMBER */

  rememberCard: {
    marginTop: 14,
    padding: 15,
    flexDirection: 'row',
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  rememberIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  rememberContent: {
    flex: 1,
    marginLeft: 12,
  },

  rememberTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 8,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },

  rememberNumber: {
    width: 28,
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },

  rememberText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  });
}
