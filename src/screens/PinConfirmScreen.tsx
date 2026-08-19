import React,{useEffect,useRef,useState} from 'react';
import {ImageBackground,Pressable,StatusBar,StyleSheet,Text,View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {PinKeypad} from '../components/security/PinKeypad';
import {PIN_LENGTH,cancelPinSetup,confirmAndSavePin} from '../services/appSecurityService';
import {setPinEnabled} from '../state/securityPreferences';
const BACKGROUND=require('../assets/images/school-selection-background.png');
type Props=NativeStackScreenProps<RootStackParamList,'PinConfirm'>;
export default function PinConfirmScreen({navigation}:Props):React.JSX.Element{
  const insets=useSafeAreaInsets();const[pin,setPin]=useState('');const[error,setError]=useState('');const busy=useRef(false);
  useEffect(()=>{if(pin.length!==PIN_LENGTH||busy.current){return;}let active=true;busy.current=true;
    confirmAndSavePin(pin).then(async result=>{if(!active){return;}if(result==='success'){await setPinEnabled(true);navigation.pop(2);return;}setError(result==='mismatch'?'Les codes ne correspondent pas. Recommence.':'La configuration a expiré. Recommence.');setPin('');busy.current=false;}).catch(()=>{if(active){setError('Impossible d’enregistrer le code. Réessaie.');setPin('');busy.current=false;}});return()=>{active=false;};
  },[navigation,pin]);
  return <ImageBackground source={BACKGROUND} style={styles.page}><SafeAreaView style={styles.safe}><StatusBar translucent backgroundColor="transparent" barStyle="dark-content"/><View style={[styles.content,{paddingTop:Math.max(insets.top,16)+10,paddingBottom:Math.max(insets.bottom,18)}]}><Pressable accessibilityLabel="Retour" onPress={()=>{cancelPinSetup();navigation.goBack();}} style={styles.back}><MaterialDesignIcons name="arrow-left" size={25} color="#6949BE"/></Pressable><View style={styles.icon}><MaterialDesignIcons name="lock-check-outline" size={35} color="#6949BE"/></View><Text style={styles.title}>Confirme ton code PIN</Text><Text style={styles.subtitle}>Saisis-le une seconde fois pour confirmer.</Text><PinKeypad error={error} onChange={value=>{setError('');setPin(value);}} value={pin}/><View style={styles.spacer}/></View></SafeAreaView></ImageBackground>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#F8EFFF'},safe:{flex:1},content:{flex:1,alignItems:'center',paddingHorizontal:20},back:{position:'absolute',top:20,left:18,width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:'#FFF',elevation:2},icon:{width:76,height:76,marginTop:42,alignItems:'center',justifyContent:'center',borderRadius:38,backgroundColor:'#EEE4FC'},title:{marginTop:18,color:'#28166F',fontFamily:'serif',fontSize:26,fontWeight:'700'},subtitle:{marginTop:8,color:'#655A8D',fontSize:13},spacer:{flex:1}});
