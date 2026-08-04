import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {isBiometricEnabled} from '../../state/securityPreferences';
import {isIntimacyUnlocked, unlockIntimacy} from '../../state/privateSectionAuthStore';
import {authenticateWithBiometry, getBiometryLabel, getBiometryType, hasPrivatePin} from '../../services/privateSectionAuth';

const PURPLE = '#6736B4';
type Props = NativeStackScreenProps<RootStackParamList, 'PrivateIntimacyUnlock'>;

export default function PrivateIntimacyUnlockScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [biometryLabel, setBiometryLabel] = useState('Utiliser la biométrie');
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isIntimacyUnlocked()) {navigation.replace('IntimacyEntry'); return;}
    Promise.all([getBiometryType(), hasPrivatePin()]).then(([type, hasPin]) => {
      setBiometryAvailable(Boolean(type) && isBiometricEnabled());
      setBiometryLabel(getBiometryLabel(type));
      setPinConfigured(hasPin);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => Animated.timing(progress, {toValue:1,duration:reduce?0:380,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start());
  }, [navigation, progress]);

  const biometricUnlock = async () => {
    if (busy) {return;}
    try {
      setBusy(true); setMessage('');
      if (await authenticateWithBiometry()) {unlockIntimacy(); navigation.replace('IntimacyEntry');}
      else {setMessage('Authentification non reconnue. Réessaie ou utilise ton code privé.');}
    } catch {setMessage('Authentification non reconnue. Réessaie ou utilise ton code privé.');}
    finally {setBusy(false);}
  };

  return <SafeAreaView edges={['top','bottom']} style={styles.safe}>
    <StatusBar backgroundColor="#FCF8FD" barStyle="dark-content" />
    <ScrollView contentContainerStyle={[styles.content,{paddingBottom:Math.max(insets.bottom,16)+18}]} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityLabel="Retour au journal" accessibilityRole="button" hitSlop={10} onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons color="#35117E" name="arrow-left" size={28}/></Pressable>
      <Animated.View style={[styles.main,{opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}]}>
        <View style={styles.shield}><MaterialDesignIcons color={PURPLE} name="shield-lock-outline" size={46}/></View>
        <Text style={styles.title}>Espace privé ♡</Text>
        <Text style={styles.lead}>Cette section contient des{`\n`}informations sensibles.</Text>
        <View style={styles.divider}><View style={styles.line}/><MaterialDesignIcons color="#A874D7" name="heart" size={17}/><View style={styles.line}/></View>
        <Text style={styles.subtitle}>Déverrouille avec ton code privé{`\n`}ou ta biométrie.</Text>
        <Animated.View style={{transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[0.94,1]})}]}}><Image accessibilityIgnoresInvertColors source={require('../../assets/images/private-intimacy-lock.png')} style={styles.hero}/></Animated.View>
      </Animated.View>

      <View style={styles.actionsCard}>
        {biometryAvailable && <Pressable accessibilityHint="Ouvre la demande biométrique native" accessibilityLabel={biometryLabel} accessibilityRole="button" disabled={busy} onPress={biometricUnlock} style={({pressed})=>[styles.primary,pressed&&styles.pressed,busy&&styles.disabled]}><View style={styles.primaryIcon}><MaterialDesignIcons color="#FFFFFF" name="face-recognition" size={30}/></View><View style={styles.buttonCopy}><Text style={styles.primaryTitle}>{busy?'Vérification…':biometryLabel}</Text><Text style={styles.primarySubtitle}>Déverrouiller avec biométrie</Text></View><MaterialDesignIcons color="#FFFFFF" name="chevron-right" size={28}/></Pressable>}
        <Pressable accessibilityHint="Ouvre le clavier du code privé" accessibilityLabel={pinConfigured?'Saisir le code privé':'Configurer un code privé'} accessibilityRole="button" onPress={()=>navigation.navigate('PrivateIntimacyPin')} style={({pressed})=>[styles.secondary,pressed&&styles.pressed]}><View style={styles.secondaryIcon}><MaterialDesignIcons color="#3F168C" name="lock-outline" size={28}/></View><View style={styles.buttonCopy}><Text style={styles.secondaryTitle}>{pinConfigured?'Saisir le code privé':'Configurer un code privé'}</Text><Text style={styles.secondarySubtitle}>{pinConfigured?'Utiliser ton code à 6 chiffres':'Créer un code sécurisé à 6 chiffres'}</Text></View><MaterialDesignIcons color="#35117E" name="chevron-right" size={28}/></Pressable>
        {message ? <Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text> : null}
        <View style={styles.privacy}><View style={styles.privacyIcon}><MaterialDesignIcons color={PURPLE} name="shield-lock" size={25}/></View><View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Ta confidentialité est notre priorité</Text><Text style={styles.privacyText}>Tes données restent privées et ne sont accessibles que par toi.</Text></View></View>
        <Pressable accessibilityLabel="Annuler et revenir" accessibilityRole="button" hitSlop={10} onPress={navigation.goBack}><Text style={styles.cancel}>Annuler et revenir</Text></Pressable>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#FCF8FD'},content:{flexGrow:1,paddingTop:12,paddingHorizontal:16},back:{width:50,height:50,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#E8DFF0',borderRadius:17,backgroundColor:'#FFFFFF',elevation:2},main:{alignItems:'center'},shield:{width:64,height:64,alignItems:'center',justifyContent:'center',marginTop:-34},title:{marginTop:8,color:'#35117E',fontFamily:'serif',fontSize:31,fontWeight:'800'},lead:{marginTop:14,color:'#3D3552',fontSize:17,lineHeight:24,textAlign:'center'},divider:{height:28,flexDirection:'row',alignItems:'center',gap:11},line:{width:22,height:1,backgroundColor:'#B99AD6'},subtitle:{color:'#3D3552',fontSize:15,lineHeight:21,textAlign:'center'},hero:{width:270,height:270,marginTop:2,resizeMode:'contain'},actionsCard:{marginTop:-8,gap:10,padding:14,borderWidth:1,borderColor:'#EAE2EF',borderRadius:26,backgroundColor:'#FFFDFF',elevation:3},primary:{minHeight:72,flexDirection:'row',alignItems:'center',paddingHorizontal:13,borderRadius:18,backgroundColor:PURPLE},primaryIcon:{width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'rgba(255,255,255,.12)'},buttonCopy:{flex:1,marginHorizontal:11},primaryTitle:{color:'#FFFFFF',fontSize:16,fontWeight:'800'},primarySubtitle:{marginTop:3,color:'#F0E5FA',fontSize:11},secondary:{minHeight:72,flexDirection:'row',alignItems:'center',paddingHorizontal:13,borderWidth:1.5,borderColor:'#5E2EAA',borderRadius:18,backgroundColor:'#FFFFFF'},secondaryIcon:{width:48,height:48,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#E8DDF1',borderRadius:14},secondaryTitle:{color:'#35117E',fontFamily:'serif',fontSize:15,fontWeight:'800'},secondarySubtitle:{marginTop:3,color:'#55466C',fontSize:11},privacy:{minHeight:79,flexDirection:'row',alignItems:'center',marginTop:2,paddingHorizontal:12,borderRadius:17,backgroundColor:'#F4EAF8'},privacyIcon:{width:46,height:46,alignItems:'center',justifyContent:'center',borderRadius:23,backgroundColor:'#FFFFFF',elevation:2},privacyCopy:{flex:1,marginLeft:11},privacyTitle:{color:'#3F2678',fontSize:12,fontWeight:'800'},privacyText:{marginTop:4,color:'#71627E',fontSize:10,lineHeight:14},cancel:{minHeight:44,color:'#4C2C94',fontSize:13,fontWeight:'700',textAlign:'center',textAlignVertical:'center'},error:{color:'#8A5370',fontSize:10.5,lineHeight:15,textAlign:'center'},pressed:{opacity:.82,transform:[{scale:.99}]},disabled:{opacity:.55}});
