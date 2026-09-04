import React, {useMemo} from 'react';
import {type LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {useArticleReadingProgress, type ReadingStatus} from '../../hooks/useArticleReadingProgress';
import {getReadingSessionState} from '../../state/libraryStore';

// PHASE C — no reading meaning here at all (no health/tracking semantics),
// every color is decorative chrome, fully migrated to `useAwaTheme()`.

export type ReadingControlsProps = {
  articleId: string;
  durationMinutes: number;
  scrollRef: React.RefObject<ScrollView | null>;
  /** Fires with this component's own real rendered height (its `bottomReadingArea`
   * root is `position: absolute`, so a wrapping View can't measure it via its own
   * layout — this reports the true height directly). Optional: existing callers
   * that don't pass it keep their exact current behavior. A caller can use this
   * to reserve exactly enough scroll bottom-padding for the real card height —
   * which grows once reading starts (the added progress-bar row) — instead of a
   * fixed estimate. */
  onLayout?: (event: LayoutChangeEvent) => void;
};

// "45 s restantes" under a minute; otherwise minutes (+seconds when
// `precise`, used for the live "reading" countdown — paused/finished states
// pass `precise=false` to round to whole minutes instead).
function formatRemaining(remainingSeconds: number, precise: boolean): string {
  const rounded = Math.max(0, Math.round(remainingSeconds));
  if (rounded < 60) {
    return `${rounded} s restantes`;
  }
  const minutes = precise ? Math.floor(rounded / 60) : Math.ceil(rounded / 60);
  const seconds = precise ? rounded % 60 : 0;
  const suffix = minutes === 1 && seconds === 0 ? 'restante' : 'restantes';
  if (seconds > 0) {
    return `${minutes} min ${seconds} s ${suffix}`;
  }
  return `${minutes} min ${suffix}`;
}

function cardCopyFor(status: ReadingStatus, durationMinutes: number, remainingSeconds: number): {title: string; subtitle: string} {
  if (status === 'not_started') {
    return {title: 'Commencer la lecture', subtitle: `${durationMinutes} min de lecture`};
  }
  if (status === 'reading') {
    return {title: 'Lecture en cours', subtitle: formatRemaining(remainingSeconds, true)};
  }
  if (status === 'finished') {
    return {title: 'Reprendre la lecture', subtitle: 'Lecture terminée'};
  }
  return {title: 'Reprendre la lecture', subtitle: formatRemaining(remainingSeconds, false)};
}

function cardIconFor(status: ReadingStatus): {name: React.ComponentProps<typeof MaterialDesignIcons>['name']} {
  if (status === 'reading') {return {name: 'pause'};}
  if (status === 'finished') {return {name: 'check-circle-outline'};}
  return {name: 'play'};
}

function buttonCopyFor(status: ReadingStatus): {label: string; icon: React.ComponentProps<typeof MaterialDesignIcons>['name']} {
  if (status === 'reading') {return {label: 'Mettre en pause', icon: 'pause'};}
  if (status === 'paused') {return {label: 'Reprendre la lecture', icon: 'play'};}
  if (status === 'finished') {return {label: 'Article terminé', icon: 'check-circle'};}
  return {label: 'Commencer à lire', icon: 'play'};
}

function ReadingControls({articleId, durationMinutes, scrollRef, onLayout}: ReadingControlsProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {status, remainingSeconds, progressPercent, start, pause} = useArticleReadingProgress({articleId, durationMinutes});

  const scrollToSavedPosition = () => {
    const {lastScrollPosition} = getReadingSessionState(articleId);
    scrollRef.current?.scrollTo({y: lastScrollPosition, animated: true});
  };

  const handleCardPress = () => {
    if (status === 'not_started') {start(); return;}
    if (status === 'reading') {pause(); return;}
    if (status === 'paused') {start(); return;}
    scrollToSavedPosition();
  };

  const handleButtonPress = () => {
    if (status === 'not_started') {start(); return;}
    if (status === 'reading') {pause(); return;}
    if (status === 'paused') {start(); return;}
    // finished: button stays visually active but does nothing — the article
    // is already complete and must not restart the timer.
  };

  const {title, subtitle} = cardCopyFor(status, durationMinutes, remainingSeconds);
  const cardIcon = cardIconFor(status);
  const buttonCopy = buttonCopyFor(status);
  const showMeta = status !== 'not_started';
  const roundedPercent = Math.round(progressPercent);

  return (
    <View
      onLayout={onLayout}
      style={[styles.bottomReadingArea, {paddingBottom: Math.max(insets.bottom, 10) + 10}]}>
      <Pressable
        accessibilityLabel={`${title}. ${subtitle}`}
        accessibilityRole="button"
        onPress={handleCardPress}
        style={({pressed}) => [styles.resumeCard, pressed && styles.pressed]}>
        <View style={styles.resumeIconWrap}>
          <MaterialDesignIcons color={theme.colors.primary} name={cardIcon.name} size={20} />
        </View>

        <View style={styles.resumeCopy}>
          <View style={styles.resumeTopRow}>
            <Text numberOfLines={1} style={styles.resumeTitle}>{title}</Text>
            {showMeta && <Text style={styles.resumePercent}>{roundedPercent}%</Text>}
          </View>
          <Text numberOfLines={1} style={styles.resumeSubtitle}>{subtitle}</Text>
          {showMeta && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${roundedPercent}%`}]} />
            </View>
          )}
        </View>

        <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={20} style={styles.chevron} />
      </Pressable>

      <Pressable
        accessibilityLabel={buttonCopy.label}
        accessibilityRole="button"
        onPress={handleButtonPress}
        style={({pressed}) => [styles.primaryReadingButton, pressed && styles.pressed]}>
        <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={buttonCopy.icon} size={19} />
        <Text style={styles.primaryReadingText}>{buttonCopy.label}</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    bottomReadingArea: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 10,
      backgroundColor: withAlpha(theme.colors.surface, 0.98),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    resumeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 66,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 9,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 1,
    },
    resumeIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      flexShrink: 0,
    },
    resumeCopy: {flex: 1, minWidth: 0},
    resumeTopRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
    resumeTitle: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    resumePercent: {color: theme.colors.primary, fontSize: 13, fontWeight: '700'},
    resumeSubtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11},
    progressTrack: {marginTop: 6, height: 4, borderRadius: 2, backgroundColor: theme.colors.primarySoft, overflow: 'hidden'},
    progressFill: {height: '100%', borderRadius: 2, backgroundColor: theme.colors.primary},
    chevron: {flexShrink: 0},
    primaryReadingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 56,
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.16,
      shadowRadius: 10,
      elevation: 3,
    },
    primaryReadingText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '800'},
    pressed: {opacity: 0.85},
  });
}

export default ReadingControls;
