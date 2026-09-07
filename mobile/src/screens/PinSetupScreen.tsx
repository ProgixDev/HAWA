import React,{useEffect,useMemo,useState} from 'react';
import {Pressable,ScrollView,StatusBar,StyleSheet,Text,View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {PinKeypad} from '../components/security/PinKeypad';
import {PIN_LENGTH,beginPinSetup,cancelPinSetup,disableStoredPin,verifyPin} from '../services/appSecurityService';
import {setPinEnabled} from '../state/securityPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
type Props=NativeStackScreenProps<RootStackParamList,'PinSetup'>;
export default function PinSetupScreen({navigation,route}:Props):React.JSX.Element{const {theme}=useAwaTheme();const styles=useMemo(()=>createStyles(theme),[theme]);const insets=useSafeAreaInsets();const mode=route.params?.mode??'create';const [stage,setStage]=useState(mode==='change'?'current':'new');const [pin,setPin]=useState('');const [error,setError]=useState('');const busy=false;const setBusy=(_value:boolean)=>{};
  useEffect(()=>()=>cancelPinSetup(),[]);
  useEffect(()=>{if(pin.length!==PIN_LENGTH||busy){return;}let active=true;setBusy(true);const run=async()=>{if(mode==='disable'){const ok=await disableStoredPin(pin);if(!active){return;}if(ok){await setPinEnabled(false);navigation.goBack();}else{setError('Code incorrect. Réessaie.');setPin('');}}else if(stage==='current'){const ok=await verifyPin(pin);if(!active){return;}if(ok){setStage('new');setPin('');setError('');}else{setError('Code incorrect. Réessaie.');setPin('');}}else if(beginPinSetup(pin)){navigation.navigate('PinConfirm',{returnTo:route.params?.returnTo??'previous'});}setBusy(false);};run().catch(()=>{if(active){setBusy(false);setPin('');setError('Une erreur est survenue. Réessaie.');}});return()=>{active=false;};},[busy,mode,navigation,pin,route.params?.returnTo,stage]);
  const title=mode==='disable'?'Confirme ton identité':stage==='current'?'Entre ton code actuel':'Crée ton code PIN';const subtitle=mode==='disable'?'Saisis ton code PIN actuel pour désactiver la protection.':stage==='current'?'Vérifie ton identité avant de choisir un nouveau code.':'Choisis un code à 4 chiffres pour protéger ton espace AWA.';
  return <LinearGradient colors={[...theme.gradients.pageBackground]} locations={[0,0.32,0.7,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.page}>
    <View pointerEvents="none" style={styles.pageBackgroundDecor}><View style={styles.pageGlowTop}/><View style={styles.pageGlowMiddle}/><View style={styles.pageGlowBottom}/></View>
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle}/>
      <Pressable accessibilityLabel="Retour" accessibilityRole="button" onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons name="arrow-left" size={25} color={theme.colors.primary}/></Pressable>
      <ScrollView contentContainerStyle={[styles.content,{paddingTop:Math.max(insets.top,16)+10,paddingBottom:Math.max(insets.bottom,18)}]} showsVerticalScrollIndicator={false}>
        <View style={styles.icon}><MaterialDesignIcons name="shield-lock-outline" size={35} color={theme.colors.primary}/></View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <PinKeypad disabled={busy} error={error} onChange={value=>{setError('');setPin(value);}} value={pin}/>
        <View style={styles.spacer}/>
        <Text style={styles.private}>Ton code reste protégé dans le stockage sécurisé de cet appareil.</Text>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;}
function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    page:{flex:1,backgroundColor:theme.colors.background},
    pageBackgroundDecor:{...StyleSheet.absoluteFillObject,overflow:'hidden'},
    pageGlowTop:{position:'absolute',top:-150,right:-110,width:330,height:330,borderRadius:165,backgroundColor:withAlpha(theme.colors.primary,0.07)},
    pageGlowMiddle:{position:'absolute',top:'38%',left:-130,width:260,height:260,borderRadius:130,backgroundColor:withAlpha(theme.colors.primary,0.045)},
    pageGlowBottom:{position:'absolute',bottom:-150,right:-100,width:310,height:310,borderRadius:155,backgroundColor:withAlpha(theme.colors.primary,0.05)},
    safe:{flex:1},
    content:{flexGrow:1,alignItems:'center',paddingHorizontal:20},
    back:{position:'absolute',top:20,left:18,width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:theme.colors.surface,elevation:2,zIndex:1},
    icon:{width:76,height:76,marginTop:42,alignItems:'center',justifyContent:'center',borderRadius:38,backgroundColor:theme.colors.primarySoft},
    title:{marginTop:18,color:theme.colors.accent,fontFamily:'serif',fontSize:26,fontWeight:'700',textAlign:'center'},
    subtitle:{maxWidth:330,marginTop:8,color:theme.colors.textSecondary,fontSize:13,lineHeight:19,textAlign:'center'},
    spacer:{flex:1,minHeight:16},
    private:{maxWidth:300,color:theme.colors.textSecondary,fontSize:11,lineHeight:16,textAlign:'center'},
  });
}
