import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';

import type {RootStackParamList} from '../../../navigation/AppNavigator';
import type {PartnerMainTabParamList} from '../../../navigation/PartnerMainTabNavigator';
import {homeColors} from '../../../components/home/homeTheme';
import {AwaButton} from '../../../components/ui/AwaButton';
import {AwaCard} from '../../../components/ui/AwaCard';
import {AwaText} from '../../../components/ui/AwaText';
import {AwaTextField} from '../../../components/ui/AwaTextField';
import {useAwaADeuxPartnerIdentity} from '../../../hooks/useAwaADeuxPartnerIdentity';
import {useAwaADeuxPartnerProfile} from '../../../hooks/useAwaADeuxPartnerProfile';
import {useAwaADeuxSharing} from '../../../hooks/useAwaADeuxSharing';
import PartnerScreenBackground from './PartnerScreenBackground';
import {PARTNER_PROFILE_FIRST_NAME_MAX_LENGTH} from '../../../state/awaADeuxPartnerProfileStore';
import {getFirstName} from '../../../state/onboardingPreferences';
import type {SharingKey} from '../../../state/awaADeuxSharingStore';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {getFloatingTabBarClearance, getTopPadding} from '../../../theme/spacing';
import {withAlpha, type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
import {awaShapes} from '../../../theme/shapes';
import {computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import {partnerSubject} from '../../../utils/awaADeuxPartnerWording';
import {APP_METADATA} from '../../../utils/appMetadata';
import {upperCaseFor} from '../../../utils/textCase';
import {sharingSections} from '../awaADeuxDemo';
import {buildMailtoUrl} from '../awaADeuxInvitation';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

// The partner's own, much simpler profile (PartnerMainTabs "Profil"). Deliberately does
// NOT show any owner-only setting: no "Mon objectif", no cycle/pregnancy/conception/
// postpartum configuration, no medical export, no backup — those all belong to the main
// user's own ProfileScreen.tsx (untouched by this screen; its identity card, avatar-
// initial fallback, "toggle active" badge and SectionHeader (icon-circle + title +
// subtitle, used ahead of "Mes informations"/"Informations personnelles" there) conventions
// are reused here for visual consistency, not its owner-only functionality).
//
// Section order mirrors the owner ProfileScreen's own hierarchy of repeated
// [SectionHeader → card] blocks: welcome/identity card, "Informations personnelles"
// (Prénom + Rôle only — no other field exists for the partner in this frontend-only
// demo), "AWA à deux" (the dynamic shared-access summary), then the pre-existing
// Confidentialité / Aide & support accordions and Se déconnecter, unchanged.
//
// THREE different names appear in this file and must never be confused:
//  - the OWNER's name (getFirstName(), read-only, used only in "Connecté à …" / the
//    explanatory sentences: it is HER name, never shown as "my" identity here);
//  - the name the OWNER typed in FOR her partner during onboarding
//    (awaADeuxPartnerStore) — read-only from this screen, used only as the INITIAL seed
//    for the partner's own identity until the partner sets one;
//  - the PARTNER's OWN, self-edited profile first name (useAwaADeuxPartnerProfile() /
//    awaADeuxPartnerProfileStore) — the only one editable from "Prénom" below.
// The first two are resolved into ONE value by useAwaADeuxPartnerIdentity() (partner's own
// name wins once set, else the owner's seed) — the SAME hook PartnerHomeScreen's greeting
// uses, so both screens can never show a different name. Editing "Prénom" only ever writes
// to awaADeuxPartnerProfileStore, NEVER back to the owner's awaADeuxPartnerStore. When
// neither value is set, a neutral "Partenaire" fallback is used — never an invented name.
export default function PartnerProfileScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // Typed against the ACTUAL nearest navigator — this screen lives inside PartnerMainTabs'
  // own tab navigator, not the root stack directly (same structure as PartnerHomeScreen.tsx's
  // own profile-shortcut navigation). Logout needs to escape that tab navigator entirely, so
  // it goes through `.getParent()` to reach the root stack — the same explicit, correctly-
  // typed pattern already used by the owner's own ProfileScreen.tsx and
  // AwaADeuxPartnerConnectedScreen.tsx for their own root-level resets.
  const navigation = useNavigation<BottomTabNavigationProp<PartnerMainTabParamList>>();

  // THE single resolved identity — same rule PartnerHomeScreen's greeting uses (owner's
  // seed until the partner saves their own name, then that value wins). See the hook's
  // own header comment for why these two screens must never compute this separately.
  const {name: resolvedPartnerFirstName, hasName: hasPartnerName} = useAwaADeuxPartnerIdentity();
  const {setFirstName: setPartnerProfileFirstName} = useAwaADeuxPartnerProfile();
  const identityName = resolvedPartnerFirstName || t('awaADeux.partnerSide.profile.roleValue');
  const identityInitial = upperCaseFor(identityName.charAt(0));

  const [nameModalVisible, setNameModalVisible] = useState(false);
  const saveProfileFirstName = (value: string) => {
    setPartnerProfileFirstName(value); // ONLY awaADeuxPartnerProfileStore — never the owner's store
    setNameModalVisible(false);
  };

  const {toggles, isPregnant} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant});
  const sharedItems = sharingSections().flatMap(section => section.items).filter(item => visibility.fields[item.key]);
  const ownerLabel = partnerSubject(getFirstName().trim());
  const accessExplanations = accessExplanationsOf(t);

  const [expanded, setExpanded] = useState<'access' | 'privacy' | 'help' | null>(null);
  // Which single "Aide & support" FAQ row is currently expanded (independent of the
  // section's own outer accordion above) — only one can be open at a time.
  const [expandedHelpItem, setExpandedHelpItem] = useState<string | null>(null);

  // Real action, not a placeholder: opens the device's mail app with AWA's existing
  // support address. Fails silently if no mail app is configured.
  const contactSupport = () => {
    const address = APP_METADATA.contactEmail;
    if (!address) {return;}
    Linking.openURL(buildMailtoUrl(address, t('awaADeux.partnerSide.profile.faq.contactEmailSubject'), '')).catch(() => {});
  };

  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  // Partner LOGOUT ≠ "stop sharing"/disconnect. It only ends the partner's own frontend
  // UI session and returns to Welcome — it must NEVER touch the AWA à deux relationship
  // itself (that belongs exclusively to the OWNER's own "Arrêter le partage" action
  // elsewhere, never to this screen). So this deliberately does not end the demo
  // connection, does not touch the owner's saved sharing choices or her entered partner
  // name, and never clears device storage globally: connectionStatus, those owner values,
  // and the partner's own saved profile first name all survive this unchanged.
  //
  // The reset targets the ROOT stack's "Welcome" (via `.getParent()`, see the navigation
  // hook's own comment above) — not a plain `navigate()` — specifically so PartnerMainTabs
  // is dropped from history entirely: Android Back after logout cannot return here.
  const signOut = () => {
    setLogoutConfirmVisible(false);
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.reset({index: 0, routes: [{name: 'Welcome'}]});
  };

  return (
    <PartnerScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top), paddingBottom: getFloatingTabBarClearance(insets.bottom, 16)}]}
        showsVerticalScrollIndicator={false}>
        <AwaText accessibilityRole="header" variant="headlineMedium" style={styles.title}>{t('awaADeux.partnerSide.profile.title')}</AwaText>
        <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.subtitle}>{t('awaADeux.partnerSide.profile.subtitle')}</AwaText>

        {/* Welcome / identity card — compact HORIZONTAL layout: avatar left, greeting
            centered. No "Connecté" badge here anymore — that status already lives in the
            "AWA à deux" section subtitle below, so it isn't duplicated. */}
        <AwaCard padding="none" style={styles.identityCard} variant="filled">
          <View style={styles.avatarOuterRing}>
            <View style={styles.avatarFallback}>
              {hasPartnerName ? (
                <Text style={styles.avatarFallbackText}>{identityInitial}</Text>
              ) : (
                <MaterialDesignIcons accessibilityLabel={t('awaADeux.partnerSide.profile.noNameAccessibility')} color={theme.colors.primary} name="account-outline" size={30} />
              )}
            </View>
          </View>
          <View style={styles.identityCopy}>
            <AwaText variant="titleMedium">{t('awaADeux.partnerSide.profile.greeting', {name: identityName})}</AwaText>
           <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.welcomeLine}>{t('awaADeux.partnerSide.profile.welcomeLine1')}</AwaText>
<AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.welcomeLine}>{t('awaADeux.partnerSide.profile.welcomeLine2')}</AwaText>
          </View>
        </AwaCard>

        <SectionHeader styles={styles} subtitle={t('awaADeux.partnerSide.profile.personalInfoSubtitle')} title={t('awaADeux.partnerSide.profile.personalInfoTitle')} />
        <AwaCard padding="none" style={styles.personalInfoCard} variant="filled">
          <InfoRow
            accessibilityLabel={t('awaADeux.partnerSide.profile.editFirstNameAccessibility')}
            icon="account-outline"
            label={t('awaADeux.partnerSide.profile.firstNameLabel')}
            onPress={() => setNameModalVisible(true)}
            styles={styles}
            theme={theme}
            value={identityName}
          />
          <View style={styles.infoRowDivider} />
          {/* Read-only — no onPress, so InfoRow renders it as a plain View with no chevron. */}
          <InfoRow icon="account-heart-outline" label={t('awaADeux.partnerSide.profile.roleLabel')} styles={styles} theme={theme} value={t('awaADeux.partnerSide.profile.roleValue')} />
        </AwaCard>

        <EditFirstNameModal
          initialValue={hasPartnerName ? identityName : ''}
          onClose={() => setNameModalVisible(false)}
          onSave={saveProfileFirstName}
          styles={styles}
          theme={theme}
          visible={nameModalVisible}
        />

        <SectionHeader styles={styles} subtitle={t('awaADeux.partnerSide.profile.connectedToSubtitle', {owner: ownerLabel.toLowerCase()})} title={t('profile.awaADeuxTitle')} />

        {/* Same accordion component/visual system as Confidentialité below (Row +
            privacyRow/privacyIcon/privacyText/privacyDivider) — only the content differs:
            here, one dynamic row per currently-shared category (never a hardcoded list),
            each with a trailing "Activé" badge. A disabled permission simply has no row —
            never a "Désactivé"/"Masqué" placeholder. */}
        <Row
          expanded={expanded === 'access'}
          icon="calendar-month-outline"
          id="access"
          onPress={() => setExpanded(current => (current === 'access' ? null : 'access'))}
          styles={styles}
          theme={theme}
          title={t('awaADeux.partnerSide.profile.accessRowTitle')}>
          {sharedItems.length === 0 ? (
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={22} />
              </View>
              <View style={styles.privacyText}>
                <Text style={styles.privacyItemTitle}>{t('awaADeux.partnerSide.profile.noSharedTitle')}</Text>
                <Text style={styles.privacyItemDescription}>{t('awaADeux.partnerSide.profile.noSharedDescription')}</Text>
              </View>
            </View>
          ) : (
            sharedItems.map((item, index) => (
              <View key={item.key}>
                {index > 0 ? <View style={styles.privacyDivider} /> : null}
                <View style={styles.privacyRow}>
                  <View style={[styles.privacyIcon, {backgroundColor: withAlpha(accessColor(item.key, theme), theme.isDark ? 0.24 : 0.14)}]}>
                    <MaterialDesignIcons color={accessColor(item.key, theme)} name={item.icon as never} size={22} />
                  </View>
                  <View style={styles.privacyText}>
                    <Text style={styles.privacyItemTitle}>{item.label}</Text>
                    <Text style={styles.privacyItemDescription}>{accessExplanations[item.key] ?? t('awaADeux.partnerSide.profile.defaultAccessDescription')}</Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>{t('awaADeux.partnerSide.profile.activeBadge')}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Row>

        <Row
          expanded={expanded === 'privacy'}
          icon="shield-lock-outline"
          id="privacy"
          onPress={() => setExpanded(current => (current === 'privacy' ? null : 'privacy'))}
          styles={styles}
          theme={theme}
          title={t('awaADeux.partnerSide.profile.privacyRowTitle')}>
          <View style={styles.privacyRow}>
            <View style={styles.privacyIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="eye-outline" size={22} />
            </View>
            <View style={styles.privacyText}>
              <Text style={styles.privacyItemTitle}>{t('awaADeux.partnerSide.profile.canSeeTitle')}</Text>
              <Text style={styles.privacyItemDescription}>
                {t('awaADeux.partnerSide.profile.canSeeDescription')}
              </Text>
            </View>
          </View>

          <View style={styles.privacyDivider} />

          <View style={styles.privacyRow}>
            <View style={styles.privacyIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="lock-outline" size={22} />
            </View>
            <View style={styles.privacyText}>
              <Text style={styles.privacyItemTitle}>{t('awaADeux.partnerSide.profile.stayPrivateTitle')}</Text>
              <Text style={styles.privacyItemDescription}>
                {t('awaADeux.partnerSide.profile.stayPrivateDescription')}
              </Text>
            </View>
          </View>

          {/* Small informational banner only — never pressable, no chevron, no navigation. */}
          <View style={styles.privacyBanner}>
            <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={18} />
            <Text style={styles.privacyBannerText}>{t('awaADeux.partnerSide.profile.privacyBanner')}</Text>
          </View>
        </Row>

        <Row
          expanded={expanded === 'help'}
          icon="help-circle-outline"
          id="help"
          onPress={() =>
            setExpanded(current => {
              if (current === 'help') {
                setExpandedHelpItem(null); // closing the whole section also resets which FAQ was open
                return null;
              }
              return 'help';
            })
          }
          styles={styles}
          theme={theme}
          title={t('awaADeux.partnerSide.profile.helpRowTitle')}>
          <View style={styles.faqList}>
            {/* Each question is now its own independent accordion (only one open at a
                time) — including "Contacter le support", which also reveals a real,
                separately-labelled action button (see FaqRow) instead of being a single
                always-active row. */}
            {helpFaqOf(t).map((faq, index) => (
              <FaqRow
                key={faq.key}
                expanded={expandedHelpItem === faq.key}
                index={index}
                item={faq}
                onContactPress={contactSupport}
                onToggle={() => setExpandedHelpItem(current => (current === faq.key ? null : faq.key))}
                styles={styles}
                theme={theme}
              />
            ))}
          </View>
        </Row>

        <AwaButton
          accessibilityLabel={t('awaADeux.partnerSide.profile.signOut')}
          fullWidth
          icon="logout"
          label={t('awaADeux.partnerSide.profile.signOut')}
          onPress={() => setLogoutConfirmVisible(true)}
          style={styles.signOut}
          variant="destructive"
        />
      </ScrollView>

      <LogoutConfirmModal
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={signOut}
        styles={styles}
        theme={theme}
        visible={logoutConfirmVisible}
      />
    </PartnerScreenBackground>
  );
}

// Explains the CATEGORY of access granted — never the actual value (that belongs on
// PartnerHome/PartnerCalendar, where sharing already permits it).
const accessExplanationsOf = (t: TFunction): Partial<Record<SharingKey, string>> => ({
  cycleDay: t('awaADeux.partnerSide.profile.accessExplanationCycleDay'),
  nextPeriod: t('awaADeux.partnerSide.profile.accessExplanationNextPeriod'),
  periodStatus: t('awaADeux.partnerSide.profile.accessExplanationPeriodStatus'),
  fertileWindow: t('awaADeux.partnerSide.profile.accessExplanationFertileWindow'),
  ovulation: t('awaADeux.partnerSide.profile.accessExplanationOvulation'),
  fertilityStatus: t('awaADeux.partnerSide.profile.accessExplanationFertilityStatus'),
  pregnancyWeek: t('awaADeux.partnerSide.profile.accessExplanationPregnancyWeek'),
  dueDate: t('awaADeux.partnerSide.profile.accessExplanationDueDate'),
  babyDevelopment: t('awaADeux.partnerSide.profile.accessExplanationBabyDevelopment'),
  mood: t('awaADeux.partnerSide.profile.accessExplanationMood'),
  dailyAdvice: t('awaADeux.partnerSide.profile.accessExplanationDailyAdvice'),
});

// Semantic colors already used elsewhere in AWA for these exact categories — reused, not
// invented: pink for period-related information (same as PartnerHomeScreen's "Prochaines
// règles estimées" card), green for fertility (same as its "Fenêtre fertile" card),
// theme.colors.accent for ovulation (AWA's existing second brand-purple token), and the
// resolved theme primary for everything else.
function accessColor(key: SharingKey, theme: ResolvedAwaTheme): string {
  if (key === 'periodStatus' || key === 'nextPeriod') {return homeColors.pink;}
  if (key === 'fertileWindow' || key === 'fertilityStatus') {return homeColors.green;}
  if (key === 'ovulation') {return theme.colors.accent;}
  return theme.colors.primary;
}

// Reference wording for the 5 FAQ rows (kept exact). Each now carries its own expanded
// ANSWER — informational only: it explains what a shared category *means*, never a real
// value (those stay on PartnerHome/PartnerCalendar, gated by the real sharing toggles).
// "Comprendre les informations partagées" uses a small definition list instead of one
// paragraph; "Contacter le support" is the only one that also exposes a real action
// (see FaqRow's `contact` handling) — it does NOT reuse cycleMath or invent a new contact
// method, it only reuses the existing `contactSupport()` / APP_METADATA.contactEmail.
type FaqParagraphAnswer = {kind: 'paragraph'; paragraphs: string[]};
type FaqDefinitionAnswer = {kind: 'definitions'; intro: string; items: Array<{term: string; description: string}>};
type FaqAnswer = FaqParagraphAnswer | FaqDefinitionAnswer;
type FaqItem = {
  key: string;
  icon: IconName;
  title: string;
  description: string;
  answer: FaqAnswer;
  /** Only "Contacter le support": reveals a real mailto action inside its expanded body. */
  contact?: boolean;
};

const helpFaqOf = (t: TFunction): FaqItem[] => [
  {
    key: 'how-it-works',
    icon: 'book-open-variant',
    title: t('awaADeux.partnerSide.profile.faq.howItWorksTitle'),
    description: t('awaADeux.partnerSide.profile.faq.howItWorksDescription'),
    answer: {
      kind: 'paragraph',
      paragraphs: [
        t('awaADeux.partnerSide.profile.faq.howItWorksParagraph1'),
        t('awaADeux.partnerSide.profile.faq.howItWorksParagraph2'),
        t('awaADeux.partnerSide.profile.faq.howItWorksParagraph3'),
      ],
    },
  },
  {
    key: 'hidden-information',
    icon: 'eye-off-outline',
    title: t('awaADeux.partnerSide.profile.faq.hiddenInfoTitle'),
    description: t('awaADeux.partnerSide.profile.faq.hiddenInfoDescription'),
    answer: {
      kind: 'paragraph',
      paragraphs: [
        t('awaADeux.partnerSide.profile.faq.hiddenInfoParagraph1'),
        t('awaADeux.partnerSide.profile.faq.hiddenInfoParagraph2'),
        t('awaADeux.partnerSide.profile.faq.hiddenInfoParagraph3'),
      ],
    },
  },
  {
    key: 'understanding-shared-info',
    icon: 'format-list-bulleted',
    title: t('awaADeux.partnerSide.profile.faq.understandingTitle'),
    description: t('awaADeux.partnerSide.profile.faq.understandingDescription'),
    answer: {
      kind: 'definitions',
      intro: t('awaADeux.partnerSide.profile.faq.understandingIntro'),
      items: [
        {term: t('awaADeux.partnerSide.profile.faq.termCycleDay'), description: t('awaADeux.partnerSide.profile.faq.descriptionCycleDay')},
        {term: t('awaADeux.partnerSide.profile.faq.termCurrentPhase'), description: t('awaADeux.partnerSide.profile.faq.descriptionCurrentPhase')},
        {term: t('awaADeux.partnerSide.profile.faq.termFertileWindow'), description: t('awaADeux.partnerSide.profile.faq.descriptionFertileWindow')},
        {term: t('awaADeux.partnerSide.profile.faq.termOvulation'), description: t('awaADeux.partnerSide.profile.faq.descriptionOvulation')},
        {term: t('awaADeux.partnerSide.profile.faq.termNextPeriod'), description: t('awaADeux.partnerSide.profile.faq.descriptionNextPeriod')},
        {term: t('awaADeux.partnerSide.profile.faq.termPeriodStatus'), description: t('awaADeux.partnerSide.profile.faq.descriptionPeriodStatus')},
      ],
    },
  },
  {
    key: 'troubleshooting',
    icon: 'cog-outline',
    title: t('awaADeux.partnerSide.profile.faq.troubleshootingTitle'),
    description: t('awaADeux.partnerSide.profile.faq.troubleshootingDescription'),
    answer: {
      kind: 'paragraph',
      paragraphs: [
        t('awaADeux.partnerSide.profile.faq.troubleshootingParagraph1'),
        t('awaADeux.partnerSide.profile.faq.troubleshootingParagraph2'),
        t('awaADeux.partnerSide.profile.faq.troubleshootingParagraph3'),
        t('awaADeux.partnerSide.profile.faq.troubleshootingParagraph4'),
      ],
    },
  },
  {
    key: 'contact-support',
    icon: 'email-outline',
    title: t('awaADeux.partnerSide.profile.faq.contactSupportTitle'),
    description: t('awaADeux.partnerSide.profile.faq.contactSupportDescription'),
    answer: {
      kind: 'paragraph',
      paragraphs: [
        t('awaADeux.partnerSide.profile.faq.contactSupportParagraph1'),
        t('awaADeux.partnerSide.profile.faq.contactSupportParagraph2'),
      ],
    },
    contact: true,
  },
];

/** Title + subtitle (the former icon circle was decorative and was removed), matching the owner ProfileScreen's own SectionHeader
 * ahead of its "Mes informations" block (that component is private to ProfileScreen.tsx,
 * so this reproduces its visual structure/tokens locally rather than duplicating a store
 * or business logic). */
function SectionHeader({
  title,
  subtitle,
  styles,
}: {
  title: string;
  subtitle: string;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <AwaText accessibilityRole="header" variant="titleMedium" style={styles.sectionTitle}>{title}</AwaText>
      <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.sectionSubtitle}>{subtitle}</AwaText>
    </View>
  );
}

/** A single read-only "label above value" row for "Informations personnelles" — plain
 * View, never Pressable: neither Prénom nor Rôle has an edit destination in this
 * frontend-only demo, so neither pretends to be a button. The trailing chevron is
 * decorative only (same convention this screen already uses for its FAQ rows /
 * PartnerAdviceScreen's "Petites attentions" rows) — it never triggers navigation. */
function InfoRow({
  icon,
  label,
  value,
  theme,
  styles,
  onPress,
  accessibilityLabel,
}: {
  icon: IconName;
  label: string;
  value: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
  /** Only "Prénom" passes this — makes the row a real, editable Pressable with a
   * FUNCTIONAL chevron. Omitted (e.g. "Rôle"): a plain, non-interactive View with no
   * chevron at all, since there is nothing to open. */
  onPress?: () => void;
  accessibilityLabel?: string;
}): React.JSX.Element {
  const rowContent = (
    <>
      <View style={styles.infoIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
      </View>
      <View style={styles.infoCopy}>
        <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{label}</AwaText>
        <AwaText variant="titleSmall" style={styles.infoValue}>{value}</AwaText>
      </View>
      {onPress ? <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={18} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        onPress={onPress}
        style={({pressed}) => [styles.infoRow, pressed && styles.pressed]}>
        {rowContent}
      </Pressable>
    );
  }

  return <View style={styles.infoRow}>{rowContent}</View>;
}

/** "Prénom" edit sheet — reuses the SAME Modal/KeyboardAvoidingView/card/footer pattern
 * already used elsewhere in AWA (e.g. QadaaManualEntryModal: fade-in transparent Modal,
 * dismiss-on-overlay-tap, a card that avoids the keyboard, a primary "confirm" action and a
 * plain-text "cancel" one) and the same TextInput visual convention as
 * AwaADeuxPartnerNameScreen's own name field (autoCapitalize="words", returnKeyType="done",
 * textContentType="givenName"). Saves ONLY to awaADeuxPartnerProfileStore — the caller
 * (PartnerProfileScreen) is the only place that decides what to do with the saved value,
 * so this component never touches the owner's awaADeuxPartnerStore itself. */
function EditFirstNameModal({
  visible,
  initialValue,
  onClose,
  onSave,
  theme,
  styles,
}: {
  visible: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const {t} = useTranslation();
  const [value, setValue] = useState(initialValue);

  // Re-seed from the current display value each time the sheet opens (never stale, never
  // shows the OTHER store's value — `initialValue` is passed in by PartnerProfileScreen).
  useEffect(() => {
    if (visible) {setValue(initialValue);}
  }, [visible, initialValue]);

  const trimmedValue = value.trim();
  const canSave = trimmedValue.length > 0;

  const submit = () => {
    if (!canSave) {return;}
    onSave(trimmedValue);
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.nameModalRoot}>
        <Pressable accessibilityLabel={t('common.close')} onPress={onClose} style={styles.nameModalOverlay} />
        <View style={styles.nameModalCard}>
          <AwaText accessibilityRole="header" variant="titleLarge">{t('awaADeux.partnerSide.profile.editNameModal.title')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.nameModalSubtitle}>{t('awaADeux.partnerSide.profile.editNameModal.subtitle')}</AwaText>

          <AwaTextField
            accessibilityLabel={t('awaADeux.partnerSide.profile.editNameModal.label')}
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            label={t('awaADeux.partnerSide.profile.editNameModal.label')}
            maxLength={PARTNER_PROFILE_FIRST_NAME_MAX_LENGTH}
            onChangeText={setValue}
            onSubmitEditing={submit}
            returnKeyType="done"
            selectionColor={theme.colors.primary}
            textContentType="givenName"
            value={value}
            wrapperStyle={styles.nameModalField}
          />

          <View style={styles.nameModalFooter}>
            <AwaButton
              accessibilityLabel={t('common.cancel')}
              label={t('common.cancel')}
              onPress={onClose}
              style={styles.nameModalAction}
              variant="outlined"
            />
            <AwaButton
              accessibilityLabel={t('common.save')}
              disabled={!canSave}
              label={t('common.save')}
              onPress={submit}
              style={styles.nameModalAction}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** "Se déconnecter ?" confirmation — reproduces the SAME destructive-confirmation visual
 * pattern already established by QadaaDeleteConfirmModal.tsx (fade-in transparent Modal,
 * dismiss-on-backdrop-tap, centered card: icon circle tinted with `theme.colors.danger` →
 * serif title → centered body → bordered "cancel" button + solid destructive button) —
 * not a second design, the same one. "Se déconnecter" here calls the EXACT same existing
 * logout behavior (`signOut`, passed in by the caller) — no authentication/session logic
 * lives in this component. */
function LogoutConfirmModal({
  visible,
  onCancel,
  onConfirm,
  theme,
  styles,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const {t} = useTranslation();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible={visible}>
      <View style={styles.logoutRoot}>
        <Pressable accessibilityLabel={t('common.close')} accessibilityRole="button" onPress={onCancel} style={styles.logoutBackdrop} />
        <View accessibilityViewIsModal style={styles.logoutCard}>
          <View importantForAccessibility="no-hide-descendants" style={styles.logoutIconCircle}>
            <MaterialDesignIcons color={theme.colors.danger} name="logout" size={26} />
          </View>

          <AwaText accessibilityRole="header" variant="titleLarge" style={styles.logoutTitle}>{t('awaADeux.partnerSide.profile.logoutModal.title')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.logoutBody}>{t('awaADeux.partnerSide.profile.logoutModal.body')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.logoutReassurance}>{t('awaADeux.partnerSide.profile.logoutModal.reassurance')}</AwaText>

          <View style={styles.logoutActions}>
            <AwaButton
              accessibilityLabel={t('common.cancel')}
              label={t('common.cancel')}
              onPress={onCancel}
              style={styles.logoutButton}
              variant="outlined"
            />
            <AwaButton
              accessibilityLabel={t('awaADeux.partnerSide.profile.signOut')}
              label={t('awaADeux.partnerSide.profile.signOut')}
              onPress={onConfirm}
              style={styles.logoutButton}
              variant="destructive"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** One independently-expandable "Aide & support" question. Same header/Pressable-vs-
 * plain-sibling-body split as `Row` (and the same reason: "Contacter le support"'s real
 * mailto button lives in the body, so the body must not be nested inside another
 * Pressable). Reuses `RowBody` for the same subtle entrance animation. */
function FaqRow({
  item,
  index,
  expanded,
  onToggle,
  onContactPress,
  theme,
  styles,
}: {
  item: FaqItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onContactPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const {t} = useTranslation();
  return (
    <View style={index > 0 ? styles.faqRowDivider : undefined}>
      <Pressable
        accessibilityLabel={item.title}
        accessibilityRole="button"
        accessibilityState={{expanded}}
        onPress={onToggle}
        style={({pressed}) => [styles.faqRow, pressed && styles.pressed]}>
        <View style={styles.faqIcon}>
          <MaterialDesignIcons color={theme.colors.primary} name={item.icon} size={20} />
        </View>
        <View style={styles.faqCopy}>
          <Text style={styles.faqTitle}>{item.title}</Text>
          <Text style={styles.faqDescription}>{item.description}</Text>
        </View>
        <MaterialDesignIcons color={theme.colors.textMuted} name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
      </Pressable>

      {expanded ? (
        <RowBody styles={styles}>
          <View style={styles.faqAnswerDivider} />
          {item.answer.kind === 'paragraph' ? (
            item.answer.paragraphs.map((paragraph, paragraphIndex) => (
              <Text key={paragraph} style={[styles.faqAnswerText, paragraphIndex > 0 && styles.faqAnswerParagraphSpacing]}>
                {paragraph}
              </Text>
            ))
          ) : (
            <>
              <Text style={styles.faqAnswerText}>{item.answer.intro}</Text>
              <View style={styles.faqDefinitionList}>
                {item.answer.items.map(entry => (
                  <View key={entry.term} style={styles.faqDefinitionRow}>
                    <Text style={styles.faqDefinitionTerm}>{entry.term}</Text>
                    <Text style={styles.faqDefinitionDescription}>{entry.description}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* The one real action in this whole section: opens the device's mail app with
              AWA's existing support address (utils/appMetadata.ts's APP_METADATA — the
              same value AboutScreen.tsx / HelpSupportScreen.tsx already use — via the same
              mailto builder the AWA à deux invitation email already uses). Deliberately a
              DIFFERENT accessibility label than the header above, so a screen reader never
              announces two "Contacter le support" buttons. */}
          {item.contact ? (
            <AwaButton
              accessibilityLabel={t('awaADeux.partnerSide.profile.faq.contactAccessibility')}
              icon="email-outline"
              label={t('awaADeux.partnerSide.profile.faq.contactButton')}
              onPress={onContactPress}
              style={styles.faqContactButton}
              variant="tonal"
            />
          ) : null}
        </RowBody>
      ) : null}
    </View>
  );
}

/** Only the Pressable header toggles; the revealed body is a plain sibling so a REAL
 * interactive row can safely live inside it (a Pressable nested in another Pressable's
 * hit area is a known source of touch-handling bugs on Android). */
function Row({
  icon,
  id,
  title,
  children,
  expanded,
  onPress,
  theme,
  styles,
}: {
  icon: string;
  id: 'access' | 'privacy' | 'help';
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const {t} = useTranslation();
  return (
    <AwaCard padding="none" style={styles.row} variant="filled">
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{expanded}}
        onPress={onPress}
        style={({pressed}) => [styles.rowHeader, pressed && styles.pressed]}>
        <View style={styles.rowIcon}>
          <MaterialDesignIcons color={theme.colors.primary} name={icon as never} size={20} />
        </View>
        <View style={styles.rowCopy}>
          <AwaText variant="titleSmall">{title}</AwaText>
          {!expanded ? <AwaText colorRole="onSurfaceVariant" numberOfLines={2} variant="bodySmall" style={styles.rowHint}>{rowHintsOf(t)[id]}</AwaText> : null}
        </View>
        <MaterialDesignIcons color={theme.colors.textMuted} name={expanded ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>
      {expanded ? <RowBody styles={styles}>{children}</RowBody> : null}
    </AwaCard>
  );
}

// Keyed by the STABLE id, never by the (now-translated) title — a lookup by title would
// silently break once the title is displayed in English.
const rowHintsOf = (t: TFunction): Record<'access' | 'privacy' | 'help', string> => ({
  access: t('awaADeux.partnerSide.profile.rowHintAccess'),
  privacy: t('awaADeux.partnerSide.profile.rowHintPrivacy'),
  help: t('awaADeux.partnerSide.profile.rowHintHelp'),
});

/** Subtle entrance for the revealed body: opacity + a small translateY, ~200ms — never
 * starting fully invisible, no looping. */
function RowBody({children, styles}: {children: React.ReactNode; styles: ReturnType<typeof createStyles>}): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, {toValue: 1, duration: 200, useNativeDriver: true});
    animation.start();
    return () => animation.stop();
  }, [progress]);
  const style = {
    opacity: progress.interpolate({inputRange: [0, 1], outputRange: [0.5, 1]}),
    transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [6, 0]})}],
  };
  return <Animated.View style={[styles.rowBodyWrap, style]}>{children}</Animated.View>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: 20, paddingBottom: 20},
    title: {color: theme.colors.accent},
    subtitle: {marginTop: 4},
    // Identity card — avatar-initial ring + name, mirroring ProfileScreen's own identity
    // Compact HORIZONTAL welcome card: avatar left, greeting centered vertically next to
    // it. `overflow: hidden` clips the decorative heart to the card's rounded corners.
    identityCard: {
      marginTop: 20,
      minHeight: 130,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    // Smaller than the previous pass (was 84/70) so the text column gets more width to
    // wrap the two welcome sentences without breaking mid-word.
    avatarOuterRing: {
      width: 70,
      height: 70,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 35,
      backgroundColor: withAlpha(theme.colors.surface, 0.86),
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12),
    },
    avatarFallback: {
      width: 60,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 30,
      borderWidth: 2,
      borderColor: theme.colors.surface,
      backgroundColor: theme.colors.primarySoft,
    },
    avatarFallbackText: {color: theme.colors.primary, fontSize: 26, fontWeight: '700'},
    // flex: 1 + minWidth: 0 so the greeting always has the remaining row width to wrap
    // into — never numberOfLines/ellipsis, so a normal first name is never truncated.
    identityCopy: {flex: 1, minWidth: 0},
    // The two compact welcome sentences below the greeting — kept short (per spec) rather
    // than one long paragraph, so each can also be asserted on independently. Left to wrap
    // naturally (no manual line splitting).
    welcomeLine: {marginTop: 3},
    // Same "toggle currently active" convention as ProfileScreen's own activeBadge.
    activeBadge: {
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: withAlpha(theme.colors.success, 0.16),
    },
    activeDot: {width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.success},
    activeBadgeText: {color: theme.colors.success, fontSize: 11, fontWeight: '800'},
    // Same border/radius/surface/shadow/horizontal-padding tokens the rest of this screen
    // uses, with the vertical padding trimmed for "Informations personnelles" specifically.
    personalInfoCard: {marginTop: 14, paddingHorizontal: 16, paddingVertical: 8},
    // Section header — icon circle + serif title + secondary subtitle — reproducing the
    // owner ProfileScreen's own SectionHeader tokens (34px icon circle, 17px serif title,
    // subtitle indented under it) ahead of both "Informations personnelles" and "AWA à deux".
    sectionHeader: {marginTop: 22, marginBottom: 10, paddingHorizontal: 2},
    sectionTitle: {color: theme.colors.accent},
    sectionSubtitle: {marginTop: 4},
    // "Informations personnelles" — read-only Prénom + Rôle rows. The trailing chevron is
    // decorative only (see InfoRow's own comment) — neither row is a Pressable. Compact but
    // still breathable: paddingVertical (not just minHeight) keeps a consistent ~56px row
    // whether or not the value wraps, without the large empty margins of the previous pass.
    infoRow: {minHeight: 56, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12},
    infoRowDivider: {marginVertical: 2, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    infoIcon: {
      width: 38,
      height: 38,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    infoCopy: {flex: 1, minWidth: 0},
    infoValue: {marginTop: 1},
    infoChevron: {flexShrink: 0, marginLeft: 4},
    row: {marginTop: 12, paddingHorizontal: 14, paddingVertical: 14},
    rowHeader: {flexDirection: 'row', alignItems: 'center', gap: 12},
    rowIcon: {
      width: 40,
      height: 40,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: theme.colors.primarySoft,
    },
    rowCopy: {flex: 1, minWidth: 0},
    rowHint: {marginTop: 2},
    rowBodyWrap: {marginTop: 10},
    // "Confidentialité" expanded content — two compact privacy rows (icon + title +
    // description) inside the SAME card, one subtle divider between them, then a small
    // non-pressable informational banner. No separate nested cards for the two rows.
    privacyRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 13},
    privacyIcon: {
      width: 48,
      height: 48,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: theme.colors.primarySoft,
    },
    privacyText: {flex: 1, minWidth: 0, paddingTop: 2},
    privacyItemTitle: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700'},
    privacyItemDescription: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},
    privacyDivider: {marginVertical: 14, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    privacyBanner: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },
    privacyBannerText: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 12.5, lineHeight: 17, fontWeight: '600'},
    // "Aide & support": one continuous list inside the same outer card (not five separate
    // shadowed cards) — a top divider under the header, then one compact row per FAQ item,
    // each separated by a hairline.
    faqList: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    faqRow: {minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12},
    faqRowDivider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    faqIcon: {
      width: 44,
      height: 44,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },
    faqCopy: {flex: 1, minWidth: 0},
    faqTitle: {color: theme.colors.text, fontSize: 13.5, lineHeight: 19, fontWeight: '700'},
    faqDescription: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
    // Expanded FAQ answer — a subtle separator, then the answer as a natural continuation
    // of the same row (never a second nested card).
    faqAnswerDivider: {marginBottom: 10, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    faqAnswerText: {color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},
    faqAnswerParagraphSpacing: {marginTop: 8},
    // "Comprendre les informations partagées" — a compact definition list (term + short
    // explanation) instead of one long paragraph, per spec.
    faqDefinitionList: {marginTop: 10, gap: 8},
    faqDefinitionRow: {gap: 1},
    faqDefinitionTerm: {color: theme.colors.text, fontSize: 12.5, fontWeight: '700'},
    faqDefinitionDescription: {color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16},
    // The one real action in this section — reuses `primarySoft`, never a hardcoded color.
    faqContactButton: {marginTop: 12, alignSelf: 'flex-start'},
    signOut: {marginTop: 20},
    // "Modifier mon prénom" sheet — same fade-in transparent Modal + dismiss-on-overlay-tap
    // + KeyboardAvoidingView + card + footer pattern already used by QadaaManualEntryModal.
    nameModalRoot: {flex: 1, justifyContent: 'flex-end'},
    nameModalOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.45)},
    nameModalCard: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 20,
      ...theme.shadow,
    },
    nameModalSubtitle: {marginTop: 6},
    nameModalField: {marginTop: 18},
    nameModalFooter: {marginTop: 20, flexDirection: 'row', gap: 12},
    nameModalAction: {flex: 1},
    // "Se déconnecter ?" — same visual pattern as QadaaDeleteConfirmModal.tsx (danger-
    // tinted icon circle, serif title, centered body, bordered-cancel + solid-destructive
    // action row). Nothing here is hardcoded — every color comes from `theme`.
    logoutRoot: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20},
    logoutBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.5)},
    logoutCard: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      borderRadius: awaShapes.extraLarge,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 20,
      elevation: 12,
    },
    logoutIconCircle: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.danger, 0.3),
      backgroundColor: withAlpha(theme.colors.danger, 0.12),
    },
    logoutTitle: {marginTop: 14, textAlign: 'center'},
    logoutBody: {marginTop: 10, textAlign: 'center'},
    logoutReassurance: {marginTop: 6, textAlign: 'center'},
    logoutActions: {marginTop: 20, flexDirection: 'row', gap: 10, alignSelf: 'stretch'},
    logoutButton: {flex: 1},
    pressed: {opacity: 0.85},
  });
}
