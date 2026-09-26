import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {isPremiumArticle, type LibraryArticle} from '../../data/libraryContent';
import {usePremium} from '../../hooks/usePremium';
import {homeColors} from '../home/homeTheme';

type Props = {
  article: Pick<LibraryArticle, 'premium'>;
};

/** THE single "this guide is Premium" affordance shared by every article
 * card/list surface (ArticleRow, RecommendedCarousel, ObjectiveArticlesSection…).
 * Renders nothing for a non-Premium article. The lock icon is only shown
 * while the reader is genuinely locked out (canonical usePremium() state);
 * a Premium user sees a crown instead. The actual gate is enforced by
 * ArticleReaderScreen — this badge is presentation only. */
export function ArticlePremiumBadge({article}: Props): React.JSX.Element | null {
  const {isPremium} = usePremium();

  if (!isPremiumArticle(article)) {
    return null;
  }

  return (
    <View
      accessibilityLabel={isPremium ? 'Contenu Premium' : 'Contenu Premium verrouillé'}
      style={styles.badge}>
      <MaterialDesignIcons color={homeColors.primary} name={isPremium ? 'crown' : 'lock-outline'} size={11} />
      <Text style={styles.text}>Premium</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: homeColors.lightLavender,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: {color: homeColors.primary, fontSize: 10, fontWeight: '800'},
});
