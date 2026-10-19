import React, {memo, useState} from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';

type Props = {
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  onPressFilters: () => void;
  activeFilterCount: number;
  onBack: () => void;
};

function LibraryHeader({searchQuery, onChangeSearch, onPressFilters, activeFilterCount, onBack}: Props): React.JSX.Element {
  const {roles} = useAwaTokens();
  const insets = useSafeAreaInsets();
  const topSpacing = Math.max(insets.top + 8, 16);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.header, {paddingTop: topSpacing}]}>
      <View style={styles.headerRow}>
        <AwaIconButton accessibilityLabel="Retour" icon="chevron-left" onPress={onBack} />

        <View style={styles.headerCopy}>
          <AwaText variant="headlineSmall" weight="700">
            Bibliothèque
          </AwaText>
          <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
            Apprends, comprends et prends soin de toi 💜
          </AwaText>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: roles.surfaceContainer,
              borderColor: focused ? roles.primary : roles.outline,
            },
          ]}>
          <MaterialDesignIcons
            color={focused ? roles.accessible.primaryAsText : roles.accessible.onSurfaceVariant}
            name="magnify"
            size={20}
          />
          <TextInput
            accessibilityLabel="Rechercher un article ou un sujet"
            onBlur={() => setFocused(false)}
            onChangeText={onChangeSearch}
            onFocus={() => setFocused(true)}
            placeholder="Rechercher un article, un sujet…"
            placeholderTextColor={roles.accessible.onSurfaceVariant}
            returnKeyType="search"
            style={[styles.searchInput, {color: roles.onSurface}]}
            value={searchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              accessibilityLabel="Effacer la recherche"
              accessibilityRole="button"
              hitSlop={16}
              onPress={() => onChangeSearch('')}>
              <MaterialDesignIcons color={roles.accessible.onSurfaceVariant} name="close-circle" size={18} />
            </Pressable>
          )}
        </View>

        <AwaButton
          accessibilityLabel={`Filtres${activeFilterCount > 0 ? `, ${activeFilterCount} actifs` : ''}`}
          icon="tune-variant"
          label={activeFilterCount > 0 ? `Filtres (${activeFilterCount})` : 'Filtres'}
          onPress={onPressFilters}
          size="default"
          variant="tonal"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {paddingHorizontal: 16, paddingBottom: 4},
  headerRow: {flexDirection: 'row', alignItems: 'center'},
  headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 12},
  subtitle: {marginTop: 4},
  searchRow: {flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8},
  searchBar: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: {flex: 1, minWidth: 0, fontSize: 16, padding: 0},
});

export default memo(LibraryHeader);
