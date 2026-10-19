import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ScrollView,StatusBar,StyleSheet,View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {PinKeypad} from '../components/security/PinKeypad';
import {PIN_LENGTH,cancelPinSetup,confirmAndSavePin} from '../services/appSecurityService';
import {setPinEnabled} from '../state/securityPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {type ResolvedAwaTheme} from '../theme/awaThemeTokens';
type Props=NativeStackScreenProps<RootStackParamList,'PinConfirm'>;
export default function PinConfirmScreen({navigation}:Props):React.JSX.Element{
  const {t}=useTranslation();
  const {theme}=useAwaTheme();const styles=useMemo(()=>createStyles(theme),[theme]);
  const insets=useSafeAreaInsets();const[pin,setPin]=useState('');const[error,setError]=useState('');const busy=useRef(false);
  useEffect(()=>{if(pin.length!==PIN_LENGTH||busy.current){return;}let active=true;busy.current=true;
    confirmAndSavePin(pin).then(async result=>{if(!active){return;}if(result==='success'){await setPinEnabled(true);navigation.pop(2);return;}setError(result==='mismatch'?t('security.codesDontMatch'):t('pinConfirm.setupExpired'));setPin('');busy.current=false;}).catch(()=>{if(active){setError(t('pinConfirm.saveFailed'));setPin('');busy.current=false;}});return()=>{active=false;};
  },[navigation,pin,t]);
  return <LinearGradient colors={[...theme.gradients.pageBackground]} locations={[0,0.32,0.7,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.page}>
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle}/>
      <AwaIconButton accessibilityLabel={t('common.back')} icon="arrow-left" onPress={()=>{cancelPinSetup();navigation.goBack();}} style={styles.back}/>
      <ScrollView contentContainerStyle={[styles.content,{paddingTop:Math.max(insets.top,16)+10,paddingBottom:Math.max(insets.bottom,18)}]} showsVerticalScrollIndicator={false}>
        <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{t('pinConfirm.title')}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">{t('pinConfirm.subtitle')}</AwaText>
        <PinKeypad error={error} onChange={value=>{setError('');setPin(value);}} value={pin}/>
        <View style={styles.spacer}/>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}
function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    page:{flex:1,backgroundColor:theme.colors.background},
    safe:{flex:1},
    content:{flexGrow:1,alignItems:'center',paddingHorizontal:20},
    back:{position:'absolute',top:20,left:18,zIndex:1},
    title:{marginTop:56,textAlign:'center'},
    subtitle:{maxWidth:330,marginTop:8,textAlign:'center'},
    spacer:{flex:1,minHeight:16},
  });
}
