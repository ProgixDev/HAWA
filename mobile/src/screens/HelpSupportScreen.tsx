import React, {useMemo, useState} from 'react';
import {KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, useWindowDimensions, View} from 'react-native';
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
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaInfoRow} from '../components/ui/AwaInfoRow';
import {AwaText} from '../components/ui/AwaText';
import {AwaTextField} from '../components/ui/AwaTextField';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type Form = 'feedback' | 'bug' | null;

function HelpRow({icon, title, subtitle, onPress, last}: {
  icon: IconName; title: string; subtitle: string; onPress: () => void; last?: boolean;
}) {
  return (
    <AwaInfoRow
      accessibilityLabel={title}
      icon={icon}
      iconTone="primary"
      last={last}
      onPress={onPress}
      subtitle={subtitle}
      title={title}
    />
  );
}

function Method({icon, title, value, helper, onPress, theme, styles}: {
  icon: IconName; title: string; value: string; helper: string; onPress: () => void;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable accessibilityLabel={title} onPress={onPress} style={({pressed}) => [styles.method, pressed && styles.pressed]}>
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={24} />
      <AwaText emphasized style={styles.methodTitle} variant="labelLarge">{title}</AwaText>
      <AwaText colorRole="primary" style={styles.methodValue} variant="labelMedium">{value}</AwaText>
      <AwaText colorRole="onSurfaceVariant" style={styles.methodHelper} variant="bodySmall">{helper}</AwaText>
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
          <AwaIconButton accessibilityLabel={t('common.back')} icon="chevron-left" onPress={navigation.goBack} variant="tonal" />
          <View style={styles.headerCopy}>
            <AwaText accessibilityRole="header" variant="headlineSmall">{t('help.helpSupport.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{t('help.helpSupport.subtitle')}</AwaText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(70).duration(420)}>
          <AwaCard style={styles.supportCard} variant="elevated">
          <View style={styles.supportTop}>
            <MaterialDesignIcons color={theme.colors.primary} name="face-agent" size={37} />
            <View style={styles.supportCopy}>
              <AwaText variant="titleMedium">{t('help.helpSupport.supportTitle')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.supportText} variant="bodySmall">{t('help.helpSupport.supportText')}</AwaText>
            </View>
          </View>
          <View style={styles.methods}>
            <Method helper={t('help.helpSupport.emailMethodHelper')} icon="email-outline" onPress={() => openEmail()} styles={styles} theme={theme} title={t('help.helpSupport.emailMethodTitle')} value={APP_METADATA.contactEmail ?? t('help.helpSupport.emailUnavailable')} />
            <Method helper={t('help.helpSupport.faqMethodHelper')} icon="help-circle-outline" onPress={() => navigation.navigate('FAQ')} styles={styles} theme={theme} title={t('help.helpSupport.faqMethodTitle')} value={t('help.helpSupport.faqMethodValue')} />
          </View>
          </AwaCard>
        </Animated.View>
        <View style={styles.sectionHeader}>
          <AwaText accessibilityRole="header" variant="titleMedium">{t('help.helpSupport.faqSectionTitle')}</AwaText>
          <AwaButton label={t('common.seeAll')} onPress={() => navigation.navigate('FAQ')} size="compact" variant="text" />
        </View>
        <Animated.View entering={FadeInUp.delay(150).duration(420)}>
        <AwaCard padding="none" style={styles.card} variant="filled">
          {faqItems.map((item, index) => (
            <HelpRow
              icon={item.icon as never} key={item.id} last={index === faqItems.length - 1}
              onPress={() => navigation.navigate('FAQDetail', {id: item.id})}
              subtitle={item.subtitle} title={item.question}
            />
          ))}
        </AwaCard>
        </Animated.View>

        {/* "Autres sujets d'aide" (Guides/Nouveautés/feedback/bug report) and its
            footer banner are account/app-level, not menstrual-cycle-tracking
            topics — not part of a managed daughter profile's Help (CLAUDE.md §4
            objective isolation). Hidden entirely (not just emptied) for her so
            no orphan title/card/banner is left; the owner's Help is unchanged. */}
        {!isManagedProfile ? (
          <>
            <AwaText accessibilityRole="header" variant="titleMedium">{t('help.helpSupport.otherTopicsTitle')}</AwaText>
            <Animated.View entering={FadeInUp.delay(220).duration(420)}>
              <AwaCard padding="none" style={styles.card} variant="filled">
                <HelpRow icon="school-outline" onPress={() => navigation.navigate('Guides')} subtitle={t('help.helpSupport.guidesSubtitle')} title={t('help.helpSupport.guidesTitle')} />
                <HelpRow icon="star-outline" onPress={() => navigation.navigate('WhatsNew')} subtitle={t('help.helpSupport.whatsNewSubtitle')} title={t('help.helpSupport.whatsNewTitle')} />
                <HelpRow icon="lightbulb-outline" onPress={() => openForm('feedback')} subtitle={t('help.helpSupport.feedbackSubtitle')} title={t('help.helpSupport.feedbackTitle')} />
                <HelpRow last icon="alert-outline" onPress={() => openForm('bug')} subtitle={t('help.helpSupport.bugReportSubtitle')} title={t('help.helpSupport.bugReportTitle')} />
              </AwaCard>
            </Animated.View>
            <AwaCard padding="compact" style={styles.banner} variant="filled">
              <MaterialDesignIcons color={theme.colors.secondary} name="email-newsletter" size={34} />
              <View style={styles.bannerCopy}>
                <AwaText colorRole="primary" variant="titleSmall">{t('help.helpSupport.bannerTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.bannerText} variant="bodySmall">{t('help.helpSupport.bannerText')}</AwaText>
              </View>
            </AwaCard>
          </>
        ) : null}
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setForm(null)} statusBarTranslucent transparent visible={form !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable onPress={() => setForm(null)} style={styles.backdrop} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.handle} />
            <AwaText accessibilityRole="header" style={styles.sheetTitle} variant="titleLarge">{form === 'bug' ? t('help.helpSupport.modal.bugTitle') : t('help.helpSupport.modal.feedbackTitle')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" emphasized style={styles.inputLabel} variant="labelMedium">{form === 'bug' ? t('help.helpSupport.modal.categoryLabelBug') : t('help.helpSupport.modal.categoryLabelFeedback')}</AwaText>
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
                <Pressable accessibilityRole="button" accessibilityState={{selected: category === item}} hitSlop={4} key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipSelected]}>
                  <AwaText colorRole={category === item ? 'onPrimaryContainer' : 'onSurfaceVariant'} emphasized variant="labelMedium">{item}</AwaText>
                </Pressable>
              ))}
            </ScrollView>
            <AwaTextField
              errorText={error || undefined}
              label={form === 'bug' ? t('help.helpSupport.modal.descriptionLabel') : t('help.helpSupport.modal.messageLabel')}
              maxLength={1000} multiline onChangeText={value => {setMessage(value); setError('');}}
              placeholder={t('help.helpSupport.modal.placeholderDescribe')} placeholderTextColor={theme.colors.textMuted}
              textAlignVertical="top" value={message}
              wrapperStyle={styles.field}
            />
            {form === 'bug' ? (
              <AwaTextField
                label={t('help.helpSupport.modal.stepsLabel')}
                multiline onChangeText={setSteps} placeholder={t('help.helpSupport.modal.placeholderSteps')} placeholderTextColor={theme.colors.textMuted}
                value={steps}
                wrapperStyle={styles.field}
              />
            ) : null}
            <AwaTextField
              autoCapitalize="none"
              keyboardType="email-address"
              label={t('help.helpSupport.modal.emailLabel')}
              onChangeText={setEmail} placeholder={t('help.helpSupport.modal.placeholderEmail')} placeholderTextColor={theme.colors.textMuted}
              value={email}
              wrapperStyle={styles.field}
            />
            <AwaButton fullWidth label={form === 'bug' ? t('help.helpSupport.modal.sendBug') : t('help.helpSupport.modal.send')} onPress={submit} size="large" style={styles.send} />
            <AwaButton fullWidth label={t('common.cancel')} onPress={() => setForm(null)} style={styles.cancel} variant="text" />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {toast ? (
        <Animated.View entering={FadeInUp.springify()} style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}>
          <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="information-outline" size={17} />
          <AwaText style={styles.toastText} variant="bodySmall">{toast}</AwaText>
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
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 10},
    subtitle: {marginTop: 3},
    supportCard: {},
    supportTop: {flexDirection: 'row', alignItems: 'center'},
    supportCopy: {flex: 1, marginLeft: 14},
    supportText: {marginTop: 4},
    methods: {flexDirection: 'row', alignItems: 'stretch', gap: 8, marginTop: 16},
    method: {
      flex: 1, minWidth: 0, alignItems: 'center', borderRadius: 16, backgroundColor: theme.colors.surfaceSecondary,
      paddingHorizontal: 12, paddingVertical: 12,
    },
    methodTitle: {marginTop: 8, textAlign: 'center'},
    methodValue: {marginTop: 3, textAlign: 'center'},
    methodHelper: {marginTop: 3, textAlign: 'center'},
    sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    sectionTitle: {color: theme.colors.accent, fontSize: 17, fontWeight: '700'},
    card: {overflow: 'hidden'},
    banner: {flexDirection: 'row', alignItems: 'center'},
    bannerCopy: {flex: 1, marginLeft: 12},
    bannerText: {marginTop: 4},
    pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
    modalRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,.38)'},
    sheet: {
      maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: theme.colors.surface,
      paddingHorizontal: 18, paddingTop: 10, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: -5}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
    },
    handle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
    sheetTitle: {marginTop: 16, textAlign: 'center'},
    inputLabel: {marginTop: 13, marginBottom: 7},
    chips: {gap: 7},
    field: {marginTop: 13},
    chip: {minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8},
    chipSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    send: {marginTop: 15},
    cancel: {marginTop: 7},
    toast: {
      position: 'absolute', left: '8%', right: '8%', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12,
      backgroundColor: theme.colors.accent, paddingHorizontal: 16, paddingVertical: 12, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
    },
    toastText: {flex: 1, color: pickReadableTextColor(theme.colors.accent)},
  });
}
