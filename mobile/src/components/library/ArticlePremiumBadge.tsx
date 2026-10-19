import React from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {isPremiumArticle, type LibraryArticle} from '../../data/libraryContent';
import {usePremium} from '../../hooks/usePremium';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaText} from '../ui/AwaText';

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
  const {t} = useTranslation();
  const {isPremium} = usePremium();
  const {roles} = useAwaTokens();

  if (!isPremiumArticle(article)) {
    return null;
  }

  return (
    <View
      accessibilityLabel={isPremium ? t('premium.articleBadge.unlocked') : t('premium.articleBadge.locked')}
      style={[styles.badge, {backgroundColor: roles.primaryContainer}]}>
      <MaterialDesignIcons
        color={roles.accessible.primaryAsText}
        name={isPremium ? 'crown' : 'lock-outline'}
        size={12}
      />
      <AwaText colorRole="primary" emphasized variant="labelSmall">{t('premium.articleBadge.label')}</AwaText>
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
