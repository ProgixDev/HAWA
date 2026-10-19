import React,{useEffect,useMemo,useState} from 'react';
import {ScrollView,StatusBar,StyleSheet,View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {PinKeypad} from '../components/security/PinKeypad';
import {PIN_LENGTH,beginPinSetup,cancelPinSetup,disableStoredPin,verifyPin} from '../services/appSecurityService';
import {setPinEnabled} from '../state/securityPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {type ResolvedAwaTheme} from '../theme/awaThemeTokens';
type Props=NativeStackScreenProps<RootStackParamList,'PinSetup'>;
export default function PinSetupScreen({navigation,route}:Props):React.JSX.Element{const {t}=useTranslation();const {theme}=useAwaTheme();const styles=useMemo(()=>createStyles(theme),[theme]);const insets=useSafeAreaInsets();const mode=route.params?.mode??'create';const [stage,setStage]=useState(mode==='change'?'current':'new');const [pin,setPin]=useState('');const [error,setError]=useState('');const busy=false;const setBusy=(_value:boolean)=>{};
  useEffect(()=>()=>cancelPinSetup(),[]);
  useEffect(()=>{if(pin.length!==PIN_LENGTH||busy){return;}let active=true;setBusy(true);const run=async()=>{if(mode==='disable'){const ok=await disableStoredPin(pin);if(!active){return;}if(ok){await setPinEnabled(false);navigation.goBack();}else{setError(t('security.incorrectCode'));setPin('');}}else if(stage==='current'){const ok=await verifyPin(pin);if(!active){return;}if(ok){setStage('new');setPin('');setError('');}else{setError(t('security.incorrectCode'));setPin('');}}else if(beginPinSetup(pin)){navigation.navigate('PinConfirm',{returnTo:route.params?.returnTo??'previous'});}setBusy(false);};run().catch(()=>{if(active){setBusy(false);setPin('');setError(t('security.genericError'));}});return()=>{active=false;};},[busy,mode,navigation,pin,route.params?.returnTo,stage,t]);
  const title=mode==='disable'?t('pinSetup.confirmIdentityTitle'):stage==='current'?t('pinSetup.enterCurrentTitle'):t('pinSetup.createTitle');const subtitle=mode==='disable'?t('pinSetup.confirmIdentitySubtitle'):stage==='current'?t('pinSetup.verifyIdentitySubtitle'):t('pinSetup.createSubtitle', {length: PIN_LENGTH});
  return <LinearGradient colors={[...theme.gradients.pageBackground]} locations={[0,0.32,0.7,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.page}>
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle}/>
      <AwaIconButton accessibilityLabel={t('common.back')} icon="arrow-left" onPress={navigation.goBack} style={styles.back}/>
      <ScrollView contentContainerStyle={[styles.content,{paddingTop:Math.max(insets.top,16)+10,paddingBottom:Math.max(insets.bottom,18)}]} showsVerticalScrollIndicator={false}>
        <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{title}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">{subtitle}</AwaText>
        <PinKeypad disabled={busy} error={error} onChange={value=>{setError('');setPin(value);}} value={pin}/>
        <View style={styles.spacer}/>
        <AwaText colorRole="onSurfaceVariant" style={styles.private} variant="bodySmall">{t('pinSetup.footerNote')}</AwaText>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;}
function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    page:{flex:1,backgroundColor:theme.colors.background},
    safe:{flex:1},
    content:{flexGrow:1,alignItems:'center',paddingHorizontal:20},
    back:{position:'absolute',top:20,left:18,zIndex:1},
    title:{marginTop:56,textAlign:'center'},
    subtitle:{maxWidth:330,marginTop:8,textAlign:'center'},
    spacer:{flex:1,minHeight:16},
    private:{maxWidth:300,textAlign:'center'},
  });
}
