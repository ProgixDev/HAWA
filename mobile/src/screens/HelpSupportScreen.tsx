import React, {useMemo, useState} from 'react';
import {KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import '../i18n';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {APP_METADATA} from '../utils/appMetadata';
import {getCycleTrackingFaqItems, getFaqItems} from '../utils/supportContent';
import {getActiveProfileIdentity} from '../state/activeProfileStore';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type Form = 'feedback' | 'bug' | null;

function HelpRow({icon, title, subtitle, onPress, last, theme, styles}: {
  icon: IconName; title: string; subtitle: string; onPress: () => void; last?: boolean;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable accessibilityLabel={title} onPress={onPress} style={({pressed}) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={19} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} />
    </Pressable>
  );
}

function Method({icon, title, value, helper, onPress, theme, styles}: {
  icon: IconName; title: string; value: string; helper: string; onPress: () => void;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable accessibilityLabel={title} onPress={onPress} style={({pressed}) => [styles.method, pressed && styles.pressed]}>
      <View style={styles.methodIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={22} />
      </View>
      <Text style={styles.methodTitle}>{title}</Text>
      <Text style={styles.methodValue}>{value}</Text>
      <Text style={styles.methodHelper}>{helper}</Text>
    </Pressable>
  );
}

export default function HelpSupportScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [toast, setToast] = useState('');
  const [form, setForm] = useState<Form>(null);
  const [category, setCategory] = useState(t('help.helpSupport.modal.feedbackCategories.suggestion'));
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [steps, setSteps] = useState('');
  const [error, setError] = useState('');
  // A managed daughter profile's "Aide & support" is limited to cycle-tracking
  // topics (CLAUDE.md §4 objective isolation) — see getCycleTrackingFaqItems()'
  // own header comment. getFaqItems() itself is never filtered/deleted globally.
  const isManagedProfile = getActiveProfileIdentity().isManagedProfile;
  const faqItems = isManagedProfile ? getCycleTrackingFaqItems(t) : getFaqItems(t);

  const showToast = (value: string) => {
    setToast(value);
    setTimeout(() => setToast(''), 2300);
  };
  const openEmail = async (subject = t('help.helpSupport.email.supportSubject'), body = '') => {
    const address = APP_METADATA.contactEmail;
    if (!address) {showToast(t('help.helpSupport.toastEmailUnavailable')); return;}
    const url = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      if (await Linking.canOpenURL(url)) {await Linking.openURL(url);}
      else {showToast(t('help.helpSupport.toastCantOpenEmail'));}
    } catch {
      showToast(t('help.helpSupport.toastCantOpenEmail'));
    }
  };
  const openForm = (next: Form) => {
    setForm(next);
    setCategory(next === 'bug' ? t('help.helpSupport.modal.bugCategories.display') : t('help.helpSupport.modal.feedbackCategories.suggestion'));
    setMessage('');
    setEmail('');
    setSteps('');
    setError('');
  };
  const submit = () => {
    if (!message.trim()) {setError(t('help.helpSupport.modal.errorEmpty')); return;}
    const subjectPrefix = form === 'bug' ? t('help.helpSupport.email.bugSubjectPrefix') : t('help.helpSupport.email.feedbackSubjectPrefix');
    const subject = `${subjectPrefix} — ${category}`;
    const body = `${t('help.helpSupport.email.bodyCategory')} : ${category}\n\n${t('help.helpSupport.email.bodyMessage')} :\n${message.trim()}${steps.trim() ? `\n\n${t('help.helpSupport.email.bodySteps')} :\n${steps.trim()}` : ''}${email.trim() ? `\n\n${t('help.helpSupport.email.bodyReplyEmail')} : ${email.trim()}` : ''}\n\n${t('help.helpSupport.email.bodyVersion')} : ${APP_METADATA.version} (${APP_METADATA.buildNumber})`;
    setForm(null);
    openEmail(subject, body);
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 25},
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable accessibilityLabel={t('common.back')} onPress={navigation.goBack} style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('help.helpSupport.title')}</Text>
            <Text style={styles.subtitle}>{t('help.helpSupport.subtitle')}</Text>
          </View>
          <View style={styles.decor}>
            <MaterialDesignIcons color={theme.colors.primary} name="headset" size={23} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(70).duration(420)} style={styles.supportCard}>
          <View style={styles.supportTop}>
            <View style={styles.supportIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="face-agent" size={37} />
            </View>
            <View style={styles.supportCopy}>
              <Text style={styles.supportTitle}>{t('help.helpSupport.supportTitle')}</Text>
              <Text style={styles.supportText}>{t('help.helpSupport.supportText')}</Text>
            </View>
          </View>
          <View style={styles.methods}>
            <Method helper={t('help.helpSupport.emailMethodHelper')} icon="email-outline" onPress={() => openEmail()} styles={styles} theme={theme} title={t('help.helpSupport.emailMethodTitle')} value={APP_METADATA.contactEmail ?? t('help.helpSupport.emailUnavailable')} />
            <View style={styles.divider} />
            <Method helper={t('help.helpSupport.faqMethodHelper')} icon="help-circle-outline" onPress={() => navigation.navigate('FAQ')} styles={styles} theme={theme} title={t('help.helpSupport.faqMethodTitle')} value={t('help.helpSupport.faqMethodValue')} />
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('help.helpSupport.faqSectionTitle')}</Text>
          <Pressable onPress={() => navigation.navigate('FAQ')}><Text style={styles.seeAll}>{`${t('common.seeAll')}  ›`}</Text></Pressable>
        </View>
        <Animated.View entering={FadeInUp.delay(150).duration(420)} style={styles.card}>
          {faqItems.map((item, index) => (
            <HelpRow
              icon={item.icon as never} key={item.id} last={index === faqItems.length - 1}
              onPress={() => navigation.navigate('FAQDetail', {id: item.id})} styles={styles} theme={theme}
              subtitle={item.subtitle} title={item.question}
            />
          ))}
        </Animated.View>

        {/* "Autres sujets d'aide" (Guides/Nouveautés/feedback/bug report) and its
            footer banner are account/app-level, not menstrual-cycle-tracking
            topics — not part of a managed daughter profile's Help (CLAUDE.md §4
            objective isolation). Hidden entirely (not just emptied) for her so
            no orphan title/card/banner is left; the owner's Help is unchanged. */}
        {!isManagedProfile ? (
          <>
            <Text style={styles.sectionTitle}>{t('help.helpSupport.otherTopicsTitle')}</Text>
            <Animated.View entering={FadeInUp.delay(220).duration(420)} style={styles.card}>
              <HelpRow icon="school-outline" onPress={() => navigation.navigate('Guides')} styles={styles} theme={theme} subtitle={t('help.helpSupport.guidesSubtitle')} title={t('help.helpSupport.guidesTitle')} />
              <HelpRow icon="star-outline" onPress={() => navigation.navigate('WhatsNew')} styles={styles} theme={theme} subtitle={t('help.helpSupport.whatsNewSubtitle')} title={t('help.helpSupport.whatsNewTitle')} />
              <HelpRow icon="lightbulb-outline" onPress={() => openForm('feedback')} styles={styles} theme={theme} subtitle={t('help.helpSupport.feedbackSubtitle')} title={t('help.helpSupport.feedbackTitle')} />
              <HelpRow last icon="alert-outline" onPress={() => openForm('bug')} styles={styles} theme={theme} subtitle={t('help.helpSupport.bugReportSubtitle')} title={t('help.helpSupport.bugReportTitle')} />
            </Animated.View>

            <View style={styles.banner}>
              <MaterialDesignIcons color={theme.colors.secondary} name="email-newsletter" size={34} />
              <View style={styles.bannerCopy}>
                <Text style={styles.bannerTitle}>{t('help.helpSupport.bannerTitle')}</Text>
                <Text style={styles.bannerText}>{t('help.helpSupport.bannerText')}</Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setForm(null)} statusBarTranslucent transparent visible={form !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable onPress={() => setForm(null)} style={styles.backdrop} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{form === 'bug' ? t('help.helpSupport.modal.bugTitle') : t('help.helpSupport.modal.feedbackTitle')}</Text>
            <Text style={styles.inputLabel}>{form === 'bug' ? t('help.helpSupport.modal.categoryLabelBug') : t('help.helpSupport.modal.categoryLabelFeedback')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {(form === 'bug'
                ? [
                    t('help.helpSupport.modal.bugCategories.display'),
                    t('help.helpSupport.modal.bugCategories.navigation'),
                    t('help.helpSupport.modal.bugCategories.calendar'),
                    t('help.helpSupport.modal.bugCategories.journal'),
                    t('help.helpSupport.modal.bugCategories.notifications'),
                    t('help.helpSupport.modal.bugCategories.data'),
                    t('help.helpSupport.modal.bugCategories.other'),
                  ]
                : [
                    t('help.helpSupport.modal.feedbackCategories.suggestion'),
                    t('help.helpSupport.modal.feedbackCategories.improvement'),
                    t('help.helpSupport.modal.feedbackCategories.other'),
                  ]
              ).map(item => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipSelected]}>
                  <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>{form === 'bug' ? t('help.helpSupport.modal.descriptionLabel') : t('help.helpSupport.modal.messageLabel')}</Text>
            <TextInput
              maxLength={1000} multiline onChangeText={value => {setMessage(value); setError('');}}
              placeholder={t('help.helpSupport.modal.placeholderDescribe')} placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.messageInput, error && styles.inputError]} textAlignVertical="top" value={message}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {form === 'bug' ? (
              <>
                <Text style={styles.inputLabel}>{t('help.helpSupport.modal.stepsLabel')}</Text>
                <TextInput multiline onChangeText={setSteps} placeholder={t('help.helpSupport.modal.placeholderSteps')} placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.stepsInput]} value={steps} />
              </>
            ) : null}
            <Text style={styles.inputLabel}>{t('help.helpSupport.modal.emailLabel')}</Text>
            <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder={t('help.helpSupport.modal.placeholderEmail')} placeholderTextColor={theme.colors.textMuted} style={styles.input} value={email} />
            <Pressable onPress={submit} style={({pressed}) => [styles.send, pressed && styles.pressed]}>
              <Text style={styles.sendText}>{form === 'bug' ? t('help.helpSupport.modal.sendBug') : t('help.helpSupport.modal.send')}</Text>
            </Pressable>
            <Pressable onPress={() => setForm(null)} style={styles.cancel}><Text style={styles.cancelText}>{t('common.cancel')}</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {toast ? (
        <Animated.View entering={FadeInUp.springify()} style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}>
          <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="information-outline" size={17} />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {flexGrow: 1, gap: 14, paddingHorizontal: 17},
    contentCompact: {paddingHorizontal: 11},
    header: {flexDirection: 'row', alignItems: 'center'},
    back: {
      width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12), borderRadius: 22, backgroundColor: withAlpha(theme.colors.surface, 0.94),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    },
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 10},
    title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 23, fontWeight: '700'},
    subtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
    decor: {width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.primarySoft},
    supportCard: {
      borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.12), borderRadius: 28, backgroundColor: theme.colors.surface,
      padding: 16, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
    },
    supportTop: {flexDirection: 'row', alignItems: 'center'},
    supportIcon: {width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.colors.primarySoft},
    supportCopy: {flex: 1, marginLeft: 14},
    supportTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
    supportText: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},
    methods: {flexDirection: 'row', alignItems: 'stretch', gap: 8, marginTop: 16},
    method: {
      flex: 1, minWidth: 0, alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.11),
      borderRadius: 18, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: 6, paddingVertical: 12,
    },
    methodIcon: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.colors.primarySoft},
    methodTitle: {marginTop: 8, color: theme.colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center'},
    methodValue: {marginTop: 3, color: theme.colors.primary, fontSize: 8.7, fontWeight: '600', textAlign: 'center'},
    methodHelper: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 8, textAlign: 'center'},
    divider: {display: 'none'},
    sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    sectionTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
    seeAll: {color: theme.colors.primary, fontSize: 10.5, fontWeight: '700'},
    card: {overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.12), borderRadius: 24, backgroundColor: theme.colors.surface},
    row: {minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 9},
    rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08)},
    rowIcon: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.colors.primarySoft},
    rowCopy: {flex: 1, minWidth: 0, marginHorizontal: 11},
    rowTitle: {color: theme.colors.text, fontSize: 12.5, fontWeight: '700'},
    rowSubtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 15},
    banner: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.12), borderRadius: 22, backgroundColor: theme.colors.primarySoft, padding: 14},
    bannerCopy: {flex: 1, marginLeft: 12},
    bannerTitle: {color: theme.colors.primary, fontSize: 11.5, fontWeight: '700'},
    bannerText: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 10.5},
    pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
    modalRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,.38)'},
    sheet: {
      maxHeight: '92%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: theme.colors.surface,
      paddingHorizontal: 18, paddingTop: 10, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: -5}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
    },
    handle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
    sheetTitle: {marginTop: 16, color: theme.colors.accent, fontFamily: 'serif', fontSize: 21, fontWeight: '700', textAlign: 'center'},
    inputLabel: {marginTop: 13, marginBottom: 7, color: theme.colors.text, fontSize: 11.5, fontWeight: '700'},
    chips: {gap: 7},
    chip: {borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 15, paddingHorizontal: 11, paddingVertical: 8},
    chipSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    chipText: {color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '600'},
    chipTextSelected: {color: theme.colors.primary},
    input: {borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.16), borderRadius: 18, backgroundColor: theme.colors.surface, paddingHorizontal: 13, paddingVertical: 11, color: theme.colors.text, fontSize: 12.5},
    messageInput: {minHeight: 92},
    stepsInput: {minHeight: 60},
    inputError: {borderColor: theme.colors.danger},
    error: {marginTop: 5, color: theme.colors.danger, fontSize: 10.5},
    send: {
      minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 15, borderRadius: 18, backgroundColor: theme.colors.primary,
      paddingHorizontal: 14, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.18, shadowRadius: 10, elevation: 3,
    },
    sendText: {color: onPrimaryTextColor(theme), fontSize: 14, fontWeight: '700'},
    cancel: {alignItems: 'center', marginTop: 7, padding: 11},
    cancelText: {color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: '600'},
    toast: {
      position: 'absolute', left: '8%', right: '8%', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18,
      backgroundColor: theme.colors.accent, paddingHorizontal: 13, paddingVertical: 12, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.22, shadowRadius: 10, elevation: 8,
    },
    toastText: {flex: 1, color: pickReadableTextColor(theme.colors.accent), fontSize: 11.5, fontWeight: '600'},
  });
}
