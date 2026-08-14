import React, {memo, useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';

const JOURNAL_HEADER = require('../../assets/images/daily-journal-header.png');
const PURPLE = '#6047B6';
const DEEP_PURPLE = '#21156B';

export type JournalRoute = Extract<
  keyof RootStackParamList,
  | 'SymptomEntry'
  | 'MoodEntry'
  | 'FlowEntry'
  | 'TemperatureEntry'
  | 'SleepEntry'
  | 'ActivityEntry'
  | 'HydrationWeightEntry'
  | 'HydrationScreen'
  | 'MenstrualFlowScreen'
  | 'NoteEntry'
  | 'PrivateIntimacyUnlock'
  | 'PrivatePhotoEntry'
>;

// Generic action descriptor for the shared journal sheet — every objective
// (Cycle/Pregnancy/Postpartum) builds an array of these and hands the sheet
// a ready-made `onPress` (close + navigate), so the sheet itself never needs
// to know about route params. See MainTabNavigator's JournalSheetHost, the
// single place that builds these arrays per objective.
export type JournalSheetAction = {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  tint: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: JournalSheetAction[];
};

// Cycle's own action list/copy — unchanged from before this component became
// reusable. Kept here (not in MainTabNavigator) since it's this screen's
// original, still-canonical content; PregnancyDashboard/PostpartumDashboard's
// lists live alongside JournalSheetHost instead.
export const CYCLE_JOURNAL_ITEMS: Array<{
  route: JournalRoute;
  icon: string;
  title: string;
  subtitle: string;
  tint: string;
}> = [
  {
    route: 'SymptomEntry',
    icon: 'heart-pulse',
    title: 'Symptôme',
    subtitle: 'Ajoute tes symptômes physiques',
    tint: '#E9DFFF',
  },
  {
    route: 'MoodEntry',
    icon: 'emoticon-happy-outline',
    title: 'Humeur',
    subtitle: 'Comment te sens-tu aujourd’hui ?',
    tint: '#F9DDE8',
  },
  {
    route: 'ActivityEntry',
    icon: 'walk',
    title: 'Activité physique',
    subtitle: 'Mouvement et activité du jour',
    tint: '#DFF0F1',
  },
  {
    route: 'SleepEntry',
    icon: 'weather-night',
    title: 'Sommeil',
    subtitle: 'Durée et qualité de ton sommeil',
    tint: '#E8DDF8',
  },
  {
    route: 'HydrationScreen',
    icon: 'cup-water',
    title: 'Hydratation',
    subtitle: 'Suis ta consommation d’eau',
    tint: '#DDEEFF',
  },
  {
    route: 'MenstrualFlowScreen',
    icon: 'water',
    title: 'Flux menstruel',
    subtitle: 'Intensité et caractéristiques du flux',
    tint: '#F9DDE8',
  },
  {
    route: 'PrivateIntimacyUnlock',
    icon: 'heart-outline',
    title: 'Vie intime',
    subtitle: 'Rapport, protection et ressenti',
    tint: '#F9DCE8',
  },
  {
    route: 'NoteEntry',
    icon: 'notebook-edit-outline',
    title: 'Note personnelle',
    subtitle: 'Écris tes observations et ajoute des photos privées',
    tint: '#E9DFF7',
  },
];

const DEFAULT_TITLE = 'Journal quotidien';
const DEFAULT_SUBTITLE = 'Comment te sens-tu aujourd’hui ?';

function DailyJournalSheet({visible, onClose, title = DEFAULT_TITLE, subtitle = DEFAULT_SUBTITLE, actions}: Props): React.JSX.Element {
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 260,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => finished && onClose());
  };

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
  }, []);

  useEffect(() => {
    if (!visible) {return;}
    dragY.setValue(0);
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      damping: 22,
      stiffness: 170,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [dragY, progress, visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => dragY.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 110 || gesture.vy > 1.1) {close(); return;}
        Animated.spring(dragY, {toValue: 0, damping: 20, stiffness: 180, useNativeDriver: true}).start();
      },
    }),
  ).current;

  const sheetTranslateY = Animated.add(
    progress.interpolate({inputRange: [0, 1], outputRange: [height, 0]}),
    dragY,
  );

  return (
    <Modal animationType="none" onRequestClose={close} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, {opacity: progress.interpolate({inputRange: [0, 1], outputRange: [0, 0.35]})}]}>
          <Pressable accessibilityLabel="Fermer le journal" onPress={close} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.sheet, {opacity: progress, transform: [{translateY: sheetTranslateY}]}]}>
          <View style={styles.handle} />
          <Pressable accessibilityLabel="Fermer" accessibilityRole="button" hitSlop={10} onPress={close} style={styles.closeButton}>
            <MaterialDesignIcons color="#FFFFFF" name="close" size={20} />
          </Pressable>
          <ScrollView contentContainerStyle={[styles.scrollContent, {paddingBottom: Math.max(insets.bottom, 16) + 20}]} showsVerticalScrollIndicator={false}>
            <Image accessibilityIgnoresInvertColors resizeMode="cover" source={JOURNAL_HEADER} style={styles.headerImage} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.cards}>
              {actions.map((action, index) => {
                const start = 0.34 + index * 0.055;
                const end = Math.min(1, start + 0.25);
                const cardOpacity = progress.interpolate({inputRange: [0, start, end, 1], outputRange: [0, 0, 1, 1]});
                const cardTranslateY = progress.interpolate({inputRange: [0, start, end, 1], outputRange: [16, 16, 0, 0]});
                return (
                  <Animated.View key={action.key} style={{opacity: cardOpacity, transform: [{translateY: cardTranslateY}]}}>
                    <Pressable
                      accessibilityHint={`Ouvre la saisie ${action.title.toLowerCase()}`}
                      accessibilityLabel={action.title}
                      accessibilityRole="button"
                      android_ripple={{color: 'rgba(96,71,182,0.10)'}}
                      onPress={action.onPress}
                      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}>
                      <View style={[styles.iconCircle, {backgroundColor: action.tint}]}>
                        <MaterialDesignIcons color={PURPLE} name={action.icon as never} size={25} />
                      </View>
                      <View style={styles.cardCopy}>
                        <Text style={styles.cardTitle}>{action.title}</Text>
                        <Text numberOfLines={1} style={styles.cardSubtitle}>{action.subtitle}</Text>
                      </View>
                      <MaterialDesignIcons color="#665A91" name="chevron-right" size={26} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  overlay: {...StyleSheet.absoluteFillObject, backgroundColor: '#17102F'},
  sheet: {height: '88%', overflow: 'hidden', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FCF8FF', elevation: 24},
  handle: {width: 46, height: 5, alignSelf: 'center', marginTop: 10, borderRadius: 3, backgroundColor: '#DED5EB'},
  closeButton: {position: 'absolute', right: 18, top: 17, zIndex: 3, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: PURPLE},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 30},
  headerImage: {width: '100%', height: 145, marginTop: 5, borderRadius: 20},
  title: {marginTop: 3, color: DEEP_PURPLE, fontFamily: 'serif', fontSize: 29, fontWeight: '700', textAlign: 'center'},
  subtitle: {marginTop: 2, color: '#675C94', fontSize: 14, textAlign: 'center'},
  cards: {gap: 10, marginTop: 18},
  card: {minHeight: 72, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(96,71,182,0.12)', borderRadius: 23, backgroundColor: '#FFFCFF', paddingHorizontal: 13, shadowColor: '#6D53A8', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2},
  cardPressed: {opacity: 0.8, transform: [{scale: 0.99}]},
  iconCircle: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24},
  cardCopy: {flex: 1, marginHorizontal: 12},
  cardTitle: {color: DEEP_PURPLE, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  cardSubtitle: {marginTop: 2, color: '#675C94', fontSize: 12},
});

export default memo(DailyJournalSheet);
