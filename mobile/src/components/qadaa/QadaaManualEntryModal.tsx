import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  addManualQadaaEntry,
  QADAA_MAX_DAYS_PER_ENTRY,
  QADAA_MAX_NOTE_LENGTH,
  updateManualQadaaEntry,
  type QadaaManualEntry,
} from '../../state/qadaaLedgerStore';
import {
  buildQadaaRamadanYearOptions,
  formatQadaaSubmitLabel,
  manualEntryToFormValues,
  parseQadaaQuantityText,
  stepQadaaQuantityText,
  validateQadaaManualForm,
  type QadaaManualFormField,
} from '../../utils/qadaaManualEntryForm';
import {classifySaveFailure, presentSaveFailure} from '../../services/saveFailure';

type Props = {
  visible: boolean;
  /** null → "add" mode; an entry → "edit" mode (only MANUAL entries are ever passed). */
  entry: QadaaManualEntry | null;
  onClose: () => void;
  /** Called after the entry has been persisted. */
  onSaved: (mode: 'added' | 'edited') => void;
};

const newSubmissionId = () => `qadaa-manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const DEFAULT_QUANTITY = '1';

/**
 * Add / correct a MANUAL Qadaa entry, in three numbered steps: how many days,
 * which Ramadan (or "ancien solde"), an optional note. It only builds the values
 * and hands them to the SAME ledger functions and the SAME validator as before
 * (validateQadaaManualForm → addManualQadaaEntry / updateManualQadaaEntry) — no
 * second counter, no second implementation.
 *
 * Layout: a card pinned to the top of the screen. Its title and the two buttons
 * are fixed; only the three steps scroll (so the buttons stay reachable on a small
 * phone, with or without the keyboard). The card sits inside a KeyboardAvoidingView
 * so the keyboard can never hide the fields, whichever resize mode the phone uses.
 * No exact date and no religious reason is ever asked for, and the Cycle 30-day
 * history limit does not apply: it never touches the menstrual history.
 */
function QadaaManualEntryModal({visible, entry, onClose, onSaved}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const editing = entry !== null;

  const [quantityText, setQuantityText] = useState(DEFAULT_QUANTITY);
  const [knowsYear, setKnowsYear] = useState(false);
  const [yearText, setYearText] = useState('');
  const [yearListOpen, setYearListOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<{field: QadaaManualFormField; message: string} | null>(null);
  const [saving, setSaving] = useState(false);
  // One id per opening of the form: submitting twice (double tap) can only ever
  // create ONE entry, even if the button were pressed again before it disabled.
  const submissionId = useRef(newSubmissionId());
  const submittingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  // Ramadans that can be picked (most recent first, ~50 years back). An existing
  // entry's own stored year is always kept selectable (see the util's doc).
  const yearOptions = useMemo(
    () => buildQadaaRamadanYearOptions(new Date(), entry && entry.year !== null && entry.yearSystem ? {year: entry.year, yearSystem: entry.yearSystem} : null),
    // Rebuilt each time the sheet opens, so "the latest Ramadan" is never stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entry, visible],
  );
  const selectedYearOption = yearOptions.find(option => String(option.year) === yearText);

  useEffect(() => {
    if (!visible) {return;}
    const initial = entry
      ? manualEntryToFormValues(entry)
      : {quantityText: DEFAULT_QUANTITY, knowsYear: false, yearText: '', note: ''};
    setQuantityText(initial.quantityText);
    setKnowsYear(initial.knowsYear);
    setYearText(initial.yearText);
    setYearListOpen(false);
    setNote(initial.note);
    setError(null);
    setSaving(false);
    submittingRef.current = false;
    submissionId.current = newSubmissionId();
  }, [visible, entry]);

  const quantity = parseQadaaQuantityText(quantityText);

  const changeQuantity = (delta: 1 | -1) => {
    setQuantityText(current => stepQadaaQuantityText(current, delta));
    if (error?.field === 'quantity') {setError(null);}
  };

  const submit = async () => {
    if (submittingRef.current) {return;}
    if (knowsYear && !yearText) {
      setError({field: 'year', message: t('qadaa.form.yearRequiredError')});
      return;
    }
    const result = validateQadaaManualForm({quantityText, knowsYear, yearText, note});
    if (!result.ok) {
      setError({field: result.field, message: result.message});
      return;
    }
    submittingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (entry) {
        await updateManualQadaaEntry(entry.id, result.value);
      } else {
        await addManualQadaaEntry({...result.value, id: submissionId.current});
      }
      onSaved(entry ? 'edited' : 'added');
      onClose();
    } catch (saveError) {
      submittingRef.current = false;
      setSaving(false);
      setError({field: 'quantity', message: t('qadaa.form.saveFailedError')});
      // An unreadable record gets the shared message that points to the recovery screen (the form keeps its draft).
      if (classifySaveFailure(saveError) === 'unavailable') {presentSaveFailure(saveError);}
    }
  };

  const stepTitle = (index: number, title: string) => (
    <View style={styles.stepHeader}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{index}</Text>
      </View>
      <Text accessibilityRole="header" style={styles.stepTitle}>{title}</Text>
    </View>
  );

  const radioCard = (selected: boolean, title: string, subtitle: string, onPress: () => void) => (
    <Pressable
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityRole="radio"
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [styles.radioCard, selected && styles.radioCardSelected, pressed && styles.pressed]}>
      <View style={[styles.radioDot, selected && styles.radioDotSelected]}>
        {selected ? <View style={styles.radioDotInner} /> : null}
      </View>
      <View style={styles.radioCopy}>
        <Text style={[styles.radioTitle, selected && styles.radioTitleSelected]}>{title}</Text>
        <Text style={styles.radioSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );

  const canDecrease = quantity !== null && quantity > 1;
  const canIncrease = quantity === null || quantity < QADAA_MAX_DAYS_PER_ENTRY;

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
        <Pressable accessibilityLabel={t('common.close')} onPress={onClose} style={styles.overlay} />
        <View style={[styles.card, {marginTop: Math.max(insets.top, 16) + 8, marginBottom: Math.max(insets.bottom, 16)}]}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}>
            <Text accessibilityRole="header" style={styles.title}>
              {editing ? t('qadaa.form.titleEdit') : t('qadaa.form.titleAdd')}
            </Text>
            <Text style={styles.description}>
              {t('qadaa.form.description')}
            </Text>

            {/* 1 — how many days */}
            {stepTitle(1, t('qadaa.form.step1Title'))}
            <View style={[styles.stepper, error?.field === 'quantity' && styles.fieldError]}>
              <TextInput
                accessibilityLabel={t('qadaa.form.quantityAccessibility')}
                keyboardType="number-pad"
                maxLength={4}
                onChangeText={text => {
                  setQuantityText(text);
                  if (error?.field === 'quantity') {setError(null);}
                }}
                selectTextOnFocus
                style={styles.stepperInput}
                value={quantityText}
              />
              <Pressable
                accessibilityLabel={t('qadaa.form.decreaseAccessibility')}
                accessibilityRole="button"
                accessibilityState={{disabled: !canDecrease}}
                disabled={!canDecrease}
                hitSlop={4}
                onPress={() => changeQuantity(-1)}
                style={({pressed}) => [styles.stepperButton, !canDecrease && styles.stepperButtonDisabled, pressed && styles.pressed]}>
                <MaterialDesignIcons color={theme.colors.primary} name="minus" size={22} />
              </Pressable>
              <View style={styles.stepperDivider} />
              <Pressable
                accessibilityLabel={t('qadaa.form.increaseAccessibility')}
                accessibilityRole="button"
                accessibilityState={{disabled: !canIncrease}}
                disabled={!canIncrease}
                hitSlop={4}
                onPress={() => changeQuantity(1)}
                style={({pressed}) => [styles.stepperButton, !canIncrease && styles.stepperButtonDisabled, pressed && styles.pressed]}>
                <MaterialDesignIcons color={theme.colors.primary} name="plus" size={22} />
              </Pressable>
            </View>
            {error?.field === 'quantity' ? (
              <Text accessibilityRole="alert" style={styles.error}>{error.message}</Text>
            ) : (
              <Text style={styles.helper}>{t('qadaa.form.quantityHelper')}</Text>
            )}

            {/* 2 — which Ramadan */}
            {stepTitle(2, t('qadaa.form.step2Title'))}
            <View accessibilityRole="radiogroup" style={styles.radioGroup}>
              {radioCard(knowsYear, t('qadaa.form.knowsYearTitle'), t('qadaa.form.knowsYearSubtitle'), () => setKnowsYear(true))}
              {radioCard(!knowsYear, t('qadaa.form.unknownYearTitle'), t('qadaa.form.unknownYearSubtitle'), () => {
                setKnowsYear(false);
                setYearListOpen(false);
                if (error?.field === 'year') {setError(null);}
              })}
            </View>

            {knowsYear ? (
              <View style={styles.yearBlock}>
                <Text style={styles.fieldLabel}>{t('qadaa.form.yearFieldLabel')}</Text>
                <Pressable
                  accessibilityLabel={t('qadaa.form.yearAccessibility', {value: selectedYearOption?.label ?? t('qadaa.form.yearNotChosen')})}
                  accessibilityRole="button"
                  accessibilityState={{expanded: yearListOpen}}
                  onPress={() => setYearListOpen(open => !open)}
                  style={({pressed}) => [styles.select, error?.field === 'year' && styles.fieldError, pressed && styles.pressed]}>
                  <Text style={[styles.selectValue, !selectedYearOption && styles.selectPlaceholder]}>
                    {selectedYearOption?.label ?? t('qadaa.form.yearPlaceholder')}
                  </Text>
                  <MaterialDesignIcons
                    color={theme.colors.textSecondary}
                    name={yearListOpen ? 'chevron-up' : 'chevron-down'}
                    size={22}
                  />
                </Pressable>
                {yearListOpen ? (
                  <ScrollView
                    accessibilityLabel={t('qadaa.form.yearListAccessibility')}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    style={styles.yearList}>
                    {yearOptions.map(option => {
                      const selected = String(option.year) === yearText;
                      return (
                        <Pressable
                          key={`${option.yearSystem}-${option.year}`}
                          accessibilityLabel={option.label}
                          accessibilityRole="radio"
                          accessibilityState={{selected}}
                          onPress={() => {
                            setYearText(String(option.year));
                            setYearListOpen(false);
                            if (error?.field === 'year') {setError(null);}
                          }}
                          style={({pressed}) => [styles.yearRow, selected && styles.yearRowSelected, pressed && styles.pressed]}>
                          <Text style={[styles.yearRowText, selected && styles.yearRowTextSelected]}>{option.label}</Text>
                          {selected ? <MaterialDesignIcons color={theme.colors.primary} name="check" size={18} /> : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
                {error?.field === 'year' ? (
                  <Text accessibilityRole="alert" style={styles.error}>{error.message}</Text>
                ) : null}
              </View>
            ) : null}

            {/* 3 — optional note */}
            {stepTitle(3, t('qadaa.form.step3Title'))}
            <TextInput
              accessibilityLabel={t('qadaa.form.noteAccessibility')}
              maxLength={QADAA_MAX_NOTE_LENGTH}
              multiline
              onChangeText={setNote}
              onFocus={() => {
                // Keep the note in view once the keyboard is up.
                setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 250);
              }}
              placeholder={t('qadaa.form.notePlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              style={styles.noteInput}
              textAlignVertical="top"
              value={note}
            />
            <Text accessibilityLabel={t('qadaa.form.noteCounterAccessibility', {length: note.length, max: QADAA_MAX_NOTE_LENGTH})} style={styles.counter}>
              {note.length}/{QADAA_MAX_NOTE_LENGTH}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityLabel={formatQadaaSubmitLabel(quantityText, editing)}
              accessibilityRole="button"
              accessibilityState={{disabled: saving}}
              disabled={saving}
              onPress={submit}
              style={({pressed}) => [styles.confirm, (pressed || saving) && styles.pressed]}>
              <Text style={styles.confirmText}>{saving ? t('qadaa.saving') : formatQadaaSubmitLabel(quantityText, editing)}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('qadaa.form.cancel')}
              accessibilityRole="button"
              disabled={saving}
              onPress={onClose}
              style={({pressed}) => [styles.cancel, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>{t('qadaa.form.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    root: {flex: 1, justifyContent: 'flex-start'},
    overlay: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.45)},
    card: {
      flexShrink: 1,
      marginHorizontal: 16,
      overflow: 'hidden',
      borderRadius: homeRadii.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      elevation: 12,
    },
    scroll: {flexShrink: 1},
    scrollContent: {paddingHorizontal: 18, paddingTop: 20, paddingBottom: 12},
    title: {color: theme.colors.text, fontFamily: 'serif', fontSize: 22, fontWeight: '700', lineHeight: 28},
    description: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},
    stepHeader: {marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 10},
    stepBadge: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: theme.colors.primarySoft,
    },
    stepBadgeText: {color: theme.colors.primary, fontSize: 13, fontWeight: '800'},
    stepTitle: {flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20},
    stepper: {
      marginTop: 12,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: homeRadii.button,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    stepperInput: {flex: 1, minHeight: 50, paddingHorizontal: 14, color: theme.colors.text, fontSize: 18, fontWeight: '700'},
    stepperButton: {width: 52, minHeight: 50, alignItems: 'center', justifyContent: 'center'},
    stepperButtonDisabled: {opacity: 0.35},
    stepperDivider: {width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 10, backgroundColor: theme.colors.border},
    fieldError: {borderColor: theme.colors.danger},
    helper: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
    error: {marginTop: 6, color: theme.colors.danger, fontSize: 12.5, lineHeight: 18},
    radioGroup: {marginTop: 12, gap: 10},
    radioCard: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: homeRadii.button,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    radioCardSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    radioDot: {
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    radioDotSelected: {borderColor: theme.colors.primary},
    radioDotInner: {width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary},
    radioCopy: {flex: 1},
    radioTitle: {color: theme.colors.text, fontSize: 14, fontWeight: '700'},
    radioTitleSelected: {color: theme.colors.primary},
    radioSubtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
    yearBlock: {marginTop: 14},
    fieldLabel: {color: theme.colors.text, fontSize: 13, fontWeight: '700'},
    select: {
      marginTop: 8,
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: homeRadii.button,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 14,
    },
    selectValue: {flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '600'},
    selectPlaceholder: {color: theme.colors.textMuted, fontWeight: '400'},
    yearList: {
      marginTop: 6,
      maxHeight: 220,
      borderRadius: homeRadii.button,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    yearRow: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
    },
    yearRowSelected: {backgroundColor: theme.colors.primarySoft},
    yearRowText: {color: theme.colors.text, fontSize: 14},
    yearRowTextSelected: {color: theme.colors.primary, fontWeight: '700'},
    noteInput: {
      marginTop: 12,
      minHeight: 72,
      borderRadius: homeRadii.button,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.colors.text,
      fontSize: 14,
    },
    counter: {marginTop: 6, alignSelf: 'flex-end', color: theme.colors.textSecondary, fontSize: 12},
    footer: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    confirm: {
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
    },
    confirmText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700', textAlign: 'center'},
    cancel: {marginTop: 2, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
    cancelText: {color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600'},
    pressed: {opacity: 0.85},
  });
}

export default memo(QadaaManualEntryModal);
