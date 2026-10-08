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

// TERMS & PRIVACY FR/EN/ES LOCALIZATION: this screen's body is itself a
// provisional, not-yet-legally-validated placeholder (see each section's own
// text below) — there is no approved Terms/Privacy document in this
// repository yet, in any language. The French text is the original,
// unchanged source of truth; English and Spanish are faithful translations
// of that same placeholder content (not new legal drafting). Keyed by
// AwaAppLanguage so the body — not just the screen's chrome — now follows
// the app language, with no fallback to French for en/es.
// Exported for TERMS/PRIVACY structural-parity and content-leak tests
// (Phase7J1LegalDocumentLanguageSwitch.test.tsx) — never imported by any
// other screen/component.
// Languages that actually have legal placeholder text. Deliberately narrower than
// AwaAppLanguage: Italian is not translated here yet (explicit English fallback).
type LegalLanguage = 'fr' | 'en' | 'es';

export const TERMS: Record<LegalLanguage, LegalSection[]> = {
  fr: [
    {title: 'Objet', body: 'Ce document présente la structure provisoire des conditions d’utilisation de l’application AWA.'},
    {title: 'Utilisation de l’application', body: 'AWA propose des outils de suivi personnel et de bien-être. Le contenu définitif décrivant les droits et responsabilités des utilisatrices sera ajouté après validation juridique.'},
    {title: 'Disponibilité du service', body: 'Les modalités définitives de disponibilité, de maintenance et d’évolution du service restent à valider.'},
    {title: 'Contact', body: 'Les coordonnées officielles seront ajoutées dès leur validation par l’équipe AWA.'},
  ],
  en: [
    {title: 'Purpose', body: 'This document presents the provisional structure of AWA’s terms of use.'},
    {title: 'Use of the application', body: 'AWA offers personal tracking and well-being tools. The final content describing users’ rights and responsibilities will be added once legal validation is complete.'},
    {title: 'Service availability', body: 'The final terms governing the service’s availability, maintenance, and evolution are still to be confirmed.'},
    {title: 'Contact', body: 'Official contact details will be added once validated by the AWA team.'},
  ],
  es: [
    {title: 'Objeto', body: 'Este documento presenta la estructura provisional de las condiciones de uso de la aplicación AWA.'},
    {title: 'Uso de la aplicación', body: 'AWA ofrece herramientas de seguimiento personal y bienestar. El contenido definitivo que describe los derechos y responsabilidades de las usuarias se añadirá tras la validación jurídica.'},
    {title: 'Disponibilidad del servicio', body: 'Las modalidades definitivas de disponibilidad, mantenimiento y evolución del servicio están aún por determinar.'},
    {title: 'Contacto', body: 'Los datos de contacto oficiales se añadirán una vez validados por el equipo de AWA.'},
  ],
};

export const PRIVACY: Record<LegalLanguage, LegalSection[]> = {
  fr: [
    {title: 'Données concernées', body: 'Cette section décrira précisément les données traitées par AWA et leur finalité après validation juridique.'},
    {title: 'Stockage et sécurité', body: 'La documentation définitive précisera les mesures de stockage, de protection et les durées de conservation.'},
    {title: 'Tes droits', body: 'Les procédures permettant d’accéder, corriger ou supprimer les données seront détaillées dans la version validée.'},
    {title: 'Contact confidentialité', body: 'L’adresse officielle du responsable de la confidentialité sera ajoutée avant publication.'},
  ],
  en: [
    {title: 'Data concerned', body: 'This section will precisely describe the data processed by AWA and its purpose, once legal validation is complete.'},
    {title: 'Storage and security', body: 'The final documentation will specify the storage measures, protections, and retention periods.'},
    {title: 'Your rights', body: 'The procedures for accessing, correcting, or deleting your data will be detailed in the validated version.'},
    {title: 'Privacy contact', body: 'The official contact address for the privacy officer will be added before publication.'},
  ],
  es: [
    {title: 'Datos tratados', body: 'Esta sección describirá con precisión los datos tratados por AWA y su finalidad, tras la validación jurídica.'},
    {title: 'Almacenamiento y seguridad', body: 'La documentación definitiva precisará las medidas de almacenamiento, protección y los plazos de conservación.'},
    {title: 'Tus derechos', body: 'Los procedimientos para acceder, corregir o eliminar los datos se detallarán en la versión validada.'},
    {title: 'Contacto de privacidad', body: 'La dirección oficial del responsable de privacidad se añadirá antes de la publicación.'},
  ],
};

/** Resolves the app's current language to one of the 3 legal-content keys —
 * the single place this screen decides fr/en/es, so body and chrome can never
 * drift apart. Italian ('it') has no legal placeholder text yet, so it — like
 * any unknown/invalid language (e.g. not yet loaded) — falls back to English,
 * never to French or Spanish. */
function resolveLegalLanguage(language: string): LegalLanguage {
  if (language === 'fr') {return 'fr';}
  if (language === 'es') {return 'es';}
  return 'en';
}

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
  const {t, i18n} = useTranslation();
  const {theme} = useAwaTheme();
  const lang = resolveLegalLanguage(i18n.language);
  return <LegalDocument navigation={navigation} sections={TERMS[lang]} theme={theme} title={t('about.termsOfUse')}/>;
}
export function PrivacyPolicyScreen({navigation}: NativeStackScreenProps<RootStackParamList,'PrivacyPolicy'>) {
  const {t, i18n} = useTranslation();
  const {theme} = useAwaTheme();
  const lang = resolveLegalLanguage(i18n.language);
  return <LegalDocument navigation={navigation} sections={PRIVACY[lang]} theme={theme} title={t('about.privacyPolicy')}/>;
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
