import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
import {isArticleBookmarked, loadLibraryState, saveScrollPosition, toggleBookmark} from '../../state/libraryStore';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';

const ARTICLE_ID = 'firstperiod-premieres-regles';
const READING_DURATION_MINUTES = 5;
const INK = '#342255';
const PURPLE = '#6F48DB';
const PINK = '#F17F9A';
const MUTED = '#7D728F';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

const TOPICS = [
  {key: 'arrivee', title: 'Quand arrivent les premières règles ?', description: 'Entre 10 et 15 ans en moyenne.', image: require('../../assets/images/first-period-calendar.png')},
  {key: 'normal', title: 'Ce qui est normal', description: 'Comprendre ton corps et les changements.', image: require('../../assets/images/first-period-normal.png')},
  {key: 'protection', title: 'Comment ça fonctionne ?', description: 'Durée, flux, cycle irrégulier…', image: require('../../assets/images/first-period-pad.png')},
  {key: 'soin', title: 'Prendre soin de soi', description: 'Hygiène, confort et bien-être.', image: require('../../assets/images/first-period-care.png')},
  {key: 'soutien', title: 'Parler et se faire soutenir', description: 'Ne reste pas seule, demande de l’aide.', image: require('../../assets/images/first-period-support.png')},
];

const DETAILS = [
  {key: 'arrivee', title: 'Quand arrivent les premières règles ?', text: 'Elles apparaissent le plus souvent entre 10 et 15 ans, environ deux ans après les premiers signes de la puberté.'},
  {key: 'normal', title: 'Ce qui est tout à fait normal', text: 'Au début, les cycles peuvent être irréguliers, courts ou longs. Ton corps prend simplement le temps de trouver son rythme.'},
  {key: 'protection', title: 'Comprendre comment ça fonctionne', text: 'Les règles durent généralement de 3 à 7 jours. Le flux et la couleur peuvent changer d’un jour à l’autre.'},
  {key: 'soin', title: 'Prendre soin de toi', text: 'Change régulièrement de protection, lave-toi doucement et choisis des vêtements confortables pour rester à l’aise.'},
  {key: 'soutien', title: 'Parler et se faire soutenir', text: 'Tu peux en parler à ta mère, une sœur, une proche, une enseignante ou un professionnel de santé en qui tu as confiance.'},
];

function FirstPeriodArticleScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadLibraryState().then(() => {
      if (!mounted) {return;}
      setBookmarked(isArticleBookmarked(ARTICLE_ID));
    });
    return () => {mounted = false;};
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    saveScrollPosition(ARTICLE_ID, event.nativeEvent.contentOffset.y);
  };

  const jumpTo = (key: string) => {
    const y = offsets.current[key];

    if (y != null) {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - 20),
        animated: true,
      });
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: getTopPadding(insets.top, true),
            paddingBottom: getBottomPadding(insets.bottom, READING_CONTROLS_SPACE),
          },
        ]}>

        <View style={styles.header}>
          <Pressable
            onPress={navigation.goBack}
            style={({pressed}) => [
              styles.circleButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retour">
            <MaterialDesignIcons
              name="chevron-left"
              color={PINK}
              size={25}
            />
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() =>
                setBookmarked(toggleBookmark(ARTICLE_ID))
              }
              style={({pressed}) => [
                styles.circleButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ajouter aux favoris">
              <MaterialDesignIcons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                color={PURPLE}
                size={19}
              />
            </Pressable>

            <Pressable
              onPress={() =>
                Share.share({
                  title: 'Premières règles · AWA',
                  message:
                    'Tes premières règles : à quoi t’attendre · AWA',
                })
              }
              style={({pressed}) => [
                styles.circleButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Partager l’article">
              <MaterialDesignIcons
                name="share-variant-outline"
                color={PURPLE}
                size={19}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.pill}><MaterialDesignIcons name="flower-outline" color={PINK} size={12} /><Text style={styles.pillText}>Premières règles</Text></View>
            <Text style={styles.title}>Tes premières règles :{`\n`}à quoi t’attendre</Text>
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <MaterialDesignIcons name="clock-outline" size={13} color={MUTED} />
                <Text style={styles.meta}>5 min</Text>
                <Text style={styles.dot}>•</Text>
                <MaterialDesignIcons name="book-open-page-variant-outline" size={13} color={MUTED} />
                <Text style={styles.meta}>Guide</Text>
              </View>

              <View style={styles.levelRow}>
                <MaterialDesignIcons name="chart-bar" size={13} color={MUTED} />
                <Text style={styles.meta}>Débutant</Text>
              </View>
            </View>
            <Text style={styles.intro}>Ce qui est normal, ce qui rassure,{`\n`}et ce qu’il faut savoir.</Text>
          </View>
          <Image source={require('../../assets/images/first-period-hero.png')} resizeMode="cover" style={styles.heroImage} />
        </View>

        <Text style={styles.blockTitle}>Dans cet article</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
          {TOPICS.map(topic => (
            <Pressable key={topic.key} onPress={() => jumpTo(topic.key)} style={({pressed}) => [styles.topicCard, pressed && styles.pressed]}>
              <Image source={topic.image} resizeMode="cover" style={styles.topicImage} />
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicDescription}>{topic.description}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <LinearGradient colors={['#F2ECFF', '#FCF7FF']} style={styles.supportBanner}>
          <View style={styles.bannerCopy}>
            <View style={styles.bannerTitleRow}><View style={styles.heartCircle}><MaterialDesignIcons name="heart-outline" size={17} color="#FFF" /></View><Text style={styles.bannerTitle}>Tu n’es pas seule</Text></View>
            <Text style={styles.bannerText}>Chaque corps est unique. Prends le temps, sois patiente et n’hésite pas à demander de l’aide à une personne de confiance.</Text>
          </View>
          <Image source={require('../../assets/images/first-period-hands-heart.png')} resizeMode="cover" style={styles.handsImage} />
        </LinearGradient>

        <LinearGradient colors={['#FFF1F4', '#FFF9FA']} style={styles.tipBanner}>
          <View style={styles.bulb}><MaterialDesignIcons name="lightbulb-on-outline" size={23} color={PINK} /></View>
          <View style={styles.tipCopy}><Text style={styles.tipTitle}>Bon à savoir</Text><Text style={styles.tipText}>Un cycle irrégulier au début est tout à fait normal. Ton corps apprend encore à fonctionner.</Text></View>
          <MaterialDesignIcons name="flower-outline" size={48} color="#F3A5B7" />
        </LinearGradient>

        <View style={styles.detailList}>
          {DETAILS.map((item, index) => (
            <View key={item.key} onLayout={event => {offsets.current[item.key] = event.nativeEvent.layout.y;}} style={styles.detailCard}>
              <Image source={TOPICS[index].image} resizeMode="cover" style={styles.detailImage} />
              <View style={styles.detailCopy}><Text style={styles.detailTitle}>{item.title}</Text><Text style={styles.detailText}>{item.text}</Text></View>
            </View>
          ))}
        </View>

      </ScrollView>

      <ReadingControls articleId={ARTICLE_ID} durationMinutes={READING_DURATION_MINUTES} scrollRef={scrollRef} />
    </View>
  );
}

const shadow = {shadowColor: '#4B3166', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFCFF'},
  content: {paddingHorizontal: 18},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 3},
  headerActions: {flexDirection: 'row', alignItems: 'center', gap: 8},
  circleButton: {width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...shadow},
  hero: {height: 246, marginTop: -10, flexDirection: 'row', overflow: 'hidden'},
  heroCopy: {width: '58%', zIndex: 2, paddingTop: 34},
  pill: {alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 11, backgroundColor: '#FFF0F4'},
  pillText: {color: PINK, fontSize: 10.5, fontWeight: '700'},
  title: {marginTop: 13, color: INK, fontFamily: 'serif', fontSize: 25, lineHeight: 30, fontWeight: '800'},
  metaContainer: {marginTop: 12, alignItems: 'flex-start'},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  levelRow: {marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4},
  meta: {fontSize: 10, color: MUTED}, dot: {fontSize: 10, color: MUTED, marginHorizontal: 2},
  intro: {marginTop: 14, color: INK, fontSize: 12, lineHeight: 18},
  heroImage: {position: 'absolute', right: -20, bottom: 0, width: '53%', height: '100%', borderRadius: 90},
  blockTitle: {marginTop: 10, marginBottom: 12, color: INK, fontSize: 15, fontWeight: '800'},
  topicRow: {gap: 8, paddingRight: 3, paddingBottom: 4},
  topicCard: {width: 112, minHeight: 185, borderRadius: 17, padding: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3EDF5', ...shadow},
  topicImage: {width: '100%', height: 72, borderRadius: 13, backgroundColor: '#FFF4F7'},
  topicTitle: {marginTop: 8, color: INK, fontSize: 10, lineHeight: 13, fontWeight: '800'},
  topicDescription: {marginTop: 6, color: MUTED, fontSize: 8.5, lineHeight: 12},
  pressed: {opacity: 0.78, transform: [{scale: 0.98}]},
  supportBanner: {marginTop: 18, minHeight: 112, borderRadius: 21, padding: 15, flexDirection: 'row', overflow: 'hidden'},
  bannerCopy: {width: '67%', zIndex: 2},
  bannerTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 9},
  heartCircle: {width: 30, height: 30, borderRadius: 15, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center'},
  bannerTitle: {color: INK, fontFamily: 'serif', fontSize: 15, fontWeight: '800'},
  bannerText: {marginTop: 9, color: MUTED, fontSize: 9.5, lineHeight: 14},
  handsImage: {position: 'absolute', right: 0, bottom: 0, width: '35%', height: '100%', borderRadius: 20},
  tipBanner: {marginTop: 12, minHeight: 82, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11},
  bulb: {width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFDDE6', alignItems: 'center', justifyContent: 'center'},
  tipCopy: {flex: 1}, tipTitle: {color: PINK, fontSize: 12, fontWeight: '800'}, tipText: {marginTop: 4, color: MUTED, fontSize: 9, lineHeight: 13},
  detailList: {marginTop: 18, gap: 10},
  detailCard: {minHeight: 92, borderRadius: 19, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F2ECF5', padding: 10, flexDirection: 'row', gap: 12, alignItems: 'center'},
  detailImage: {width: 68, height: 68, borderRadius: 15}, detailCopy: {flex: 1}, detailTitle: {color: INK, fontSize: 12.5, fontWeight: '800'}, detailText: {marginTop: 5, color: MUTED, fontSize: 10.5, lineHeight: 15},
});

export default FirstPeriodArticleScreen;