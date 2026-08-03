import React from 'react';
import {Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, useRoute, type NavigationProp, type RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../../navigation/AppNavigator';

type JournalRoute = 'SymptomEntry' | 'MoodEntry' | 'FlowEntry' | 'TemperatureEntry' | 'NoteEntry' | 'IntimacyEntry' | 'PrivatePhotoEntry';

const titles: Record<JournalRoute, string> = {
  SymptomEntry: 'Symptôme', MoodEntry: 'Humeur', FlowEntry: 'Flux',
  TemperatureEntry: 'Température', NoteEntry: 'Note', IntimacyEntry: 'Vie intime',
  PrivatePhotoEntry: 'Photo privée',
};

function JournalEntryPlaceholderScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, JournalRoute>>();
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FBF7EF" barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable accessibilityLabel="Retour" accessibilityRole="button" hitSlop={10} onPress={navigation.goBack} style={styles.back}>
          <MaterialDesignIcons color="#1E6249" name="arrow-left" size={28} />
        </Pressable>
        <Text style={styles.title}>{titles[route.name]}</Text>
      </View>
      <View style={styles.content}>
        <MaterialDesignIcons color="#709688" name="notebook-outline" size={52} />
        <Text style={styles.message}>Cet écran sera disponible prochainement.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FBF7EF'},
  header: {height: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16},
  back: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center'},
  title: {marginLeft: 8, color: '#173D30', fontFamily: 'serif', fontSize: 25, fontWeight: '600'},
  content: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  message: {marginTop: 16, color: '#6D746F', fontSize: 15, textAlign: 'center'},
});

export default JournalEntryPlaceholderScreen;
