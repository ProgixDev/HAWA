import React, {useEffect, useRef, useState} from 'react';
import {
  Animated as RNAnimated,
  Image,
  ImageBackground,
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

const READING_DURATION_MINUTES = 6;

const ARTICLE_ID = 'flow-hygiene-intime';
const INK = '#30245C';
const PURPLE = '#6942DF';
const LILAC = '#F3EEFF';
const PINK = '#F08BA0';
const MUTED = '#77708F';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

const TOC = [
  {key: 'important', label: "Pourquoi c’est important", icon: 'flower-pollen-outline'},
  {key: 'gestes', label: 'Les bons gestes', icon: 'water-outline'},
  {key: 'eviter', label: 'À éviter', icon: 'shield-outline'},
  {key: 'consulter', label: 'Quand consulter', icon: 'stethoscope'},
  {key: 'conseils', label: 'Conseils pratiques', icon: 'lightbulb-on-outline'},
] as const;

const GOOD_PRACTICES = [
  {title: 'Lave-toi doucement', text: "Un simple lavage à l’eau claire, de l’avant vers l’arrière, suffit pour préserver ta flore naturelle.", image: require('../../assets/images/flux5.png')},
  {title: 'Change régulièrement tes protections', text: "Toutes les 4 à 6 heures pour éviter l’humidité et les mauvaises odeurs.", image: require('../../assets/images/flux6.png')},
  {title: 'Privilégie le coton', text: "Les sous-vêtements en coton laissent la peau respirer et réduisent les risques d’irritation.", image: require('../../assets/images/flux7.png')},
];

const TAKEAWAYS = [
  "Lavage doux à l’eau claire",
  'Changer régulièrement',
  'Éviter les produits parfumés',
  'Privilégier le coton',
];

const THINGS_TO_AVOID = [
  'Les savons agressifs et les produits parfumés',
  'Les douches vaginales qui perturbent la flore naturelle',
  'Garder une protection humide trop longtemps',
];

const CONSULT_REASONS = [
  'Irritations, démangeaisons ou brûlures persistantes',
  'Odeur inhabituelle ou pertes différentes de ton habitude',
  'Douleurs importantes ou symptômes qui t’inquiètent',
];

const RELATED = [
  {title: 'Comprendre les douleurs menstruelles', meta: '7 min  ·  Guide', image: require('../../assets/images/menstrual-calendar-card.png'), articleId: 'pain-gerer-douleurs'},
  {title: 'Choisir la protection adaptée à ton corps', meta: '5 min  ·  Guide', image: require('../../assets/images/sanitary-pads-card.png'), articleId: 'flow-comprendre-flux'},
  {title: 'Comment soulager les crampes naturellement', meta: '6 min  ·  Guide', image: require('../../assets/images/hot-water-bottle.png'), articleId: 'pain-gerer-douleurs'},
];

function FlowMenstrualArticleScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const heartScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (tocAnimationFrame.current != null) {
        cancelAnimationFrame(tocAnimationFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    loadLibraryState().then(() => {
      if (!mounted) {return;}
      setBookmarked(isArticleBookmarked(ARTICLE_ID));
    });
    return () => {mounted = false;};
  }, []);

  const scrollYRef = useRef(0);
  const tocAnimationFrame = useRef<number | null>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollYRef.current = y;
    saveScrollPosition(ARTICLE_ID, y);
  };

  const register = (key: string) => (
    event: {nativeEvent: {layout: {y: number}}},
  ) => {
    offsets.current[key] = event.nativeEvent.layout.y;
  };

  const jumpTo = (key: string) => {
    const target = offsets.current[key];

    if (target == null) {
      return;
    }

    if (tocAnimationFrame.current != null) {
      cancelAnimationFrame(tocAnimationFrame.current);
      tocAnimationFrame.current = null;
    }

    const topOffset = Math.max(insets.top, 14) + 18;
    const destination = Math.max(0, target - topOffset);
    const start = scrollYRef.current;
    const distance = destination - start;

    // Slow and smooth enough to clearly show the transition
    // without making navigation feel heavy.
    const duration = 900;
    const startTime = Date.now();

    const animateScroll = () => {
      const elapsed = Date.now() - startTime;
      const animationProgress = Math.min(elapsed / duration, 1);

      // Smooth ease-in-out cubic-like motion.
      const eased =
        animationProgress < 0.5
          ? 2 * animationProgress * animationProgress
          : 1 -
            Math.pow(-2 * animationProgress + 2, 2) / 2;

      const nextY = start + distance * eased;

      scrollRef.current?.scrollTo({
        y: nextY,
        animated: false,
      });

      if (animationProgress < 1) {
        tocAnimationFrame.current =
          requestAnimationFrame(animateScroll);
      } else {
        tocAnimationFrame.current = null;
        scrollYRef.current = destination;
      }
    };

    tocAnimationFrame.current =
      requestAnimationFrame(animateScroll);
  };
  const toggleLike = () => {
    setLiked(value => !value);
    RNAnimated.sequence([
      RNAnimated.timing(heartScale, {toValue: 1.25, duration: 100, useNativeDriver: true}),
      RNAnimated.spring(heartScale, {toValue: 1, damping: 8, useNativeDriver: true}),
    ]).start();
  };

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top, true), paddingBottom: getBottomPadding(insets.bottom, READING_CONTROLS_SPACE)}]}>

        <View style={styles.topRow}>
          <Pressable onPress={navigation.goBack} accessibilityRole="button" accessibilityLabel="Retour" style={({pressed}) => [styles.circleButton, pressed && styles.pressed]}>
            <MaterialDesignIcons name="chevron-left" size={28} color={INK} />
          </Pressable>
          <View style={styles.topActions}>
            <Pressable onPress={() => setBookmarked(toggleBookmark(ARTICLE_ID))} style={styles.circleButton} accessibilityRole="button">
              <MaterialDesignIcons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={21} color={PURPLE} />
            </Pressable>
            <Pressable onPress={() => Share.share({title: 'Hygiène intime · AWA', message: 'Bien vivre son hygiène intime pendant les règles · AWA'})} style={styles.circleButton} accessibilityRole="button">
              <MaterialDesignIcons name="share-variant-outline" size={21} color={PURPLE} />
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.categoryPill}>
              <MaterialDesignIcons name="heart-circle-outline" size={14} color={PINK} />
              <Text style={styles.categoryText}>Flux menstruel</Text>
            </View>
            <Text style={styles.heroTitle}>Bien vivre son hygiène intime pendant les règles</Text>
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <MaterialDesignIcons
                  name="clock-outline"
                  size={15}
                  color={MUTED}
                />
                <Text style={styles.meta}>6 min</Text>

                <Text style={styles.dot}>•</Text>

                <MaterialDesignIcons
                  name="book-open-page-variant-outline"
                  size={15}
                  color={MUTED}
                />
                <Text style={styles.meta}>Guide</Text>
              </View>

              <View style={styles.levelRow}>
                <MaterialDesignIcons
                  name="chart-bar"
                  size={15}
                  color={MUTED}
                />
                <Text style={styles.meta}>Débutant</Text>
              </View>
            </View>
          </View>
          <LinearGradient colors={['#FBE5EA', '#F7DDE8']} style={styles.heroArt}>
            <Image source={require('../../assets/images/flux.png')} resizeMode="cover" style={styles.heroImage} />
          </LinearGradient>
        </View>

        <LinearGradient colors={['#F0EBFF', '#FAF3FF']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.quote}>
          <View style={styles.quoteIcon}><Text style={styles.quoteMark}>“</Text></View>
          <Text style={styles.quoteText}>Prendre soin de son intimité, c’est respecter son corps et son équilibre naturel.</Text>
          <Pressable onPress={toggleLike} style={styles.likeButton} accessibilityRole="button">
            <RNAnimated.View style={{transform: [{scale: heartScale}]}}><MaterialDesignIcons name={liked ? 'heart' : 'heart-outline'} size={23} color={PINK} /></RNAnimated.View>
          </Pressable>
        </LinearGradient>

        <Text style={styles.blockTitle}>Dans cet article</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tocRow}>
          {TOC.map((item, index) => (
            <Pressable
              key={item.key}
              accessibilityLabel={`Aller à la section ${item.label}`}
              accessibilityRole="button"
              onPress={() => jumpTo(item.key)}
              style={({pressed}) => [
                styles.tocCard,
                index === 0 && styles.tocCardActive,
                pressed && styles.tocCardPressed,
              ]}>
              <MaterialDesignIcons
                name={item.icon}
                size={30}
                color={PURPLE}
              />
              <Text style={styles.tocText}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View onLayout={register('important')} style={styles.section}>
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionTitle}><Text style={styles.flower}>✿  </Text>Pourquoi c’est important ?</Text>
            <Text style={styles.body}>Pendant les règles, ton corps change et devient plus sensible. Adopter les bons gestes aide à prévenir les irritations, les infections et à rester à l’aise au quotidien.</Text>
          </View>
          <View style={styles.roundArt}><Image source={require('../../assets/images/flux4.png')} style={styles.roundImage} resizeMode="contain" /></View>
        </View>

        <View onLayout={register('gestes')}>
          <Text style={styles.sectionTitle}><Text style={styles.flower}>✿  </Text>Les bons gestes</Text>
          <LinearGradient
            colors={['#FFFFFF', '#FCF9FF', '#FFFDFE']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.practiceList}>
            {GOOD_PRACTICES.map(item => (
              <View key={item.title} style={styles.practiceRow}>
                <View style={styles.check}><MaterialDesignIcons name="check" size={17} color={PURPLE} /></View>
                <View style={styles.practiceCopy}><Text style={styles.practiceTitle}>{item.title}</Text><Text style={styles.practiceText}>{item.text}</Text></View>
                <View style={styles.practiceArt}><Image source={item.image} style={styles.practiceImage} resizeMode="contain" /></View>
              </View>
            ))}
          </LinearGradient>
        </View>

        <View onLayout={register('eviter')} style={styles.infoSection}>
          <Text style={styles.sectionTitle}><Text style={styles.flower}>✿  </Text>À éviter</Text>
          <LinearGradient colors={['#FFF7F8', '#FFFCFD']} style={styles.infoCard}>
            {THINGS_TO_AVOID.map(item => (
              <View key={item} style={styles.infoRow}>
                <View style={styles.avoidIcon}><MaterialDesignIcons name="close" size={14} color="#D76B81" /></View>
                <Text style={styles.infoText}>{item}</Text>
              </View>
            ))}
          </LinearGradient>
        </View>

        <View onLayout={register('consulter')} style={styles.infoSection}>
          <Text style={styles.sectionTitle}><Text style={styles.flower}>✿  </Text>Quand consulter ?</Text>
          <LinearGradient colors={['#F5F0FF', '#FCFAFF']} style={styles.infoCard}>
            {CONSULT_REASONS.map(item => (
              <View key={item} style={styles.infoRow}>
                <View style={styles.consultIcon}><MaterialDesignIcons name="stethoscope" size={14} color={PURPLE} /></View>
                <Text style={styles.infoText}>{item}</Text>
              </View>
            ))}
          </LinearGradient>
        </View>

        <View style={styles.twoCards} onLayout={register('conseils')}>
          <ImageBackground
            source={require('../../assets/images/awa-advice-background-square.png')}
            resizeMode="cover"
            imageStyle={styles.adviceBackgroundImage}
            style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>♡  Conseil AWA</Text>
            <Text style={styles.adviceText}>Ton corps possède déjà un mécanisme naturel d’équilibre. Un lavage doux suffit généralement.</Text>
          </ImageBackground>
          <LinearGradient colors={['#FFF5F4', '#FFF9F8']} style={styles.takeawayCard}>
            <Text style={styles.takeawayTitle}>✿  À retenir</Text>
            {TAKEAWAYS.map(item => <View key={item} style={styles.takeawayRow}><View style={styles.pinkCheck}><MaterialDesignIcons name="check" size={11} color="#FFF" /></View><Text style={styles.takeawayText}>{item}</Text></View>)}
          </LinearGradient>
        </View>

        <View style={styles.relatedHeader}>
          <Text style={styles.relatedTitle}>♥  Tu pourrais aussi aimer</Text>
          <Text style={styles.seeAll}>Voir tout  ›</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
          {RELATED.map(item => <Pressable key={item.title} onPress={() => navigation.push('ArticleReader', {articleId: item.articleId})} style={styles.relatedCard}>
            <View style={styles.relatedArt}><Image source={item.image} resizeMode="contain" style={styles.relatedImage} /></View>
            <View style={styles.relatedCopy}><Text numberOfLines={3} style={styles.relatedCardTitle}>{item.title}</Text><Text style={styles.relatedMeta}>{item.meta}</Text></View>
            <MaterialDesignIcons name="bookmark-outline" size={16} color={PURPLE} style={styles.relatedBookmark} />
          </Pressable>)}
        </ScrollView>
      </ScrollView>

      <ReadingControls articleId={ARTICLE_ID} durationMinutes={READING_DURATION_MINUTES} scrollRef={scrollRef} />
    </View>
  );
}

const shadow = {shadowColor: '#3A275F', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFCFF'},
  content: {paddingHorizontal: 20},
  topRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  topActions: {flexDirection: 'row', gap: 10},
  circleButton: {width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...shadow},
  pressed: {opacity: 0.75, transform: [{scale: 0.97}]},
  hero: {marginTop: 22, minHeight: 250},
  heroCopy: {width: '56%', zIndex: 2, paddingTop: 8},
  categoryPill: {alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FDE8ED'},
  categoryText: {fontSize: 12, color: PINK, fontWeight: '700'},
  heroTitle: {marginTop: 10, color: INK, fontFamily: 'serif', fontSize: 20, lineHeight: 25, fontWeight: '700'},
  metaContainer: {
    marginTop: 14,
    alignItems: 'flex-start',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  levelRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {fontSize: 11.5, color: MUTED},
  dot: {fontSize: 11, color: MUTED, marginHorizontal: 2},
  heroArt: {position: 'absolute', right: -5, top: 0, width: '53%', height: 244, borderRadius: 34, overflow: 'hidden'},
  heroImage: {width: '100%', height: '100%'},
  quote: {marginTop: 12, minHeight: 84, borderRadius: 24, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12},
  quoteIcon: {width: 43, height: 43, borderRadius: 17, backgroundColor: '#E9DEFF', alignItems: 'center', justifyContent: 'center'},
  quoteMark: {color: PURPLE, fontSize: 31, fontWeight: '900', lineHeight: 37},
  quoteText: {flex: 1, color: INK, fontSize: 14, lineHeight: 20},
  likeButton: {width: 43, height: 43, borderRadius: 22, backgroundColor: '#FFF4F7', alignItems: 'center', justifyContent: 'center'},
  blockTitle: {marginTop: 24, marginBottom: 12, color: INK, fontSize: 18, fontWeight: '800'},
  tocRow: {gap: 10, paddingRight: 4, paddingBottom: 3},
  tocCard: {width: 112, minHeight: 102, borderRadius: 22, padding: 13, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F2EDF8', ...shadow},
  tocCardActive: {backgroundColor: LILAC, borderColor: '#DDD0FF'},
  tocCardPressed: {opacity: 0.78, transform: [{scale: 0.97}]},
  tocText: {fontSize: 11, lineHeight: 15, color: INK, fontWeight: '700', textAlign: 'center'},
  section: {marginTop: 28, marginBottom: 22, flexDirection: 'row', alignItems: 'center'},
  sectionTextWrap: {flex: 1},
  sectionTitle: {color: INK, fontSize: 18, fontWeight: '800', marginBottom: 12},
  flower: {color: PINK},
  body: {color: INK, fontSize: 13, lineHeight: 20},
  roundArt: {width: 112, height: 112, marginLeft: 12, borderRadius: 56, backgroundColor: '#FFF1F3', overflow: 'hidden'},
  roundImage: {width: '100%', height: '100%'},
  practiceList: {borderRadius: 22, paddingHorizontal: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F5F0F8'},
  practiceRow: {minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8E0ED'},
  check: {width: 30, height: 30, borderRadius: 15, backgroundColor: '#E9DFFF', alignItems: 'center', justifyContent: 'center'},
  practiceCopy: {flex: 1, paddingVertical: 13},
  practiceTitle: {color: INK, fontSize: 13, fontWeight: '800'},
  practiceText: {marginTop: 3, color: INK, fontSize: 11.5, lineHeight: 16},
  practiceArt: {width: 72, height: 72, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FBF5FF', flexShrink: 0},
  practiceImage: {width: '100%', height: '100%'},
  infoSection: {marginTop: 24},
  infoCard: {borderRadius: 22, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#F0E8F4'},
  infoRow: {minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EDE5F0'},
  avoidIcon: {width: 27, height: 27, borderRadius: 14, backgroundColor: '#FCE5E9', alignItems: 'center', justifyContent: 'center'},
  consultIcon: {width: 27, height: 27, borderRadius: 14, backgroundColor: '#E9DEFF', alignItems: 'center', justifyContent: 'center'},
  infoText: {flex: 1, color: INK, fontSize: 12, lineHeight: 17},
  twoCards: {marginTop: 22, flexDirection: 'row', gap: 10},
  adviceCard: {flex: 1, minHeight: 170, borderRadius: 24, padding: 15, overflow: 'hidden'},
  adviceBackgroundImage: {borderRadius: 24},
  adviceTitle: {color: PURPLE, fontSize: 13, fontWeight: '800'},
  adviceText: {width: '66%', marginTop: 16, color: INK, fontSize: 11.5, lineHeight: 17},
  takeawayCard: {flex: 1, minHeight: 170, borderRadius: 24, padding: 15},
  takeawayTitle: {color: PINK, fontSize: 13, fontWeight: '800', marginBottom: 10},
  takeawayRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7},
  pinkCheck: {width: 18, height: 18, borderRadius: 9, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center'},
  takeawayText: {flex: 1, color: INK, fontSize: 10.5},
  relatedHeader: {marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  relatedTitle: {color: INK, fontSize: 16, fontWeight: '800'}, seeAll: {color: PURPLE, fontSize: 12, fontWeight: '700'},
  relatedRow: {gap: 10, paddingTop: 14, paddingRight: 4, paddingBottom: 5},
  relatedCard: {width: 230, height: 105, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0EAF5', flexDirection: 'row', overflow: 'hidden', ...shadow},
  relatedArt: {width: 80, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center'}, relatedImage: {width: 72, height: 72, borderRadius: 16},
  relatedCopy: {flex: 1, padding: 12, paddingRight: 23}, relatedCardTitle: {color: INK, fontSize: 11.5, lineHeight: 15, fontWeight: '800'}, relatedMeta: {marginTop: 9, color: MUTED, fontSize: 9.5},
  relatedBookmark: {position: 'absolute', right: 8, bottom: 9},
});

export default FlowMenstrualArticleScreen;