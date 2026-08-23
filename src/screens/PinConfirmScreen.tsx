import React,{useEffect,useRef,useState} from 'react';
import {Pressable,ScrollView,StatusBar,StyleSheet,Text,View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {PinKeypad} from '../components/security/PinKeypad';
import {PIN_LENGTH,cancelPinSetup,confirmAndSavePin} from '../services/appSecurityService';
import {setPinEnabled} from '../state/securityPreferences';
type Props=NativeStackScreenProps<RootStackParamList,'PinConfirm'>;
export default function PinConfirmScreen({navigation}:Props):React.JSX.Element{
  const insets=useSafeAreaInsets();const[pin,setPin]=useState('');const[error,setError]=useState('');const busy=useRef(false);
  useEffect(()=>{if(pin.length!==PIN_LENGTH||busy.current){return;}let active=true;busy.current=true;
    confirmAndSavePin(pin).then(async result=>{if(!active){return;}if(result==='success'){await setPinEnabled(true);navigation.pop(2);return;}setError(result==='mismatch'?'Les codes ne correspondent pas. Recommence.':'La configuration a expiré. Recommence.');setPin('');busy.current=false;}).catch(()=>{if(active){setError('Impossible d’enregistrer le code. Réessaie.');setPin('');busy.current=false;}});return()=>{active=false;};
  },[navigation,pin]);
  return <LinearGradient colors={['#FAF8FD','#F4EFFA','#EEE7F7','#E9E1F3']} locations={[0,0.32,0.7,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.page}>
    <View pointerEvents="none" style={styles.pageBackgroundDecor}><View style={styles.pageGlowTop}/><View style={styles.pageGlowMiddle}/><View style={styles.pageGlowBottom}/></View>
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content"/>
      <Pressable accessibilityLabel="Retour" accessibilityRole="button" onPress={()=>{cancelPinSetup();navigation.goBack();}} style={styles.back}><MaterialDesignIcons name="arrow-left" size={25} color="#6949BE"/></Pressable>
      <ScrollView contentContainerStyle={[styles.content,{paddingTop:Math.max(insets.top,16)+10,paddingBottom:Math.max(insets.bottom,18)}]} showsVerticalScrollIndicator={false}>
        <View style={styles.icon}><MaterialDesignIcons name="lock-check-outline" size={35} color="#6949BE"/></View>
        <Text style={styles.title}>Confirme ton code PIN</Text>
        <Text style={styles.subtitle}>Saisis-le une seconde fois pour confirmer.</Text>
        <PinKeypad error={error} onChange={value=>{setError('');setPin(value);}} value={pin}/>
        <View style={styles.spacer}/>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}
const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:'#F8EFFF'},
  pageBackgroundDecor:{...StyleSheet.absoluteFillObject,overflow:'hidden'},
  pageGlowTop:{position:'absolute',top:-150,right:-110,width:330,height:330,borderRadius:165,backgroundColor:'rgba(111, 82, 170, 0.07)'},
  pageGlowMiddle:{position:'absolute',top:'38%',left:-130,width:260,height:260,borderRadius:130,backgroundColor:'rgba(139, 112, 188, 0.045)'},
  pageGlowBottom:{position:'absolute',bottom:-150,right:-100,width:310,height:310,borderRadius:155,backgroundColor:'rgba(92, 67, 139, 0.05)'},
  safe:{flex:1},
  content:{flexGrow:1,alignItems:'center',paddingHorizontal:20},
  back:{position:'absolute',top:20,left:18,width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:'#FFF',elevation:2,zIndex:1},
  icon:{width:76,height:76,marginTop:42,alignItems:'center',justifyContent:'center',borderRadius:38,backgroundColor:'#EEE4FC'},
  title:{marginTop:18,color:'#28166F',fontFamily:'serif',fontSize:26,fontWeight:'700',textAlign:'center'},
  subtitle:{maxWidth:330,marginTop:8,color:'#655A8D',fontSize:13,lineHeight:19,textAlign:'center'},
  spacer:{flex:1,minHeight:16},
});
