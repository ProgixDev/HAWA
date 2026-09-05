import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, Share, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

function Shell({title, navigation, children}: {title: string; navigation: {goBack: () => void}; children: React.ReactNode}) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <View style={[styles.header, {paddingTop: Math.max(insets.top, 18) + 8}]}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 24}]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

async function readAwaData() {
  const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith('@awa') || key.startsWith('@hawa'));
  const pairs = await Promise.all(keys.map(async key => [key, await AsyncStorage.getItem(key)] as const));
  return Object.fromEntries(pairs);
}

export function DataManagementScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'DataManagement'>) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    readAwaData().then(data => setCount(Object.keys(data).length));
  }, []);
  const exportData = async () => {
    const data = await readAwaData();
    await Share.share({title: 'Mes données AWA', message: JSON.stringify(data, null, 2)});
  };
  return (
    <Shell navigation={navigation} title="Gestion des données">
      <View style={styles.hero}>
        <MaterialDesignIcons color={theme.colors.primary} name="database-lock-outline" size={35} />
        <Text style={styles.heroTitle}>Tes données AWA</Text>
        <Text style={styles.text}>{count} espaces de stockage locaux sont actuellement utilisés sur cet appareil.</Text>
      </View>
      <Pressable onPress={exportData} style={styles.action}>
        <MaterialDesignIcons color={theme.colors.primary} name="export-variant" size={22} />
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>Exporter mes données</Text>
          <Text style={styles.text}>Créer une copie JSON via le menu de partage sécurisé.</Text>
        </View>
      </Pressable>
      <Pressable onPress={() => setMessage('Pour tout supprimer, utilise « Supprimer mon compte » dans l’écran précédent.')} style={styles.secondary}>
        <Text style={styles.secondaryText}>Informations sur la suppression</Text>
      </Pressable>
      {message ? <Text style={styles.notice}>{message}</Text> : null}
    </Shell>
  );
}

export function DeleteAccountScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const remove = async () => {
    if (value.trim().toUpperCase() !== 'SUPPRIMER') {
      setError('Écris SUPPRIMER pour confirmer.');
      return;
    }
    await AsyncStorage.clear();
    navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
  };
  return (
    <Shell navigation={navigation} title="Supprimer mon compte">
      <View style={styles.warning}>
        <MaterialDesignIcons color={theme.colors.danger} name="alert-outline" size={35} />
        <Text style={styles.warningTitle}>Cette action est irréversible</Text>
        <Text style={styles.text}>Toutes les données AWA enregistrées localement sur cet appareil seront définitivement supprimées.</Text>
      </View>
      <Text style={styles.label}>Écris SUPPRIMER pour confirmer</Text>
      <TextInput
        autoCapitalize="characters" onChangeText={text => {setValue(text); setError('');}}
        style={[styles.input, error && styles.inputError]} value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={remove} style={styles.delete}>
        <Text style={styles.deleteText}>Supprimer définitivement</Text>
      </Pressable>
    </Shell>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12},
    back: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: theme.colors.surface, padding: 9, elevation: 2},
    title: {flex: 1, color: theme.colors.accent, fontFamily: 'serif', fontSize: 20, fontWeight: '700', textAlign: 'center'},
    spacer: {padding: 23},
    content: {paddingHorizontal: 16, gap: 13},
    hero: {alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 24, backgroundColor: theme.colors.surface, padding: 20},
    heroTitle: {marginTop: 9, color: theme.colors.text, fontFamily: 'serif', fontSize: 18, fontWeight: '700'},
    text: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center'},
    action: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.10), borderRadius: 20, backgroundColor: theme.colors.surface, padding: 15},
    actionCopy: {flex: 1, marginLeft: 12},
    actionTitle: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700'},
    secondary: {alignItems: 'center', borderRadius: 18, backgroundColor: theme.colors.primarySoft, padding: 14},
    secondaryText: {color: theme.colors.primary, fontSize: 12, fontWeight: '700'},
    notice: {color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17, textAlign: 'center'},
    // Destructive-action warning card — theme.colors.danger throughout,
    // preserving semantic identity (Step 15). Never becomes theme.primary.
    warning: {alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.28), borderRadius: 24, backgroundColor: withAlpha(theme.colors.danger, 0.05), padding: 20},
    warningTitle: {marginTop: 9, color: theme.colors.danger, fontFamily: 'serif', fontSize: 18, fontWeight: '700'},
    label: {marginTop: 4, color: theme.colors.text, fontSize: 12, fontWeight: '700'},
    input: {borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.16), borderRadius: 18, backgroundColor: theme.colors.surface, padding: 13, color: theme.colors.text, fontSize: 14},
    inputError: {borderColor: theme.colors.danger},
    error: {color: theme.colors.danger, fontSize: 11},
    delete: {alignItems: 'center', borderRadius: 18, backgroundColor: theme.colors.danger, padding: 15},
    deleteText: {color: pickReadableTextColor(theme.colors.danger), fontSize: 14, fontWeight: '700'},
  });
}
