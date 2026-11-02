import React, {useEffect, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

import {
  LAYOUT_RESTART_COPY,
  closeAppForLayoutDirection,
  layoutDirectionRestartNeeded,
  layoutDirectionRestartTarget,
  subscribeLayoutDirection,
} from '../../i18n/layoutDirection';
import {useAwaTheme} from '../../theme/AwaThemeProvider';

// Shown when the language just chosen needs the other layout direction (to or from Arabic) than the one running: React Native applies it at the next
// start, so the prompt asks the user to close and reopen AWA. The language is already saved. "Later" keeps using AWA in the current direction.
// Mounted once in App.tsx; renders nothing while the direction already matches.

export function LayoutDirectionRestartPrompt(): React.JSX.Element | null {
  const {theme} = useAwaTheme();
  const [needed, setNeeded] = useState(layoutDirectionRestartNeeded());
  const [target, setTarget] = useState(layoutDirectionRestartTarget());
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeLayoutDirection(() => {
        setNeeded(layoutDirectionRestartNeeded());
        setTarget(layoutDirectionRestartTarget());
      }),
    [],
  );

  if (!needed || dismissedFor === target) {
    return null;
  }
  const copy = target === 'ar' ? LAYOUT_RESTART_COPY.ar : LAYOUT_RESTART_COPY.en;
  return (
    <Modal animationType="fade" onRequestClose={() => setDismissedFor(target)} transparent visible>
      <View style={styles.backdrop}>
        <View style={[styles.card, {backgroundColor: theme.colors.surface}]} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={[styles.title, {color: theme.colors.text}]}>
            {copy.title}
          </Text>
          <Text style={[styles.message, {color: theme.colors.textSecondary}]}>{copy.message}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => setDismissedFor(target)} style={styles.secondary}>
              <Text style={[styles.secondaryText, {color: theme.colors.primary}]}>{copy.later}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={closeAppForLayoutDirection}
              style={[styles.primary, {backgroundColor: theme.colors.primary}]}>
              <Text style={styles.primaryText}>{copy.action}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 24},
  card: {width: '100%', maxWidth: 420, borderRadius: 20, padding: 22},
  title: {fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center'},
  message: {fontSize: 15, lineHeight: 23, textAlign: 'center'},
  actions: {flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap'},
  secondary: {minHeight: 48, minWidth: 96, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16},
  secondaryText: {fontSize: 15, fontWeight: '600'},
  primary: {minHeight: 48, minWidth: 140, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingHorizontal: 20},
  primaryText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},
});
