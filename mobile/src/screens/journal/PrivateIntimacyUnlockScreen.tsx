import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {isBiometricEnabled, loadSecurityPreferences} from '../../state/securityPreferences';
import {isIntimacyUnlocked, replaceWithIntimacyDestination} from '../../state/privateSectionAuthStore';
import {getBiometryLabel, getBiometryType, hasPrivatePin} from '../../services/privateSectionAuth';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import '../../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivateIntimacyUnlock'>;

// Purpose-specific line for the unified lock design — same structural idea
// as PrivateAccessScreen.tsx's PURPOSE_COPY, kept local here since that
// screen has its own separate gate (System B: purpose-based PrivateAccess,
// vs. this System A: target-based Intimacy flow) and is out of scope for
// this change. `cycle` also covers `undefined` (Vie intime never passes a
// target param). Covers every IntimacyTarget value — `photos` and
// `miscarriageNotes` were the last two still on the legacy padlock-artwork
// PNG background; this file no longer renders that PNG for any target.
// This screen is ONE shared gate reused by every objective (not duplicated
// per-objective), so — unlike the out-of-scope per-objective dashboards —
// translating it benefits every caller uniformly and is in scope.
export function unifiedPurposeCopy(t: (key: string) => string): Record<string, string> {
  return {
    cycle: t('privateIntimacyUnlock.purpose.cycle'),
    conception: t('privateIntimacyUnlock.purpose.conception'),
    cycleNotes: t('privateIntimacyUnlock.purpose.cycleNotes'),
    contraceptionNotes: t('privateIntimacyUnlock.purpose.contraceptionNotes'),
    menopauseNotes: t('privateIntimacyUnlock.purpose.menopauseNotes'),
    photos: t('privateIntimacyUnlock.purpose.photos'),
    miscarriageNotes: t('privateIntimacyUnlock.purpose.miscarriageNotes'),
    export: t('privateIntimacyUnlock.purpose.export'),
  };
}

export default function PrivateIntimacyUnlockScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const compact = height < 700;
  const progress = useRef(new Animated.Value(0)).current;
  const [biometryLabel, setBiometryLabel] = useState(t('privateIntimacyUnlock.useBiometrics'));
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);
  const target = route.params?.target;
  // Unified, theme-aware lock presentation (inspired by Pregnancy
  // "Informations médicales personnelles" centered-badge layout, but
  // reading the GLOBAL theme instead of a fixed color) — now applies to
  // every IntimacyTarget value. `photos` and `miscarriageNotes` were the
  // last two still on the legacy padlock-artwork PNG background; that
  // branch has been fully retired from this file.
  const purposeCopy = unifiedPurposeCopy(t);
  const purposeLine = purposeCopy[target ?? 'cycle'] ?? purposeCopy.cycle;

  useEffect(() => {
    if (isIntimacyUnlocked()) {replaceWithIntimacyDestination(navigation, target); return;}
    Promise.all([loadSecurityPreferences(), getBiometryType(), hasPrivatePin()]).then(([, type, hasPin]) => {
      setBiometryAvailable(Boolean(type) && isBiometricEnabled());
      setBiometryLabel(getBiometryLabel(type));
      setPinConfigured(hasPin);
    }).catch(() => {
      setBiometryAvailable(false);
      setPinConfigured(false);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => Animated.timing(progress, {toValue:1,duration:reduce?0:380,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start());
  }, [navigation, progress, target]);

  const heroAnimatedStyle = {opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[12,0]})}]};

  const hero = (
    <Animated.View style={[styles.main,styles.mainUnified,heroAnimatedStyle]}>
      <View style={styles.lockBadge}><MaterialDesignIcons color={onPrimaryTextColor(theme)} name="lock" size={30}/></View>
      <Text style={[styles.title,compact&&styles.titleCompact]}>{t('privateIntimacyUnlock.title')}</Text>
      <Text style={styles.purposeLine}>{purposeLine}</Text>
      <Text style={styles.subtitle}>{t('privateIntimacyUnlock.subtitle')}</Text>
    </Animated.View>
  );

  const content = (
    <SafeAreaView edges={['top','bottom']} style={styles.flex}>
    <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
    <View style={[styles.content,{paddingBottom:Math.max(insets.bottom,14)}]}>
      <Pressable accessibilityLabel={t('privateIntimacyUnlock.backToJournal')} accessibilityRole="button" hitSlop={10} onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons color={theme.colors.accent} name="arrow-left" size={26}/></Pressable>
      {hero}

      <View style={[styles.actionsCard,compact&&styles.actionsCardCompact]}>
        {biometryAvailable && <Pressable accessibilityHint={t('privateIntimacyUnlock.biometricHint')} accessibilityLabel={biometryLabel} accessibilityRole="button" onPress={()=>navigation.navigate('PrivateIntimacyFaceId', {target: route.params?.target})} style={({pressed})=>[styles.primary,compact&&styles.buttonCompact,pressed&&styles.pressed]}><View style={styles.primaryIcon}><MaterialDesignIcons color={onPrimaryTextColor(theme)} name="face-recognition" size={30}/></View><View style={styles.buttonCopy}><Text style={styles.primaryTitle}>{biometryLabel}</Text><Text style={styles.primarySubtitle}>{t('privateIntimacyUnlock.unlockWithBiometrics')}</Text></View><MaterialDesignIcons color={onPrimaryTextColor(theme)} name="chevron-right" size={28}/></Pressable>}
        <Pressable accessibilityHint={t('privateIntimacyUnlock.pinHint')} accessibilityLabel={pinConfigured?t('privateIntimacyUnlock.enterPin'):t('privateIntimacyUnlock.setUpPin')} accessibilityRole="button" onPress={()=>navigation.navigate('PrivateIntimacyPin', {target: route.params?.target})} style={({pressed})=>[styles.secondary,compact&&styles.buttonCompact,pressed&&styles.pressed]}><View style={styles.secondaryIcon}><MaterialDesignIcons color={theme.colors.accent} name="lock-outline" size={28}/></View><View style={styles.buttonCopy}><Text style={styles.secondaryTitle}>{pinConfigured?t('privateIntimacyUnlock.enterPin'):t('privateIntimacyUnlock.setUpPin')}</Text><Text style={styles.secondarySubtitle}>{pinConfigured?t('privateIntimacyUnlock.usePinSubtitle'):t('privateIntimacyUnlock.createPinSubtitle')}</Text></View><MaterialDesignIcons color={theme.colors.accent} name="chevron-right" size={28}/></Pressable>
        <View style={[styles.privacy,compact&&styles.privacyCompact]}><View style={styles.privacyIcon}><MaterialDesignIcons color={theme.colors.primary} name="shield-lock" size={25}/></View><View style={styles.privacyCopy}><Text style={styles.privacyTitle}>{t('privateIntimacyUnlock.privacyTitle')}</Text><Text style={styles.privacyText}>{t('privateIntimacyUnlock.privacyText')}</Text></View></View>
      </View>
    </View>
    </SafeAreaView>
  );

  return <View style={[styles.safe, styles.flatBackground]}>{content}</View>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({safe:{flex:1,backgroundColor:theme.colors.background},
  // Reads the GLOBAL theme so it supports Light/Dark/System/True Black/
  // Premium palettes — the "no PNG, calm flat page" structural principle
  // originally inspired by Pregnancy's private-access design.
  flatBackground:{backgroundColor:theme.colors.background},
  flex:{flex:1},
  content:{flex:1,paddingTop:12,paddingHorizontal:16},
  back:{position:'absolute',top:12,left:16,zIndex:2,width:48,height:48,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:theme.colors.border,borderRadius:17,backgroundColor:theme.colors.surface,elevation:2},
  main:{alignItems:'center'},
  mainUnified:{marginTop:32},
  lockBadge:{width:76,height:76,marginBottom:16,alignItems:'center',justifyContent:'center',borderRadius:38,backgroundColor:theme.colors.primary,shadowColor:theme.colors.primary,shadowOffset:{width:0,height:6},shadowOpacity:0.22,shadowRadius:14,elevation:4},
  purposeLine:{marginTop:10,color:theme.colors.textSecondary,fontSize:13,textAlign:'center'},
  title:{color:theme.colors.accent,fontFamily:'serif',fontSize:31,fontWeight:'800'},
  titleCompact:{fontSize:26},
  subtitle:{color:theme.colors.textSecondary,fontSize:15,lineHeight:21,textAlign:'center'},
 actionsCard: {
  marginTop: 10,
  gap: 10,
  padding: 14,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: 26,
  backgroundColor: theme.colors.surface,
  elevation: 3,
},

actionsCardCompact: {
  marginTop: 6,
  gap: 7,
  padding: 11,
},
  primary:{minHeight:72,flexDirection:'row',alignItems:'center',paddingHorizontal:13,borderRadius:18,backgroundColor:theme.colors.primary},
  buttonCompact:{minHeight:58},
  primaryIcon:{width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:withAlpha(onPrimaryTextColor(theme),0.12)},
  buttonCopy:{flex:1,marginHorizontal:11},
  primaryTitle:{color:onPrimaryTextColor(theme),fontSize:16,fontWeight:'800'},
  primarySubtitle:{marginTop:3,color:withAlpha(onPrimaryTextColor(theme),0.85),fontSize:11},
  secondary:{minHeight:72,flexDirection:'row',alignItems:'center',paddingHorizontal:13,borderWidth:1.5,borderColor:theme.colors.primary,borderRadius:18,backgroundColor:theme.colors.surface},
  secondaryIcon:{width:48,height:48,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:theme.colors.border,borderRadius:14},
  secondaryTitle:{color:theme.colors.accent,fontFamily:'serif',fontSize:15,fontWeight:'800'},
  secondarySubtitle:{marginTop:3,color:theme.colors.textSecondary,fontSize:11},
  privacy:{minHeight:79,flexDirection:'row',alignItems:'center',marginTop:2,paddingHorizontal:12,borderRadius:17,backgroundColor:theme.colors.primarySoft},
  privacyCompact:{minHeight:60,paddingVertical:6},
  privacyIcon:{width:46,height:46,alignItems:'center',justifyContent:'center',borderRadius:23,backgroundColor:theme.colors.surface,elevation:2},
  privacyCopy:{flex:1,marginLeft:11},privacyTitle:{color:theme.colors.accent,fontSize:12,fontWeight:'800'},
  privacyText:{marginTop:4,color:theme.colors.textSecondary,fontSize:10,lineHeight:14},
  cancel:{minHeight:38,color:theme.colors.primary,fontSize:13,fontWeight:'700',textAlign:'center',textAlignVertical:'center'},error:{color:theme.colors.danger,fontSize:10.5,lineHeight:15,textAlign:'center'},pressed:{opacity:.82,transform:[{scale:.99}]},disabled:{opacity:.55}});
}
