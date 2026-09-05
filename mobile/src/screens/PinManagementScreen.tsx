import React,{useCallback,useState} from 'react';
import {Pressable,ScrollView,StatusBar,StyleSheet,Text,View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {isPinEnabled,loadSecurityPreferences} from '../state/securityPreferences';

type Props=NativeStackScreenProps<RootStackParamList,'PinManagement'>;

export default function PinManagementScreen({navigation}:Props):React.JSX.Element{
  const insets=useSafeAreaInsets();
  const[enabled,setEnabled]=useState(isPinEnabled());
  useFocusEffect(useCallback(()=>{
    let active=true;
    loadSecurityPreferences().then(()=>{if(active){setEnabled(isPinEnabled());}});
    return()=>{active=false;};
  },[]));

  return <LinearGradient colors={['#FAF8FD','#F4EFFA','#EEE7F7','#E9E1F3']} locations={[0,0.32,0.7,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.page}>
    <View pointerEvents="none" style={styles.pageBackgroundDecor}><View style={styles.pageGlowTop}/><View style={styles.pageGlowMiddle}/><View style={styles.pageGlowBottom}/></View>
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content"/>
      <Pressable accessibilityLabel="Retour" accessibilityRole="button" onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons name="arrow-left" size={25} color="#6949BE"/></Pressable>
      <ScrollView contentContainerStyle={[styles.content,{paddingTop:Math.max(insets.top,18)+8,paddingBottom:Math.max(insets.bottom,18)}]} showsVerticalScrollIndicator={false}>
        <View style={styles.icon}><MaterialDesignIcons name="lock-outline" size={40} color="#6949BE"/></View>
        <Text style={styles.title}>Code PIN</Text>
        <View style={styles.status}><MaterialDesignIcons name={enabled?'check-circle':'shield-off-outline'} size={21} color={enabled?'#3D9B72':'#8C819D'}/><Text style={styles.statusText}>{enabled?'Protection activée':'Protection désactivée'}</Text></View>
        <View style={styles.spacer}/>
        {enabled?<>
          <Pressable onPress={()=>navigation.navigate('PinSetup',{mode:'change',returnTo:'previous'})} style={styles.primary}><Text style={styles.primaryText}>Modifier mon code PIN</Text></Pressable>
          <Pressable onPress={()=>navigation.navigate('PinSetup',{mode:'disable',returnTo:'previous'})} style={styles.danger}><Text style={styles.dangerText}>Désactiver le code PIN</Text></Pressable>
        </>:<Pressable onPress={()=>navigation.navigate('PinSetup',{mode:'create',returnTo:'previous'})} style={styles.primary}><Text style={styles.primaryText}>Activer le code PIN</Text></Pressable>}
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
  content:{flexGrow:1,alignItems:'center',paddingHorizontal:22},
  back:{position:'absolute',top:18,left:18,width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:'#FFF',elevation:2,zIndex:1},
  icon:{width:90,height:90,marginTop:70,alignItems:'center',justifyContent:'center',borderRadius:45,backgroundColor:'#EEE4FC'},
  title:{marginTop:18,color:'#28166F',fontFamily:'serif',fontSize:28,fontWeight:'700'},
  status:{flexDirection:'row',alignItems:'center',gap:8,marginTop:15,paddingHorizontal:16,paddingVertical:10,borderRadius:18,backgroundColor:'#FFF'},
  statusText:{color:'#4D416A',fontWeight:'700'},
  spacer:{flex:1,minHeight:16},
  primary:{width:'100%',height:54,alignItems:'center',justifyContent:'center',borderRadius:18,backgroundColor:'#6949BE',elevation:4},
  primaryText:{color:'#FFF',fontSize:16,fontWeight:'700'},
  danger:{marginTop:12,padding:15},
  dangerText:{color:'#C74669',fontWeight:'700'},
});
