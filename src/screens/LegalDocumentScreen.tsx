import React from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';

const PURPLE = '#6D4AE8';
const DARK = '#2F2258';
const MUTED = '#746D92';

type LegalSection = {title: string; body: string};

const TERMS: LegalSection[] = [
  {title: 'Objet', body: 'Ce document présente la structure provisoire des conditions d’utilisation de l’application AWA.'},
  {title: 'Utilisation de l’application', body: 'AWA propose des outils de suivi personnel et de bien-être. Le contenu définitif décrivant les droits et responsabilités des utilisatrices sera ajouté après validation juridique.'},
  {title: 'Disponibilité du service', body: 'Les modalités définitives de disponibilité, de maintenance et d’évolution du service restent à valider.'},
  {title: 'Contact', body: 'Les coordonnées officielles seront ajoutées dès leur validation par l’équipe AWA.'},
];

const PRIVACY: LegalSection[] = [
  {title: 'Données concernées', body: 'Cette section décrira précisément les données traitées par AWA et leur finalité après validation juridique.'},
  {title: 'Stockage et sécurité', body: 'La documentation définitive précisera les mesures de stockage, de protection et les durées de conservation.'},
  {title: 'Tes droits', body: 'Les procédures permettant d’accéder, corriger ou supprimer les données seront détaillées dans la version validée.'},
  {title: 'Contact confidentialité', body: 'L’adresse officielle du responsable de la confidentialité sera ajoutée avant publication.'},
];

function LegalDocument({navigation, title, sections}: {navigation: {goBack: () => void}; title: string; sections: LegalSection[]}) {
  const insets = useSafeAreaInsets();
  return <SafeAreaView edges={['left','right']} style={styles.safe}>
    <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
    <View style={[styles.header, {paddingTop: Math.max(insets.top, 18) + 8}]}>
      <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons color={PURPLE} name="chevron-left" size={28}/></Pressable>
      <Text style={styles.title}>{title}</Text><View style={styles.spacer}/>
    </View>
    <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom,18)+24}]} showsVerticalScrollIndicator={false}>
      <View style={styles.notice}><MaterialDesignIcons color={PURPLE} name="information-outline" size={21}/><Text style={styles.noticeText}>Contenu provisoire — validation juridique requise avant publication.</Text></View>
      {sections.map(section => <View key={section.title} style={styles.section}><Text style={styles.sectionTitle}>{section.title}</Text><Text style={styles.body}>{section.body}</Text></View>)}
    </ScrollView>
  </SafeAreaView>;
}

export function TermsOfUseScreen({navigation}: NativeStackScreenProps<RootStackParamList,'TermsOfUse'>) {return <LegalDocument navigation={navigation} sections={TERMS} title="Conditions d’utilisation"/>;}
export function PrivacyPolicyScreen({navigation}: NativeStackScreenProps<RootStackParamList,'PrivacyPolicy'>) {return <LegalDocument navigation={navigation} sections={PRIVACY} title="Politique de confidentialité"/>;}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#FCFAFF'},header:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingBottom:12},back:{alignItems:'center',justifyContent:'center',borderRadius:999,backgroundColor:'#FFF',padding:9,elevation:2},title:{flex:1,color:DARK,fontFamily:'serif',fontSize:20,fontWeight:'700',textAlign:'center',paddingHorizontal:8},spacer:{padding:23},content:{paddingHorizontal:16,gap:12},notice:{flexDirection:'row',alignItems:'center',gap:10,borderRadius:18,backgroundColor:'#F1E8FF',padding:14},noticeText:{flex:1,color:MUTED,fontSize:11.5,lineHeight:17},section:{borderWidth:1,borderColor:'#EEE7F5',borderRadius:22,backgroundColor:'#FFF',padding:17},sectionTitle:{color:DARK,fontFamily:'serif',fontSize:16,fontWeight:'700'},body:{marginTop:7,color:MUTED,fontSize:13,lineHeight:20}});
