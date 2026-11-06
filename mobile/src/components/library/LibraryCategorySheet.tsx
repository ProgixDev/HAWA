import React, {memo, useEffect, useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaText} from '../ui/AwaText';

export type LibraryCategoryOption = {id: string; label: string};

type Props = {
  visible: boolean;
  options: LibraryCategoryOption[];
  /** Categories ticked when the sheet opens. */
  selectedIds: string[];
  onApply: (ids: string[]) => void;
  onClose: () => void;
};

// The Library's category filter: a bottom sheet with one check box per category. Ticking only edits a draft; "Appliquer" commits it,
// "Réinitialiser" clears the draft.
function LibraryCategorySheet({visible, options, selectedIds, onApply, onClose}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [draft, setDraft] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (visible) {
      setDraft(selectedIds);
    }
  }, [visible, selectedIds]);

  const toggle = (id: string) =>
    setDraft(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]));

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={t('common.close')} onPress={onClose} style={styles.scrim} />

        <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 12) + 4}]}>
          <View style={styles.handle} />

          <AwaText style={styles.title} variant="titleLarge" weight="700">
            {t('library.screen.categoriesTitle')}
          </AwaText>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {options.map(option => {
              const checked = draft.includes(option.id);

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked}}
                  onPress={() => toggle(option.id)}
                  style={styles.row}>
                  <View style={[styles.box, checked && styles.boxChecked]}>
                    {checked ? <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={16} /> : null}
                  </View>

                  <AwaText style={styles.label} variant="bodyLarge">
                    {option.label}
                  </AwaText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <AwaButton label={t('library.screen.emptyReset')} onPress={() => setDraft([])} variant="text" />

            <AwaButton
              label={t('common.apply')}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={styles.apply}
              variant="filled"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    root: {flex: 1, justifyContent: 'flex-end'},
    scrim: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha('#000000', 0.5)},
    sheet: {
      maxHeight: '80%',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: theme.colors.surface,
    },
    handle: {width: 36, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: theme.colors.border},
    title: {marginTop: 16},
    list: {paddingTop: 8, paddingBottom: 8},
    row: {flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52},
    box: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxChecked: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
    label: {flex: 1, minWidth: 0},
    actions: {marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
    apply: {flex: 1, maxWidth: 200},
  });
}

export default memo(LibraryCategorySheet);
