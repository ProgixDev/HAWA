import React,{useCallback,useState} from 'react';
import {ImageBackground,Pressable,StatusBar,StyleSheet,Text,View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {isPinEnabled,loadSecurityPreferences} from '../state/securityPreferences';

const BACKGROUND=require('../assets/images/school-selection-background.png');
type Props=NativeStackScreenProps<RootStackParamList,'PinManagement'>;

export default function PinManagementScreen({navigation}:Props):React.JSX.Element{
  const insets=useSafeAreaInsets();
  const[enabled,setEnabled]=useState(isPinEnabled());
  useFocusEffect(useCallback(()=>{
    let active=true;
    loadSecurityPreferences().then(()=>{if(active){setEnabled(isPinEnabled());}});
    return()=>{active=false;};
  },[]));

  return <ImageBackground source={BACKGROUND} style={styles.page}>
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content"/>
      <View style={[styles.content,{paddingTop:Math.max(insets.top,18)+8,paddingBottom:Math.max(insets.bottom,18)}]}>
        <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons name="arrow-left" size={25} color="#6949BE"/></Pressable>
        <View style={styles.icon}><MaterialDesignIcons name="lock-outline" size={40} color="#6949BE"/></View>
        <Text style={styles.title}>Code PIN</Text>
        <View style={styles.status}><MaterialDesignIcons name={enabled?'check-circle':'shield-off-outline'} size={21} color={enabled?'#3D9B72':'#8C819D'}/><Text style={styles.statusText}>{enabled?'Protection activée':'Protection désactivée'}</Text></View>
        <View style={styles.spacer}/>
        {enabled?<>
          <Pressable onPress={()=>navigation.navigate('PinSetup',{mode:'change',returnTo:'previous'})} style={styles.primary}><Text style={styles.primaryText}>Modifier mon code PIN</Text></Pressable>
          <Pressable onPress={()=>navigation.navigate('PinSetup',{mode:'disable',returnTo:'previous'})} style={styles.danger}><Text style={styles.dangerText}>Désactiver le code PIN</Text></Pressable>
        </>:<Pressable onPress={()=>navigation.navigate('PinSetup',{mode:'create',returnTo:'previous'})} style={styles.primary}><Text style={styles.primaryText}>Activer le code PIN</Text></Pressable>}
      </View>
    </SafeAreaView>
  </ImageBackground>;
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#F8EFFF'},safe:{flex:1},content:{flex:1,alignItems:'center',paddingHorizontal:22},back:{position:'absolute',top:18,left:18,width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:'#FFF',elevation:2},icon:{width:90,height:90,marginTop:70,alignItems:'center',justifyContent:'center',borderRadius:45,backgroundColor:'#EEE4FC'},title:{marginTop:18,color:'#28166F',fontFamily:'serif',fontSize:28,fontWeight:'700'},status:{flexDirection:'row',alignItems:'center',gap:8,marginTop:15,paddingHorizontal:16,paddingVertical:10,borderRadius:18,backgroundColor:'#FFF'},statusText:{color:'#4D416A',fontWeight:'700'},spacer:{flex:1},primary:{width:'100%',height:54,alignItems:'center',justifyContent:'center',borderRadius:18,backgroundColor:'#6949BE',elevation:4},primaryText:{color:'#FFF',fontSize:16,fontWeight:'700'},danger:{marginTop:12,padding:15},dangerText:{color:'#C74669',fontWeight:'700'}});
