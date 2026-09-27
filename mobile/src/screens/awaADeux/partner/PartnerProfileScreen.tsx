import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../../navigation/AppNavigator';
import type {PartnerMainTabParamList} from '../../../navigation/PartnerMainTabNavigator';
import {homeColors, homeRadii} from '../../../components/home/homeTheme';
import {useAwaADeuxPartnerIdentity} from '../../../hooks/useAwaADeuxPartnerIdentity';
import {useAwaADeuxPartnerProfile} from '../../../hooks/useAwaADeuxPartnerProfile';
import {useAwaADeuxSharing} from '../../../hooks/useAwaADeuxSharing';
import PartnerScreenBackground from './PartnerScreenBackground';
import {PARTNER_PROFILE_FIRST_NAME_MAX_LENGTH} from '../../../state/awaADeuxPartnerProfileStore';
import {getFirstName} from '../../../state/onboardingPreferences';
import type {SharingKey} from '../../../state/awaADeuxSharingStore';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {getFloatingTabBarClearance, getTopPadding} from '../../../theme/spacing';
import {onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
import {computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import {partnerSubject} from '../../../utils/awaADeuxPartnerWording';
import {APP_METADATA} from '../../../utils/appMetadata';
import {SHARING_SECTIONS} from '../awaADeuxDemo';
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
  const identityName = resolvedPartnerFirstName || 'Partenaire';
  const identityInitial = identityName.charAt(0).toUpperCase();

  const [nameModalVisible, setNameModalVisible] = useState(false);
  const saveProfileFirstName = (value: string) => {
    setPartnerProfileFirstName(value); // ONLY awaADeuxPartnerProfileStore — never the owner's store
    setNameModalVisible(false);
  };

  const {toggles, isPregnant} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant});
  const sharedItems = SHARING_SECTIONS.flatMap(section => section.items).filter(item => visibility.fields[item.key]);
  const ownerLabel = partnerSubject(getFirstName().trim());

  const [expanded, setExpanded] = useState<'access' | 'privacy' | 'help' | null>(null);
  // Which single "Aide & support" FAQ row is currently expanded (independent of the
  // section's own outer accordion above) — only one can be open at a time.
  const [expandedHelpItem, setExpandedHelpItem] = useState<string | null>(null);

  // Real action, not a placeholder: opens the device's mail app with AWA's existing
  // support address. Fails silently if no mail app is configured — same fallback as
  // every other mailto: attempt already in AWA à deux (e.g. EmailInvitationModal).
  const contactSupport = () => {
    const address = APP_METADATA.contactEmail;
    if (!address) {return;}
    Linking.openURL(buildMailtoUrl(address, 'Aide — AWA à deux', '')).catch(() => {});
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
        <Text accessibilityRole="header" style={styles.title}>Mon profil</Text>
        <Text style={styles.subtitle}>Votre espace personnel dans AWA à deux</Text>

        {/* Welcome / identity card — compact HORIZONTAL layout: avatar left, greeting
            centered, a very subtle decorative heart behind the content on the right. No
            "Connecté" badge here anymore — that status already lives in the "AWA à deux"
            section subtitle below, so it isn't duplicated. */}
        <View style={styles.identityCard}>
          <View importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.identityDecor}>
            <MaterialDesignIcons color={withAlpha(theme.colors.primary, theme.isDark ? 0.16 : 0.1)} name="heart" size={56} />
          </View>
          <View style={styles.avatarOuterRing}>
            <View style={styles.avatarFallback}>
              {hasPartnerName ? (
                <Text style={styles.avatarFallbackText}>{identityInitial}</Text>
              ) : (
                <MaterialDesignIcons accessibilityLabel="Aucun prénom renseigné" color={theme.colors.primary} name="account-outline" size={30} />
              )}
            </View>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName}>{`Salam ${identityName} ! 💜`}</Text>
           <Text style={styles.welcomeLine}>Partenaire sur AWA à deux.</Text>
<Text style={styles.welcomeLine}>Merci d’être à ses côtés.</Text>
          </View>
        </View>

        <SectionHeader icon="account-outline" styles={styles} subtitle="Vos informations dans AWA à deux" theme={theme} title="Informations personnelles" />
        <View style={styles.personalInfoCard}>
          <InfoRow
            accessibilityLabel="Modifier mon prénom"
            icon="account-outline"
            label="Prénom"
            onPress={() => setNameModalVisible(true)}
            styles={styles}
            theme={theme}
            value={identityName}
          />
          <View style={styles.infoRowDivider} />
          {/* Read-only — no onPress, so InfoRow renders it as a plain View with no chevron. */}
          <InfoRow icon="account-heart-outline" label="Rôle" styles={styles} theme={theme} value="Partenaire" />
        </View>

        <EditFirstNameModal
          initialValue={hasPartnerName ? identityName : ''}
          onClose={() => setNameModalVisible(false)}
          onSave={saveProfileFirstName}
          styles={styles}
          theme={theme}
          visible={nameModalVisible}
        />

        <SectionHeader icon="link-variant" styles={styles} subtitle={`Vous êtes connecté à ${ownerLabel.toLowerCase()}.`} theme={theme} title="AWA à deux" />

        {/* Same accordion component/visual system as Confidentialité below (Row +
            privacyRow/privacyIcon/privacyText/privacyDivider) — only the content differs:
            here, one dynamic row per currently-shared category (never a hardcoded list),
            each with a trailing "Activé" badge. A disabled permission simply has no row —
            never a "Désactivé"/"Masqué" placeholder. */}
        <Row
          expanded={expanded === 'access'}
          icon="calendar-month-outline"
          onPress={() => setExpanded(current => (current === 'access' ? null : 'access'))}
          styles={styles}
          theme={theme}
          title="Informations auxquelles vous avez accès">
          {sharedItems.length === 0 ? (
            <View style={styles.privacyRow}>
              <View style={styles.privacyIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={22} />
              </View>
              <View style={styles.privacyText}>
                <Text style={styles.privacyItemTitle}>Aucune information partagée pour le moment.</Text>
                <Text style={styles.privacyItemDescription}>Votre partenaire peut modifier ses choix de partage à tout moment.</Text>
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
                    <Text style={styles.privacyItemDescription}>{ACCESS_EXPLANATIONS[item.key] ?? 'Vous pouvez voir cette information.'}</Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>Activé</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Row>

        <Row
          expanded={expanded === 'privacy'}
          icon="shield-lock-outline"
          onPress={() => setExpanded(current => (current === 'privacy' ? null : 'privacy'))}
          styles={styles}
          theme={theme}
          title="Confidentialité">
          <View style={styles.privacyRow}>
            <View style={styles.privacyIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="eye-outline" size={22} />
            </View>
            <View style={styles.privacyText}>
              <Text style={styles.privacyItemTitle}>Ce que vous pouvez voir</Text>
              <Text style={styles.privacyItemDescription}>
                Vous voyez uniquement les informations que votre partenaire a choisi de partager avec vous dans AWA à deux.
              </Text>
            </View>
          </View>

          <View style={styles.privacyDivider} />

          <View style={styles.privacyRow}>
            <View style={styles.privacyIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="lock-outline" size={22} />
            </View>
            <View style={styles.privacyText}>
              <Text style={styles.privacyItemTitle}>Ce qui reste privé</Text>
              <Text style={styles.privacyItemDescription}>
                Les informations qu’elle ne partage pas restent privées et ne sont pas visibles dans votre espace.
              </Text>
            </View>
          </View>

          {/* Small informational banner only — never pressable, no chevron, no navigation. */}
          <View style={styles.privacyBanner}>
            <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={18} />
            <Text style={styles.privacyBannerText}>AWA à deux est conçu pour partager uniquement ce qu’elle souhaite vous montrer.</Text>
          </View>
        </Row>

        <Row
          expanded={expanded === 'help'}
          icon="help-circle-outline"
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
          title="Aide & support">
          <View style={styles.faqList}>
            {/* Each question is now its own independent accordion (only one open at a
                time) — including "Contacter le support", which also reveals a real,
                separately-labelled action button (see FaqRow) instead of being a single
                always-active row. */}
            {HELP_FAQ.map((faq, index) => (
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

        <Pressable
          accessibilityLabel="Se déconnecter"
          accessibilityRole="button"
          onPress={() => setLogoutConfirmVisible(true)}
          style={({pressed}) => [styles.signOut, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.danger} name="logout" size={20} />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </Pressable>
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
const ACCESS_EXPLANATIONS: Partial<Record<SharingKey, string>> = {
  cycleDay: 'Vous pouvez voir son jour de cycle et sa phase actuelle.',
  nextPeriod: 'Vous pouvez voir la date estimée de ses prochaines règles.',
  periodStatus: 'Vous pouvez voir si ses règles sont en cours ou terminées.',
  fertileWindow: 'Vous pouvez voir ses jours fertiles.',
  ovulation: 'Vous pouvez voir son ovulation estimée.',
  fertilityStatus: 'Vous pouvez voir son statut de fertilité.',
  pregnancyWeek: 'Vous pouvez voir sa semaine de grossesse.',
  dueDate: 'Vous pouvez voir sa date d’accouchement prévue.',
  babyDevelopment: 'Vous pouvez voir les informations sur le développement du bébé.',
  mood: 'Vous pouvez voir son humeur du jour.',
  dailyAdvice: 'Vous recevez un conseil quotidien pour la soutenir.',
};

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

const HELP_FAQ: FaqItem[] = [
  {
    key: 'how-it-works',
    icon: 'book-open-variant',
    title: 'Comment fonctionne AWA à deux ?',
    description: 'Découvrez comment l’application vous permet de soutenir votre partenaire tout en respectant sa vie privée.',
    answer: {
      kind: 'paragraph',
      paragraphs: [
        'AWA à deux vous permet de consulter uniquement les informations que votre partenaire a choisi de partager avec vous.',
        'Vous pouvez par exemple voir certaines informations sur son cycle, ses prochaines règles ou sa fenêtre fertile lorsque leur partage est activé.',
        'Les informations visibles dépendent toujours de ses choix. Elle peut modifier ce qu’elle partage à tout moment.',
      ],
    },
  },
  {
    key: 'hidden-information',
    icon: 'eye-off-outline',
    title: 'Pourquoi certaines informations sont masquées ?',
    description: 'Votre partenaire choisit ce qu’elle partage avec vous. Elle peut modifier ces choix à tout moment.',
    answer: {
      kind: 'paragraph',
      paragraphs: [
        'Votre partenaire garde le contrôle sur les informations qu’elle souhaite partager avec vous.',
        'Si une information n’apparaît pas dans votre espace, cela peut simplement signifier qu’elle n’a pas choisi de la partager.',
        'Ses choix peuvent être modifiés à tout moment. AWA à deux vous montre uniquement les informations auxquelles vous avez actuellement accès.',
      ],
    },
  },
  {
    key: 'understanding-shared-info',
    icon: 'format-list-bulleted',
    title: 'Comprendre les informations partagées',
    description: 'Explications simples sur le jour du cycle, la phase actuelle, la fenêtre fertile, l’ovulation estimée et les prochaines règles.',
    answer: {
      kind: 'definitions',
      intro: 'Voici ce que peuvent signifier les informations partagées avec vous :',
      items: [
        {term: 'Jour du cycle', description: 'Indique le nombre de jours écoulés depuis le début des dernières règles.'},
        {term: 'Phase actuelle', description: 'Indique l’étape actuelle du cycle lorsqu’elle est disponible.'},
        {term: 'Fenêtre fertile', description: 'Période estimée durant laquelle la probabilité de conception peut être plus élevée.'},
        {term: 'Ovulation estimée', description: 'Estimation du moment de l’ovulation basée sur les informations disponibles.'},
        {term: 'Prochaines règles estimées', description: 'Date estimée du début des prochaines règles.'},
        {term: 'Statut des règles', description: 'Indique si les règles sont actuellement en cours ou terminées.'},
      ],
    },
  },
  {
    key: 'troubleshooting',
    icon: 'cog-outline',
    title: 'J’ai un problème avec AWA à deux',
    description: 'Que faire si les informations ne s’affichent pas, si la connexion semble interrompue ou si vous avez un autre souci.',
    answer: {
      kind: 'paragraph',
      paragraphs: [
        'Si certaines informations ne s’affichent pas, commencez par vérifier que votre connexion internet fonctionne correctement.',
        'Certaines informations peuvent aussi être absentes simplement parce que votre partenaire ne les partage pas actuellement.',
        'Vous pouvez également fermer puis rouvrir l’application.',
        'Si le problème persiste, vous pourrez contacter le support AWA.',
      ],
    },
  },
  {
    key: 'contact-support',
    icon: 'email-outline',
    title: 'Contacter le support',
    description: 'Besoin d’aide supplémentaire ? Notre équipe est là pour vous accompagner.',
    answer: {
      kind: 'paragraph',
      paragraphs: [
        'Si vous avez une question, rencontrez un problème ou souhaitez nous faire un retour, vous pourrez contacter l’équipe AWA depuis cette section.',
        'Merci de nous aider à améliorer AWA ! 💜',
      ],
    },
    contact: true,
  },
];

/** Icon-circle + title + subtitle, matching the owner ProfileScreen's own SectionHeader
 * ahead of its "Mes informations" block (that component is private to ProfileScreen.tsx,
 * so this reproduces its visual structure/tokens locally rather than duplicating a store
 * or business logic). */
function SectionHeader({
  icon,
  title,
  subtitle,
  theme,
  styles,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderTopRow}>
        <View style={styles.sectionHeaderIcon}>
          <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
        </View>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
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
        <Text style={styles.infoLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.infoValue}>{value}</Text>
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
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={styles.nameModalOverlay} />
        <View style={styles.nameModalCard}>
          <Text accessibilityRole="header" style={styles.nameModalTitle}>Modifier mon prénom</Text>
          <Text style={styles.nameModalSubtitle}>Ce prénom sera utilisé dans votre espace AWA à deux.</Text>

          <Text style={styles.nameModalLabel}>Prénom</Text>
          <TextInput
            accessibilityLabel="Prénom"
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
            maxLength={PARTNER_PROFILE_FIRST_NAME_MAX_LENGTH}
            onChangeText={setValue}
            onSubmitEditing={submit}
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="done"
            selectionColor={theme.colors.primary}
            style={styles.nameModalInput}
            textContentType="givenName"
            value={value}
          />

          <View style={styles.nameModalFooter}>
            <Pressable
              accessibilityLabel="Annuler"
              accessibilityRole="button"
              onPress={onClose}
              style={({pressed}) => [styles.nameModalCancel, pressed && styles.pressed]}>
              <Text style={styles.nameModalCancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Enregistrer"
              accessibilityRole="button"
              accessibilityState={{disabled: !canSave}}
              disabled={!canSave}
              onPress={submit}
              style={({pressed}) => [styles.nameModalSave, !canSave && styles.nameModalSaveDisabled, pressed && canSave && styles.pressed]}>
              <Text style={styles.nameModalSaveText}>Enregistrer</Text>
            </Pressable>
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
  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible={visible}>
      <View style={styles.logoutRoot}>
        <Pressable accessibilityLabel="Fermer" accessibilityRole="button" onPress={onCancel} style={styles.logoutBackdrop} />
        <View accessibilityViewIsModal style={styles.logoutCard}>
          <View importantForAccessibility="no-hide-descendants" style={styles.logoutIconCircle}>
            <MaterialDesignIcons color={theme.colors.danger} name="logout" size={26} />
          </View>

          <Text accessibilityRole="header" style={styles.logoutTitle}>Se déconnecter ?</Text>
          <Text style={styles.logoutBody}>Voulez-vous vraiment vous déconnecter de votre espace partenaire ?</Text>
          <Text style={styles.logoutReassurance}>Vous pourrez vous reconnecter à tout moment.</Text>

          <View style={styles.logoutActions}>
            <Pressable
              accessibilityLabel="Annuler"
              accessibilityRole="button"
              onPress={onCancel}
              style={({pressed}) => [styles.logoutButton, styles.logoutCancelButton, pressed && styles.pressed]}>
              <Text style={styles.logoutCancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Se déconnecter"
              accessibilityRole="button"
              onPress={onConfirm}
              style={({pressed}) => [styles.logoutButton, styles.logoutDestructiveButton, pressed && styles.pressed]}>
              <Text style={[styles.logoutDestructiveText, {color: pickReadableTextColor(theme.colors.danger)}]}>Se déconnecter</Text>
            </Pressable>
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
            <Pressable
              accessibilityLabel="Nous contacter par e-mail"
              accessibilityRole="button"
              onPress={onContactPress}
              style={({pressed}) => [styles.faqContactButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="email-outline" size={18} />
              <Text style={styles.faqContactButtonText}>Nous écrire</Text>
            </Pressable>
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
  title,
  children,
  expanded,
  onPress,
  theme,
  styles,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.row}>
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
          <Text style={styles.rowTitle}>{title}</Text>
          {!expanded ? <Text numberOfLines={2} style={styles.rowHint}>{ROW_HINTS[title]}</Text> : null}
        </View>
        <MaterialDesignIcons color={theme.colors.textMuted} name={expanded ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>
      {expanded ? <RowBody styles={styles}>{children}</RowBody> : null}
    </View>
  );
}

const ROW_HINTS: Record<string, string> = {
  'Informations auxquelles vous avez accès': 'Votre partenaire a choisi de partager ces informations avec vous.',
  'Confidentialité': 'Comprendre ce qui est partagé et ce qui reste privé.',
  'Aide & support': 'Des réponses à vos questions sur AWA à deux.',
};

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
    title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 26, lineHeight: 32, fontWeight: '700'},
    subtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 14.5, lineHeight: 20},
    // Identity card — avatar-initial ring + name, mirroring ProfileScreen's own identity
    // Compact HORIZONTAL welcome card: avatar left, greeting centered vertically next to
    // it. `overflow: hidden` clips the decorative heart to the card's rounded corners.
    identityCard: {
      marginTop: 20,
      minHeight: 130,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 26,
      backgroundColor: theme.colors.surface,
      // Trimmed from 18 — a touch less horizontal padding frees a little more room for
      // the text column, alongside the smaller avatar below.
      paddingHorizontal: 16,
      paddingVertical: 16,
      ...theme.shadow,
    },
    // A very subtle, decorative-only heart sitting behind the content in the bottom-right
    // corner (never interactive, never shrinking the text column below).
    identityDecor: {position: 'absolute', right: 10, bottom: 8},
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
    avatarFallbackText: {color: theme.colors.primary, fontFamily: 'serif', fontSize: 26, fontWeight: '700'},
    // flex: 1 + minWidth: 0 so the greeting always has the remaining row width to wrap
    // into — never numberOfLines/ellipsis, so a normal first name is never truncated.
    identityCopy: {flex: 1, minWidth: 0},
    identityName: {color: theme.colors.text, fontFamily: 'serif', fontSize: 18, lineHeight: 23, fontWeight: '700'},
    // The two compact welcome sentences below the greeting — kept short (per spec) rather
    // than one long paragraph, so each can also be asserted on independently. Left to wrap
    // naturally (no manual line splitting).
    welcomeLine: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 17},
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
    activeBadgeText: {color: theme.colors.success, fontSize: 10.5, fontWeight: '800'},
    // Same border/radius/surface/shadow/horizontal-padding tokens the rest of this screen
    // uses, with the vertical padding trimmed for "Informations personnelles" specifically.
    personalInfoCard: {
      marginTop: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 26,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      ...theme.shadow,
    },
    // Section header — icon circle + serif title + secondary subtitle — reproducing the
    // owner ProfileScreen's own SectionHeader tokens (34px icon circle, 17px serif title,
    // subtitle indented under it) ahead of both "Informations personnelles" and "AWA à deux".
    sectionHeader: {marginTop: 22, marginBottom: 10, paddingHorizontal: 2},
    sectionHeaderTopRow: {flexDirection: 'row', alignItems: 'center'},
    sectionHeaderIcon: {
      width: 34,
      height: 34,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 11,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.09),
    },
    sectionTitle: {marginLeft: 9, color: theme.colors.accent, fontFamily: 'serif', fontSize: 17, lineHeight: 22, fontWeight: '700'},
    sectionSubtitle: {marginTop: 5, marginLeft: 43, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
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
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },
    infoCopy: {flex: 1, minWidth: 0},
    infoLabel: {color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16},
    infoValue: {marginTop: 1, color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    infoChevron: {flexShrink: 0, marginLeft: 4},
    row: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 14,
      ...theme.shadow,
    },
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
    rowTitle: {color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    rowHint: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16},
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
    faqContactButton: {
      marginTop: 12,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },
    faqContactButtonText: {color: theme.colors.primary, fontSize: 13, fontWeight: '700'},
    signOut: {
      marginTop: 20,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 22,
      backgroundColor: withAlpha(theme.colors.danger, 0.06),
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.danger, 0.4),
    },
    signOutText: {color: theme.colors.danger, fontSize: 14.5, fontWeight: '700'},
    // "Modifier mon prénom" sheet — same fade-in transparent Modal + dismiss-on-overlay-tap
    // + KeyboardAvoidingView + card + footer pattern already used by QadaaManualEntryModal.
    nameModalRoot: {flex: 1, justifyContent: 'flex-end'},
    nameModalOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.45)},
    nameModalCard: {
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 20,
      ...theme.shadow,
    },
    nameModalTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 20, fontWeight: '700'},
    nameModalSubtitle: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},
    nameModalLabel: {marginTop: 18, marginBottom: 8, color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    nameModalInput: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 14,
      color: theme.colors.text,
      fontSize: 15,
    },
    nameModalFooter: {marginTop: 20, flexDirection: 'row', gap: 12},
    nameModalCancel: {
      flex: 1,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    nameModalCancelText: {color: theme.colors.textSecondary, fontSize: 14.5, fontWeight: '700'},
    nameModalSave: {
      flex: 1,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
    },
    nameModalSaveDisabled: {opacity: 0.45},
    nameModalSaveText: {color: onPrimaryTextColor(theme), fontSize: 14.5, fontWeight: '700'},
    // "Se déconnecter ?" — same visual pattern as QadaaDeleteConfirmModal.tsx (danger-
    // tinted icon circle, serif title, centered body, bordered-cancel + solid-destructive
    // action row). Nothing here is hardcoded — every color comes from `theme`.
    logoutRoot: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20},
    logoutBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.5)},
    logoutCard: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      borderRadius: homeRadii.card,
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
    logoutTitle: {marginTop: 14, color: theme.colors.text, fontFamily: 'serif', fontSize: 21, fontWeight: '700', lineHeight: 27, textAlign: 'center'},
    logoutBody: {marginTop: 10, color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20, textAlign: 'center'},
    logoutReassurance: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
    logoutActions: {marginTop: 20, flexDirection: 'row', gap: 10, alignSelf: 'stretch'},
    logoutButton: {
      flex: 1,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: homeRadii.button,
      paddingHorizontal: 10,
    },
    logoutCancelButton: {borderWidth: 1.4, borderColor: theme.colors.primary, backgroundColor: theme.colors.surface},
    logoutCancelText: {color: theme.colors.primary, fontSize: 15, fontWeight: '700'},
    logoutDestructiveButton: {backgroundColor: theme.colors.danger},
    logoutDestructiveText: {fontSize: 15, fontWeight: '700'},
    pressed: {opacity: 0.85},
  });
}
