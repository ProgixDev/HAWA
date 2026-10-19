import React,{useCallback,useMemo,useState} from 'react';
import {ScrollView,StatusBar,StyleSheet,View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {isPinEnabled,loadSecurityPreferences} from '../state/securityPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

type Props=NativeStackScreenProps<RootStackParamList,'PinManagement'>;

export default function PinManagementScreen({navigation}:Props):React.JSX.Element{
  const {t}=useTranslation();
  const {theme}=useAwaTheme();
  const styles=useMemo(()=>createStyles(theme),[theme]);
  const insets=useSafeAreaInsets();
  const[enabled,setEnabled]=useState(isPinEnabled());
  useFocusEffect(useCallback(()=>{
    let active=true;
    loadSecurityPreferences().then(()=>{if(active){setEnabled(isPinEnabled());}});
    return()=>{active=false;};
  },[]));

  return <LinearGradient colors={[...theme.gradients.pageBackground]} locations={[0,0.32,0.7,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.page}>
    <SafeAreaView style={styles.safe}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle}/>
      <AwaIconButton accessibilityLabel={t('common.back')} icon="arrow-left" onPress={navigation.goBack} style={styles.back}/>
      <ScrollView contentContainerStyle={[styles.content,{paddingTop:Math.max(insets.top,18)+8,paddingBottom:Math.max(insets.bottom,18)}]} showsVerticalScrollIndicator={false}>
        <AwaText accessibilityRole="header" style={styles.title} variant="headlineMedium">{t('pinManagement.title')}</AwaText>
        <AwaCard padding="compact" style={styles.status} variant="filled"><MaterialDesignIcons name={enabled?'check-circle':'shield-off-outline'} size={21} color={enabled?theme.colors.success:theme.colors.textSecondary}/><AwaText emphasized variant="bodyMedium">{enabled?t('pinManagement.protectionEnabled'):t('pinManagement.protectionDisabled')}</AwaText></AwaCard>
        <View style={styles.spacer}/>
        {enabled?<>
          <AwaButton fullWidth label={t('pinManagement.changePin')} onPress={()=>navigation.navigate('PinSetup',{mode:'change',returnTo:'previous'})} size="large"/>
          <AwaButton fullWidth label={t('pinManagement.disablePin')} onPress={()=>navigation.navigate('PinSetup',{mode:'disable',returnTo:'previous'})} style={styles.danger} variant="destructive"/>
        </>:<AwaButton fullWidth label={t('pinManagement.enablePin')} onPress={()=>navigation.navigate('PinSetup',{mode:'create',returnTo:'previous'})} size="large"/>}
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    page:{flex:1,backgroundColor:theme.colors.background},
    safe:{flex:1},
    content:{flexGrow:1,alignItems:'center',paddingHorizontal:22},
    back:{position:'absolute',top:18,left:18,zIndex:1},
    title:{marginTop:72,textAlign:'center'},
    status:{flexDirection:'row',alignItems:'center',gap:8,marginTop:16},
    spacer:{flex:1,minHeight:16},
    danger:{marginTop:12},
  });
}
