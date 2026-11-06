import React, {useMemo} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import type {ObjectiveId} from '../../state/onboardingPreferences';
import '../../i18n';
import {getLibraryConfigForObjective, type LibraryGroupId} from '../../data/libraryObjectiveConfig';
import {getArticleThumbnail, getGroupCover} from '../../data/libraryCovers';
import {getLibraryArticles, type LibraryArticle} from '../../data/libraryContent';
import {ArticlePremiumBadge} from '../library/ArticlePremiumBadge';
import {AwaButton} from '../ui/AwaButton';
import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AWA_DISPLAY_FONT} from '../../theme/awaTypography';

// "Pour t'accompagner" (the article categories of the objective, in the order its Library configuration gives them) and
// "Derniers articles" (the newest articles first, then the objective's curated ones). Shared by every objective Dashboard.
//
// Data always comes from the canonical Library source (libraryContent.ts + libraryObjectiveConfig.ts), never a second list.
// Covers come from src/assets/images/cover through data/libraryCovers.ts. A missing id is silently filtered out; with no real
// article at all the "Derniers articles" block renders nothing rather than an empty card.

const LATEST_COUNT = 3;

type Props = {
  objective: ObjectiveId;
  /** Bound by the caller to its own already-correctly-typed `navigation` object (composite navigation prop types do not
   * structurally satisfy a plain `NavigationProp<RootStackParamList>` parameter). */
  onOpenArticle: (articleId: string) => void;
  /** Opens the Library with this category already ticked. */
  onOpenCategory: (groupId: LibraryGroupId) => void;
  onSeeAll: () => void;
};

function SectionHeader({title, icon, onSeeAll, styles, seeAllLabel, color, tile}: {
  /** Puts the icon in a soft rounded tile (the "Derniers articles" header). */
  tile?: boolean;
  title: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  onSeeAll: () => void;
  styles: ReturnType<typeof createStyles>;
  seeAllLabel: string;
  color: string;
}) {
  return (
    <View style={styles.header}>
      {tile ? (
        <View style={styles.iconTile}>
          <MaterialDesignIcons color={color} name={icon} size={24} />
        </View>
      ) : (
        <MaterialDesignIcons color={color} name={icon} size={28} />
      )}
      <Text accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.headerTitle}>{title}</Text>
      <View style={styles.seeAll}>
        <AwaButton hitSlop={8} label={seeAllLabel} onPress={onSeeAll} size="compact" variant="text" />
      </View>
    </View>
  );
}

function ObjectiveArticlesSection({objective, onOpenArticle, onOpenCategory, onSeeAll}: Props): React.JSX.Element | null {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const groups = useMemo(() => getLibraryConfigForObjective(objective).categoryOrder, [objective]);

  // The objective's own curated articles (never a second list), the newly published ones first.
  const latest = useMemo(() => {
    const byId = new Map(getLibraryArticles(t).map(article => [article.id, article]));
    return getLibraryConfigForObjective(objective).recommendedArticleIds
      .map(id => byId.get(id))
      .filter((article): article is LibraryArticle => Boolean(article))
      .map((article, index) => ({article, index}))
      .sort((x, y) => Number(Boolean(y.article.isNew)) - Number(Boolean(x.article.isNew)) || x.index - y.index)
      .slice(0, LATEST_COUNT)
      .map(item => item.article);
  }, [objective, t]);

  const seeAll = t('objectiveArticles.seeAll');

  return (
    <View style={styles.root}>
      <SectionHeader
        color={theme.colors.primary}
        icon="flower-outline"
        onSeeAll={onSeeAll}
        seeAllLabel={seeAll}
        styles={styles}
        title={t('objectiveArticles.title')}
      />

      <ScrollView contentContainerStyle={styles.tiles} horizontal showsHorizontalScrollIndicator={false} style={styles.tilesScroll}>
        {groups.map(groupId => {
          const label = t(`library.screen.categoryTiles.${groupId}.label`).replace('\n', ' ');

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="button"
              key={groupId}
              onPress={() => onOpenCategory(groupId)}
              style={({pressed}) => [styles.tile, pressed && styles.pressed]}>
              <Image resizeMode="cover" source={getGroupCover(groupId)} style={styles.tileImage} />
              <View style={styles.tileLabelWrap}>
                <Text numberOfLines={2} style={styles.tileLabel}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {latest.length > 0 ? (
        <>
          <SectionHeader
            color={theme.colors.primary}
            icon="newspaper-variant-outline"
            onSeeAll={onSeeAll}
            seeAllLabel={seeAll}
            styles={styles}
            tile
            title={t('objectiveArticles.latestTitle')}
          />

          {latest.map(article => (
            <Pressable
              accessibilityLabel={article.title}
              accessibilityRole="button"
              key={article.id}
              onPress={() => onOpenArticle(article.id)}
              style={({pressed}) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.rowImageBox}>
                <Image resizeMode="cover" source={getArticleThumbnail(article.categoryId, article.id)} style={styles.rowImage} />
              </View>

              <View style={styles.rowCopy}>
                <Text numberOfLines={2} style={styles.rowTitle}>{article.title}</Text>
                <ArticlePremiumBadge article={article} />
                <View style={styles.rowMeta}>
                  <MaterialDesignIcons color={theme.colors.textSecondary} name="clock-outline" size={14} />
                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                    {t('objectiveArticles.readingMinutes', {count: article.durationMinutes})}
                  </AwaText>
                </View>
              </View>

              <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={22} style={styles.chevron} />
            </Pressable>
          ))}
        </>
      ) : null}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    // the bottom margin keeps the last card clear of the raised "+" button of the floating tab bar
    root: {marginTop: 24, marginBottom: 24},
    header: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4},
    iconTile: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(theme.colors.primary, 0.18)},
    seeAll: {flexShrink: 0, flexDirection: 'row', alignItems: 'center', marginRight: -4},
    headerTitle: {flex: 1, flexShrink: 1, minWidth: 0, color: theme.colors.text, fontFamily: AWA_DISPLAY_FONT, fontSize: 19, lineHeight: 26, fontWeight: '600'},

    tilesScroll: {marginTop: 14, marginHorizontal: -16},
    tiles: {gap: 10, paddingHorizontal: 16, paddingBottom: 4},
    tile: {width: 112, borderRadius: 18, overflow: 'hidden', backgroundColor: theme.colors.surface},
    tileImage: {width: '100%', height: 104},
    tileLabelWrap: {minHeight: 46, paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(theme.colors.primary, 0.14)},
    tileLabel: {color: theme.colors.text, fontSize: 13, lineHeight: 16, fontWeight: '600', textAlign: 'center'},

    // compact horizontal card: fixed height, fixed 110 x 110 image box, flexible text
    row: {
      marginTop: 14,
      height: 120,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: withAlpha(theme.colors.surface, 0.6),
      overflow: 'hidden',
    },
    rowImageBox: {width: 110, height: 110, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.surfaceSecondary},
    rowImage: {width: '100%', height: '100%'},
    rowCopy: {flex: 1, flexShrink: 1, minWidth: 0, paddingLeft: 12, paddingRight: 4, justifyContent: 'center'},
    rowTitle: {flexShrink: 1, color: theme.colors.text, fontFamily: AWA_DISPLAY_FONT, fontSize: 17, lineHeight: 22, fontWeight: '600'},
    rowMeta: {marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6},
    chevron: {marginHorizontal: 8, alignSelf: 'center'},
    pressed: {opacity: 0.82, transform: [{scale: 0.98}]},
  });
}

export default ObjectiveArticlesSection;
