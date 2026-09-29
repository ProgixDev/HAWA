import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  JournalSaveToast,
  useJournalSaveToast,
} from '../journal/JournalSaveToast';
import { getFloatingTabBarClearance } from '../../theme/spacing';
import {
  clearPostpartumSuccessToast,
  getPostpartumSuccessToast,
  subscribePostpartumSuccessToast,
} from '../../state/postpartumSuccessToastStore';
// i18n (Phase 3): this component renders no hardcoded French text of its
// own — `title`/`message` are plain string PROPS supplied by whichever
// caller requests the toast (PostpartumJournalEntryScreen, via
// showPostpartumSuccessToast(...)), so the actual translated copy lives
// there (postpartumJournalEntry namespace), not here. Kept as a defensive
// side-effect import for consistency with the rest of this i18n pass.
import '../../i18n';

// Postpartum save confirmations ("Fatigue enregistrée", "Sommeil enregistré"...)
// are requested through postpartumSuccessToastStore by
// PostpartumJournalEntryScreen and shown here, on the Postpartum Home, once the
// user is back on the dashboard. The toast itself is AWA's shared save toast
// (JournalSaveToast — the same component every other objective uses): it resolves
// its colors from the selected theme (Light / Dark, live) and is positioned at the
// BOTTOM, above the floating tab bar and the device's bottom inset
// (getFloatingTabBarClearance, the helper every main-tab screen already uses to
// clear that bar). Nothing here decides WHEN a toast is shown or what it says.
export function PostpartumSuccessToast(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState(getPostpartumSuccessToast);
  const toast = useJournalSaveToast();
  // `show` is recreated every render; the effect below must only react to a NEW request.
  const showRef = useRef(toast.show);
  showRef.current = toast.show;

  useEffect(
    () =>
      subscribePostpartumSuccessToast(() =>
        setRequest(getPostpartumSuccessToast()),
      ),
    [],
  );

  useEffect(() => {
    if (!request) {
      return;
    }
    showRef.current(request.title, request.message, () =>
      clearPostpartumSuccessToast(),
    );
  }, [request]);

  return (
    <JournalSaveToast
      animation={toast.animation}
      bottom={getFloatingTabBarClearance(insets.bottom, 8)}
      message={toast.message}
      onDismiss={() => {
        toast.hide();
        clearPostpartumSuccessToast();
      }}
      title={toast.title}
      visible={toast.visible}
    />
  );
}
