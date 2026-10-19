import React, {useMemo} from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import '../i18n';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {APP_METADATA} from '../utils/appMetadata';
import {faqCategoryLabel, getCycleTrackingFaqItems, getFaqItems, getGuideItems} from '../utils/supportContent';
import {getActiveProfileIdentity} from '../state/activeProfileStore';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIcon} from '../components/ui/AwaIcon';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaInfoRow} from '../components/ui/AwaInfoRow';
import {AwaText} from '../components/ui/AwaText';

function Shell({title, navigation, children, theme, styles}: {title: string; navigation: {goBack: () => void}; children: React.ReactNode; theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>}) {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />
      <View style={[styles.header, {paddingTop: Math.max(insets.top, 18) + 8}]}>
        <AwaIconButton accessibilityLabel={t('common.back')} icon="chevron-left" onPress={navigation.goBack} variant="tonal" />
        <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{title}</AwaText>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 24}]}>{children}</ScrollView>
    </SafeAreaView>
  );
}

// A managed daughter profile's "Aide & support" is limited to cycle-tracking
// topics (CLAUDE.md §4 objective isolation) — see getCycleTrackingFaqItems()'
// own header comment. getFaqItems() itself is never filtered/deleted globally.
export function FAQScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'FAQ'>) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const items = getActiveProfileIdentity().isManagedProfile ? getCycleTrackingFaqItems(t) : getFaqItems(t);
  return (
    <Shell navigation={navigation} styles={styles} theme={theme} title={t('help.faqScreen.title')}>
      <AwaText colorRole="onSurfaceVariant" style={styles.intro} variant="bodyMedium">{t('help.faqScreen.intro')}</AwaText>
      <AwaCard padding="none" variant="filled">
        {items.map((item, index) => (
          <AwaInfoRow
            icon={item.icon as never}
            iconTone="primary"
            key={item.id}
            last={index === items.length - 1}
            onPress={() => navigation.navigate('FAQDetail', {id: item.id})}
            subtitle={item.subtitle}
            title={item.question}
          />
        ))}
      </AwaCard>
    </Shell>
  );
}

export function FAQDetailScreen({navigation, route}: NativeStackScreenProps<RootStackParamList, 'FAQDetail'>) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const items = getFaqItems(t);
  const item = items.find(value => value.id === route.params.id) ?? items[0];
  return (
    <Shell navigation={navigation} styles={styles} theme={theme} title={t('help.faqScreen.detailTitle')}>
      <AwaCard padding="default" style={styles.detail} variant="filled">
        <AwaIcon colorRole="primary" decorative name={item.icon as never} size="lg" />
        <AwaText style={styles.detailTitle} variant="titleLarge">{item.question}</AwaText>
        <AwaText colorRole="primary" emphasized style={styles.category} variant="labelMedium">{faqCategoryLabel(item.category, t)}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.answer} variant="bodyMedium">{item.answer}</AwaText>
      </AwaCard>
    </Shell>
  );
}

export function GuidesScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'Guides'>) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const guides = getGuideItems(t);
  return (
    <Shell navigation={navigation} styles={styles} theme={theme} title={t('help.guidesScreen.title')}>
      <AwaText colorRole="onSurfaceVariant" style={styles.intro} variant="bodyMedium">{t('help.guidesScreen.intro')}</AwaText>
      <AwaCard padding="none" variant="filled">
        {guides.map((item, index) => (
          <AwaInfoRow
            icon={item.icon as never}
            iconTone="primary"
            key={item.id}
            last={index === guides.length - 1}
            subtitle={item.text}
            title={item.title}
          />
        ))}
      </AwaCard>
    </Shell>
  );
}

export function WhatsNewScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'WhatsNew'>) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  return (
    <Shell navigation={navigation} styles={styles} theme={theme} title={t('help.whatsNewScreen.title')}>
      <AwaCard padding="default" style={styles.detail} variant="filled">
        <View style={styles.version}>
          <AwaText colorRole="onPrimaryContainer" emphasized variant="labelMedium">{t('help.whatsNewScreen.version', {version: APP_METADATA.version})}</AwaText>
        </View>
        <AwaText style={styles.detailTitle} variant="titleLarge">{t('help.whatsNewScreen.heading')}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.answer} variant="bodyMedium">{t('help.whatsNewScreen.body')}</AwaText>
      </AwaCard>
    </Shell>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12},
    title: {flex: 1, textAlign: 'center'},
    spacer: {width: 40},
    content: {paddingHorizontal: 16, gap: 12},
    intro: {marginBottom: 4},
    detail: {alignItems: 'center'},
    detailTitle: {marginTop: 12, textAlign: 'center'},
    category: {marginTop: 8},
    answer: {marginTop: 12, textAlign: 'center'},
    version: {borderRadius: 12, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6},
  });
}
