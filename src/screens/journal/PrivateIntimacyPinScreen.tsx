import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Image, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {hasPrivatePin, savePrivatePin, verifyPrivatePin} from '../../services/privateSectionAuth';
import {unlockIntimacy} from '../../state/privateSectionAuthStore';

type Props=NativeStackScreenProps<RootStackParamList,'PrivateIntimacyPin'>;
const KEYS=['1','2','3','4','5','6','7','8','9','empty','0','delete'] as const;
const PURPLE='#6736B4';
export default function PrivateIntimacyPinScreen({navigation}:Props):React.JSX.Element{
  const {height}=useWindowDimensions(); const insets=useSafeAreaInsets(); const compact=height<720;
  const [configured,setConfigured]=useState(true); const [pin,setPin]=useState(''); const [first,setFirst]=useState(''); const [error,setError]=useState(''); const shake=useRef(new Animated.Value(0)).current;
  useEffect(()=>{hasPrivatePin().then(setConfigured);},[]);
  const fail=(message:string)=>{setError(message);setPin('');Animated.sequence([6,-6,4,-4,0].map(value=>Animated.timing(shake,{toValue:value,duration:45,easing:Easing.linear,useNativeDriver:true}))).start();};
  const complete=async(value:string)=>{
    if(configured){if(await verifyPrivatePin(value)){unlockIntimacy();navigation.replace('IntimacyEntry');}else{fail('Code incorrect. Réessaie.');}return;}
    if(!first){setFirst(value);setPin('');setError('Confirme ton nouveau code.');return;}
    if(first!==value){setFirst('');fail('Les codes ne correspondent pas. Recommence.');return;}
    await savePrivatePin(value);unlockIntimacy();navigation.replace('IntimacyEntry');
  };
  const enter=(key:typeof KEYS[number])=>{if(key==='delete'){setPin(v=>v.slice(0,-1));return;}if(key==='empty'||pin.length>=6){return;}const next=`${pin}${key}`;setPin(next);setError('');if(next.length===6){setTimeout(()=>complete(next),120);}};
  return <SafeAreaView edges={['top','bottom']} style={styles.safe}><StatusBar backgroundColor="#FCF8FD" barStyle="dark-content"/><View style={[styles.content,compact&&styles.compact,{paddingBottom:Math.max(insets.bottom,14)}]}><Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons color="#35117E" name="arrow-left" size={27}/></Pressable><Image source={require('../../assets/images/private-intimacy-lock.png')} style={[styles.image,compact&&styles.imageCompact]}/><Text style={styles.title}>{configured?'Saisis ton code privé':first?'Confirme ton code':'Crée ton code privé'}</Text><Text style={styles.subtitle}>Code sécurisé à 6 chiffres</Text><Animated.View accessibilityLabel={`${pin.length} chiffres saisis`} style={[styles.dots,{transform:[{translateX:shake}]}]}>{[0,1,2,3,4,5].map(index=><View key={index} style={[styles.dot,index<pin.length&&styles.dotFilled]}/>)}</Animated.View><Text accessibilityLiveRegion="polite" style={styles.error}>{error||' '}</Text><View style={[styles.keypad,compact&&styles.keypadCompact]}>{KEYS.map((key,index)=>key==='empty'?<View key={key} style={styles.key}/>:<Pressable accessibilityLabel={key==='delete'?'Effacer':key} accessibilityRole="button" key={`${key}-${index}`} onPress={()=>enter(key)} style={({pressed})=>[styles.key,styles.keyActive,pressed&&styles.pressed]}>{key==='delete'?<MaterialDesignIcons color="#35117E" name="backspace-outline" size={25}/>:<Text style={styles.number}>{key}</Text>}</Pressable>)}</View></View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#FCF8FD'},content:{flex:1,alignItems:'center',paddingTop:12,paddingHorizontal:22},compact:{paddingTop:6},back:{position:'absolute',top:12,left:16,zIndex:2,width:48,height:48,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#E8DFF0',borderRadius:16,backgroundColor:'#FFFFFF'},image:{width:190,height:190,resizeMode:'contain'},imageCompact:{width:135,height:135},title:{color:'#35117E',fontFamily:'serif',fontSize:24,fontWeight:'800'},subtitle:{marginTop:6,color:'#6A5C78',fontSize:12},dots:{flexDirection:'row',gap:15,marginTop:26},dot:{width:14,height:14,borderWidth:1.5,borderColor:'#A98AC6',borderRadius:7,backgroundColor:'#FFFFFF'},dotFilled:{borderColor:PURPLE,backgroundColor:PURPLE},error:{height:31,marginTop:10,color:'#8A5370',fontSize:11,textAlign:'center'},keypad:{width:264,flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:13},keypadCompact:{rowGap:7},key:{width:72,height:60,alignItems:'center',justifyContent:'center',borderRadius:25},keyActive:{backgroundColor:'#F1E7F7'},number:{color:'#35117E',fontSize:23,fontWeight:'600'},pressed:{opacity:.65,transform:[{scale:.96}]}});
