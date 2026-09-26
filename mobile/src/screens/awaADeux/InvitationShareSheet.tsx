import React, {useMemo, useRef, useState} from 'react';
import {Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {DEMO_PAIRING_CODE} from './awaADeuxDemo';
import {INVITATION_MESSAGE, buildShareTargetUrl, type ShareTarget} from './awaADeuxInvitation';
import {useEntrance} from './useEntrance';

// "Partager l'invitation" — a bottom sheet. FRONTEND ONLY, DEMO code (AWA-7K4P9): AWA
// sends nothing; the phone's apps do.
//
//  - WhatsApp / Messages / Gmail: open that app's own "compose" link with the invitation
//    (whatsapp://send, sms:, mailto:), and fall back to the system share sheet when the
//    app cannot be opened. There are no official app icons in the project and none are
//    added: the shortcuts use neutral glyphs from the installed icon set, in theme colors.
//  - Instagram has no link that pre-fills a text, so it opens the system share sheet.
//  - "Copier le texte": AWA has no clipboard package (none is added in this phase), so
//    it opens the system share sheet, which offers "Copier" — no "Invitation copiée"
//    toast is shown because nothing is copied by AWA itself.
//  - "Plus d'options": the system share sheet.
//
// Colors: the resolved AWA theme only. Motion: Reanimated (opacity / transform only),
// skipped with reduced motion. The sheet slides up, its parts fade in one after another,
// and it slides down when closed with X, the backdrop or Android Back.

type Props = {
  visible: boolean;
  onClose: () => void;
};

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const APPS: Array<{target: ShareTarget; label: string; icon: IconName; unavailable: string}> = [
  {target: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', unavailable: 'WhatsApp n’est pas disponible sur cet appareil'},
  {target: 'sms', label: 'Messages', icon: 'message-text-outline', unavailable: 'Messages n’est pas disponible sur cet appareil'},
  {target: 'instagram', label: 'Instagram', icon: 'instagram', unavailable: ''},
  {target: 'gmail', label: 'Gmail', icon: 'gmail', unavailable: 'Aucune application e-mail n’est disponible sur cet appareil'},
];

const SLIDE_MS = 260;
const CLOSE_MS = 200;

function SheetContent({onClose, closeRef}: {onClose: () => void; closeRef: React.MutableRefObject<(() => void) | null>}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  // A short, non-technical line under the actions: an app that is missing, or a share sheet that failed.
  const [notice, setNotice] = useState('');
  const closing = useRef(false);

  // 0 = off screen, 1 = in place. Drives the backdrop and the slide.
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  React.useEffect(() => {
    if (!reduceMotion) {
      progress.value = withTiming(1, {duration: SLIDE_MS, easing: Easing.out(Easing.cubic)});
    }
  }, [reduceMotion, progress]);

  const backdropStyle = useAnimatedStyle(() => ({opacity: progress.value}));
  const sheetStyle = useAnimatedStyle(() => ({transform: [{translateY: (1 - progress.value) * height * 0.5}]}));

  // Slides down, then closes (once). Reduced motion: closes immediately.
  const requestClose = () => {
    if (closing.current) {return;}
    closing.current = true;
    if (reduceMotion) {
      onClose();
      return;
    }
    progress.value = withTiming(0, {duration: CLOSE_MS, easing: Easing.in(Easing.cubic)}, finished => {
      if (finished) {runOnJS(onClose)();}
    });
  };

  // Android Back (handled by the Modal) uses the same slide-down close.
  closeRef.current = requestClose;

  const headEntrance = useEntrance(120, 300, reduceMotion, 8);
  const appEntrances = [
    useEntrance(200, 260, reduceMotion, 8),
    useEntrance(250, 260, reduceMotion, 8),
    useEntrance(300, 260, reduceMotion, 8),
    useEntrance(350, 260, reduceMotion, 8),
  ];
  const actionsEntrance = useEntrance(420, 280, reduceMotion, 8);

  // The system share sheet (the OS lists the installed apps). Never throws.
  const systemShare = async (keepNotice = false) => {
    if (!keepNotice) {setNotice('');}
    try {
      await Share.share({message: INVITATION_MESSAGE});
    } catch {
      setNotice('Impossible d’ouvrir le partage pour le moment.');
    }
  };

  // Opens the app's own compose screen with the invitation pre-filled (never sends it: the
  // user picks the recipient and confirms). Sharing is NOT pairing: nothing here touches
  // the partner state. A missing app or a Linking failure never crashes: a plain message
  // is shown and the system share sheet opens instead.
  const shareVia = async (app: (typeof APPS)[number]) => {
    const url = buildShareTargetUrl(app.target);
    if (!url) {
      // Instagram has no link that pre-fills a text and there is no clipboard: the share sheet.
      await systemShare();
      return;
    }
    try {
      await Linking.openURL(url);
      setNotice('');
    } catch {
      setNotice(app.unavailable);
      await systemShare(true);
    }
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdropLayer, backdropStyle]}>
        <Pressable accessibilityLabel="Fermer" accessibilityRole="button" onPress={requestClose} style={styles.backdrop} />
      </Animated.View>

      <Animated.View accessibilityViewIsModal style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 16) + 12}, sheetStyle]}>
        <View importantForAccessibility="no-hide-descendants" style={styles.handle} />

        <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Animated.View style={headEntrance}>
            <View style={styles.header}>
              <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={styles.title}>Partager l’invitation</Text>
              <Pressable
                accessibilityLabel="Fermer"
                accessibilityRole="button"
                hitSlop={8}
                onPress={requestClose}
                style={({pressed}) => [styles.close, pressed && styles.pressed]}>
                <MaterialDesignIcons color={theme.colors.textSecondary} name="close" size={22} />
              </Pressable>
            </View>

            <View accessibilityLabel="Aperçu de l’invitation" style={styles.card}>
              <Text maxFontSizeMultiplier={1.2} style={styles.line}>Rejoins-moi sur AWA à deux 💜</Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.line}>
                {'Utilise ce code : '}
                <Text style={styles.code}>{DEMO_PAIRING_CODE}</Text>
                {'\npour te connecter et m’accompagner.'}
              </Text>
              <Text maxFontSizeMultiplier={1.2} style={[styles.line, styles.lastLine]}>Télécharge l’application AWA !</Text>
            </View>
          </Animated.View>

          <View style={styles.appsRow}>
            {APPS.map((app, index) => (
              <Animated.View key={app.target} style={[styles.appCell, appEntrances[index]]}>
                <Pressable
                  accessibilityLabel={app.label}
                  accessibilityRole="button"
                  onPress={() => shareVia(app)}
                  style={({pressed}) => [styles.app, pressed && styles.pressedScale]}>
                  <View style={styles.appIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name={app.icon} size={28} />
                  </View>
                  <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={styles.appLabel}>{app.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Animated.View style={[styles.actionsRow, actionsEntrance]}>
            <Pressable
              accessibilityHint="Ouvre le partage du téléphone, qui propose Copier"
              accessibilityLabel="Copier le texte"
              accessibilityRole="button"
              onPress={() => systemShare()}
              style={({pressed}) => [styles.action, pressed && styles.pressedScale]}>
              <View style={styles.actionIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="content-copy" size={24} />
              </View>
              <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={styles.appLabel}>Copier le texte</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Plus d’options"
              accessibilityRole="button"
              onPress={() => systemShare()}
              style={({pressed}) => [styles.action, pressed && styles.pressedScale]}>
              <View style={styles.actionIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="dots-horizontal" size={24} />
              </View>
              <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={styles.appLabel}>Plus d’options</Text>
            </Pressable>
          </Animated.View>

          {notice ? <Text accessibilityRole="alert" style={styles.error}>{notice}</Text> : null}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export default function InvitationShareSheet({visible, onClose}: Props): React.JSX.Element {
  const closeRef = useRef<(() => void) | null>(null);
  // The content is mounted only while the sheet is open, so it animates in on every opening.
  return (
    <Modal animationType="none" onRequestClose={() => (closeRef.current ?? onClose)()} statusBarTranslucent transparent visible={visible}>
      <SheetContent closeRef={closeRef} onClose={onClose} />
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    root: {flex: 1, justifyContent: 'flex-end'},
    backdropLayer: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.55)},
    backdrop: {flex: 1},
    sheet: {
      maxHeight: '92%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingTop: 10,
      elevation: 16,
    },
    handle: {alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: theme.colors.border},
    scroll: {flexGrow: 0, flexShrink: 1},
    content: {paddingHorizontal: 20, paddingTop: 6},
    header: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10},
    title: {flex: 1, color: theme.colors.text, fontFamily: 'serif', fontSize: 19, lineHeight: 25, fontWeight: '700'},
    close: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20},
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.2),
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    line: {color: theme.colors.text, fontSize: 14.5, lineHeight: 21},
    lastLine: {marginTop: 10},
    code: {color: theme.colors.accent, fontWeight: '800', letterSpacing: 0.5},
    appsRow: {marginTop: 18, flexDirection: 'row', justifyContent: 'space-between'},
    appCell: {flex: 1},
    app: {alignItems: 'center', gap: 7, paddingVertical: 2},
    appIcon: {
      width: 58,
      height: 58,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    appLabel: {color: theme.colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center'},
    actionsRow: {marginTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 28},
    action: {alignItems: 'center', gap: 7, minWidth: 96, paddingVertical: 2},
    actionIcon: {
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
    },
    error: {marginTop: 12, color: theme.colors.danger, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
    pressed: {opacity: 0.85},
    pressedScale: {opacity: 0.85, transform: [{scale: 0.97}]},
  });
}
