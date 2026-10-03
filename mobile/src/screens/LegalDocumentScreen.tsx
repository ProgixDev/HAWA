import React, {useMemo} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type LegalSection = {title: string; body: string};

// LEGAL CONTENT TRANSLATION GAP (Phase 7J.1): these sections are themselves a
// provisional, not-yet-legally-validated placeholder (see each body's own
// text) — not an approved legal document. No approved English version exists
// in this repository. Per Phase 7J.1's explicit instruction, this body is
// NOT machine-translated and NOT presented as approved legal copy; only the
// screen's chrome (back button, title, provisional-notice banner) is
// localized below. Translate this content only once an approved EN legal
// version is provided.
const TERMS: LegalSection[] = [
  {title: 'Objet', body: 'Ce document présente la structure provisoire des conditions d’utilisation de l’application AWA.'},
  {title: 'Utilisation de l’application', body: 'AWA propose des outils de suivi personnel et de bien-être. Le contenu définitif décrivant les droits et responsabilités des utilisatrices sera ajouté après validation juridique.'},
  {title: 'Disponibilité du service', body: 'Les modalités définitives de disponibilité, de maintenance et d’évolution du service restent à valider.'},
  {title: 'Contact', body: 'Les coordonnées officielles seront ajoutées dès leur validation par l’équipe AWA.'},
];

const PRIVACY: LegalSection[] = [
  {title: 'Données concernées', body: 'Cette section décrira précisément les données traitées par AWA et leur finalité après validation juridique.'},
  {title: 'Stockage et sécurité', body: 'La documentation définitive précisera les mesures de stockage, de protection et les durées de conservation.'},
  {title: 'Tes droits', body: 'Les procédures permettant d’accéder, corriger ou supprimer les données seront détaillées dans la version validée.'},
  {title: 'Contact confidentialité', body: 'L’adresse officielle du responsable de la confidentialité sera ajoutée avant publication.'},
];

function LegalDocument({navigation, title, sections, theme}: {navigation: {goBack: () => void}; title: string; sections: LegalSection[]; theme: ResolvedAwaTheme}) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <SafeAreaView edges={['left','right']} style={styles.safe}>
    <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />
    <View style={[styles.header, {paddingTop: Math.max(insets.top, 18) + 8}]}>
      <Pressable accessibilityLabel={t('common.back')} onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28}/></Pressable>
      <Text style={styles.title}>{title}</Text><View style={styles.spacer}/>
    </View>
    <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom,18)+24}]} showsVerticalScrollIndicator={false}>
      <View style={styles.notice}><MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={21}/><Text style={styles.noticeText}>{t('legalDocument.provisionalNotice')}</Text></View>
      {sections.map(section => <View key={section.title} style={styles.section}><Text style={styles.sectionTitle}>{section.title}</Text><Text style={styles.body}>{section.body}</Text></View>)}
    </ScrollView>
  </SafeAreaView>;
}

export function TermsOfUseScreen({navigation}: NativeStackScreenProps<RootStackParamList,'TermsOfUse'>) {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  return <LegalDocument navigation={navigation} sections={TERMS} theme={theme} title={t('about.termsOfUse')}/>;
}
export function PrivacyPolicyScreen({navigation}: NativeStackScreenProps<RootStackParamList,'PrivacyPolicy'>) {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  return <LegalDocument navigation={navigation} sections={PRIVACY} theme={theme} title={t('about.privacyPolicy')}/>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12},
    back: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: theme.colors.surface, padding: 9, elevation: 2},
    title: {flex: 1, color: theme.colors.accent, fontFamily: 'serif', fontSize: 20, fontWeight: '700', textAlign: 'center', paddingHorizontal: 8},
    spacer: {padding: 23},
    content: {paddingHorizontal: 16, gap: 12},
    notice: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: theme.colors.primarySoft, padding: 14},
    noticeText: {flex: 1, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},
    section: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: 22, backgroundColor: theme.colors.surface, padding: 17},
    sectionTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    body: {marginTop: 7, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20},
  });
}
