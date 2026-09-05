import React, {useMemo, useState} from 'react';
import {KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {APP_METADATA} from '../utils/appMetadata';
import {FAQ_ITEMS} from '../utils/supportContent';

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

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [toast, setToast] = useState('');
  const [form, setForm] = useState<Form>(null);
  const [category, setCategory] = useState('Suggestion');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [steps, setSteps] = useState('');
  const [error, setError] = useState('');

  const showToast = (value: string) => {
    setToast(value);
    setTimeout(() => setToast(''), 2300);
  };
  const openEmail = async (subject = 'Support AWA', body = '') => {
    const address = APP_METADATA.contactEmail;
    if (!address) {showToast('Adresse de support indisponible.'); return;}
    const url = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      if (await Linking.canOpenURL(url)) {await Linking.openURL(url);}
      else {showToast('Impossible d’ouvrir l’application e-mail.');}
    } catch {
      showToast('Impossible d’ouvrir l’application e-mail.');
    }
  };
  const openForm = (next: Form) => {
    setForm(next);
    setCategory(next === 'bug' ? 'Problème d’affichage' : 'Suggestion');
    setMessage('');
    setEmail('');
    setSteps('');
    setError('');
  };
  const submit = () => {
    if (!message.trim()) {setError('Décris ta demande avant de continuer.'); return;}
    const subject = form === 'bug' ? `Signalement AWA — ${category}` : `Avis AWA — ${category}`;
    const body = `Catégorie : ${category}\n\nMessage :\n${message.trim()}${steps.trim() ? `\n\nÉtapes :\n${steps.trim()}` : ''}${email.trim() ? `\n\nE-mail de réponse : ${email.trim()}` : ''}\n\nVersion AWA : ${APP_METADATA.version} (${APP_METADATA.buildNumber})`;
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
          <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Aide & support</Text>
            <Text style={styles.subtitle}>Une question ? Nous sommes là pour toi.</Text>
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
              <Text style={styles.supportTitle}>Comment pouvons-nous t’aider ?</Text>
              <Text style={styles.supportText}>Choisis le moyen de contact qui te convient, ou consulte les réponses les plus fréquentes.</Text>
            </View>
          </View>
          <View style={styles.methods}>
            <Method helper="Réponse sous 24h" icon="email-outline" onPress={() => openEmail()} styles={styles} theme={theme} title="E-mail" value={APP_METADATA.contactEmail ?? 'Indisponible'} />
            <View style={styles.divider} />
            <Method helper="Disponible 9h – 18h" icon="chat-processing-outline" onPress={() => showToast('Chat bientôt disponible.')} styles={styles} theme={theme} title="Chat en direct" value="Discuter maintenant" />
            <View style={styles.divider} />
            <Method helper="Questions fréquentes" icon="help-circle-outline" onPress={() => navigation.navigate('FAQ')} styles={styles} theme={theme} title="FAQ" value="Voir les réponses" />
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          <Pressable onPress={() => navigation.navigate('FAQ')}><Text style={styles.seeAll}>Voir tout  ›</Text></Pressable>
        </View>
        <Animated.View entering={FadeInUp.delay(150).duration(420)} style={styles.card}>
          {FAQ_ITEMS.map((item, index) => (
            <HelpRow
              icon={item.icon as never} key={item.id} last={index === FAQ_ITEMS.length - 1}
              onPress={() => navigation.navigate('FAQDetail', {id: item.id})} styles={styles} theme={theme}
              subtitle={item.subtitle} title={item.question}
            />
          ))}
        </Animated.View>

        <Text style={styles.sectionTitle}>Autres sujets d’aide</Text>
        <Animated.View entering={FadeInUp.delay(220).duration(420)} style={styles.card}>
          <HelpRow icon="school-outline" onPress={() => navigation.navigate('Guides')} styles={styles} theme={theme} subtitle="Découvre nos guides pour bien utiliser AWA." title="Guides & tutoriels" />
          <HelpRow icon="star-outline" onPress={() => navigation.navigate('WhatsNew')} styles={styles} theme={theme} subtitle="Voir les dernières fonctionnalités et améliorations." title="Nouveautés" />
          <HelpRow icon="lightbulb-outline" onPress={() => openForm('feedback')} styles={styles} theme={theme} subtitle="Partage tes idées pour améliorer l’application." title="Envoyer un commentaire" />
          <HelpRow last icon="alert-outline" onPress={() => openForm('bug')} styles={styles} theme={theme} subtitle="Signale un bug ou un comportement inattendu." title="Signaler un problème" />
        </Animated.View>

        <View style={styles.banner}>
          <MaterialDesignIcons color={theme.colors.secondary} name="email-newsletter" size={34} />
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>Ton expérience nous aide à améliorer AWA</Text>
            <Text style={styles.bannerText}>Merci de prendre le temps de nous écrire.</Text>
          </View>
        </View>
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setForm(null)} statusBarTranslucent transparent visible={form !== null}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable onPress={() => setForm(null)} style={styles.backdrop} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{form === 'bug' ? 'Signaler un problème' : 'Ton avis compte 💜'}</Text>
            <Text style={styles.inputLabel}>{form === 'bug' ? 'Catégorie' : 'Type de retour'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {(form === 'bug'
                ? ['Problème d’affichage', 'Navigation', 'Calendrier', 'Journal', 'Notifications', 'Données', 'Autre']
                : ['Suggestion', 'Amélioration', 'Autre']
              ).map(item => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipSelected]}>
                  <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>{form === 'bug' ? 'Description' : 'Message'}</Text>
            <TextInput
              maxLength={1000} multiline onChangeText={value => {setMessage(value); setError('');}}
              placeholder="Décris ta demande..." placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.messageInput, error && styles.inputError]} textAlignVertical="top" value={message}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {form === 'bug' ? (
              <>
                <Text style={styles.inputLabel}>Étapes pour reproduire (optionnel)</Text>
                <TextInput multiline onChangeText={setSteps} placeholder="1. Ouvrir..." placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.stepsInput]} value={steps} />
              </>
            ) : null}
            <Text style={styles.inputLabel}>E-mail pour une réponse (optionnel)</Text>
            <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="ton@email.com" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={email} />
            <Pressable onPress={submit} style={({pressed}) => [styles.send, pressed && styles.pressed]}>
              <Text style={styles.sendText}>{form === 'bug' ? 'Envoyer le signalement' : 'Envoyer'}</Text>
            </Pressable>
            <Pressable onPress={() => setForm(null)} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
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
